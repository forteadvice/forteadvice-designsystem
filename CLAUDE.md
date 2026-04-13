# Forte Advice Design System — AI Agent Instructions

You are working on a project that uses the Forte Advice design system. Follow these rules precisely.

## Quick Reference

- **Tokens:** All design decisions live in `tokens.json`. Never invent colors, fonts, or spacing.
- **CSS:** Import `@forteadvice/design-tokens/css` for CSS custom properties.
- **shadcn/ui:** Import `@forteadvice/design-tokens/shadcn` for shadcn-compatible CSS variables.
- **Tailwind:** Use the preset from `@forteadvice/design-tokens/tailwind`.
- **TypeScript:** Import from `@forteadvice/design-tokens` for programmatic access.

## Rules

1. **Always use semantic tokens** — write `bg-surface-primary` not `bg-[#F2F0E7]`. Never hardcode hex values.
2. **Support all color modes** — components must work across all 5 modes. Use CSS custom properties, not static colors.
3. **Default modes:** Light = Cream/Plum, Dark = Plum/Cream. Unless told otherwise, implement for these two.
4. **Font:** Geist (sans) and Geist Mono (mono). Load from Google Fonts. Never substitute.
5. **Icons:** Phosphor only. Default weight: regular. Import from `@phosphor-icons/react`.
6. **Highlight (#FF6A3D)** is accent only. Never use as a background surface.
7. **Mode switching** uses `data-theme` attribute: `cream-plum`, `plum-cream`, `cream-burgendy`, `burgendy-cream`, `grey`.

## Semantic Token Names (Tailwind classes)

| Token | CSS Variable | Tailwind Class | Purpose |
|-------|-------------|----------------|---------|
| Surface primary | `--surface-primary` | `bg-surface-primary` | Page/section background |
| Surface secondary | `--surface-secondary` | `bg-surface-secondary` | Card/muted background |
| Text primary | `--text-primary` | `text-text-primary` | Headings, body text |
| Text secondary | `--text-secondary` | `text-text-secondary` | Muted/supporting text |
| Text inverted | `--text-inverted` | `text-text-inverted` | Text on primary buttons |
| Button primary | `--button-primary` | `bg-button-primary` | Primary button fill |
| Button hover | `--button-primary-hover` | `hover:bg-button-primary-hover` | Primary button hover |
| Stroke harsh | `--stroke-harsh` | `border-stroke-harsh` | Strong borders |
| Stroke subtle | `--stroke-subtle` | `border-stroke-subtle` | Subtle borders/dividers |
| Focus | `--focus` | `ring-focus` | Focus ring color |

## Buttons

Forte Advice buttons are **pill-shaped** (`rounded-full`). Three variants:

| Variant | Classes |
|---------|---------|
| **Primary** | `inline-flex items-center justify-center h-11 px-6 rounded-full bg-button-primary hover:bg-button-primary-hover text-text-inverted font-semibold transition-colors duration-300` |
| **Secondary** | `inline-flex items-center justify-center h-11 px-6 rounded-full border border-button-primary bg-transparent text-text-primary hover:bg-button-primary-hover hover:text-text-inverted font-semibold transition-colors duration-300` |
| **Text Only** | `inline-flex items-center justify-center bg-transparent text-text-primary underline font-semibold transition-colors duration-300` |

- **Icon buttons** use a compound pill+circle shape: the label sits in a pill (with `rounded-r-none` on the right), and the icon sits in a separate 44x44px circle (`w-11 h-11 rounded-full`) with the same background color, placed flush next to the pill. Icon is 14px Phosphor. Text Only variant uses inline icon with `gap-2` instead of a circle wrapper.
- Disabled: use `bg-button-disabled text-text-disabled cursor-not-allowed`
- Focus: `focus:ring-2 focus:ring-focus focus:ring-offset-2`
- **Never use `rounded-lg` on buttons** — always `rounded-full` (pill shape)

## File Structure

```
tokens.json          — Source of truth (edit this to change tokens)
scripts/build.js     — Generates dist/ from tokens.json
scripts/validate.js  — Validates tokens + WCAG contrast
dist/css/tokens.css  — Generated CSS custom properties
dist/css/shadcn.css  — Generated shadcn/ui compatible theme
dist/tailwind/preset.js — Generated Tailwind preset
dist/ts/tokens.ts    — Generated TypeScript module
design.md            — Visual rules and UI recipes
assets/logo/         — SVG logo files
```

## When Modifying the Design System

1. Edit `tokens.json`
2. Run `npm run validate` to check
3. Run `npm run build` to regenerate dist/
4. Bump `meta.version` in tokens.json
