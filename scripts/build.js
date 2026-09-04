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

/**
 * Emits the mode cascade shared by tokens.css and shadcn.css. The order is
 * deliberate:
 *
 *   1. :root carries the default light mode.
 *   2. The auto-dark media query is scoped away from every explicit opt-in
 *      (.light, .dark, [data-theme]). A media query adds no specificity, so an
 *      unscoped :root here would tie with those and win on source order —
 *      a pinned light theme would render dark on a dark-mode OS.
 *   3. .light / .dark support Tailwind's darkMode: "class" and next-themes,
 *      which is how shadcn projects toggle their theme.
 *   4. [data-theme] comes last, so the design system's own five-mode switch
 *      wins over the two-state class toggle when a project uses both.
 */
function modeCascade(modes, block) {
  const out = [];
  const light = modes["cream-plum"];
  const dark = modes["plum-cream"];

  out.push(`/* === Default: ${light.label} === */`);
  out.push(":root {");
  out.push(block(light));
  out.push("}");
  out.push("");

  out.push(`/* === Auto dark: ${dark.label} — only when no theme is pinned === */`);
  out.push("@media (prefers-color-scheme: dark) {");
  out.push("  :root:not(.light):not(.dark):not([data-theme]) {");
  out.push(block(dark).replace(/^  /gm, "    "));
  out.push("  }");
  out.push("}");
  out.push("");

  out.push('/* === Class toggle: Tailwind darkMode: "class" / next-themes === */');
  out.push(".light {");
  out.push(block(light));
  out.push("}");
  out.push(".dark {");
  out.push(block(dark));
  out.push("}");
  out.push("");

  out.push("/* === data-theme modes — win over the class toggle above === */");
  for (const [key, mode] of Object.entries(modes)) {
    out.push(`/* ${mode.label} */`);
    out.push(`[data-theme="${key}"] {`);
    out.push(block(mode));
    out.push("}");
    out.push("");
  }

  return out;
}

