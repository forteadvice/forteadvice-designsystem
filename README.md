# Forte Advice Design System

Shared design system for all Forte Advice products (apps + web).

This repository is the single source of truth for colors, typography, spacing and icon usage across all Forte Advice projects. It is designed to work equally well for humans (design overview) and AI tools like Cursor or Claude Code (deterministic tokens + rules).

## Why

- **Consistent** — every product looks and feels like it belongs to the same family
- **Scalable** — easy to extend when adding new features or products
- **Maintainable** — one file to update, everything regenerates
- **AI-Friendly** — deterministic tokens that AI agents can use without hallucinating

## Quick Start

### Install

```bash
npm install github:forteadvice/designsystem
```

### Tailwind v4

```ts
// tailwind.config.ts
import fortePreset from '@forteadvice/design-tokens/tailwind'

export default {
  presets: [fortePreset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

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

All shadcn components will automatically use Forte Advice colors, including dark mode and all 5 themes.

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

## Usage Examples

```html
<!-- Primary button -->
<button class="bg-button-primary hover:bg-button-primary-hover text-text-inverted
  px-5 py-2.5 rounded-lg font-semibold">
  Get Started
</button>

<!-- Card -->
<div class="bg-surface-secondary border border-stroke-subtle rounded-xl p-6">
  <h3 class="text-text-primary text-xl font-semibold">Title</h3>
  <p class="text-text-secondary mt-2">Description</p>
</div>
```

## Documentation

| File | Purpose |
|------|---------|
| [design.md](design.md) | Visual rules, typography, icons, UI recipes |
| [CLAUDE.md](CLAUDE.md) | AI agent instructions |
| [tokens.json](tokens.json) | Single source of truth for all tokens |
| [index.html](index.html) | Visual token viewer (open in browser) |

## Development

```bash
# Validate tokens (schema + WCAG contrast)
npm run validate

# Build all outputs (CSS + Tailwind preset + TypeScript)
npm run build
```

### Updating Tokens

1. Edit `tokens.json`
2. Bump `meta.version`
3. Run `npm run build`
4. Push to main — CI auto-commits generated files and tags the version

## Architecture

```
tokens.json              ← Edit this
    │
    ├─► dist/css/tokens.css        (CSS custom properties)
    ├─► dist/css/shadcn.css        (shadcn/ui theme)
    ├─► dist/tailwind/preset.js    (Tailwind preset)
    └─► dist/ts/tokens.ts          (TypeScript module)
```
