#!/usr/bin/env node

/**
 * Forte Advice Design System — Build Script
 *
 * Reads tokens.json and generates:
 *   1. dist/css/tokens.css     — CSS custom properties with mode switching
 *   2. dist/css/shadcn.css     — shadcn/ui compatible CSS variables
 *   3. dist/tailwind/preset.js — Tailwind v4 preset
 *   4. dist/ts/tokens.ts       — TypeScript token module
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const tokens = JSON.parse(readFileSync(join(ROOT, "tokens.json"), "utf-8"));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function ensureDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function write(relPath, content) {
  const abs = join(ROOT, relPath);
  ensureDir(abs);
  writeFileSync(abs, content, "utf-8");
  console.log(`  ✓ ${relPath}`);
}

// ---------------------------------------------------------------------------
// 1. CSS Generator
// ---------------------------------------------------------------------------

function buildCSS() {
  const lines = [];
  const { primitives, tones, state, modes } = tokens.colors;
  const { typography } = tokens.brand;

  lines.push("/* ============================================");
  lines.push("   Forte Advice Design Tokens (auto-generated)");
  lines.push("   DO NOT EDIT — regenerate with: npm run build");
  lines.push("   ============================================ */");
  lines.push("");

  // --- Primitives & tones (always available) ---
  lines.push(":root {");
  lines.push("  /* Brand primitives */");
  for (const [key, value] of Object.entries(primitives)) {
    lines.push(`  --color-${camelToKebab(key)}: ${value};`);
  }

  lines.push("");
  lines.push("  /* Tone scales */");
  for (const [scaleName, scale] of Object.entries(tones)) {
    for (const [step, value] of Object.entries(scale)) {
      lines.push(`  --color-${camelToKebab(scaleName)}-${step}: ${value};`);
    }
  }

  lines.push("");
  lines.push("  /* State colors */");
  for (const [key, value] of Object.entries(state)) {
    lines.push(`  --color-${key}: ${value};`);
  }

  lines.push("");
  lines.push("  /* Typography */");
  lines.push(`  --font-sans: '${typography.fontFamily.sans}', system-ui, sans-serif;`);
  lines.push(`  --font-mono: '${typography.fontFamily.mono}', ui-monospace, monospace;`);

  lines.push("}");
  lines.push("");

  // --- Semantic tokens per mode ---
  function modeBlock(mode) {
    const out = [];
    const { surface, text, button, stroke, focus } = mode;
    out.push(`  --surface-primary: ${surface.primary};`);
    out.push(`  --surface-secondary: ${surface.secondary};`);
    out.push(`  --surface-opaque: ${surface.opaque};`);
    out.push(`  --text-primary: ${text.primary};`);
    out.push(`  --text-secondary: ${text.secondary};`);
    out.push(`  --text-inverted: ${text.inverted};`);
    out.push(`  --text-disabled: ${text.disabled};`);
    out.push(`  --button-primary: ${button.primary};`);
    out.push(`  --button-primary-hover: ${button.primaryHover};`);
    out.push(`  --button-disabled: ${button.disabled};`);
    out.push(`  --stroke-harsh: ${stroke.harsh};`);
    out.push(`  --stroke-subtle: ${stroke.subtle};`);
    out.push(`  --focus: ${focus};`);
    return out.join("\n");
  }

  // Default: cream-plum (light)
  lines.push("/* === Default: Cream / Plum (light) === */");
  lines.push(`:root, [data-theme="cream-plum"] {`);
  lines.push(modeBlock(modes["cream-plum"]));
  lines.push("}");
  lines.push("");

  // Dark: plum-cream (auto via media query)
  lines.push("/* === Dark: Plum / Cream (auto + manual) === */");
  lines.push("@media (prefers-color-scheme: dark) {");
  lines.push("  :root {");
  lines.push(modeBlock(modes["plum-cream"]).replace(/^  /gm, "    "));
  lines.push("  }");
  lines.push("}");
  lines.push(`[data-theme="plum-cream"] {`);
  lines.push(modeBlock(modes["plum-cream"]));
  lines.push("}");
  lines.push("");

  // Additional modes (manual only)
  for (const [key, mode] of Object.entries(modes)) {
    if (key === "cream-plum" || key === "plum-cream") continue;
    lines.push(`/* === ${mode.label} === */`);
    lines.push(`[data-theme="${key}"] {`);
    lines.push(modeBlock(mode));
    lines.push("}");
    lines.push("");
  }

  write("dist/css/tokens.css", lines.join("\n"));
}

// ---------------------------------------------------------------------------
// 2. shadcn/ui CSS Generator
// ---------------------------------------------------------------------------

