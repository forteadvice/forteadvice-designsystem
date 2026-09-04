#!/usr/bin/env node

/**
 * Forte Advice Design System — Build Script
 *
 * Reads tokens.json and generates:
 *   1. dist/css/tokens.css     — CSS custom properties with mode switching
 *   2. dist/css/shadcn.css     — shadcn/ui compatible CSS variables
 *   3. dist/tailwind/preset.js — Tailwind preset
 *   4. dist/ts/tokens.js       — runtime ESM token module
 *   5. dist/ts/tokens.d.ts     — type declarations for the module above
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

/**
 * Serializes a JSON value into an equivalent TypeScript literal type, so the
 * generated .d.ts preserves exact hex/number literals (what `as const` gave us
 * when the module was shipped as raw .ts).
 */
function tsLiteralType(value, indent = 0) {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return `readonly [${value.map((v) => tsLiteralType(v, indent)).join(", ")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, v]) => `${padInner}readonly ${JSON.stringify(key)}: ${tsLiteralType(v, indent + 1)};`
    );
    return `{\n${entries.join("\n")}\n${pad}}`;
  }
  return JSON.stringify(value);
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
  //
  // The auto-dark block is scoped to :root:not([data-theme]) on purpose. A media
  // query adds no specificity, so a plain `:root` here would tie with
  // [data-theme="cream-plum"] above and win on source order — meaning an
  // explicitly forced light theme would render dark on a dark-mode OS.
  lines.push("/* === Dark: Plum / Cream (auto + manual) === */");
  lines.push("@media (prefers-color-scheme: dark) {");
  lines.push("  :root:not([data-theme]) {");
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
    out.push(`  --sidebar-primary: ${mode.button.primary};`);
    out.push(`  --sidebar-primary-foreground: ${mode.text.inverted};`);
    out.push(`  --sidebar-border: ${mode.stroke.subtle};`);
    out.push(`  --sidebar-accent: ${mode.surface.secondary};`);
    out.push(`  --sidebar-accent-foreground: ${mode.text.primary};`);
    out.push(`  --sidebar-ring: ${mode.focus};`);
    out.push(`  --chart-1: ${mode.button.primary};`);
    out.push(`  --chart-2: ${mode.text.secondary};`);
    out.push(`  --chart-3: ${mode.stroke.subtle};`);
    out.push(`  --chart-4: ${state.success};`);
    out.push(`  --chart-5: ${state.warning};`);
    out.push(`  --radius: 0.625rem;`);
    return out.join("\n");
  }

  // Default: cream-plum (light)
  lines.push("@layer base {");
  lines.push("  :root {");
  lines.push(shadcnBlock(modes["cream-plum"]));
  lines.push("  }");
  lines.push("");

  // Dark: plum-cream — scoped like tokens.css so an explicit [data-theme]
  // always wins over the OS preference, regardless of block order below.
  lines.push("  @media (prefers-color-scheme: dark) {");
  lines.push("    :root:not([data-theme]) {");
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
// 4. TypeScript Generator (runtime ESM + declarations)
//
// The package ships compiled .js plus .d.ts rather than raw .ts: files inside
// node_modules are not type-stripped by Node and are not transpiled by default
// by Next/webpack/Vite, so a raw .ts entrypoint fails for most consumers.
// ---------------------------------------------------------------------------

const TS_EXPORTS = ["meta", "typography", "icons", "colors"];

function tsExportValues() {
  return {
    meta: tokens.meta,
    typography: tokens.brand.typography,
    icons: tokens.brand.icons,
    colors: tokens.colors,
  };
}

function buildJS() {
  const values = tsExportValues();
  const lines = [];

  lines.push("// Forte Advice Design Tokens (auto-generated)");
  lines.push("// DO NOT EDIT — regenerate with: npm run build");
  lines.push("");

  for (const name of TS_EXPORTS) {
    lines.push(`export const ${name} = ${JSON.stringify(values[name], null, 2)};`);
    lines.push("");
  }

  lines.push("export function modeColors(mode) {");
  lines.push("  return colors.modes[mode];");
  lines.push("}");
  lines.push("");

  write("dist/ts/tokens.js", lines.join("\n"));
}

function buildTypeScriptDeclarations() {
  const values = tsExportValues();
  const lines = [];

  lines.push("// Forte Advice Design Tokens (auto-generated)");
  lines.push("// DO NOT EDIT — regenerate with: npm run build");
  lines.push("");

  for (const name of TS_EXPORTS) {
    lines.push(`export declare const ${name}: ${tsLiteralType(values[name])};`);
    lines.push("");
  }

  const modeKeys = Object.keys(tokens.colors.modes);
  lines.push(`export type ColorMode = ${modeKeys.map((k) => `"${k}"`).join(" | ")};`);
  lines.push("");
  lines.push("export declare function modeColors(mode: ColorMode): (typeof colors)[\"modes\"][ColorMode];");
  lines.push("");

  write("dist/ts/tokens.d.ts", lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log("Building Forte Advice design tokens...\n");
buildCSS();
buildShadcnCSS();
buildTailwindPreset();
buildJS();
buildTypeScriptDeclarations();
console.log("\nDone!");
