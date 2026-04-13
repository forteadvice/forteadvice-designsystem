# Forte Advice — Design Rules

This document defines the visual DNA and non-negotiable rules for all Forte Advice products. Follow these rules to ensure consistency across projects.

## Visual Identity

Forte Advice uses a warm, sophisticated palette built around deep plums, soft creams, and rich burgundies. The brand communicates trust, strategic thinking, and Danish craftsmanship.

- **Primary palette:** Dark Plum / Plum for depth, Cream for warmth
- **Accent:** Highlight (#FF6A3D) — used sparingly for CTAs and focus states
- **Typography:** Geist — clean, modern, geometric sans-serif
- **Icons:** Phosphor — consistent weight, versatile style

## Color Modes

The system supports 5 color modes. Unless specified, use:
- **Light (default):** Cream / Plum — cream backgrounds, dark plum text
- **Dark:** Plum / Cream — dark plum backgrounds, cream text

Additional modes for specific sections or campaigns:
- **Cream / Burgendy** — cream backgrounds, dark burgundy text
- **Burgendy / Cream** — deep burgundy backgrounds, highlight text
- **Grey** — neutral ash grey backgrounds

## Non-Negotiable Rules

1. **Never hardcode colors.** Always use CSS custom properties (`var(--surface-primary)`) or Tailwind semantic classes (`bg-surface-primary`).

2. **Always support light + dark mode.** Every component must work in both Cream/Plum and Plum/Cream. Test both.

3. **Use semantic token names, not primitives.** Write `bg-surface-primary` not `bg-brand-cream`. This ensures mode switching works correctly.

4. **Respect contrast ratios.** All text on backgrounds must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text).

5. **Use Phosphor icons only.** Default weight: regular. Use bold for emphasis, duotone sparingly.

6. **Use Geist font only.** Load via Google Fonts. Never substitute with other fonts.