function buildShadcnCSS() {
  const lines = [];
  const { modes, state } = tokens.colors;
  const { typography } = tokens.brand;

  lines.push("/* ============================================");
  lines.push("   Forte Advice — shadcn/ui Theme (auto-generated)");
  lines.push("   DO NOT EDIT — regenerate with: npm run build");
  lines.push("");
  lines.push("   Import this AFTER tokens.css in your project:");
  lines.push("   @import '@forteadvice/design-tokens/css';");
  lines.push("   @import '@forteadvice/design-tokens/shadcn';");
  lines.push("   ============================================ */");
  lines.push("");

  function shadcnBlock(mode) {
    const out = [];
    out.push(`  --background: ${mode.surface.primary};`);
    out.push(`  --foreground: ${mode.text.primary};`);
    out.push(`  --card: ${mode.surface.secondary};`);
    out.push(`  --card-foreground: ${mode.text.primary};`);
    out.push(`  --popover: ${mode.surface.primary};`);
    out.push(`  --popover-foreground: ${mode.text.primary};`);
    out.push(`  --primary: ${mode.button.primary};`);
    out.push(`  --primary-foreground: ${mode.text.inverted};`);
    out.push(`  --secondary: ${mode.surface.secondary};`);
    out.push(`  --secondary-foreground: ${mode.text.primary};`);
    out.push(`  --muted: ${mode.surface.secondary};`);
    out.push(`  --muted-foreground: ${mode.text.secondary};`);
    out.push(`  --accent: ${mode.surface.secondary};`);
    out.push(`  --accent-foreground: ${mode.text.primary};`);
    out.push(`  --destructive: ${state.error};`);
    out.push(`  --border: ${mode.stroke.subtle};`);
    out.push(`  --input: ${mode.stroke.subtle};`);
    out.push(`  --ring: ${mode.focus};`);
    out.push(`  --sidebar: ${mode.surface.secondary};`);
    out.push(`  --sidebar-foreground: ${mode.text.primary};`);
    out.push(`  --sidebar-border: ${mode.stroke.subtle};`);
    out.push(`  --sidebar-accent: ${mode.button.primary};`);
    out.push(`  --sidebar-accent-foreground: ${mode.text.inverted};`);
    out.push(`  --sidebar-ring: ${mode.focus};`);
    out.push(`  --radius: 0.625rem;`);
    return out.join("\n");
  }

  // Default: cream-plum (light)
  lines.push("@layer base {");
  lines.push("  :root {");
  lines.push(shadcnBlock(modes["cream-plum"]));
  lines.push("  }");
  lines.push("");

  // Dark: plum-cream
  lines.push("  @media (prefers-color-scheme: dark) {");
  lines.push("    :root {");
  lines.push(shadcnBlock(modes["plum-cream"]).replace(/^  /gm, "      "));
  lines.push("    }");
  lines.push("  }");
  lines.push("");

  // Manual mode overrides
  for (const [key, mode] of Object.entries(modes)) {
    lines.push(`  [data-theme="${key}"] {`);
    lines.push(shadcnBlock(mode));
    lines.push("  }");
    lines.push("");
  }

  lines.push("}");

  write("dist/css/shadcn.css", lines.join("\n"));
}

// ---------------------------------------------------------------------------
// 3. Tailwind Preset Generator
// ---------------------------------------------------------------------------

function buildTailwindPreset() {
  const { primitives, tones, state } = tokens.colors;
  const { typography } = tokens.brand;

  // Build brand color map (primitives)
  const brandColors = {};
  for (const [key, value] of Object.entries(primitives)) {
    brandColors[camelToKebab(key)] = value;
  }

  // Build tone color maps
  const toneColors = {};
  for (const [scaleName, scale] of Object.entries(tones)) {
    toneColors[camelToKebab(scaleName)] = { ...scale };
  }

  const preset = {
    theme: {
      extend: {
        colors: {
          // Semantic tokens (via CSS custom properties — mode-aware)
          surface: {
            primary: "var(--surface-primary)",
            secondary: "var(--surface-secondary)",
            opaque: "var(--surface-opaque)",
          },
          text: {
            primary: "var(--text-primary)",
            secondary: "var(--text-secondary)",
            inverted: "var(--text-inverted)",
            disabled: "var(--text-disabled)",
          },
          button: {
            primary: "var(--button-primary)",
            "primary-hover": "var(--button-primary-hover)",
            disabled: "var(--button-disabled)",
          },
          stroke: {
            harsh: "var(--stroke-harsh)",
            subtle: "var(--stroke-subtle)",
          },
          focus: "var(--focus)",
          // Static colors
          brand: brandColors,
          state,
          ...toneColors,
        },
        fontFamily: {
          sans: [`'${typography.fontFamily.sans}'`, "system-ui", "sans-serif"],
          mono: [`'${typography.fontFamily.mono}'`, "ui-monospace", "monospace"],
        },
      },
    },
  };

  const output = [
    "/* Forte Advice Tailwind Preset (auto-generated) */",
    "/* DO NOT EDIT — regenerate with: npm run build */",
    "",
    `export default ${JSON.stringify(preset, null, 2)};`,
    "",
  ].join("\n");

  write("dist/tailwind/preset.js", output);
}

// ---------------------------------------------------------------------------
// 3. TypeScript Generator
// ---------------------------------------------------------------------------

function buildTypeScript() {
  const lines = [];

  lines.push("// Forte Advice Design Tokens (auto-generated)");
  lines.push("// DO NOT EDIT — regenerate with: npm run build");
  lines.push("");

  // Meta
  lines.push(`export const meta = ${JSON.stringify(tokens.meta, null, 2)} as const;`);
  lines.push("");

  // Typography
  lines.push(`export const typography = ${JSON.stringify(tokens.brand.typography, null, 2)} as const;`);
  lines.push("");

  // Icons
  lines.push(`export const icons = ${JSON.stringify(tokens.brand.icons, null, 2)} as const;`);
  lines.push("");

  // Colors
  lines.push(`export const colors = ${JSON.stringify(tokens.colors, null, 2)} as const;`);
  lines.push("");

  // Mode type + helper
  const modeKeys = Object.keys(tokens.colors.modes);
  lines.push(`export type ColorMode = ${modeKeys.map((k) => `"${k}"`).join(" | ")};`);
  lines.push("");
  lines.push("export function modeColors(mode: ColorMode) {");
  lines.push("  return colors.modes[mode];");
  lines.push("}");
  lines.push("");

  write("dist/ts/tokens.ts", lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log("Building Forte Advice design tokens...\n");
buildCSS();
buildShadcnCSS();
buildTailwindPreset();
buildTypeScript();
console.log("\nDone!");
