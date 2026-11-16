# Forte Advice Design System — AI Agent Instructions

You are working on a project that uses the Forte Advice design system. Follow these rules precisely.

**Most work here is building PowerPoint decks.** If that is the task, start at
[PowerPoint](#powerpoint) below and read [powerpoint.md](powerpoint.md) — it has
the 65 layout names, the example-slide index and every layout's placeholders.
Skip to [Web and app products](#web-and-app-products) only for digital UI.

In both cases: **all design decisions live in `tokens.json`. Never invent colors, fonts, or spacing.**

## PowerPoint

### Rules

1. **Always start from a template** in `assets/powerpoint/` (default: `forte-advice-template-01.pptx`). Never build a deck from a blank file.
2. **Duplicate example slides — don't instantiate bare layouts.** The example slides carry constructions the bare layouts do not: the agenda is an 8×2 table with divider lines, image arrangements are pre-built, slide numbers are instantiated. `add_slide(layout)` gives you empty placeholders instead and the table is simply gone.
3. **Select layouts by their exact names** (e.g. `TITLE: Plum`, `QUOTE: Burgundy`, `FOCUS x 3: Numbers`) — the full inventory of 65 is in `powerpoint.md`.
4. **Fill the layout's placeholders**, and also replace the text the template keeps *outside* them. Placeholder indices per layout are in powerpoint.md's appendix; the off-placeholder text — group shapes, table cells, `BLANK:` layouts — is listed in its "Text Outside Placeholders" table. Filling only `slide.placeholders[idx]` ships `Name Namesen` and `Caborepe porum exerume` to the client.
5. **Fonts: Aptos Display (headings) / Aptos (body).** Never Geist in PowerPoint. Leave runs on the theme font (`+mn-lt` / `+mj-lt`) rather than naming a font.
6. **Colors: theme slots only.** The slot→token mapping lives in `powerpoint.theme` in `tokens.json`. Never hardcode hex outside that palette.
7. **Validate before you hand it over:** `npm run validate:pptx -- your-deck.pptx`.

### Building a deck

Use the `pptx` skill's scripts for the structural work — python-pptx cannot
duplicate or delete slides, so this is not something to hand-roll. Paths below
are relative to that skill's directory.

```bash
cp assets/powerpoint/forte-advice-template-01.pptx deck.pptx
python3 -c "import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall('unpacked')" deck.pptx

# Need a layout more than once? Duplicate its example slide first.
python3 scripts/add_slide.py unpacked/ slide58.xml --after slide58.xml

# Then edit <p:sldIdLst> in unpacked/ppt/presentation.xml down to the slides
# you want, in the order you want them.
python3 scripts/clean.py unpacked/     # drops the unused slides, media and rels

(cd unpacked && rm -f ../deck.pptx && zip -Xqr ../deck.pptx .)
npm run validate:pptx -- deck.pptx
```

- **Do all structural work — duplicate, delete, reorder — before editing any slide's content.** `add_slide.py` copies a slide verbatim, so duplicating after editing clones the edited text, and `clean.py` deletes any slide missing from `<p:sldIdLst>`.
- **Slide position == `slideN.xml`** in both templates, so the example-slide index in powerpoint.md can be used directly as filenames. `validate-pptx.py` asserts this, because a round-trip through PowerPoint can renumber the parts.
- `clean.py` needs `defusedxml`. It matters: it takes a 4-slide deck from 2.8 MB down to ~228 KB by removing the 78 example slides' media.
- Example photos in the templates are stripped to 1×1 placeholders — replace them with real visuals. The `forte`/`advice` wordmarks and "5th element" graphics are intact in the masters and render automatically.

## Web and app products

- **CSS:** Import `@forteadvice/design-tokens/css` for CSS custom properties.
- **shadcn/ui:** Import `@forteadvice/design-tokens/shadcn` for shadcn-compatible CSS variables.
- **Tailwind v4:** Import `@forteadvice/design-tokens/theme` after `@import "tailwindcss"` and after the `css` import.
- **Tailwind v3:** Use the preset from `@forteadvice/design-tokens/tailwind`.
- **TypeScript:** Import from `@forteadvice/design-tokens` for programmatic access.
- **Dimensions:** Radius, motion and component sizes are tokens too — use `var(--button-height)`, `var(--radius-card)`, `var(--duration)`. Layout spacing uses Tailwind's default scale; there is no Forte spacing scale to look up.

### Rules

1. **Always use semantic tokens** — write `bg-surface-primary` not `bg-[#F2F0E7]`. Never hardcode hex values.
2. **Support all color modes** — components must work across all 5 modes. Use CSS custom properties, not static colors.
3. **Default modes:** Light = Cream/Plum, Dark = Plum/Cream. Unless told otherwise, implement for these two.
4. **Font:** Geist (sans) and Geist Mono (mono). Load from Google Fonts. Never substitute.
5. **Icons:** Phosphor only. Default weight: regular. Import from `@phosphor-icons/react`.
6. **Highlight (#FF6A3D)** is accent only. Never use as a background surface, and never as a focus ring — it fails WCAG 1.4.11 on cream and ash grey. Always use `ring-focus` / `var(--focus)`, which resolves per mode.
7. **Mode switching** uses `data-theme`: `cream-plum`, `plum-cream`, `cream-burgendy`, `burgendy-cream`, `grey`. A `.light` / `.dark` class also works for shadcn and next-themes; `data-theme` wins over it.

### Semantic Token Names (Tailwind classes)

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

### Buttons

Forte Advice buttons are **pill-shaped** (`rounded-full`). Three variants:

| Variant | Classes |
|---------|---------|
| **Primary** | `inline-flex items-center justify-center h-11 px-6 rounded-full bg-button-primary hover:bg-button-primary-hover text-text-inverted font-semibold transition-colors duration-300` |
| **Secondary** | `inline-flex items-center justify-center h-11 px-6 rounded-full border border-button-primary bg-transparent text-text-primary hover:bg-button-primary-hover hover:text-text-inverted font-semibold transition-colors duration-300` |
| **Text Only** | `inline-flex items-center justify-center bg-transparent text-text-primary underline font-semibold transition-colors duration-300` |

- **Icon buttons** use a compound pill+circle shape: the label sits in a fully rounded pill, and the icon sits in a separate 44x44px circle (`w-11 h-11 rounded-full -ml-3 relative z-10`) with the same background color, overlapping the pill slightly. Icon is 14px Phosphor. Text Only variant uses inline icon with `gap-2` instead of a circle wrapper.
- Disabled: use `bg-button-disabled text-text-disabled cursor-not-allowed`
- Focus: `focus:ring-2 focus:ring-focus focus:ring-offset-2`
- **Never use `rounded-lg` on buttons** — always `rounded-full` (pill shape)

## File Structure

```
tokens.json          — Source of truth (edit this to change tokens)
powerpoint.md        — PowerPoint rules, layout reference, placeholder appendix
design.md            — Visual rules and UI recipes (web)
assets/powerpoint/   — Official .pptx templates
assets/logo/         — SVG logo files

scripts/build.js             — Generates dist/ from tokens.json
scripts/validate.js          — Validates tokens + WCAG contrast
scripts/validate-pptx.py     — Validates templates or any deck against tokens.json
scripts/gen-pptx-layouts.py  — Regenerates powerpoint.md's generated sections
scripts/strip-pptx-media.py  — Strips media from .pptx files

dist/css/tokens.css     — Generated CSS custom properties
dist/css/shadcn.css     — Generated shadcn/ui compatible theme
dist/css/theme.css      — Generated Tailwind v4 @theme
dist/tailwind/preset.js — Generated Tailwind v3 preset
dist/ts/tokens.js       — Generated runtime ESM module
dist/ts/tokens.d.ts     — Generated TypeScript declarations
```

## When Modifying the Design System

1. Edit `tokens.json`
2. Run `npm run validate` to check
3. Run `npm run build` to regenerate dist/
4. Bump `meta.version` in tokens.json

After editing a .pptx template, run `npm run validate:pptx` and regenerate
powerpoint.md's generated sections with `python3 scripts/gen-pptx-layouts.py`.
