#!/usr/bin/env node

/**
 * Forte Advice Design System — Validation Script
 *
 * Checks:
 *   1. Schema integrity (required fields, types)
 *   2. Color format validity (hex, rgba)
 *   3. WCAG 2.1 AA contrast ratios (text on surface, button)
 *   4. Mode parity (all modes have same semantic keys)
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

  // Brand
  if (!tokens.brand?.typography?.fontFamily?.sans)
    error("brand.typography.fontFamily.sans is required");
  if (!tokens.brand?.icons?.library) error("brand.icons.library is required");
  else ok(`brand: ${tokens.brand.typography.fontFamily.sans} + ${tokens.brand.icons.library}`);

  // Colors
  if (!tokens.colors?.primitives) error("colors.primitives is required");
  if (!tokens.colors?.modes) error("colors.modes is required");
  else ok(`colors: ${Object.keys(tokens.colors.modes).length} modes defined`);
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
// 3. WCAG contrast checks
// ---------------------------------------------------------------------------

function validateContrast() {
  console.log("\n3. WCAG 2.1 AA contrast checks (target ≥ 4.5:1)");

  for (const [modeName, mode] of Object.entries(tokens.colors.modes)) {
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
        warn(`${label}: cannot compute (non-hex color)`);
        continue;
      }
      const ratioStr = ratio.toFixed(2);
      if (ratio >= 4.5) {
        ok(`${label}: ${ratioStr}:1`);
      } else if (ratio >= 3.0) {
        warn(`${label}: ${ratioStr}:1 (AA-large only, below 4.5)`);
      } else {
        warn(`${label}: ${ratioStr}:1 (FAILS AA)`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Mode parity check
// ---------------------------------------------------------------------------

function validateModeParity() {
  console.log("\n4. Mode parity check");

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

  for (const [modeName, mode] of modeEntries.slice(1)) {
    const modeKeys = getKeys(mode);
    const missing = refKeys.filter((k) => !modeKeys.includes(k));
    const extra = modeKeys.filter((k) => !refKeys.includes(k));
    if (missing.length) error(`${modeName} is missing keys: ${missing.join(", ")}`);
    if (extra.length) error(`${modeName} has extra keys: ${extra.join(", ")}`);
  }

  if (errors === 0) ok(`All ${modeEntries.length} modes have identical semantic keys`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log("Validating Forte Advice design tokens...");
validateSchema();
validateColorFormats();
validateContrast();
validateModeParity();

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);

if (errors > 0) {
  console.error("\nValidation FAILED.");
  process.exit(1);
} else {
  console.log("\nValidation PASSED.");
}