7. **Highlight is for emphasis only.** Never use Highlight (#FF6A3D) as a surface/background color. It is reserved for focus states, accent CTAs, and the Burgendy/Cream mode text.

## Typography

| Usage      | Size class    | Weight   |
|------------|---------------|----------|
| H1         | text-4xl      | bold     |
| H2         | text-3xl      | semibold |
| H3         | text-2xl      | semibold |
| H4         | text-xl       | semibold |
| Body       | text-base     | regular  |
| Body small | text-sm       | regular  |
| Caption    | text-xs       | medium   |
| Code       | text-sm mono  | regular  |

## Icon Usage

- **Library:** Phosphor (https://phosphoricons.com)
- **Default weight:** regular
- **Sizes:** 16px (inline), 20px (toolbar/nav), 24px (primary actions), 28px (hero)
- **Color:** `text-primary` by default, `text-secondary` for muted, Highlight for emphasis
- **Don't:** Mix icon libraries. Use duotone for decorative only, never for core UI.

## Buttons

Forte Advice buttons are **pill-shaped** (fully rounded). All buttons support an optional trailing icon (14px Phosphor icon).

### Button Variants

| Variant | Fill | Text | Border | Shape |
|---------|------|------|--------|-------|
| **Primary** | `button-primary` | `text-inverted` | none | Pill (rounded-full) |
| **Secondary** | transparent | `text-primary` | `button-primary` | Pill (rounded-full) |
| **Text Only** | transparent | `text-primary` | none (underline) | No rounding |

### Button States

| State | Primary | Secondary | Text Only |
|-------|---------|-----------|-----------|
| **Default** | Filled | Outlined | Underlined text |
| **Hover** | `button-primary-hover` fill | `button-primary-hover` fill + `text-inverted` | No underline change |
| **Focused** | Focus ring (`--focus`) | Focus ring (`--focus`) | Focus ring (`--focus`) |
| **Pressed** | Same as hover | Same as hover | Same as hover |
| **Disabled** | `button-disabled` fill, `text-disabled` | `button-disabled` border, `text-disabled` | `text-disabled`, no underline |

### Button Anatomy

- **Height:** 44px (all variants)
- **Padding:** Primary uses internal padding, Secondary/Text Only use `padding: 0`
- **Border radius:** `rounded-full` (9999px) for Primary and Secondary. None for Text Only.
- **Icon wrapper:** 44x44px circle (`rounded-full`), same background as button. Sits adjacent to the label pill — the label's right side loses its rounding (`rounded-r-none`) so the pill and circle form a compound shape.
- **Icon size:** 14x14px (Phosphor, weight: regular)
- **Icon color:** `text-inverted` (matches button text)
- **Gap:** Label pill and icon circle are flush (no gap between them)
- **Text Only with icon:** No circle wrapper — icon sits inline with 8px gap
- **Animation:** Hover transitions use ease-out 300ms

## UI Recipes

### Primary Button
```html
<button class="inline-flex items-center justify-center gap-2 h-11
  bg-button-primary hover:bg-button-primary-hover text-text-inverted
  px-6 rounded-full font-semibold transition-colors duration-300 ease-out
  focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
  Label
</button>
```

### Primary Button with Icon
The icon sits in a separate 44px circular wrapper adjacent to the label pill, creating a compound pill+circle shape.

```html
<div class="inline-flex items-center">
  <button class="inline-flex items-center justify-center h-11
    bg-button-primary hover:bg-button-primary-hover text-text-inverted
    pl-6 pr-5 rounded-full rounded-r-none font-semibold transition-colors duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
    Label
  </button>
  <span class="flex items-center justify-center w-11 h-11 rounded-full
    bg-button-primary hover:bg-button-primary-hover text-text-inverted
    transition-colors duration-300 ease-out">
    <ArrowRight size={14} />
  </span>
</div>
```

### Secondary Button with Icon
```html
<div class="inline-flex items-center">
  <button class="inline-flex items-center justify-center h-11
    bg-transparent border border-button-primary text-text-primary
    pl-6 pr-5 rounded-full rounded-r-none font-semibold transition-colors duration-300 ease-out
    hover:bg-button-primary-hover hover:text-text-inverted
    focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
    Label
  </button>
  <span class="flex items-center justify-center w-11 h-11 rounded-full
    border border-button-primary text-text-primary
    hover:bg-button-primary-hover hover:text-text-inverted
    transition-colors duration-300 ease-out">
    <ArrowRight size={14} />
  </span>
</div>
```

### Secondary Button (outline)
```html
<button class="inline-flex items-center justify-center gap-4 h-11
  bg-transparent border border-button-primary text-text-primary
  px-6 rounded-full font-semibold transition-colors duration-300 ease-out
  hover:bg-button-primary-hover hover:text-text-inverted
  focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
  Label
</button>
```

### Text Only Button
```html
<button class="inline-flex items-center justify-center gap-2
  bg-transparent text-text-primary underline
  font-semibold transition-colors duration-300 ease-out
  hover:text-text-secondary
  focus:outline-none focus:ring-2 focus:ring-focus">
  Label
</button>
```

### Disabled Buttons
```html
<!-- Primary disabled -->
<button class="inline-flex items-center justify-center gap-2 h-11
  bg-button-disabled text-text-disabled
  px-6 rounded-full font-semibold cursor-not-allowed" disabled>
  Label
</button>

<!-- Secondary disabled -->
<button class="inline-flex items-center justify-center gap-4 h-11
  bg-transparent border border-button-disabled text-text-disabled
  px-6 rounded-full font-semibold cursor-not-allowed" disabled>
  Label
</button>

<!-- Text Only disabled -->
<button class="inline-flex items-center justify-center gap-2
  bg-transparent text-text-disabled
  font-semibold cursor-not-allowed" disabled>
  Label
</button>
```

### Card
```html
<div class="bg-surface-secondary border border-stroke-subtle rounded-xl p-6">
  <h3 class="text-text-primary text-xl font-semibold">Title</h3>
  <p class="text-text-secondary text-base mt-2">Description</p>
</div>
```

### Input
```html
<input class="bg-surface-primary border border-stroke-subtle rounded-lg
  px-4 py-2.5 text-text-primary placeholder:text-text-disabled
  focus:outline-none focus:ring-2 focus:ring-focus transition-colors"
  placeholder="Placeholder text" />
```

## Mode Switching

Apply a mode by setting `data-theme` on any parent element:

```html
<!-- Entire page in dark mode -->
<html data-theme="plum-cream">

<!-- Just a section in burgundy -->
<section data-theme="burgendy-cream">
  <h2 class="text-text-primary">This uses burgundy mode tokens</h2>
</section>
```

Dark mode (Plum/Cream) also activates automatically via `prefers-color-scheme: dark`.