function indentLines(lines, pad) {
  if (!pad) return lines;
  return lines.map((line) => (line === "" ? "" : line.replace(/^/gm, pad)));
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
    lines.push(`  --color-${camelToKebab(key)}: ${value};`);
  }

  lines.push("");
  lines.push("  /* Typography */");
  lines.push(`  --font-sans: '${typography.fontFamily.sans}', system-ui, sans-serif;`);
  lines.push(`  --font-mono: '${typography.fontFamily.mono}', ui-monospace, monospace;`);

  lines.push("");
  lines.push("  /* Type scale (roles from design.md) */");
  for (const [role, step] of Object.entries(typography.scale)) {
    const name = camelToKebab(role);
    lines.push(`  --text-${name}-size: ${step.fontSize};`);
    lines.push(`  --text-${name}-line-height: ${step.lineHeight};`);
    lines.push(`  --text-${name}-weight: ${step.fontWeight};`);
  }

  lines.push("");
  lines.push("  /* Radius */");
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`  --radius-${camelToKebab(key)}: ${value};`);
  }

  lines.push("");
  lines.push("  /* Motion */");
  lines.push(`  --duration: ${tokens.motion.duration};`);
  lines.push(`  --easing: ${tokens.motion.easing};`);

  lines.push("");
  lines.push("  /* Component dimensions */");
  for (const [component, props] of Object.entries(tokens.components)) {
    for (const [prop, value] of Object.entries(props)) {
      lines.push(`  --${camelToKebab(component)}-${camelToKebab(prop)}: ${value};`);
    }
  }

  lines.push("}");
  lines.push("");

  // --- Semantic tokens per mode ---
  function modeBlock(mode) {
    const out = [];
    const { surface, text, button, stroke, focus } = mode;
    // Not a custom property: this is what tells the browser to render native
    // scrollbars, selects, date pickers and form controls dark instead of light.
    out.push(`  color-scheme: ${mode.colorScheme};`);
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

  lines.push(...modeCascade(modes, modeBlock));

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
  lines.push("   Theme switching works three ways, in increasing precedence:");
  lines.push("     - prefers-color-scheme, when nothing is pinned");
  lines.push("     - .light / .dark, for Tailwind darkMode:\"class\" and next-themes");
  lines.push("     - [data-theme=\"...\"], for all five Forte Advice modes");
  lines.push("");
  lines.push("   Import this AFTER tokens.css in your project:");
  lines.push("   @import '@forteadvice/design-tokens/css';");
  lines.push("   @import '@forteadvice/design-tokens/shadcn';");
  lines.push("   ============================================ */");
  lines.push("");

  function shadcnBlock(mode) {
    const out = [];
    out.push(`  color-scheme: ${mode.colorScheme};`);
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
    out.push(`  --destructive-foreground: ${state.errorForeground};`);
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
    out.push(`  --radius: ${tokens.radius.shadcnBase};`);
    return out.join("\n");
  }

  lines.push("@layer base {");
  lines.push(...indentLines(modeCascade(modes, shadcnBlock), "  "));
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

  // Build state color map (kebab-cased, so the v3 preset and the v4 @theme
  // generate the same class names)
  const stateColors = {};
  for (const [key, value] of Object.entries(state)) {
    stateColors[camelToKebab(key)] = value;
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
          state: stateColors,
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
// 4. Tailwind v4 @theme Generator
//
// Tailwind v4 does not pick up a JS config on its own — it needs an explicit
// @config directive — so the preset above only serves v3. v4 projects import
// this file instead, after `@import "tailwindcss"`.
//
// It deliberately exposes the same utility surface as the v3 preset (colours
// and fonts, nothing else), so the class names documented in CLAUDE.md and
// design.md mean the same thing on both versions. Radius, motion and component
// dimensions stay custom properties, consumed as var(--radius-card) and
// friends: the recipes in design.md are written against Tailwind's own
// rounded-*/h-*/gap-* utilities, and a parallel set could only drift from them.
// ---------------------------------------------------------------------------

function buildTailwindV4Theme() {
  const { primitives, tones, state } = tokens.colors;
  const { typography } = tokens.brand;
  const lines = [];

  lines.push("/* ============================================");
  lines.push("   Forte Advice — Tailwind v4 theme (auto-generated)");
  lines.push("   DO NOT EDIT — regenerate with: npm run build");
  lines.push("");
  lines.push("   Usage — order matters. CSS comments do not nest, so the example");
  lines.push("   below is written without inline annotations on purpose:");
  lines.push("");
  lines.push('     @import "tailwindcss";');
  lines.push("     @import '@forteadvice/design-tokens/css';");
  lines.push("     @import '@forteadvice/design-tokens/theme';");
  lines.push("");
  lines.push("   The css import supplies the runtime variables and the mode cascade;");
  lines.push("   this file maps them onto Tailwind utilities.");
  lines.push("   ============================================ */");
  lines.push("");

  // `inline` is required, not stylistic. Without it the utility would resolve
  // --color-surface-primary once at :root and inherit that computed value, so a
  // nested [data-theme] section would keep the root mode's colour. With it, the
  // utility emits var(--surface-primary) directly and the cascade works.
  lines.push("/* Semantic, mode-aware colours — `inline` keeps mode switching working. */");
  lines.push("@theme inline {");
  const semantic = [
    ["surface-primary", "--surface-primary"],
    ["surface-secondary", "--surface-secondary"],
    ["surface-opaque", "--surface-opaque"],
    ["text-primary", "--text-primary"],
    ["text-secondary", "--text-secondary"],
    ["text-inverted", "--text-inverted"],
    ["text-disabled", "--text-disabled"],
    ["button-primary", "--button-primary"],
    ["button-primary-hover", "--button-primary-hover"],
    ["button-disabled", "--button-disabled"],
    ["stroke-harsh", "--stroke-harsh"],
    ["stroke-subtle", "--stroke-subtle"],
    ["focus", "--focus"],
  ];
  for (const [name, ref] of semantic) {
    lines.push(`  --color-${name}: var(${ref});`);
  }
  lines.push("}");
  lines.push("");

  lines.push("/* Static values — safe to resolve at build time. */");
  lines.push("@theme {");
  lines.push("  /* Brand primitives */");
  for (const [key, value] of Object.entries(primitives)) {
    lines.push(`  --color-brand-${camelToKebab(key)}: ${value};`);
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
    lines.push(`  --color-state-${camelToKebab(key)}: ${value};`);
  }

  lines.push("");
  lines.push("  /* Typography */");
  lines.push(`  --font-sans: '${typography.fontFamily.sans}', system-ui, sans-serif;`);
  lines.push(`  --font-mono: '${typography.fontFamily.mono}', ui-monospace, monospace;`);
  lines.push("}");
  lines.push("");

  write("dist/css/theme.css", lines.join("\n"));
}

// ---------------------------------------------------------------------------
// 5. TypeScript Generator (runtime ESM + declarations)
//
// The package ships compiled .js plus .d.ts rather than raw .ts: files inside
// node_modules are not type-stripped by Node and are not transpiled by default
// by Next/webpack/Vite, so a raw .ts entrypoint fails for most consumers.
// ---------------------------------------------------------------------------

const TS_EXPORTS = ["meta", "typography", "icons", "colors", "radius", "motion", "components"];

function tsExportValues() {
  return {
    meta: tokens.meta,
    typography: tokens.brand.typography,
    icons: tokens.brand.icons,
    colors: tokens.colors,
    radius: tokens.radius,
    motion: tokens.motion,
    components: tokens.components,
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
buildTailwindV4Theme();
buildJS();
buildTypeScriptDeclarations();
console.log("\nDone!");
