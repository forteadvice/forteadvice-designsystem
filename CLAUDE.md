# Forte Advice Design System — AI Agent Instructions

You are working on a project that uses the Forte Advice design system. Follow these rules precisely.

## Quick Reference

- **Tokens:** All design decisions live in `tokens.json`. Never invent colors, fonts, or spacing.
- **CSS:** Import `@forteadvice/design-tokens/css` for CSS custom properties.
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

## File Structure

```
tokens.json          — Source of truth (edit this to change tokens)
scripts/build.js     — Generates dist/ from tokens.json
scripts/validate.js  — Validates tokens + WCAG contrast
dist/css/tokens.css  — Generated CSS custom properties
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
