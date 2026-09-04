#!/usr/bin/env node

/**
 * Forte Advice Design System — Validation Script
 *
 * Checks:
 *   1. Schema integrity (required fields, types)
 *   2. Color format validity (hex, rgba)
 *   3. WCAG 2.1 AA text contrast, >= 4.5:1 (fatal)
 *   4. WCAG 2.1 AA non-text contrast, >= 3:1 (reported, not fatal)
 *   5. Mode parity (all modes have same semantic keys)
 *
 * Text contrast is fatal because it is fully determined by the token values.
 * Non-text contrast is reported as a warning: the fixes are brand decisions
 * (picking a different focus hue per mode), not mechanical corrections, so
 * they must not block a release the moment someone adds a mode.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const tokens = JSON.parse(readFileSync(join(ROOT, "tokens.json"), "utf-8"));

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ✗ ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  ⚠ WARN:  ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const RGBA_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;

function isValidColor(value) {
  return HEX_RE.test(value) || RGBA_RE.test(value);
}

function hexToRGB(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
  if (!HEX_RE.test(hex1) || !HEX_RE.test(hex2)) return null;
  const c1 = hexToRGB(hex1);
  const c2 = hexToRGB(hex2);
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// 1. Schema validation
// ---------------------------------------------------------------------------

function validateSchema() {
  console.log("\n1. Schema validation");

  // Meta
  if (!tokens.meta?.name) error("meta.name is required");
  if (!tokens.meta?.version) error("meta.version is required");
  else if (!/^\d+\.\d+\.\d+$/.test(tokens.meta.version))
    error(`meta.version "${tokens.meta.version}" is not valid semver`);
  if (!tokens.meta?.updated) error("meta.updated is required");
  else ok(`meta: v${tokens.meta.version} (${tokens.meta.updated})`);

  // CI tags releases from meta.version while npm consumers read package.json;
  // if the two drift, a published tag and its package version disagree.
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
  if (pkg.version !== tokens.meta.version)
    error(
      `package.json version "${pkg.version}" does not match meta.version "${tokens.meta.version}"`
    );
  else ok(`package.json version matches meta.version`);

  // Brand
  if (!tokens.brand?.typography?.fontFamily?.sans)
    error("brand.typography.fontFamily.sans is required");
  if (!tokens.brand?.icons?.library) error("brand.icons.library is required");
  else ok(`brand: ${tokens.brand.typography.fontFamily.sans} + ${tokens.brand.icons.library}`);

  // Colors
  if (!tokens.colors?.primitives) error("colors.primitives is required");
  if (!tokens.colors?.state?.errorForeground)
    error("colors.state.errorForeground is required (shadcn --destructive-foreground)");
  if (!tokens.colors?.modes) error("colors.modes is required");
  else ok(`colors: ${Object.keys(tokens.colors.modes).length} modes defined`);

  // Drives the generated `color-scheme` property, so it must be one of the two
  // values the CSS keyword accepts — anything else silently does nothing.
  for (const [modeName, mode] of Object.entries(tokens.colors.modes ?? {})) {
    if (!mode.colorScheme) error(`${modeName} is missing colorScheme`);
    else if (mode.colorScheme !== "light" && mode.colorScheme !== "dark")
      error(`${modeName} colorScheme must be "light" or "dark", got "${mode.colorScheme}"`);
  }
}

// ---------------------------------------------------------------------------
// 2. Color format validation
// ---------------------------------------------------------------------------

function validateColorFormats() {
  console.log("\n2. Color format validation");

  let checked = 0;

  function checkColors(obj, path) {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = `${path}.${key}`;
      if (typeof value === "string" && (value.startsWith("#") || value.startsWith("rgb"))) {
        checked++;
        if (!isValidColor(value)) error(`Invalid color at ${fullPath}: "${value}"`);
      } else if (typeof value === "object" && value !== null && key !== "id" && key !== "label") {
        checkColors(value, fullPath);
      }
    }
  }

  checkColors(tokens.colors, "colors");
  ok(`${checked} color values checked`);
}

// ---------------------------------------------------------------------------
// 3. WCAG text contrast checks (fatal below 4.5:1)
// ---------------------------------------------------------------------------

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3.0;

function validateTextContrast() {
  console.log(`\n3. WCAG 2.1 AA text contrast (require >= ${AA_TEXT}:1)`);

  // Mode-independent: state colors are the same in every mode.
  console.log("\n   State colors");
  const stateRatio = contrastRatio(tokens.colors.state.errorForeground, tokens.colors.state.error);
  if (stateRatio === null) error("state.errorForeground on state.error: cannot compute contrast");
  else if (stateRatio >= AA_TEXT)
    ok(`state.errorForeground on state.error: ${stateRatio.toFixed(2)}:1`);
  else
    error(
      `state.errorForeground on state.error: ${stateRatio.toFixed(2)}:1 — below AA ${AA_TEXT}:1`
    );

  for (const [, mode] of Object.entries(tokens.colors.modes)) {
    console.log(`\n   Mode: ${mode.label}`);

    const checks = [
      ["text.primary on surface.primary", mode.text.primary, mode.surface.primary],
      ["text.secondary on surface.primary", mode.text.secondary, mode.surface.primary],
      ["text.primary on surface.secondary", mode.text.primary, mode.surface.secondary],
      ["text.inverted on button.primary", mode.text.inverted, mode.button.primary],
    ];

    for (const [label, fg, bg] of checks) {
      const ratio = contrastRatio(fg, bg);
      if (ratio === null) {
        error(`${label}: cannot compute contrast (non-hex color ${fg} / ${bg})`);
        continue;
      }
      const ratioStr = ratio.toFixed(2);
      if (ratio >= AA_TEXT) ok(`${label}: ${ratioStr}:1`);
      else error(`${label}: ${ratioStr}:1 — below AA ${AA_TEXT}:1`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. WCAG non-text contrast checks (reported, not fatal)
//
// WCAG 2.1 SC 1.4.11 wants >= 3:1 for the visual boundary of UI components and
// for focus indicators. stroke.subtle is intentionally excluded: it is used for
// decorative dividers, which the criterion does not cover.
// ---------------------------------------------------------------------------

function validateNonTextContrast() {
  console.log(`\n4. WCAG 2.1 AA non-text contrast (SC 1.4.11, want >= ${AA_NON_TEXT}:1)`);

  for (const [, mode] of Object.entries(tokens.colors.modes)) {
    console.log(`\n   Mode: ${mode.label}`);

    const checks = [
      ["focus ring on surface.primary", mode.focus, mode.surface.primary],
      ["focus ring on surface.secondary", mode.focus, mode.surface.secondary],
      ["stroke.harsh on surface.primary", mode.stroke.harsh, mode.surface.primary],
    ];

    for (const [label, fg, bg] of checks) {
      const ratio = contrastRatio(fg, bg);
      if (ratio === null) {
        warn(`${label}: cannot compute contrast (non-hex color ${fg} / ${bg})`);
        continue;
      }
      const ratioStr = ratio.toFixed(2);
      if (ratio >= AA_NON_TEXT) ok(`${label}: ${ratioStr}:1`);
      else warn(`${label}: ${ratioStr}:1 — FAILS SC 1.4.11 (${AA_NON_TEXT}:1)`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Non-colour token checks
//
// The type scale records both a value and the Tailwind class design.md is
// written against. Those two can drift silently, so they are checked against
// each other using Tailwind's own default scale.
// ---------------------------------------------------------------------------

const TW_FONT_SIZE = {
  "text-xs": ["0.75rem", "1rem"],
  "text-sm": ["0.875rem", "1.25rem"],
  "text-base": ["1rem", "1.5rem"],
  "text-lg": ["1.125rem", "1.75rem"],
  "text-xl": ["1.25rem", "1.75rem"],
  "text-2xl": ["1.5rem", "2rem"],
  "text-3xl": ["1.875rem", "2.25rem"],
  "text-4xl": ["2.25rem", "2.5rem"],
};

const TW_FONT_WEIGHT = {
  "font-normal": 400,
  "font-medium": 500,
  "font-semibold": 600,
  "font-bold": 700,
};

const DIMENSION_RE = /^(0|-?\d+(\.\d+)?(px|rem|ms))$/;

function validateNonColorTokens() {
  console.log("\n5. Non-colour tokens");

  // --- Type scale ---
  const scale = tokens.brand?.typography?.scale;
  if (!scale) {
    error("brand.typography.scale is required");
  } else {
    let scaleErrors = 0;
    for (const [role, step] of Object.entries(scale)) {
      const classes = (step.tailwind ?? "").split(/\s+/);
      const sizeClass = classes.find((c) => TW_FONT_SIZE[c]);
      if (!sizeClass) {
        error(`typography.scale.${role}.tailwind has no known text-* size class`);
        scaleErrors++;
        continue;
      }
      const [size, lineHeight] = TW_FONT_SIZE[sizeClass];
      if (step.fontSize !== size) {
        error(
          `typography.scale.${role}: fontSize "${step.fontSize}" does not match ${sizeClass} (${size})`
        );
        scaleErrors++;
      }
      if (step.lineHeight !== lineHeight) {
        error(
          `typography.scale.${role}: lineHeight "${step.lineHeight}" does not match ${sizeClass} (${lineHeight})`
        );
        scaleErrors++;
      }
      const weightClass = classes.find((c) => TW_FONT_WEIGHT[c]);
      const expectedWeight = weightClass ? TW_FONT_WEIGHT[weightClass] : 400;
      if (step.fontWeight !== expectedWeight) {
        error(
          `typography.scale.${role}: fontWeight ${step.fontWeight} does not match "${
            weightClass ?? "(no font-* class, defaults to 400)"
          }" (${expectedWeight})`
        );
        scaleErrors++;
      }
    }
    if (scaleErrors === 0)
      ok(`type scale: ${Object.keys(scale).length} roles consistent with their Tailwind classes`);
  }

  // --- Radius, motion, component dimensions ---
  let dimensionCount = 0;
  let dimensionErrors = 0;

  function checkDimension(path, value) {
    dimensionCount++;
    if (typeof value !== "string" || !DIMENSION_RE.test(value)) {
      error(`${path}: "${value}" is not a valid dimension (expected 0, or a px/rem/ms value)`);
      dimensionErrors++;
    }
  }

  if (!tokens.radius) error("radius is required");
  else for (const [key, value] of Object.entries(tokens.radius)) checkDimension(`radius.${key}`, value);

  if (!tokens.motion) error("motion is required");
  else {
    checkDimension("motion.duration", tokens.motion.duration);
    if (!tokens.motion.easing) error("motion.easing is required");
  }

  if (!tokens.components) error("components is required");
  else
    for (const [component, props] of Object.entries(tokens.components))
      for (const [prop, value] of Object.entries(props))
        checkDimension(`components.${component}.${prop}`, value);

  if (dimensionErrors === 0) ok(`${dimensionCount} dimension values checked`);

  // The button radius and the pill radius describe the same decision, stated in
  // two places in design.md; keep them from drifting apart.
  if (tokens.radius?.pill && tokens.components?.button?.radius &&
      tokens.radius.pill !== tokens.components.button.radius)
    error(
      `radius.pill "${tokens.radius.pill}" and components.button.radius ` +
        `"${tokens.components.button.radius}" disagree`
    );
}

// ---------------------------------------------------------------------------
// 6. Mode parity check
// ---------------------------------------------------------------------------

function validateModeParity() {
  console.log("\n6. Mode parity check");

  const modeEntries = Object.entries(tokens.colors.modes);
  if (modeEntries.length === 0) {
    error("No modes defined");
    return;
  }

  function getKeys(obj, prefix = "") {
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      if (key === "id" || key === "label") continue;
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        keys.push(...getKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys.sort();
  }

  const [refName, refMode] = modeEntries[0];
  const refKeys = getKeys(refMode);
  let parityErrors = 0;

  for (const [modeName, mode] of modeEntries.slice(1)) {
    const modeKeys = getKeys(mode);
    const missing = refKeys.filter((k) => !modeKeys.includes(k));
    const extra = modeKeys.filter((k) => !refKeys.includes(k));
    if (missing.length) {
      error(`${modeName} is missing keys: ${missing.join(", ")}`);
      parityErrors++;
    }
    if (extra.length) {
      error(`${modeName} has extra keys: ${extra.join(", ")}`);
      parityErrors++;
    }
  }

  // Scoped to this check: a failure elsewhere must not silence the parity result.
  if (parityErrors === 0)
    ok(`All ${modeEntries.length} modes have identical semantic keys (reference: ${refName})`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log("Validating Forte Advice design tokens...");
validateSchema();
validateColorFormats();
validateTextContrast();
validateNonTextContrast();
validateNonColorTokens();
validateModeParity();

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);

if (errors > 0) {
  console.error("\nValidation FAILED.");
  process.exit(1);
} else {
  console.log("\nValidation PASSED.");
}
