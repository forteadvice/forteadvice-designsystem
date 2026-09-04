# Forte Advice Design System

[![Co-created with AI](https://madebyhuman.iamjarl.com/badges/co-created-white.svg)](https://madebyhuman.iamjarl.com)

Shared design system for all Forte Advice products (apps + web).

This repository is the single source of truth for colors, typography, radius, motion, component dimensions and icon usage across all Forte Advice projects. It is designed to work equally well for humans (design overview) and AI tools like Cursor or Claude Code (deterministic tokens + rules).

## Why

- **Consistent** — every product looks and feels like it belongs to the same family
- **Scalable** — easy to extend when adding new features or products
- **Maintainable** — one file to update, everything regenerates
- **AI-Friendly** — deterministic tokens that AI agents can use without hallucinating

## Quick Start

### Install

```bash
npm install github:forteadvice/forteadvice-designsystem
```

### Tailwind v4

v4 does not read a JS config on its own, so use the generated `@theme` file.
Order matters — the `css` import supplies the runtime variables and the mode
cascade, and `theme` maps them onto utilities:

```css
/* globals.css */
@import "tailwindcss";
@import '@forteadvice/design-tokens/css';
@import '@forteadvice/design-tokens/theme';
```

### Tailwind v3

```ts
// tailwind.config.ts
import fortePreset from '@forteadvice/design-tokens/tailwind'

export default {
  presets: [fortePreset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

Both paths generate the same class names, so `bg-surface-primary` and
`text-text-primary` mean the same thing on either version.

### CSS Custom Properties

```css
@import '@forteadvice/design-tokens/css';
```

### shadcn/ui Integration

If using shadcn/ui, import the shadcn theme file instead of (or in addition to) the base CSS. This maps Forte Advice tokens to shadcn's expected variable names (`--background`, `--foreground`, `--primary`, etc.):

```css
/* globals.css */
@import '@forteadvice/design-tokens/css';
@import '@forteadvice/design-tokens/shadcn';
```

All shadcn components will automatically use Forte Advice colors, including dark
mode and all 5 themes. The `.dark` class that shadcn and next-themes toggle is
supported directly, so no extra configuration is needed.

We also recommend installing the [shadcn/ui AI skill](https://ui.shadcn.com/docs/skills) so your AI assistant knows both the component library and the Forte Advice brand:

```bash
pnpm dlx skills add shadcn/ui
```

### TypeScript

```ts
import { colors, typography, modeColors } from '@forteadvice/design-tokens'

const light = modeColors('cream-plum')
const dark = modeColors('plum-cream')
```

### Google Fonts

Add Geist to your project:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400&display=swap" rel="stylesheet">
```

## Color Modes

The system supports 5 color modes. Default is Cream/Plum (light):

| Mode | `data-theme` | Usage |
|------|-------------|-------|
| Cream / Plum | `cream-plum` | Default light mode |
| Plum / Cream | `plum-cream` | Default dark mode (auto via `prefers-color-scheme`) |
| Cream / Burgendy | `cream-burgendy` | Alternative light theme |
| Burgendy / Cream | `burgendy-cream` | Alternative dark theme |
| Grey | `grey` | Neutral sections |

Switch modes by setting `data-theme` on any element:

```html
<html data-theme="plum-cream">
<!-- or scope it to a section -->
<section data-theme="burgendy-cream">
```

### Precedence

Three mechanisms are supported, in increasing precedence:

| Mechanism | Applies |
|-----------|---------|
| `prefers-color-scheme` | Only when nothing else is pinned |
| `.light` / `.dark` class | Tailwind `darkMode: "class"`, next-themes, shadcn |
| `data-theme="..."` | All five modes — wins over the class toggle |

So a project already toggling `.dark` with next-themes works without changes, and
a pinned theme is never overridden by the OS preference.

Each mode also sets the CSS `color-scheme` property, so native scrollbars,
selects, checkboxes and date pickers follow the mode instead of always rendering
light.

## Usage Examples

```html
<!-- Primary button — always pill-shaped (rounded-full), never rounded-lg -->
<button class="inline-flex items-center justify-center gap-2 h-11 px-6
  bg-button-primary hover:bg-button-primary-hover text-text-inverted
  rounded-full font-semibold transition-colors duration-300 ease-out
  focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
  Get Started
</button>

<!-- Card -->
<div class="bg-surface-secondary border border-stroke-subtle rounded-xl p-6">
  <h3 class="text-text-primary text-xl font-semibold">Title</h3>
  <p class="text-text-secondary mt-2">Description</p>
</div>
```

## Radius, Motion and Component Dimensions

Beyond colors, `tokens.json` records the fixed dimensions that `design.md`
specifies, so they do not have to be copied out of prose:

| Group | Examples | CSS |
|-------|----------|-----|
| `radius` | `input`, `card`, `pill` | `var(--radius-card)` |
| `motion` | `duration`, `easing` | `var(--duration)`, `var(--easing)` |
| `components.button` | `height`, `paddingX`, `iconSize`, `iconCircleSize` | `var(--button-height)` |
| `components.card` / `.input` | `padding`, `radius` | `var(--card-padding)` |
| `components.focusRing` | `width`, `offset` | `var(--focus-ring-width)` |

These are exposed as CSS custom properties and through the TypeScript module,
but deliberately **not** as Tailwind utilities — the recipes in `design.md` are
written against Tailwind's own `rounded-*`, `h-*` and `gap-*` classes, and a
parallel set of utilities could only drift from them.

There is also **no bespoke spacing scale**. Layout spacing follows Tailwind's
default 4px scale (`gap-2`, `px-6`, `p-6`), which is what every recipe already
uses. Only the fixed component dimensions above are Forte decisions.

The type scale in `brand.typography.scale` records each role from `design.md`
with both its value and its Tailwind class; `npm run validate` checks the two
against each other so they cannot drift.

## PowerPoint Templates

Two ready-to-use PowerPoint templates with the Forte Advice color theme are available in `assets/powerpoint/`:

| File | Slides | Purpose |
|------|--------|---------|
| [forte-advice-template-01.pptx](assets/powerpoint/forte-advice-template-01.pptx) | 82 | Full template with all slide layouts |
| [forte-advice-template-02.pptx](assets/powerpoint/forte-advice-template-02.pptx) | 74 | Alternative template variant |

Both templates share the same theme and 65 named slide layouts. See [powerpoint.md](powerpoint.md) for the full layout reference, theme color mapping and rules for building decks.

**Font note:** PowerPoint templates use **Aptos** (body) and **Aptos Display** (headings) instead of Geist. Aptos ships with Microsoft 365 by default, so it works on any machine without font installation. For web/digital products, continue to use Geist.

Placeholder images have been stripped from the templates — replace with your own visuals when building decks.

The templates' theme colors and fonts are validated against `tokens.json` in CI:

```bash
npm run validate:pptx
```

## Documentation

| File | Purpose |
|------|---------|
| [design.md](design.md) | Visual rules, typography, icons, UI recipes |
| [powerpoint.md](powerpoint.md) | PowerPoint rules, theme mapping, layout reference |
| [CLAUDE.md](CLAUDE.md) | AI agent instructions |
| [tokens.json](tokens.json) | Single source of truth for all tokens |
| [index.html](index.html) | Visual token viewer (open in browser) |
| [scripts/strip-pptx-media.py](scripts/strip-pptx-media.py) | Strip media from .pptx files |

## Development

Every pull request runs `validate`, `validate:pptx` and `build` in CI, and fails
if `dist/` is not in sync with `tokens.json` — so run `npm run build` before
pushing.

```bash
# Validate tokens (schema + WCAG contrast)
npm run validate

# Build all outputs (CSS + Tailwind preset + JS/TS module)
npm run build
```

### Updating Tokens

1. Edit `tokens.json`
2. Bump `meta.version`
3. Run `npm run build`
4. Push to main — CI auto-commits generated files and tags `v<meta.version>`

Tags are only created for a version that has not been released before. Existing
tags are never moved, so a pinned `#vX.Y.Z` install always resolves to the same
content — bump `meta.version` to publish a change.

## Breaking Changes

### 0.6.0

- `bg-state-errorForeground` is now `bg-state-error-foreground`. The v3 preset
  passed state keys through unchanged while the new v4 theme kebab-cased them;
  both now kebab-case, so the two versions agree. The CSS variable is
  `--color-error-foreground`.

Everything else is additive: a new `./theme` export for Tailwind v4, and the
`radius`, `motion`, `components` and `brand.typography.scale` token groups.

### 0.5.0

Additive, with one visible change: every mode now emits the CSS `color-scheme`
property. Native controls and default scrollbars will render dark in the dark
modes instead of light. If you had worked around the old behaviour with custom
scrollbar styling, remove it.

New tokens: `colors.state.errorForeground` (shadcn `--destructive-foreground`)
and a `colorScheme` field on every mode.

### 0.4.0

- `--color-habour-mist` is now `--color-harbour-mist` (Tailwind: `brand.habour-mist`
  → `brand.harbour-mist`). The tone scale was already spelled `harbourMist`; the
  primitive now matches it.
- `--color-focus` has been removed. The focus ring is mode-dependent, so use the
  semantic `--focus` (Tailwind: `ring-focus`), which resolves per `data-theme`.

## Architecture

```
tokens.json              ← Edit this
    │
    ├─► dist/css/tokens.css        (CSS custom properties)
    ├─► dist/css/shadcn.css        (shadcn/ui theme)
    ├─► dist/css/theme.css         (Tailwind v4 @theme)
    ├─► dist/tailwind/preset.js    (Tailwind v3 preset)
    ├─► dist/ts/tokens.js          (runtime ESM module)
    └─► dist/ts/tokens.d.ts        (TypeScript declarations)
```
