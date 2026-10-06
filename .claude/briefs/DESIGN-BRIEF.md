# Brasmora — Design Brief: "The Dresser"

This is the implementation prompt for the engineer and the source of truth for the motion engineer. Read it top to bottom before touching code. Concept background is in `.claude/briefs/CONCEPTS.md` (Concept 3). The rules in `.claude/knowledge/DESIGN-MASTER.md` and `.claude/knowledge/CHECKLIST-QC.md` still apply. Where this brief is more specific, follow this brief.

Scope: the storefront only (`src/app/(store)/**`, `src/components/**` except `admin`, `src/styles/variables.css`, `src/styles/globals.css`, `src/styles/animations.css`, `src/app/layout.tsx`, `src/app/fonts.css`, `public/` brand assets). Admin (`src/app/admin/**`, `src/components/admin/**`, `src/styles/admin.css`) stays untouched. It is already isolated on `--admin-*` variables. Functionality, routes, data model, API, currency logic and the homepage "no product in two sections" claim logic stay as they are.

House rules for the code: no comments anywhere; reuse existing utilities and patterns (`PriceDisplay`, `QuantitySelector`, `Breadcrumbs`, `EmptyState`, `ConfirmDialog`, `CartProvider`, `CurrencyProvider`, `ThemeProvider`, `homepage-products.ts` helpers) and restyle them rather than writing parallel ones; tokens only, no hex values in components.

---

## 1. Direction in one paragraph

Brasmora is a painted kitchen dresser. Open shelves hold plates and glasses, drawers hold utensils, cutlery and linen, cupboards hold pans, bakeware and storage, and hooks hold mugs and bar tools. The site is two-tone: cool chalk walls and deep chocolate paint, with small bevelled brass plates as the only ornament. Products never float in boxes. They stand on shelves with a contact shadow. Disclosure is physical: drawers slide out, cupboard doors swing, hooks sway. The visitor should feel they are looking at a real, well-kept piece of furniture full of good things, and should be able to find, compare and buy one in a few clicks.

Category-to-furniture mapping (used by the hero, the mega-menu and the drawer index):

| Zone | Categories (slugs from `src/config/catalog.ts`) |
|---|---|
| Open shelves | `tableware`, `glassware-drinkware` |
| Drawers | `utensils-gadgets`, `cutlery`, `kitchen-table-linen` |
| Cupboards | `cookware`, `bakeware`, `storage-organisation` |
| Hooks | `coffee-tea`, `bar-wine` |

The furniture names are visual organisation only. All user-facing labels use the real category names.

---

## 2. Token plumbing — how the new system plugs into the existing names

### 2.1 Where tokens live today
- `src/styles/variables.css` holds the CSS custom properties (`:root` and `[data-theme="dark"]`). This is the single source of colour.
- `src/styles/globals.css` holds the Tailwind v4 `@theme inline` block that turns those variables into utilities (`bg-surface`, `text-ink`, `text-ink-muted`, `border-line`, `bg-brand`, `text-sale` …). This is what Tailwind v4 actually compiles from.
- `tailwind.config.ts` mirrors the same aliases plus the `heroui()` plugin. `globals.css` has no `@config` directive, so Tailwind v4 does not read this file. Update it anyway so the two stay in sync for any tool that reads it, but treat `@theme` as authoritative.
- `ThemeProvider` sets `data-theme="light|dark"` and the `dark` class on `<html>`; dark tokens hang off `[data-theme="dark"]`. Keep this.
- HeroUI: the storefront only imports `Chip` (account pages) and `Spinner` (`LoadingSpinner`). Replace those storefront usages with the `Plate` badge (§7.7) and the shelf loader (§7.17). Leave admin's HeroUI usage alone. If a storefront HeroUI component remains, pass the hex values from §3 to `heroui({ themes: { light: { colors }, dark: { colors } } })` with `layout.radius` all `0px`.

### 2.2 Keep every existing alias name, change what it points to
Existing utility usage counts in the storefront: `border-line` 106, `text-ink` 97, `text-ink-muted` 89, `text-ink-subtle` 79, `bg-surface` 71, `text-brand` 60, `border-brand` 34, `bg-surface-1` 33, `bg-brand` 28, `bg-brand-soft` 20, `bg-surface-2` 13, `rounded-pill` 10, `bg-sale` 7, `text-sale` 6. Inline `var(--color-accent)` appears 43 times, `var(--color-text-tertiary)` 42 times and `var(--color-border)` 38 times. The names stay, so everything keeps compiling. The values change:

| Existing variable | Utility alias | New meaning |
|---|---|---|
| `--color-bg` | `bg-surface` | chalk page canvas |
| `--color-bg-secondary` | `bg-surface-1` | band (alternating sections, input disabled) |
| `--color-bg-tertiary` | `bg-surface-2` | inset (cubby back, skeleton) |
| `--color-bg-warm` | `bg-surface-warm` | brass tint (sale band, note boxes) |
| `--color-text` | `text-ink` | chocolate ink |
| `--color-text-secondary` | `text-ink-muted` | muted ink |
| `--color-text-tertiary` | `text-ink-subtle` | faint ink (still ≥4.5:1) |
| `--color-accent` | `bg-brand`, `text-brand`, `border-brand` | paint: chocolate in light, chalk in dark |
| `--color-accent-hover` | `bg-brand-hover` | paint pressed |
| `--color-accent-light` | `bg-brand-soft` | paint tint for hover fills |
| `--color-accent-2` | `bg-brand-2` | brass |
| `--color-accent-3` | `text-sale`, `bg-sale` | sale ink (dark brass) |
| `--color-border` | `border-line` | hairline |
| `--color-border-hover` | `border-line-hover` | stronger hairline |
| `--promo-bg-*` | `bg-promo-*` | mapped to band/brass tint, to be deleted with the old home components |
| `--gradient-*` | `bg-gradient-*` | flattened to a solid fill, consumers to be deleted |
| `--radius-sm…2xl`, `--radius-pill` | `rounded-*` | all `0` |
| `--shadow-card`, `--shadow-card-hover`, `--shadow-accent` | `shadow-*` | `none`, `none`, focus-ring only |

### 2.3 New names to add (in both `variables.css` and `@theme inline`)
| Variable | Utility | Job |
|---|---|---|
| `--color-on-accent` | `text-on-brand` | text on `bg-brand` (chalk in light, chocolate in dark) |
| `--color-raised` | `bg-raised` | inputs, open drawers, panels, modals |
| `--color-stage` | `bg-stage` | packshot cubby |
| `--color-paint` | `bg-paint` | header cornice |
| `--color-plinth` | `bg-plinth` | footer |
| `--color-on-paint`, `--color-on-paint-muted` | `text-on-paint`, `text-on-paint-muted` | text on cornice and plinth |
| `--color-brass`, `--color-on-brass` | `bg-brass`, `text-on-brass` | plates |
| `--color-brass-tint` | `bg-brass-tint` | sale band, note boxes |
| `--color-shelf`, `--color-shelf-hairline` | `border-shelf`, `bg-shelf` | shelf lines |
| `--color-border-control` | `border-control` | input, checkbox and select borders (≥3:1) |
| `--color-focus` | `outline-focus` | focus rings |
| `--color-on-danger` | `text-on-danger` | text on danger fill |
| `--color-success-tint`, `--color-warning-tint`, `--color-danger-tint`, `--color-info-tint` | `bg-*-tint` | status plates, alerts |
| `--color-scrim` | `bg-scrim` | modal and drawer backdrop |

### 2.4 Mandatory sweeps (otherwise dark mode breaks)
1. **Text on paint fills.** `text-white` appears 48 times and `color: "#fff"` appears in `src/components/ui/Button.tsx`. In dark mode the paint is chalk, so white text on it fails. Every `text-white` that sits on `bg-brand` / `bg-brand-hover` becomes `text-on-brand`. On `bg-danger` it becomes `text-on-danger`. On `bg-sale` it becomes `text-on-brass` (the sale fill is brass, see §3).
2. **Ad-hoc colours.** Remove hard-coded hex and rgba from storefront components: `BrandMark.tsx`, `TopBar`, `TrustStrip`, `HeroCarousel`, `DealOfTheDay`, `PromoBannerGrid`, `WhyShopWithUs`, `MarketplaceProductCard`, the auth pages and the account pages. Most of the home components are deleted anyway (§13.1).
3. **Retired helpers.** Delete `.glass`, `.glass-border` and `.gradient-text` from `globals.css` and remove their consumers. Replace `rounded-*` classes with nothing or a bevel (§5).
4. **Phosphor imports.** Swap every storefront Phosphor import for Lucide (§8). Remove `@phosphor-icons/react` from storefront code only; admin keeps it.

---

## 3. Colour tokens

Contrast ratios below are WCAG 2.x relative-luminance values computed for these exact hex pairs.

### 3.1 `src/styles/variables.css` — replace the whole file with this structure

```css
:root {
  --color-primary: #2a1a15;
  --color-secondary: #fafbfa;

  --color-bg: #f1f3f2;
  --color-bg-secondary: #e5e8e6;
  --color-bg-tertiary: #dce0de;
  --color-bg-warm: #f2ead8;
  --color-raised: #fafbfa;
  --color-stage: #ffffff;
  --color-surface-dark: #3b2620;

  --color-text: #2a1a15;
  --color-text-secondary: #5b4c47;
  --color-text-tertiary: #72625d;

  --color-accent: #3b2620;
  --color-accent-hover: #22140f;
  --color-accent-light: #e6deda;
  --color-on-accent: #f1f3f2;
  --color-accent-2: #c9a04e;
  --color-accent-3: #7a5a1e;

  --color-paint: #3b2620;
  --color-plinth: #2e1d18;
  --color-on-paint: #f1f3f2;
  --color-on-paint-muted: #c8bbb3;
  --color-brass: #c9a04e;
  --color-on-brass: #2a1a15;
  --color-brass-tint: #f2ead8;
  --color-brass-on-paint: #d6b064;

  --color-shelf: #3b2620;
  --color-shelf-hairline: rgba(59, 38, 32, 0.28);
  --color-border: #d2d3cf;
  --color-border-hover: #a9a49d;
  --color-border-control: #8a7e79;
  --color-focus: #3b2620;

  --color-success: #2f6b45;
  --color-success-tint: #e1eee5;
  --color-warning: #8a4b0f;
  --color-warning-tint: #f5e8d8;
  --color-danger: #a3262b;
  --color-danger-tint: #f6e3e1;
  --color-on-danger: #ffffff;
  --color-info: #45525a;
  --color-info-tint: #e3e8ea;

  --color-scrim: rgba(42, 26, 21, 0.48);

  --promo-bg-blue: #e5e8e6;
  --promo-bg-warm: #f2ead8;
  --promo-bg-green: #e5e8e6;

  --gradient-primary: linear-gradient(#3b2620, #3b2620);
  --gradient-accent: linear-gradient(#3b2620, #3b2620);
  --gradient-warm: linear-gradient(#c9a04e, #c9a04e);
  --gradient-cool: linear-gradient(#3b2620, #3b2620);
  --gradient-hero: linear-gradient(#f1f3f2, #f1f3f2);
  --gradient-card-hover: linear-gradient(transparent, transparent);
  --gradient-badge: linear-gradient(#c9a04e, #c9a04e);

  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: 0 1px 0 #d2d3cf, 0 18px 40px -24px rgba(42, 26, 21, 0.35);
  --shadow-xl: 0 1px 0 #d2d3cf, 0 28px 60px -28px rgba(42, 26, 21, 0.45);
  --shadow-card: none;
  --shadow-card-hover: none;
  --shadow-accent: 0 0 0 2px #3b2620;
  --shadow-panel: -1px 0 0 #d2d3cf, -24px 0 48px -32px rgba(42, 26, 21, 0.45);
  --shadow-contact: rgba(42, 26, 21, 0.2);

  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
  --radius-2xl: 0;
  --radius-pill: 0;

  --bevel-xs: 3px;
  --bevel-sm: 4px;
  --bevel-md: 6px;
  --bevel-lg: 10px;

  --max-width: 1320px;
  --header-height: 72px;
  --header-height-compact: 56px;
  --utility-height: 32px;
  --announcement-height: 32px;

  --font-sans: var(--font-commissioner), "Commissioner Variable", "Commissioner Fallback", "Segoe UI", sans-serif;
  --font-display: var(--font-gloock), "Gloock", "Gloock Fallback", Georgia, serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-furniture: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-std: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --dur-micro: 160ms;
  --dur-ui: 260ms;
  --dur-panel: 320ms;
  --dur-reveal: 900ms;

  --selection-bg: #c9a04e;
  --selection-fg: #2a1a15;
}

[data-theme="dark"] {
  --color-primary: #f0ebe5;
  --color-secondary: #2b211c;

  --color-bg: #1d1613;
  --color-bg-secondary: #241b17;
  --color-bg-tertiary: #15100e;
  --color-bg-warm: #3a3020;
  --color-raised: #2b211c;
  --color-stage: #f4f1ec;
  --color-surface-dark: #120d0b;

  --color-text: #f0ebe5;
  --color-text-secondary: #bdb0a7;
  --color-text-tertiary: #968880;

  --color-accent: #ede7df;
  --color-accent-hover: #ffffff;
  --color-accent-light: #3a2e28;
  --color-on-accent: #1d1613;
  --color-accent-2: #d6b064;
  --color-accent-3: #d6b064;

  --color-paint: #120d0b;
  --color-plinth: #120d0b;
  --color-on-paint: #f0ebe5;
  --color-on-paint-muted: #bdb0a7;
  --color-brass: #d6b064;
  --color-on-brass: #1d1613;
  --color-brass-tint: #3a3020;
  --color-brass-on-paint: #d6b064;

  --color-shelf: #8a786d;
  --color-shelf-hairline: rgba(240, 235, 229, 0.18);
  --color-border: #3f322b;
  --color-border-hover: #5c4c43;
  --color-border-control: #7f6f66;
  --color-focus: #ede7df;

  --color-success: #8fc7a1;
  --color-success-tint: #22302a;
  --color-warning: #e7a56a;
  --color-warning-tint: #3a2a1c;
  --color-danger: #f08f86;
  --color-danger-tint: #3d2220;
  --color-on-danger: #1d1613;
  --color-info: #a9b6bd;
  --color-info-tint: #263034;

  --color-scrim: rgba(8, 5, 4, 0.66);

  --promo-bg-blue: #241b17;
  --promo-bg-warm: #3a3020;
  --promo-bg-green: #241b17;

  --gradient-primary: linear-gradient(#ede7df, #ede7df);
  --gradient-accent: linear-gradient(#ede7df, #ede7df);
  --gradient-hero: linear-gradient(#1d1613, #1d1613);

  --shadow-lg: 0 1px 0 #3f322b, 0 18px 40px -24px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 1px 0 #3f322b, 0 28px 60px -28px rgba(0, 0, 0, 0.7);
  --shadow-accent: 0 0 0 2px #ede7df;
  --shadow-panel: -1px 0 0 #3f322b, -24px 0 48px -32px rgba(0, 0, 0, 0.7);
  --shadow-contact: rgba(0, 0, 0, 0.5);

  --selection-bg: #d6b064;
  --selection-fg: #1d1613;
}

::selection {
  background: var(--selection-bg);
  color: var(--selection-fg);
}
```

The dark theme ("Lamplight") is its own mood: the dresser recedes into shadow, the cornice and plinth go darker than the room, packshot stages become warm lamplit off-white (`#F4F1EC`), and the paint inverts to chalk for actions.

### 3.2 Measured contrast

| Pair | Morning (light) | Lamplight (dark) |
|---|---|---|
| ink / bg | 14.99 | 15.06 |
| ink / raised | 16.10 | 13.25 |
| ink / stage | 16.71 | — |
| muted / bg | 7.33 | 8.44 |
| muted / raised | 7.88 | 7.43 |
| muted / band | 6.62 | 7.98 |
| faint / bg | 5.20 | 5.21 |
| faint / raised | 5.59 | 4.58 (placeholder) |
| faint / band | 4.70 | — |
| on-accent / accent (primary button) | 12.70 | 14.53 |
| on-accent / accent-hover | 16.04 | 17.85 |
| ink / accent-soft (hover fill) | 12.59 | 11.07 |
| on-brass / brass (plates) | 6.86 | 8.72 |
| sale ink (`--color-accent-3`) / bg | 5.69 | 8.72 |
| sale ink / raised | 6.12 | — |
| ink / brass tint | 13.95 | 10.91 |
| muted / brass tint | 6.82 | — |
| on-paint / paint (cornice) | 12.70 | 16.28 |
| on-paint / plinth (footer) | 14.44 | 16.28 |
| on-paint-muted / paint | 7.56 | 9.13 |
| on-paint-muted / plinth | 8.59 | 9.13 |
| brass-on-paint / paint | 6.91 | 9.42 |
| brass-on-paint / plinth | 7.86 | 9.42 |
| success / bg | 5.69 | 9.22 |
| warning / bg | 6.09 | 8.49 |
| danger / bg | 6.57 | 7.63 |
| info / bg | 7.23 | 8.60 |
| danger / danger tint | 5.92 | — |
| success / success tint | 5.31 | — |
| on-danger / danger | 7.32 | 7.63 |
| control border / raised (1.4.11) | 3.79 | 3.27 |
| shelf line / bg (non-text) | 12.70 | 4.24 |
| focus ring / bg | 12.70 | 14.53 |
| focus ring / band | 11.47 | — |

Rules:
- `--color-border` (hairline) is decorative only and never the sole boundary of a control. Controls use `--color-border-control`.
- Brass is never text on chalk. It is a fill with `--color-on-brass` text, or text only on paint/plinth (`--color-brass-on-paint`).
- `--color-accent-3` is the only sale text colour. Sale prices are never shown in danger red.

---

## 4. Typography

### 4.1 Packages and loading
- Install `@fontsource/gloock` (display, weight 400 only) and `@fontsource-variable/commissioner` (body/UI, wght 100–900).
- Uninstall `@fontsource-variable/bricolage-grotesque` and `@fontsource-variable/karla`.
- In `src/app/layout.tsx` replace the two font imports with:

```ts
import "@fontsource/gloock/400.css";
import "@fontsource-variable/commissioner/wght.css";
```

- `src/app/fonts.css` becomes:

```css
:root {
  --font-gloock: "Gloock";
  --font-commissioner: "Commissioner Variable";
}

@font-face {
  font-family: "Gloock Fallback";
  src: local("Georgia");
  size-adjust: 104%;
  ascent-override: 92%;
  descent-override: 24%;
}

@font-face {
  font-family: "Commissioner Fallback";
  src: local("Arial");
  size-adjust: 101%;
  ascent-override: 96%;
  descent-override: 25%;
}
```

  Tune the four override values against the real fonts until swapping shifts the hero wordmark and a body paragraph by less than 2px. Preload the latin Gloock woff2 file used by the hero wordmark.
- Font weights: Gloock 400 only. Set `font-synthesis: none` on everything rendered in the display face so that inherited `font-semibold` / `font-bold` classes never fake-bold it. Commissioner uses 400 (body), 500 (UI labels, product names), 600 (buttons, plates) and 700 (rare emphasis in tables).
- Numbers: `font-variant-numeric: tabular-nums lining-nums` on prices, quantities, totals and tables.
- `--font-mono` stays a system mono and is used only for order numbers and SKUs, where 0/O and 1/l must be told apart. It is not part of the identity.

### 4.2 Modular scale — ratio 1.333 (perfect fourth), base 16px

Add these to `@theme inline` so they generate `text-step-*` utilities:

```css
@theme inline {
  --text-step--1: 0.75rem;
  --text-step-0: 1rem;
  --text-step-1: clamp(1.125rem, 1.05rem + 0.35vw, 1.333rem);
  --text-step-2: clamp(1.375rem, 1.2rem + 0.8vw, 1.777rem);
  --text-step-3: clamp(1.625rem, 1.3rem + 1.5vw, 2.369rem);
  --text-step-4: clamp(2rem, 1.5rem + 2.4vw, 3.157rem);
  --text-step-5: clamp(2.5rem, 1.7rem + 3.8vw, 4.209rem);
  --text-step-6: clamp(3rem, 1.8rem + 5.6vw, 5.61rem);
  --text-display-xl: clamp(4rem, 1rem + 12vw, 12rem);
  --text-ui-sm: 0.875rem;
  --text-ui-xs: 0.8125rem;
}
```

| Role | Face | Size token | Leading | Tracking | Case |
|---|---|---|---|---|---|
| Hero wordmark (cornice) | Gloock | display-xl | 0.9 | -0.015em | as set |
| Page H1 (home sections, about) | Gloock | step-5 | 1.02 | -0.01em | sentence |
| Page H1 (catalog, PDP, account) | Gloock | step-4 | 1.08 | -0.01em | sentence |
| H2 section | Gloock | step-3 | 1.12 | -0.005em | sentence |
| H3 / panel title | Gloock | step-2 | 1.2 | 0 | sentence |
| Lead paragraph | Commissioner 400 | step-1 | 1.5 | 0 | sentence |
| Body | Commissioner 400 | step-0 | 1.6 | 0 | sentence |
| UI label, product name | Commissioner 500 | step-0 / ui-sm | 1.4 | 0 | sentence |
| Plate / eyebrow | Commissioner 600 | step--1 (12px) | 1 | 0.12em | uppercase |
| Meta, captions, breadcrumbs | Commissioner 400 | ui-xs (13px) | 1.5 | 0.01em | sentence |
| Price in tile | Gloock | step-1 | 1.1 | 0 | — |
| Price on PDP | Gloock | step-3 | 1.05 | 0 | — |
| Order total | Gloock | step-3 | 1.05 | 0 | — |
| Button | Commissioner 600 | ui-sm (sm) / 15px (md) / step-0 (lg) | 1 | 0.01em | sentence |

Reading blocks (`about`, policies, FAQ answers, product description) are capped at `max-width: 68ch`. Body never goes below 16px. Meta text never goes below 13px, and plates never below 12px.

### 4.3 Global base rules to change in `globals.css`
- `body`: font `var(--font-sans)`, background `var(--color-bg)`, colour `var(--color-text)`.
- `h1–h6`: font `var(--font-display)`, `font-weight: 400`, `font-synthesis: none`, `letter-spacing: -0.01em`, `text-wrap: balance`.
- `p`: `text-wrap: pretty`.
- Replace `.section-title` with the H2 role and `.section-subtitle` with the lead role, both via tokens.
- `::selection` uses the brass tokens. Restyle the scrollbar: thumb `--color-border-hover`, track `--color-bg-secondary`, no radius.

---

## 5. Space, layout, radius, bevel, borders, elevation

### 5.1 Spacing scale (4px base; add to `@theme inline` as `--spacing-*` only if a value is missing from Tailwind's default 0.25rem scale)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`. Section rhythm is deliberately uneven (§13.1 gives each section its own top/bottom spacing). Never apply one padding to every section.

### 5.2 Layout
| Token | Value | Use |
|---|---|---|
| `--container-container` | 1320px | default content width (`max-w-container`) |
| `--container-wide` | 1440px | homepage hero dresser, footer plinth inner |
| `--container-narrow` | 1120px | checkout, account |
| `--container-read` | 720px | policies, about text, FAQ answers |
| gutters | 16px (<640), 24px (640–1023), 40px (≥1024) | page side padding |
| grid | 12 columns, 24px gap (≥1024); 6 columns, 16px gap (640–1023); 4 columns, 16px gap (<640) | |

Breakpoints: 390 (design base for mobile), 640, 1024, 1280, 1440.

### 5.3 Radius language
Every structural element has a 0px radius: cubbies, drawers, doors, panels, inputs, selects, checkboxes, modals, toasts, images and tables. Nothing in the UI is rounded except the radio dot (a circle, for recognisability) and the product photography itself. The identity geometry is the **bevel**.

### 5.4 The bevel (chamfered corner) — geometry spec
A bevel cuts all four corners at 45° by `--bevel` px. It is used **only** on:
- buttons (primary, outline, danger): `--bevel-md` 6px; small buttons `--bevel-sm` 4px;
- brass plates and badges: `--bevel-xs` 3px (height < 24px) or `--bevel-sm` 4px;
- the bag count plate: `--bevel-xs`;
- the current page in pagination: `--bevel-sm`;
- the footer credential plaque and the newsletter plaque: `--bevel-lg` 10px;
- range-slider thumbs (drawer knobs): `--bevel-xs`.

Shape:

```css
.bevel {
  --b: var(--bevel-md);
  clip-path: polygon(var(--b) 0, calc(100% - var(--b)) 0, 100% var(--b), 100% calc(100% - var(--b)), calc(100% - var(--b)) 100%, var(--b) 100%, 0 calc(100% - var(--b)), 0 var(--b));
}
```

Rules:
1. Never clip the interactive element itself, because clip-path would cut off the focus outline. Draw the fill on a `::before` layer (`position: absolute; inset: 0; z-index: -1`, with `isolation: isolate` on the element) and clip that layer.
2. Outlined bevels use two layers: `::before` is the border colour at full size, and `::after` is the fill, inset by the border width (1.5px) with `--b` reduced by 0.6px so the diagonal stays an even thickness.
3. Focus ring: `outline: 2px solid var(--color-focus); outline-offset: 3px` on the unclipped element. The ring is rectangular around the bevelled shape. That is intended and clearly visible.
4. Optional progressive enhancement: inside `@supports (corner-shape: bevel)` you may use `border-radius: var(--b); corner-shape: bevel;` with a real border instead of pseudo layers. The pseudo-layer version is the baseline and must look identical.
5. Create one shared utility set in `globals.css`: `.bevel`, `.bevel-xs`, `.bevel-sm`, `.bevel-lg` and `.bevel-outline`. Components use these and never re-declare polygons.

### 5.5 Borders
- Hairline: 1px `--color-border`, for section dividers, table rules and panel edges.
- Control: 1px `--color-border-control`. On hover the border becomes `--color-text-secondary`. Error state is 2px `--color-danger`.
- **Shelf line** (motif, §10.1): 2px `--color-shelf`, then 3px of clear space, then a 1px `--color-shelf-hairline`. This reads as the front edge and underside of a shelf in a drawn elevation.

### 5.6 Elevation
The page is flat; depth comes from shelves and contact shadows, not floating cards. There are only three levels:
- `--shadow-contact` (product resting on a shelf, §10.2);
- `--shadow-lg` (dropdowns, mega-menu drawer, toast);
- `--shadow-panel` / `--shadow-xl` (cart door, modal).

No other box-shadows are used. `shadow-card` and `shadow-card-hover` resolve to none.

### 5.7 Z-index scale
`base 0 · shelf-item 1 · sticky-header 40 · dropdown 50 · drawer 60 · modal 70 · toast 80 · cookie 90`.

---

## 6. Motion tokens (for both engineers)
| Token | Value | Use |
|---|---|---|
| `--dur-micro` | 160ms | hover, press, focus |
| `--dur-ui` | 260ms | drawers, accordions, tabs, toggles |
| `--dur-panel` | 320ms | cart door, mega-menu, modals |
| `--dur-reveal` | 900ms | section entrances (landing pages only) |
| `--ease-furniture` | cubic-bezier(0.22, 1, 0.36, 1) | anything that slides (drawers, panels) |
| `--ease-std` | cubic-bezier(0.4, 0, 0.2, 1) | colour/opacity state |
| `--ease-in-out` | cubic-bezier(0.76, 0, 0.24, 1) | pinned scenes, page-level moves |
| spring (motion engineer) | stiffness 220, damping 26, critically damped, no overshoot >4% | swinging doors, hooks |

Philosophy: tactile and weighted. Every movement is something physical opening, sliding or settling. Nothing bounces playfully, nothing spins, nothing glows. Transform and opacity only. With `prefers-reduced-motion: reduce`, every transition becomes an instant state change or an opacity fade of 120ms or less, and every scene shows its designed end state. Remove the `scroll-behavior: smooth` default under reduced motion.

`src/styles/animations.css`: delete the existing keyframes that no new component uses after the rebuild. Add `shelf-settle` (translateY 6px→0 plus contact-shadow scale 0.85→1), `drawer-out` (translateY -8px→0, opacity 0→1) and `plate-in` (scaleX 0.9→1, opacity). Their durations and easings come from the tokens.

---

## 7. Components (all states)

General states for every interactive component:
- default;
- hover (pointer devices only, `@media (hover: hover)`);
- active/pressed;
- focus-visible (2px `--color-focus` outline, 2–3px offset, never removed);
- disabled (`aria-disabled` or `disabled`; `--color-text-tertiary` text, `--color-bg-secondary` fill, no hover, `cursor: not-allowed`);
- loading (`aria-busy="true"`, width locked so the layout does not jump).

Minimum touch target is 44×44px on mobile.

### 7.1 Button (`src/components/ui/Button.tsx` — keep the API, restyle)
Variant mapping from the current API:
- `primary` → **Paint**;
- `secondary`, `outline`, `bordered` → **Outline**;
- `tertiary`, `ghost`, `light`, `flat` → **Text**;
- `danger` → **Danger**;
- `danger-soft` → **Text** in danger colour.

`color` maps the same way. Move from inline style objects to token classes.

| | Paint | Outline | Text | Danger |
|---|---|---|---|---|
| Shape | bevel-md fill `--color-accent` | bevel-outline 1.5px `--color-accent`, transparent fill | no box, 1px underline offset 4px | bevel-md fill `--color-danger` |
| Text | `--color-on-accent`, Commissioner 600 | `--color-accent` | `--color-text` | `--color-on-danger` |
| Hover | fill `--color-accent-hover`, the button rises 1px and a 2px shelf line appears 4px below it (the button "sits on a shelf"), 160ms | fill `--color-accent-light` | underline thickens to 2px | darken via `filter: brightness(0.92)` |
| Active | translateY 0, shelf line hidden | fill `--color-accent-light`, translateY 1px | underline colour `--color-accent` | translateY 1px |
| Focus | outline 2px `--color-focus`, offset 3px | same | same | same |
| Disabled | fill `--color-bg-secondary`, text `--color-text-tertiary`, no shelf | outline `--color-border`, text faint | text faint, no underline | as Paint disabled |
| Loading | label stays for width; a 3-square loader (§7.17) replaces the label visually; `aria-busy` | same | same | same |

Sizes: sm 36px high, 12px/16px padding, ui-sm; md 44px, 20px padding, 15px; lg 52px, 28px padding, step-0. Icon-only buttons are 40px square (44px on touch), with no bevel, transparent fill, a hover fill of `--color-accent-light`, and a required `aria-label`. `fullWidth` stretches the bevel. `startContent`/`endContent` icons are 18px with an 8px gap.

### 7.2 Text inputs, textarea
- 48px high, 0 radius, fill `--color-raised`, 1px `--color-border-control`, 14px horizontal padding, Commissioner step-0.
- Label above: ui-sm 500 `--color-text`, 6px gap. Required fields get a " *" in muted text plus `aria-required`.
- Hint below: ui-xs `--color-text-secondary`. Placeholder: `--color-text-tertiary`.
- Hover: the border becomes `--color-text-secondary`.
- Focus: border `--color-accent` plus a 2px focus outline, offset 2px.
- Error: 2px `--color-danger` border. The message below in danger colour, with a Lucide `TriangleAlert` at 16px, is linked by `aria-describedby`. `aria-invalid="true"` is set.
- Disabled: fill `--color-bg-secondary`, faint text.
- Read-only: no border, fill `--color-bg-secondary`.
- Password fields have an inline 40px icon button (`Eye`/`EyeOff`) with `aria-pressed`.
- Textarea: minimum 140px, resizes vertically.
- Phone fields show the country dialling code as a prefix segment (raised, separated by a 1px control border), derived from the selected country.

### 7.3 Select
Native `<select>` styled like an input: 48px (36px in the sort and currency spots), `appearance: none`, Lucide `ChevronDown` at 16px placed 14px from the right, with the same states. The country select (registration, checkout) uses the single restricted-countries config. The currency select lives in the utility line and the mobile menu. Build a custom listbox only if search-in-list is needed for country (more than 60 options). If you do, it must follow the WAI-ARIA combobox pattern.

### 7.4 Checkbox, radio, switch
- **Checkbox:** 20px square, 0 radius, 1.5px `--color-border-control`. Checked: fill `--color-accent` with a 14px `Check` in `--color-on-accent`. Indeterminate: a 10×2px bar. The label sits 10px to the right, and the hit area covers the whole row (44px high in filter lists).
- **Radio:** 20px circle, 1.5px border. Checked: an 8px dot in `--color-accent`. Used for delivery methods: each option is a full-width row with a 1px border, and the selected row gets a 2px `--color-accent` border and a `--color-raised` fill.
- **Switch** (cookie preferences): a 44×24 track, 0 radius, 1px control border, holding a 16×16 square knob that slides 20px. On: track `--color-accent`, knob `--color-on-accent`. A locked "Necessary" switch is on and disabled, with the text "Always on". Use `role="switch"` with `aria-checked`.

### 7.5 Chips (active filters, variant options)
- **Active filter chip:** 32px high, bevel-outline-xs in `--color-border-control`, fill `--color-raised`, ui-sm text plus a 14px `X` remove button inside the hit area (`aria-label="Remove filter: Induction"`). Hover: border `--color-accent`. A "Clear all" text button ends the row.
- **Variant option** (size, colour, set size): a 40px-high rectangle, 0 radius, 1px control border. Selected: 2px `--color-accent` border with a 4px shelf line under it. Unavailable: faint text with a diagonal 1px line through the box and `aria-disabled`. Colour variants show a 20px swatch square before the label (the swatch is the product colour from data, never a decoration).

### 7.6 Plates and badges (§10.3 motif)
The `Plate` component replaces HeroUI `Chip` in the storefront.

| Variant | Fill | Text | Use |
|---|---|---|---|
| `brass` | `--color-brass` | `--color-on-brass` | category label under a product, "Reduced −20%", "New" (createdAt < 30 days), step names in closed drawers |
| `neutral` | `--color-bg-secondary` | `--color-text` | "Sold out", "Set of 4", counts |
| `success` / `warning` / `danger` / `info` | tint | semantic colour | order status: Paid, Processing, Shipped, Delivered, Cancelled, Refunded |
| `on-paint` | `--color-brass-on-paint` fill | `--color-on-brass` | bag count on the cornice |

Plates are bevel-xs, 20–24px high, 6px/10px padding, Commissioner 600 at 12px uppercase with +0.12em tracking. They are never clickable. When a link needs a plate look, it is a text link next to one.

### 7.7 Shelf product tile (replaces `ProductCard` and `MarketplaceProductCard`)
Anatomy, top to bottom:
1. **Cubby:** a 1:1 `--color-stage` area with 0 radius, no border. The packshot is `object-contain`, bottom-aligned (`object-position: center bottom`) with 10% inset on the sides and top and 6% at the bottom, so the product stands on the floor of the cubby. In light theme the image has `mix-blend-mode: multiply` to remove grey fringes. In dark theme it does not (the stage is already lamplit off-white).
2. **Contact shadow** (§10.2) under the product, inside the cubby, just above its floor.
3. **Shelf line** (§5.5) as the cubby's bottom edge. In grids it joins up with the neighbouring tiles (§13.2).
4. **Brass plate** (category or "Reduced −20%"), placed 12px below the shelf.
5. **Name:** Commissioner 500 step-0, 2 lines max with a reserved height of 2 lines.
6. **Price row:** Gloock step-1 price in the active currency via `PriceDisplay`. On sale, the old price follows in Commissioner ui-sm, struck through, muted. A sale price uses `--color-accent-3`.
7. **Add:** a full-width Paint button sm "Add to bag", hidden at rest on hover devices. On touch devices it is always visible as a 44px bevel-sm Paint icon button with `Handbag`, placed at the right of the price row.
8. **Save:** the text button "Save", placed top-right inside the cubby on hover devices. On touch it is a `Heart` icon button. It sets `aria-pressed`. Saved state: "Saved" with a filled heart.

States:
- **Hover/focus-within:** the packshot lifts 4px, and the contact shadow widens to 110% and lightens to 70% opacity. The add button and "Save" fade in over 160ms. The tile link shows a focus outline around the cubby only.
- **Pressed add:** the shelf-settle micro-moment (§12, M7).
- **Out of stock:** the brass plate is replaced by a neutral "Sold out" plate, the add button is removed, and the image stays in full colour.
- **No image:** the cubby is filled `--color-bg-tertiary` with a 24px `ImageOff` icon and "No photo yet" in ui-xs muted.
- **Loading skeleton:** the cubby is filled `--color-bg-tertiary`, with a 2px shelf line, an 80×20 plate block and two 12px text bars. A shimmer is not allowed. The skeleton fades to the loaded tile in 160ms.

Variants:
- **Compact** (cart rows, search dropdown): a 64–72px cubby with a shelf line, text to the right, no plate.
- **Featured** ("Top shelf" hero product): a 4:5 cubby spanning 2 columns, name in Gloock step-3, plus the spec line (material, size) in muted text.

The whole tile is one `<article>` with the name as the link. The add and save buttons are separate controls, not nested inside the link. Restructure the current `Link` wrapper so that no button sits inside an anchor.

### 7.8 Quantity stepper (`QuantitySelector`)
- Three joined segments in one 1px `--color-border-control` frame with 0 radius: `Minus` button 44×44 | input 52px wide (tabular, centred, `inputmode="numeric"`, step-0) | `Plus` button 44×44. A compact version is 36px high for the cart door.
- Hover on a segment: fill `--color-accent-light`.
- Disabled minus at 1 and disabled plus at the stock maximum use faint icons. At the maximum, a ui-xs hint reads "Only N available" (N is real stock).
- Typing an out-of-range value clamps it on blur and announces the change via `aria-live="polite"`.
- Buttons are labelled "Decrease quantity" and "Increase quantity".

### 7.9 Filters (`ProductFilters`) — "drawer index"
- Desktop: a left column 280px wide, sticky under the header.
- Each group is a drawer: a 52px header row with the label in Commissioner 600 at 12px caps (+0.12em), a brass plate with the number of selected options (when there are any) and `ChevronDown`. It is a button with `aria-expanded`. Open drawers slide down (grid-rows 0fr→1fr, 260ms) onto a `--color-raised` panel with a 1px top hairline.
- Groups in order: Category / Sub-category, Price, Material, Hob type (only if data exists), Size/Diameter, Capacity, Colour, Dishwasher-safe, Oven-safe, Set or single, Availability.
- Only show groups and values that exist in the current result set, with real counts (muted, tabular, right-aligned).
- **Price:** two number inputs (Min / Max in the active currency) plus a dual-thumb slider. The track is a 2px `--color-shelf` line with a 1px hairline below. Thumbs are 18×18 bevel-xs `--color-accent` "drawer knobs" with `role="slider"` and full keyboard support.
- Above the grid there is a sentence-form result line: "128 products · Cookware · Induction" plus active filter chips.
- Mobile: a "Filter (3)" Outline button plus a sort select in a sticky bar under the header. The filter button opens a full-height left drawer (§7.14) containing the same drawers and a sticky footer with Paint "Show 128 products" and Text "Clear all".
- Filter state stays in the URL (existing logic). Prices bind to the active currency.

### 7.10 Sort (`ProductSort`)
A native select with an inline label "Sort", 36px high. Options: Newest, Price low–high, Price high–low, Most popular, Name A–Z (only those the API supports).

### 7.11 Pagination
- Numbers are 40px squares in ui-sm, tabular. Hover: fill `--color-accent-light`. Current: Paint bevel-sm fill with `aria-current="page"`.
- "Previous" and "Next" are text buttons with `ChevronLeft`/`ChevronRight`. Ellipses appear after 1 … n.
- Mobile shows "Page 2 of 9" with Previous/Next only.
- If the catalog uses "Load more", that is an Outline button md, centred, with the line "Showing 48 of 128" above it.

### 7.12 Breadcrumbs
- ui-xs, muted links, separators "/" in faint text with `aria-hidden`. The current page is ink, not linked, and carries `aria-current="page"`. The `nav` has `aria-label="Breadcrumb"`.
- Mobile collapses to a back link to the parent only ("← Cookware").
- Emit `BreadcrumbList` JSON-LD via the existing `JsonLd`.

### 7.13 Tabs (PDP: Description / Specifications / Care / Delivery & returns)
- The tablist has a 1px bottom hairline. Tabs are Commissioner 500 in step-0, 48px high. The active tab is ink with a 2px `--color-shelf` line under it plus the 1px hairline 3px below (a mini shelf). Inactive tabs are muted, and hover turns them ink.
- The WAI-ARIA tabs pattern is required (arrow keys, Home/End, `aria-selected`, `aria-controls`). The panel fades over 160ms.
- Mobile: tabs become accordions (§7.14).

### 7.14 Accordion / drawer (FAQ, mobile filters, mobile footer columns, mobile PDP tabs)
- The header row is at least 56px and is a button with `aria-expanded` and `aria-controls`. The question or title is Commissioner 500 step-1, and `ChevronDown` rotates 180° over 260ms.
- Open: the panel slides via grid-rows onto `--color-raised` with 20px padding. The open item gets a 2px shelf line at its bottom. Closed items are separated by 1px hairlines.
- More than one item can be open at once.

### 7.15 Toasts (`Toast`, `CartToast`, `ToastProvider`)
- Position: desktop bottom-right 24px; mobile top, full width minus 32px, under the header.
- Panel: `--color-raised`, 1px `--color-border`, `--shadow-lg`, 0 radius, max-width 380px.
- Add-to-bag toast: a 48px compact cubby, "Added to bag", the product name (1 line), and the text button "View bag" plus Paint sm "Checkout".
- Status toasts: a 16px semantic icon (`CircleCheck`, `TriangleAlert`, `Info`) in the semantic colour, plus text.
- They auto-dismiss after 5s, pause on hover/focus, and have a close `X`. Use `role="status"` (or `role="alert"` for errors).
- Entrance is translateY 12px→0 plus opacity over 260ms. Reduced motion uses opacity only.

### 7.16 Modal / dialog (`ConfirmDialog`, image zoom, preference centre)
- A centred panel 0 radius, `--color-raised`, `--shadow-xl`, max-width 560px (zoom is full-screen on a stage colour), 32px padding.
- Title: Gloock step-2. Close: an `X` icon button at top-right.
- Scrim: `--color-scrim`, no blur.
- Focus trap; Esc closes; focus returns to the trigger; `role="dialog"`, `aria-modal`, `aria-labelledby`.
- Entrance: the panel rises 12px and fades in over 320ms on `--ease-furniture`; the scrim fades.
- Destructive confirm: a Danger button on the right and an Outline "Cancel" on the left.

### 7.17 Loaders
- **Shelf loader** (replaces `LoadingSpinner`): three 8×8 squares on a 2px shelf line. Each fills `--color-accent` in sequence (480ms cycle). It has `role="status"` and the visually hidden text "Loading". Reduced motion shows a static "Loading…" text.
- Skeletons follow §7.7. Page-level loading uses skeletons, not spinners.

### 7.18 Cookie banner and preference centre (new components)
**Banner** (first visit, nothing stored under the consent key):
- A full-width bar fixed to the bottom, `--color-paint` fill with `--color-on-paint` text, max 2 lines of copy on desktop. It must never cover the mobile sticky add/checkout bars; when one exists it stacks above it.
- Copy: "We use necessary cookies to run the store, and optional analytics and marketing cookies only if you allow them." followed by a link "Cookie policy" in brass-on-paint.
- Three buttons, **visually identical** (same size, same style: an outline bevel in `--color-on-paint` with on-paint text): "Accept all", "Reject all", "Customise". On mobile they sit in one row of three equal widths below the text.
- `role="region"` with `aria-label="Cookie consent"`. It is not modal and does not trap focus. Analytics and marketing scripts load only after consent.

**Preference centre:**
- A modal (§7.16) titled "Cookie settings" with three drawers: "Necessary" (switch locked on, "Always on"), "Analytics" and "Marketing". Each has a one-sentence honest purpose and a "Show cookies" disclosure that lists names, provider, purpose and expiry (the same table as the Cookie Policy).
- Footer buttons: Paint "Save choices", Outline "Accept all", Outline "Reject all".
- Opened from the banner and from the persistent footer link "Cookie settings".
- The choice persists in `localStorage` (key `brasmora-consent`, value with version and timestamp). Add that key to the Cookie Policy table.

### 7.19 Stepper — multi-step checkout and registration (drawer stepper)
- An `<ol>` of drawers stacked vertically. Each step is a drawer: a 64px header row with the step number in Gloock step-2 (1, 2, 3 …), the title in Commissioner 600 step-1 and, on the right, a status.
- States:
  - **Current:** the drawer is pulled out, its panel open on `--color-raised` with a 2px shelf line at the bottom; `aria-current="step"`.
  - **Complete:** closed, with a brass plate summarising the answer (e.g. "Delivery · Standard · London SW1") and a text button "Change" that reopens it.
  - **Upcoming:** closed, title in faint text, a neutral plate "Next", not focusable until reached.
- The "Continue" button (Paint lg) sits at the panel's bottom right, with the text button "Back" at the bottom left (except on step 1).
- Validation errors: the field-level messages plus a summary at the top of the panel ("Check 2 fields") that links to the fields and receives focus.
- When moving to the next step, the next drawer slides out (260ms) and focus moves to its heading.
- A visually hidden live region announces "Step 2 of 3, Delivery".
- Mobile: the same vertical drawers. The header row shrinks to 56px, and closed summaries wrap to 2 lines.

### 7.20 Cart door (`CartSheet`)
- A right-hand panel, 440px wide (100% on mobile), `--color-raised`, `--shadow-panel`, scrim behind.
- Opening: the "cupboard door" moment (§12, M6) — rotateY from -12° to 0 with `transform-origin: right center`, perspective 1600px, plus a translateX of 24px→0, over 320ms on `--ease-furniture`. Closing reverses in 260ms. Reduced motion uses a plain 160ms fade.
- **Header:** "Your bag" in Gloock step-2, the count in a neutral plate, and a close `X`.
- **Items:** compact shelf rows (a 72px cubby with a shelf line), name (2 lines), variant line in muted ui-xs, compact stepper, line price in Gloock step-1, and the text button "Remove" (`Trash2` 16px). Removing an item collapses its row over 260ms and announces it.
- **Footer** (sticky): Subtotal row; a delivery note ("Delivery calculated at checkout", or the real threshold message from config); the total label reads "Total", or "Total incl. VAT" only when `COMPANY.vatRegistered` is true. Then Paint lg full-width "Checkout", the Text button "View bag", and payment logos (Visa, Mastercard) at 24px high.
- **Empty:** an empty shelf line drawing, "Your bag is empty", and three category links (Cookware, Tableware, Glassware & drinkware) as text links, plus Outline "Browse the shop".
- Focus trap; Esc closes; focus returns to the trigger; `role="dialog"`, `aria-label="Your bag"`.

### 7.21 Search dialog (`SearchDialog`)
- A drawer pulled down from the cornice, full width, `--color-raised`, max-height 80vh.
- One input styled at step-2 in Commissioner 400 with a leading `Search` icon, placeholder "Search pans, plates, glasses…", and a "Close" text button.
- Results update live (debounced 200ms):
  - "Products" as compact rows (48px cubby, name, price), maximum 6;
  - "Categories" as text links with counts;
  - a "See all 128 results" text button.
- Keyboard: combobox pattern with arrow keys, Enter opens, Esc closes.
- No results: "Nothing matches 'xyz'." and three category links.

---

## 8. Icons — Lucide

- Package: `lucide-react` (1.x). One system across the storefront: `strokeWidth={1.5}`, sizes 16, 18, 20 or 24 only, `aria-hidden` unless the icon is the only content (then the parent gets `aria-label`).
- Never put an icon in a circle or tinted square. Icons sit in text colour.
- On desktop, header actions are words, not icons (§11). Icons appear on mobile and in compact controls.
- Lucide 1.x has no brand logos. Social links appear only if `NEXT_PUBLIC_INSTAGRAM_URL` / `NEXT_PUBLIC_LINKEDIN_URL` are set, and then only as text links ("Instagram").

Phosphor → Lucide replacement table (every storefront import; admin keeps Phosphor):

| Phosphor | Lucide | Phosphor | Lucide |
|---|---|---|---|
| Basket | Handbag | MagnifyingGlass | Search |
| Package | Package | CaretRight / Left / Down / Up | ChevronRight / Left / Down / Up |
| Heart | Heart | Truck | Truck |
| MapPin | MapPin | EnvelopeSimple | Mail |
| CheckCircle | CircleCheck | Check | Check |
| ShieldCheck | ShieldCheck | Shield | Shield |
| Lock | Lock | ArrowRight / ArrowLeft | ArrowRight / ArrowLeft |
| ArrowCounterClockwise | RotateCcw | ArrowsClockwise | RefreshCw |
| Phone | Phone | Headset | Headset |
| Eye / EyeSlash | Eye / EyeOff | X | X |
| UserCircle | CircleUser | User / UserPlus | User / UserPlus |
| Star | Star | ImageBroken | ImageOff |
| Trash | Trash2 | Tag | Tag |
| SquaresFour | LayoutGrid | Question | CircleHelp |
| PaperPlaneTilt | Send | Globe | Globe |
| Gift | Gift | CreditCard | CreditCard |
| Clock | Clock | Calendar | Calendar |
| Warning | TriangleAlert | Info | Info |
| Sun / Moon | Sun / Moon | Sliders | SlidersHorizontal |
| SignOut | LogOut | Plus / Minus | Plus / Minus |
| List | Menu | ChatCircle | MessageCircle |
| LinkedinLogo, InstagramLogo | remove (text links) | Medal, Fire, Lightning, Lightbulb, Sparkle | remove (decorative or old-niche) |
| Wrench, Wind, Plug, Plugs, Cpu, DeviceMobile, GameController, AppleLogo, Cube, Stack | remove (electrical-store leftovers) | | |

---

## 9. Logo and favicon

### 9.1 Wordmark
- "Brasmora" set in Gloock, sentence case, optical kerning, tracking -0.01em, converted to outlines.
- Files: `public/logo.svg` (ink `#2A1A15`), `public/logo-dark.svg` (chalk `#F1F3F2`), and `public/logo-on-paint.svg` (chalk, for the cornice).
- Clear space equals the cap height of the "B" on all sides.
- Minimum width is 88px. Below that, use the monogram.
- The wordmark never sits on a plate and never gets effects.

### 9.2 Monogram
A Gloock capital **B** standing on a 2px shelf line (with the 1px hairline 3px below, scaled to the mark), inside a bevelled chocolate tile (bevel = 12% of the tile width). The B is chalk.
- At 180px and up (apple-touch, android, OG): full mark with shelf line and hairline.
- At 32px: no hairline; the shelf line is 2px; the B's thin strokes are thickened to at least 2px so Gloock's hairlines do not vanish; the bevel is 4px.
- At 16px: drop the shelf, use a solid-weight simplified B (redrawn path: thin strokes at least 1.5px, counters opened), and a 2px bevel. It must read as a "B" in a dark tile at 100% zoom on both light and dark browser chrome.
- `public/favicon.svg`: SVG first, with a `prefers-color-scheme` media query inside the SVG swapping to a chalk tile with a chocolate B for dark browser UI.

### 9.3 Files and code to update
- Regenerate `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png` and `android-chrome-512x512.png` with `scripts/gen-favicons.mjs`. Replace its two inline SVGs with the monogram (full and small) and keep its target list.
- Update `src/app/icon.svg`, `public/manifest.json` (`theme_color: #3B2620`, `background_color: #F1F3F2`) and the `viewport.themeColor` in `src/app/layout.tsx` (light `#3B2620` to match the cornice, dark `#120D0B`).
- `src/components/layout/BrandMark.tsx` becomes the monogram/wordmark component, driven by `currentColor` and tokens, with no hex values.
- Update the root `metadata.description` to the new niche: "Cookware, bakeware, tableware, glassware and bar tools, delivered to the UK and EU." Make sure no electrical-store wording remains anywhere.

---

## 10. Motif usage rules

### 10.1 Shelf line
- **Is:** the 2px + 3px gap + 1px drawn shelf (§5.5).
- **Used for:** under every product cubby, under each catalog row (continuous), under cart, order and wishlist rows, under the active tab, under the open drawer, under the current step, under a hovered primary button, the header bottom edge when sticky (2px only), empty-state drawings, and the range-slider track.
- **Never:** as a generic section divider between text blocks (use a 1px hairline), in more than one weight, or in colours other than `--color-shelf`.

### 10.2 Contact shadow
- **Is:** an ellipse 70% of the product's visual width, 12px tall, `radial-gradient(closest-side, var(--shadow-contact), transparent)`, sitting 2px above the cubby floor behind the packshot.
- **Used for:** product packshots only (tiles, PDP gallery, hero shelves, hooks, plate rack).
- **Never:** under buttons, text or panels. Never a coloured glow.

### 10.3 Brass plate
- **Is:** the bevelled label (§7.6).
- **Used for:** category label per product, sale ("Reduced −20%"), "New", "Sold out" (neutral), selected-filter counts, closed-step summaries, the bag count, order statuses (semantic variants), the footer credential plaque (large version) and the newsletter plaque.
- **Limits:** at most one brass plate per product tile, and at most 3 plates visible in any viewport section outside grids. A plate is never a button.

### 10.4 Drawer
- **Is:** a full-width row that slides out to reveal content.
- **Used for:** filters, FAQ, checkout and registration steps, mobile footer columns, account navigation, the mega-menu, the search dialog, and the homepage drawer index.
- **Rule:** drawers always open downward or outward from their front and close the same way. Content inside an open drawer is on `--color-raised`.

### 10.5 Cupboard doors
- **Is:** a paired or single panel rotating on a vertical hinge.
- **Used for:** the homepage hero (M1), the cart door (M6) and order confirmed (M8).
- **Never:** for page transitions or in more than one place per screen.

### 10.6 Hooks
- **Is:** a 2px rail with S-hooks drawn in 1.5px lines, with products hanging from them.
- **Used for:** the homepage "Hooks" section (coffee & tea, bar & wine) only.
- **Rule:** the product hangs from its top centre. The hook drawing is SVG in `--color-shelf`.

### 10.7 Plate rack
- **Is:** vertical slats (1.5px lines, 28px spacing) in a frame, holding plates and bowls upright.
- **Used for:** the homepage tableware set-piece only.

### 10.8 Plinth
- **Is:** the footer's base (§11.4). The dresser stands on it.
- **Rule:** the footer always starts with a 2px shelf line in `--color-shelf` above the plinth fill.

Drawing style for all furniture: flat planes plus 1px or 1.5px lines in `--color-shelf` or `--color-text-secondary`. No wood grain, gradients, bevel highlights, rendered lighting or skeuomorphic hardware beyond simple knobs (a 10px bevel-xs square) and hinges (two 1px ticks).

---

## 11. Header, mega-menu, footer

### 11.1 Tier 1 — utility line (desktop ≥1024px only)
- 32px high, `--color-bg` fill, 1px bottom hairline, ui-xs muted text.
- Left: a true delivery statement from the shipping config (e.g. "Delivery to the UK and EU"; no times unless the policy states them).
- Right: currency select (GBP / EUR / USD), theme toggle (`Sun`/`Moon` icon button, labelled "Switch to dark theme"), and the link "Help" (to FAQ).
- No language switcher (English only, QC §14).
- It hides when the header becomes sticky.

### 11.2 Tier 2 — the cornice
- 72px high, `--color-paint` fill, `--color-on-paint` text, full width with inner `max-w-container`.
- **Left:** the wordmark (`logo-on-paint.svg`, 32px cap height), linking to "/".
- **Centre** (≥1280px): text links in Commissioner 500 at 15px: "Cookware", "Bakeware", "Tableware", "Glassware", "Coffee & tea", "Bar & wine", plus the mega trigger "All categories". Active: a 2px brass-on-paint underline offset 6px. Hover: underline appears over 160ms.
- **1024–1279px:** only "Shop" (mega trigger) plus the actions.
- **Right:** text actions "Search", "Account" (or "Sign in"), and "Bag" with a count plate (on-paint brass variant), Commissioner 500 at 15px, gap 24px. Each is a real button or link with a visible focus ring in `--color-on-paint`.
- **Sticky:** after 120px of scroll the utility line hides and the cornice compacts to 56px (wordmark 24px cap height) with a 2px `--color-shelf` bottom line (in dark mode the shelf line is `--color-shelf`, a lighter brown). It hides on scroll down and returns on scroll up, except while a drawer is open. There is no layout shift: reserve the header height.

### 11.3 Mega-menu — "All categories" drawer
- A full-width drawer pulled down from under the cornice: `--color-raised`, `--shadow-lg`, 32px padding, max-height 70vh.
- Four columns, each headed by a brass plate with the zone, in real terms:
  - "Cook & bake": Cookware, Bakeware;
  - "Prep & serve": Utensils & gadgets, Cutlery, Tableware;
  - "Drink": Glassware & drinkware, Coffee & tea, Bar & wine;
  - "Store & linen": Storage & organisation, Kitchen & table linen.
- Under each category name (Commissioner 600 step-0) come its sub-categories (Commissioner 400 ui-sm, muted, hover ink) with counts in faint text.
- Right fifth: one product standing on a shelf (featured from the hovered category, real product, price), and below it "Shop all Cookware →".
- Opens on click and on hover-intent (150ms delay), closes on mouse leave (250ms grace), Esc, or focus leaving. The trigger is a button with `aria-expanded` and `aria-controls`; arrow keys move within the columns.
- Animation: drawer-out (translateY -8px→0, opacity) over 260ms.

### 11.4 Mobile header (<1024px)
- A 56px cornice: left "Menu" (the `Menu` icon plus the word on ≥390px), centre the wordmark (24px cap height), right `Search` and `Handbag` icon buttons with the count plate.
- Menu opens a full-height left drawer (`--color-raised`) containing:
  - the category list as 56px drawer rows with `ChevronRight`, sliding to sub-category panels with a "Back" row;
  - then Account / Orders / Saved, Help (FAQ, Delivery, Returns, Contact), the currency select and the theme toggle.
- Focus trap; Esc closes.

### 11.5 Footer — the plinth
Structure top to bottom, inside `max-w-wide` with gutters:
1. A 2px `--color-shelf` line (the dresser's bottom shelf), then the plinth fill `--color-plinth`, `--color-on-paint` text, 64px top padding.
2. **Three drawer-front columns** (desktop, separated by 1px lines in `--color-on-paint` at 16% opacity):
   - **Shop:** the 10 categories in 2 sub-columns.
   - **Help:** Delivery, Returns & refunds, Warranty, Payment, FAQ, Contact us, Track an order (to account orders).
   - **Small print:** Terms & conditions, Privacy policy, Cookie policy, All policies, and the button "Cookie settings" (opens the preference centre).
   - Column titles are Commissioner 600 at 12px caps +0.12em in `--color-on-paint-muted`. Links are Commissioner 400 ui-sm in `--color-on-paint`, with hover underline.
3. **Credential plaque:**
   - Full width, bevel-lg, `--color-brass` fill, `--color-on-brass` text, 24px/32px padding.
   - Line 1, Gloock step-2: `COMPANY.name`.
   - Line 2, ui-sm: "Brasmora is a trading name of {COMPANY.name}."
   - Then a 3- or 4-column definition list (ui-xs labels in caps +0.12em, ui-sm values): Company number `COMPANY.companyNumber`; VAT number `COMPANY.vatNumber` (only when `COMPANY.vatRegistered`); Registered office `COMPANY.registeredOffice`; Email (mailto link); Phone (only when not null, tel link); Support hours `COMPANY.supportHours`.
   - All values come from `src/lib/company.ts`. No hard-coded copies.
4. **Bottom row** (24px padding, 1px top line at 16% on-paint):
   - Left: "© {year} Brasmora. All rights reserved." in ui-xs on-paint-muted.
   - Right: payment logos on a `--color-stage` chalk plaque (bevel-sm, 8px/14px padding): `/payments/visa.svg`, `/payments/mastercard.svg`, `/payments/pci-dss.svg`. Each is rendered via `next/image` at a fixed height of 28px, width auto, original proportions, in colour, with alts "Visa", "Mastercard" and "PCI DSS compliant". The plaque keeps them on light ground in both themes so brand colours stay true.
   - Social text links, only if the env URLs are set.
5. **Mobile:**
   - The three columns become accordions (§7.14) on plinth colours.
   - The plaque becomes a single column.
   - Logos centre in one row (24px high).
   - Copyright goes last.

---

## 12. Motion hooks for the motion engineer

Use the data-attribute engine from `WEBGL-3D-KNOWLEDGE.md` §4.2. The implementing engineer leaves the markup hooks and the static end-state; the motion engineer adds behaviour.

Depth scale for this site (the pointer parallax amplitudes are maxima at the viewport edge):

| Layer | Content | Pointer offset | Scroll speed |
|---|---|---|---|
| D0 | back panel of the dresser, wall | 2px | 0 |
| D1 | shelf backs, cubby backs | 4px | ±0.04 |
| D2 | packshots on shelves, hanging items | 8px | ±0.08 |
| D3 | shelf edges, frame, cornice board | 10px | ±0.1 |
| D4 | doors, drawer fronts | 14px | scene-driven |
| L0 | headlines, body, CTAs, prices | 0 | 0 |

Readable text and CTAs never move with parallax.

### Named signature moments

| ID | Name | Where | What it communicates | Static / reduced-motion state |
|---|---|---|---|---|
| M1 | Open the cupboards | homepage hero | the whole store is behind these doors | doors drawn open, cookware shelves visible, no pin |
| M2 | Drawer pull | homepage drawer index | each category has contents | all drawers shown closed with their three packshots in a strip below each front |
| M3 | Plate rack | homepage tableware | plates slot into place, one by one | the rack shown full, normal horizontal scroller with snap |
| M4 | Hooks | homepage coffee & bar | weight and momentum of real objects | hanging still |
| M5 | Glaze sheen (optional WebGL) | hero top-shelf plates | glazed ceramic catches light | no sheen |
| M6 | Cupboard door | cart drawer | the bag is a cupboard you open | 160ms fade |
| M7 | Shelf settle | add to bag (any tile/PDP) | the item went into your bag | count plate updates, toast appears |
| M8 | Doors close | order confirmed | the order is safely put away | doors closed, order number plate shown |
| M9 | Elevation drawing | about page hero | the dresser is drawn, honest and simple | complete line drawing |

**M1 Open the cupboards (homepage hero)**
- The hero is a section with `data-scene="dresser"`. Children carry `data-depth="0…4"` for pointer parallax (desktop pointer only; mobile uses a gentle response to device tilt only if permission is not required, otherwise none).
- Doors carry `data-door="left|right"` and hinge on their outer edges.
- Pin length 220vh desktop / 160vh mobile.
- Progress 0–0.15: doors ease 6° ajar with a sliver of shelf light (a lighter `--color-bg-tertiary` plane behind the gap).
- Progress 0.15–0.6: doors rotateY to ±105° with perspective 1400px on `--ease-in-out`, revealing two inner shelves of cookware/bakeware packshots, which settle with stagger.rows 70ms.
- Progress 0.6–1: the whole dresser scales 1→1.6 towards the inner shelf centre while the cornice wordmark stays (L0) and fades at 0.9.
- On release, hand over to the drawer index.
- Hovering a door at rest eases it 6° ajar (160ms) as an affordance; clicking a door scrolls to the end of the scene.
- LCP is the cornice wordmark text (HTML, not canvas). Hero packshots: the first 2 use `priority`, the rest lazy.

**M2 Drawer pull**
- Each drawer front carries `data-drawer`. As the section crosses 30–70% of the viewport, drawers translateY 0→64px and translateZ to show three packshots inside on a cubby floor, in sequence (stagger 90ms), then close as the section leaves.
- Hover or focus pulls a single drawer immediately (260ms).
- Drawers are links to their categories, so motion never blocks navigation.

**M3 Plate rack**
- The section has `data-pin="rack"`, a horizontal track pinned for ~180vh.
- Slats move at 1.0×, plates at 1.12× and contact shadows at 0.9×. Each plate drops 16px into its slot as it passes the 40% mark.
- Every plate is a product link with name and price beneath (L0 within the track).
- On mobile it becomes a native horizontal scroller with scroll-snap and no pin.

**M4 Hooks**
- Items carry `data-hang`. The rotation angle is proportional to scroll velocity, at most ±6°, with a critically damped spring, settling within 600ms after scroll stops.
- The pivot is the top-centre hook point. Mobile amplitude is ±3°.

**M5 Glaze sheen** (optional, only if budget allows)
- A small WebGL layer behind the top-shelf plate packshots: one normal-mapped disc per plate with a single specular highlight following the pointer.
- DPR is capped at 1.5, it pauses when off-screen, it is not loaded on mobile, low-memory or save-data clients, and it is lazy-initialised after LCP.

**M6 Cupboard door** — the cart door spec in §7.20.

**M7 Shelf settle**
- On add: the tile's packshot lifts 6px. A FLIP ghost (opacity 0.9, scaled to 40px) travels to the header Bag count over 450ms on `--ease-furniture`. The count plate does `plate-in` (scaleX 0.9→1). The tile packshot settles back with `shelf-settle`. Then the toast appears (§7.15).
- If the header is hidden, skip the ghost.

**M8 Doors close**
- On `/order/confirmed`, a single pair of small doors (max 320px wide) closes over 600ms, and a brass plate with the order number rises into place.
- It plays once per order (session flag).

**M9 Elevation drawing**
- The about hero shows the dresser outline as SVG paths with `data-draw`, stroke-drawn over 1.6s on load (stagger 40ms per path), with Gloock text revealing by words.

Store surfaces (catalog, PDP, cart, checkout, account, policies) get only functional motion: drawers, tabs, toasts, the cart door, M7, skeleton-to-content fades. No scroll scenes there.

Performance budgets: hero JS (excluding Next runtime) ≤ 70 KB gzip before the optional M5; CLS 0; no scroll-jacking beyond the three pins on the homepage; all scenes released and reverted on route change.

---

## 13. Pages — layout specs

Global page skeleton: utility line → cornice → breadcrumbs (all except home, checkout and auth) → main → plinth footer. Page H1 is always the first heading in `main`. Every page has a unique `title` and `description`.

### 13.1 Home (`src/app/(store)/page.tsx`, `MarketplaceHome`)
Delete these components from the home tree (their files may go once unused): HeroCarousel, HorizontalTabs, PromoStrip, PromoBar, CategoryShowcase, DealOfTheDay, SaleStrip, PromoBannerGrid, BrandStrip, TrustStrip, TopBar, WhyShopWithUs, NewsletterBanner, MarketplaceProductCard. Reuse ProductSection logic via the new shelf components. Keep the `claimed` set: each section below takes products in render order, and no product appears twice (drawer contents and hero shelves count as sections). Banner records from admin are no longer rendered on the storefront; leave admin as is.

Section order, shapes and spacing:

1. **Hero — the dresser** (M1).
   - Full width (`max-w-wide`), height 100svh minus the header, bg `--color-bg`.
   - Desktop composition on 12 columns:
     - the dresser elevation spans columns 1–8: cornice board with the wordmark "Brasmora" in display-xl on `--color-paint`; two open shelves holding 4–5 real packshots each from tableware and glassware; then two cupboard doors labelled with brass plates "Cookware" and "Bakeware"; then a row of three drawers labelled "Utensils", "Cutlery", "Linen";
     - the side panel (columns 9–12, L0) is aligned to the top shelf: H1 in Gloock step-5 "Cookware, tableware and glass for kitchens across the UK and EU", a lead in step-1 muted ("Pans, plates, glasses and the tools between them, chosen to be used every day."), Paint lg "Open the cupboards" (scrolls to the end of the scene) and Text "Browse all categories" (to /catalog).
   - Mobile (390): a portrait elevation — cornice wordmark at full width; one open shelf of three packshots; the two doors; the H1 at step-4 and the two buttons below the dresser (not overlaid). Pin 160vh.
   - Spacing: 0 top, 0 bottom (the scene hands over).
2. **Drawer index — "Every drawer in the shop"** (M2).
   - H2 left-aligned with a one-line lead.
   - A chest of 10 drawer fronts: desktop 5 × 2; tablet 2 × 5; mobile 1 × 10, each 72px high.
   - Each drawer: a raised front with a 10px bevel-xs knob, a brass plate with the category name, the real product count in muted ui-sm ("214 items"), and the link to the category. Inside are three packshots from that category (claimed).
   - Padding 96px top, 64px bottom.
3. **Top shelf** (featured).
   - One wide shelf line across the container. On it: one featured product spanning columns 1–5 (4:5 cubby, name in Gloock step-3, spec line, price, Paint "Add to bag"), then four compact products standing in columns 6–12.
   - Title as an eyebrow plate "Top shelf" plus H2 "Most chosen this month" — only if ranked by real order data; otherwise H2 "Picked for the top shelf" (an editorial pick, honest).
   - Padding 64px top, 80px bottom.
4. **Plate rack** (M3, tableware).
   - Full-bleed band `--color-bg-secondary`.
   - H2 "Plates, bowls and serveware" at top-left, the rack track below, and a text link "All tableware →" at the end of the track.
   - Padding 80px top, 80px bottom.
5. **Hooks** (M4, coffee & tea plus bar & wine).
   - A 2px rail across the container with 6–8 hanging products, mixed sizes (mugs, cafetières, jiggers, shakers), each with a name and price in a small caption under the item.
   - Two text links at the right: "Coffee & tea →", "Bar & wine →".
   - Dense: padding 48px top, 48px bottom.
6. **Reduced** (sale).
   - Full-bleed `--color-paint` band with `--color-on-paint` text. H2 in Gloock step-4 "Reduced", with a lead stating the real rule ("Prices lowered on these pieces while stock lasts").
   - Products stand on a chalk shelf strip (`--color-stage` cubbies on the paint) in a 4-up row with brass "Reduced −N%" plates. N is the real percentage, rounded down.
   - Text link "See everything reduced →" in brass-on-paint.
   - Omit the whole section if there are no sale products.
   - Padding 80px top, 96px bottom.
7. **New on the shelf.**
   - H2 plus a "Newest first" text link to `/catalog?sort=newest`.
   - Two shelf rows of 4 (desktop) or 2 × 2 (mobile) of the most recent products.
   - Padding 96px top, 64px bottom.
8. **Care cupboard.**
   - A two-column typographic block on `--color-bg`, max 68ch per column.
   - Four short, true care notes (cast iron: dry and oil after washing; enamel: avoid metal scourers; non-stick: low-to-medium heat and wooden or silicone tools; glass: avoid sudden temperature changes). Each links to the matching category or filter.
   - Left column title H2 "Looking after it".
   - Padding 64px top, 64px bottom.
9. **Newsletter plaque.**
   - A centred bevel-lg brass plaque (max 720px): Gloock step-3 "New pieces, once a month", one email input plus Paint "Sign up", and the line "Unsubscribe any time. We never share your email." with a privacy link.
   - No discount unless a real one exists in config.
   - Padding 64px top, 96px bottom.

Every count, percentage and ranking shown is computed from data. A section with no data is omitted, never filled with placeholders.

### 13.2 Catalog (`/catalog`) and category (`/catalog/[category]`)
- **Category opener** (category pages): H1 in Gloock step-4 with the category name, the real count in a neutral plate, and a 1–2 sentence description from the category record (max 68ch). On the right (desktop), a small drawn cubby with the category's art product (`artProductSlug`) standing on a shelf.
- Sub-category row: text links with counts, separated by 24px. The active one is ink with a 2px shelf underline. It scrolls horizontally on mobile.
- `/catalog` (all): H1 "All categories", followed by the 10-drawer chest from the home (compact, no motion) above the product grid.
- **Body:**
  - Desktop: the filter drawer index in the left 280px column and the grid on the right.
  - Toolbar: result sentence and active chips on the left; sort on the right.
  - Grid: 4 columns ≥1280, 3 columns 1024–1279, 2 columns <1024; column gap 32px, row gap 56px.
  - **Continuous shelves:** each tile's shelf line extends by half the column gap on both sides (negative inline margin), and the grid container uses `overflow-x: clip`, so each row reads as one shelf.
- Pagination or load more at the bottom.
- **Empty results:** an empty shelf drawing, "Nothing on this shelf with those filters.", the active chips with "Clear all", and three related category links.
- **Mobile:** a sticky toolbar under the header (Filter button, sort select), 2-up grid, 12px gap, and touch add buttons visible.

### 13.3 Product page (`/product/[slug]`)
- **Desktop 12 columns:**
  - **Gallery (columns 1–7):** one large cubby (1:1, `--color-stage`, contact shadow, shelf line). Thumbnails are 72px cubbies on their own shelf line below; the active one carries a 2px `--color-accent` box. Click opens the zoom modal (full-screen stage, pan with pointer and drag, `Esc`).
  - **Info (columns 8–12, sticky):** breadcrumbs above the H1; brass category plate; H1 in Gloock step-4; price in Gloock step-3 with the struck compare price and "Reduced −N%" plate; a 2–3 line summary; `VariantSelector` (§7.5); stepper plus Paint lg "Add to bag" in one row (stepper 148px, button fills the rest); Text "Save to wishlist".
  - Then three ruled info rows (1px hairlines, 48px each) with 18px icons: `Truck` delivery line from config, `RotateCcw` returns window from the Returns Policy, `ShieldCheck` "Secure card payment" with Visa/Mastercard logos at 20px.
- **Below the fold:** `ProductTabs` (Description / Specifications / Care / Delivery & returns). Specifications are a ruled two-column table (label muted ui-sm, value ink step-0, 48px rows) showing only attributes that exist.
- Then "From the same shelf": one shelf row of 4 related products (`RelatedProducts`), distinct from the gallery product.
- JSON-LD Product with offers in the active currency.
- **Mobile:**
  - The gallery is a swipeable track with scroll-snap and a "1 / 5" neutral plate at the bottom right, followed by the info.
  - A sticky bottom bar (64px, `--color-raised`, top hairline) holds the price in Gloock step-1 plus Paint "Add to bag". It appears once the main add button leaves the viewport.
  - Tabs become accordions.
- **States:** out of stock (the button is replaced by a disabled Paint "Sold out" plus the text "Check back later"; no fake notify form unless a real one exists), variant not selected (button text "Choose a size"), adding (loading state), added (M7 plus toast).

### 13.4 Search (`/search`)
- H1 is the query itself: Gloock step-4 `“casserole”` with a muted "128 results" beside it. A large input above, prefilled, so the user can refine.
- Then the same filter and grid layout as the catalog.
- **No results:** "Nothing matches “xyz”." Suggestions: check spelling, try a broader word, plus the 10 categories as text links in two columns.

### 13.5 Cart page (`/cart`)
- H1 "Your bag" plus the count plate.
- **Desktop:** items in columns 1–8 as full shelf rows (a 120px cubby, name, variant, unit price, stepper, line total, "Remove", "Save for later" only if a wishlist exists); a 1px hairline between rows plus a shelf line under the last row.
- **"The counter"** (columns 9–12, sticky, `--color-raised`, 1px border, 24px padding):
  - Subtotal; delivery ("Calculated at the next step", or the real rule); Total in Gloock step-3 (label per VAT rule);
  - Paint lg "Checkout", Text "Continue shopping";
  - payment logos row at 24px; MerchantInfo line (legal name and support email) in ui-xs.
- **Mobile:** stacked rows, with the counter at the bottom and a sticky "Checkout · £84.00" bar.
- Empty: as the cart door's empty state, at page scale.

### 13.6 Checkout (`/checkout`) — three drawers (§7.19)
- **Page frame:** a minimal header (cornice with wordmark only plus a "Secure checkout" text with a `Lock` 16px icon and "Back to bag"). No category nav and no full footer: a compact plinth with policy links, the credentials one-liner and payment logos. `max-w-narrow`.
- **Desktop:** drawers in columns 1–7; "The counter" in columns 8–12 (sticky) with compact item rows, subtotal, delivery (updates once a method is chosen), Total, and a ui-xs list of policy links (Terms, Returns, Delivery, Privacy).
- **Drawer 1 "Contact":** email (with the "Already have an account? Sign in" text link), first name, last name, phone (country prefix). Continue.
- **Drawer 2 "Delivery":** street, city, postcode, country (the restricted list is excluded via config). Delivery method radio rows (name, real time range from config, price). Billing same as delivery (checkbox; unticked reveals billing fields). Continue.
- **Drawer 3 "Review & pay":**
  - a read-only summary of contact and delivery with "Change" links;
  - the order lines;
  - a Terms checkbox, "I have read and agree to the Terms and Conditions" (link), required;
  - Paint lg "Pay £84.00", enabled only when ticked;
  - under it, the Visa / Mastercard / PCI DSS logos at 28px and the line "Card payments are processed securely by {provider placeholder}. We never see or store your full card number." (matching the Privacy Policy wording).
  - On submit: button loading state, then the PSP redirect or embed per existing logic.
- **Mobile:** the counter collapses to a top toggle row "Show order summary · £84.00" (an accordion), drawers follow, and the pay button is full-width.

### 13.7 Order confirmed (`/order/confirmed`)
- A centred narrow column with the M8 small doors.
- H1 in Gloock step-4 "Thank you, {firstName}".
- The order number in a brass plate (mono for the number).
- The line "We've sent a confirmation to {email}."
- A summary block (items as compact shelf rows, totals, delivery address, delivery estimate from config).
- Buttons: Paint "View your order" (if logged in) / Outline "Continue shopping".

### 13.8 Auth
- **Login (`/auth/login`):**
  - Two columns on desktop (max 960px). Left (columns 1–6): H1 "Sign in", email, password (show/hide), "Forgot your password?" text link, Paint lg "Sign in", and the error summary when credentials fail ("Email or password is incorrect").
  - Right (columns 8–12, separated by a 1px vertical hairline): H2 in Gloock step-2 "New to Brasmora?", three true benefits as a plain list (track orders, save addresses, keep a wishlist), and Outline "Create an account".
  - Mobile stacks them, with the form first.
- **Register (`/auth/register`):**
  - Four drawers (§7.19) in a 560px column. Desktop has a right aside with the same three benefits and "Already registered? Sign in".
  - Drawer 1 "About you": first name, last name, date of birth (three selects or a date input with a format hint, 18+ check per T&Cs, with an error naming the rule).
  - Drawer 2 "Contact": email, phone (country prefix hint).
  - Drawer 3 "Address": street, city, country (select, restricted excluded), postcode.
  - Drawer 4 "Password": password (strength hint text: "At least 8 characters, one number"), confirm password, Terms checkbox (link), Paint lg "Create account" disabled until ticked.
  - Errors as in §7.2.
- **Forgot password:** a single 480px column with H1 "Reset your password", email, Paint "Send reset link". The success state replaces the form: "If an account exists for {email}, a reset link is on its way. It expires in {real expiry}."
- **Reset password:** new plus confirm fields and Paint "Set new password". An expired or invalid token shows a clear message and a link to request a new one.

### 13.9 Account (`/account/**`)
- **Layout (`account/layout.tsx`, `AccountSidebar`):**
  - Desktop: the left 240px column is a drawer chest: Overview, Orders, Saved (wishlist), Addresses, Profile, then a hairline and Sign out.
  - Active: ink text, pulled 6px right, with a 2px shelf line under it. Others are muted.
  - Mobile: a horizontal scroller of text tabs with the same active treatment, under the H1.
- **Overview:** H1 "Hello, {firstName}". The latest order as one shelf row (order number in mono, date, status plate, total, "View"). Quick links as text (Addresses, Profile). No stats tiles.
- **Orders:**
  - A ruled table (Order, Date, Items, Status plate, Total, action) with 56px rows. Mobile: each order is a stacked block separated by a shelf line.
  - Empty: "No orders yet." plus Outline "Browse the shop".
- **Order detail:**
  - H1 "Order {number}" with a status plate.
  - A vertical status list (Placed → Paid → Shipped → Delivered) drawn as a drawer stack with dates. Only real statuses are shown, and future ones are faint.
  - Items as shelf rows; delivery and billing addresses; totals in a counter block; tracking link if one exists; "Need help with this order?" linking to contact with the order number prefilled.
- **Saved:** the shelf grid (3-up desktop, 2-up mobile). Empty: "Nothing saved yet. Tap Save on any product to keep it here."
- **Addresses:**
  - Each address is a raised block with a 1px border and 0 radius (the only "card-like" block, because it is an editable record), with a "Default" brass plate and the text actions Edit / Remove / Set as default.
  - "Add an address" is an Outline button. The form opens in a drawer below.
- **Profile:** a form in two groups (Personal details, Password) as drawers. Save buttons per group, with a success toast.

### 13.10 Contact (`/contact`)
- **Desktop two columns:**
  - Left (columns 1–5): H1 "Contact us", a one-line promise using real support hours and expected reply time from config, then the credential plaque in bevel-lg brass (same data as the footer, stacked), then "Order questions? Have your order number ready." with links to the Delivery and Returns policies.
  - Right (columns 7–12): form with name, email, order number (optional), subject select (Order, Delivery, Returns, Product question, Other), message, and Paint "Send message".
- Success replaces the form ("Thanks, we'll reply to {email} within {real time}"). The error state keeps the input.
- No map unless there is a real public address.

### 13.11 About (`/about`) — a landing surface
1. **Hero:** the M9 elevation drawing at the right, and at the left the H1 in Gloock step-5 "A dresser full of good kitchen things" plus a step-1 lead.
2. **"What goes on our shelves":** a 2-column 68ch text, giving true selection criteria (materials, everyday use, care).
3. **"What we don't sell":** a short, honest list: no electrical appliances, no knives.
4. **"How ordering works":** three ruled rows (Order, Dispatch, Delivery & returns) with real terms from config and policies.
5. The company plaque.
6. Paint "Browse the shop".

Pull-quotes or invented founders' stories are not allowed.

### 13.12 FAQ (`/faq`)
- H1 "Questions".
- Desktop: the left sticky group index (Orders, Delivery, Returns & refunds, Payment, Products & care, Account) as text links with the active one shelf-underlined. On the right, the accordion groups (§7.14), each with an H2 in Gloock step-3.
- Every answer is consistent with the policies, word for word on numbers (days, costs).
- End block: "Still need help?" plus Outline "Contact us".
- Emit FAQPage JSON-LD.

### 13.13 Policies (`/policies`, `/policies/*`, `/pages/[slug]`) — `PolicyLayout`
- **Index (`/policies`):** H1 "Policies" and a ruled list of all 8 (Terms, Privacy, Cookies, Returns & refunds, Shipping, Payment, Warranty, plus Complaints / Acceptable use if present), each row with the title in Gloock step-2, one-line scope and "Last updated {date}".
- **Policy page:**
  - Desktop: the left 240px sticky drawer index of all policies (active pulled with a shelf line) and, below it, "On this page" contents generated from H2s.
  - Main column: 68ch, with H1 in Gloock step-5, a "Last updated {realistic date}" plate (neutral), section H2 in Gloock step-3 numbered "1.", "2.", … body step-0 at 1.7, lists with 8px gaps, and ruled tables (the Cookie table: name, provider, purpose, expiry, including localStorage keys such as cart, theme, wishlist, currency and consent).
  - Mobile: a "Jump to policy" select at the top, plus an "On this page" accordion.
- Print stylesheet: hide header and footer, use black text on white.

### 13.14 404 (`src/app/(store)/not-found.tsx`, create it if missing)
- A drawn shelf with three cubbies, one of them empty, and a brass plate under the empty one reading "404".
- H1 in Gloock step-4 "This shelf is empty", a one-line explanation, the search input, the category text links (two columns) and Text "Back to home".
- It returns a real 404 status.

### 13.15 Empty states (shared `EmptyState`, restyled)
- Anatomy: a small drawn shelf line (120px wide) with nothing on it, an H2 in Gloock step-2, one sentence in muted text, and one primary action (plus at most one text link).
- Copy per context:
  - bag: "Your bag is empty";
  - saved: "Nothing saved yet";
  - orders: "No orders yet";
  - search: "Nothing matches “…”";
  - filters: "Nothing on this shelf with those filters";
  - addresses: "No saved addresses".
- No illustrations of people, no emoji.

### 13.16 Error states
- Inline form errors follow §7.2.
- A page-level fetch error is an `Alert` (`--color-danger-tint` fill, 1px danger border, 0 radius, `TriangleAlert` icon) with the text "Something went wrong loading this page." and an Outline "Try again".
- Payment failure on return from the PSP: an alert above the drawers, "Your payment didn't go through. You haven't been charged." plus "Try again" reopening drawer 3.

---

## 14. Imagery rules for white-background packshots

1. Every product image sits in a cubby on `--color-stage` (white in light theme, `#F4F1EC` in dark), 1:1 for tiles and 4:5 for featured. Never on chalk, paint or band directly.
2. Fit with `object-contain`, bottom-anchored, insets 10% sides and top and 6% bottom. Never crop products. Never `object-cover` a packshot.
3. Light theme: `mix-blend-mode: multiply` on the image. Dark theme: no blend, so the stage colour carries the warmth.
4. Every packshot gets the contact shadow and stands on a shelf line. The shadow width follows the cubby (70%). There is no per-image detection.
5. Hero, drawer, rack and hook imagery uses the same packshots with transparent-feel staging, never re-coloured, tinted, duotoned or filtered. No CSS filters on product images, except `opacity` during transitions.
6. Prefer packshots whose product fills at least 60% of the frame for hero shelves, hooks and the plate rack. The engineer picks them by category via the existing pick helpers. Long thin items (utensils) go in drawers, never on the top shelf.
7. Images are served from our own storage (R2/`public`) through `next/image` with correct `sizes`. Never hotlink, and never show supplier names or watermarks.
8. No stock lifestyle photos, AI-generated scenes, or people. The furniture drawings, typography and packshots are the whole visual world.
9. Alt text is the product name plus the key variant ("Enamelled cast iron casserole, 24 cm, cream"). Decorative furniture SVGs are `aria-hidden`.
10. Category art uses the category's `artProductSlug` packshot in a cubby, never a different image per surface for the same category.

---

## 15. Copy and content rules
- British English (colour, organisation, cafetière, aluminium). Prices are formatted by the existing currency provider.
- Plain, specific, true. No "elevate", "seamless", "effortless", "curated essentials", "must-have", "premium quality" claims, "chef-approved", "best-selling" (unless ranked by real data), or invented numbers, reviews, ratings, partners or "as seen in".
- Delivery, returns, warranty and payment statements come from one config and match the policies word for word on numbers. No carrier names or delivery times unless they are configured.
- Every count shown (items per category, results, reduced %) is computed live.
- Button labels are verbs: Add to bag, Checkout, Continue, Pay £84.00, Sign in, Create account, Send message, Save choices.
- Section titles use the furniture voice lightly ("Top shelf", "Looking after it"), but category and navigation labels are always the real category names.

---

## 16. Accessibility and quality floor (must pass before handover)
- WCAG 2.2 AA: contrast as in §3.2 in both themes; every control has a focus-visible ring; targets ≥44px on touch.
- Landmarks: `header`, `nav` (main, breadcrumb, footer, account), `main`, `footer`. One H1 per page, then H2/H3 in order.
- ARIA patterns: disclosure (drawers), tabs, combobox (search, country if custom), dialog (cart, modal, preference centre, mobile menu), slider (price), switch (cookies), live regions (cart updates, steps, quantity clamp).
- Keyboard: everything reachable and operable; mega-menu and drawers close on Esc and return focus; no keyboard traps outside dialogs.
- `prefers-reduced-motion`: every scene shows its static state (§12), and nothing pins.
- Performance: LCP ≤ 2.5s on 4G mid-tier (the hero LCP element is text), CLS 0, INP ≤ 200ms. Images lazy below the fold; fonts subset to latin and latin-ext; hero packshots ≤ 2 priority.
- Theme parity: every screen checked in Morning and Lamplight.
- SEO: unique titles and descriptions; Product, BreadcrumbList, FAQPage and Organization JSON-LD; OG image with wordmark plus monogram on chalk.
- QC checklist items that touch design: payment logos in the footer and at checkout; credentials in the footer; "Cookie settings" link in the footer; registration multi-step with the required fields and the T&C gate; no language switcher; no fake stock or claims.

---

## 17. Implementation order
1. Tokens: `variables.css`, `@theme inline` additions, `tailwind.config.ts` mirror, fonts, `fonts.css`, global base rules, bevel utilities, animations clean-up.
2. Sweeps from §2.4 (on-accent text, hex removal, glass/gradient helpers, Phosphor → Lucide).
3. Primitives: Button, inputs, select, checkbox/radio/switch, Plate, chips, stepper, tabs, accordion, toast, modal, loader, EmptyState, Alert, Breadcrumbs, Pagination.
4. Shelf product tile, grid shelves, filters, sort.
5. Header (utility line, cornice, mega-menu, mobile menu, search dialog) and footer plinth, cookie banner and preference centre.
6. Pages: catalog/category/search → PDP → cart door and cart page → checkout → order confirmed → auth → account → contact, about, FAQ, policies, 404 → home (static end-states of M1–M4 first).
7. Logo, favicon, manifest, metadata.
8. Hand over to the motion engineer with the hooks from §12 in place.
9. Run `npm run build`; check every page at 390 / 768 / 1280 / 1440, in both themes and with reduced motion.

---

## 18. Slop self-audit — the result must pass every line

Visual
- [ ] Nothing in the storefront has a border-radius except the radio dot. Bevels appear only where §5.4 lists them.
- [ ] No gradients except the named contact-shadow token. No glow, glass, blur, blob, mesh or gradient text anywhere (`.glass` and `.gradient-text` are deleted).
- [ ] No floating cards: products stand on shelves, and the only boxed records are addresses and the counter.
- [ ] No grid of identical items where importance differs: the home has one featured product per shelf section, and the drawer index shows real counts.
- [ ] Gloock and Commissioner are the only families (plus system mono for order numbers and SKUs). No Inter, Karla, Bricolage, Roboto or system-ui as identity. No faux-bold Gloock.
- [ ] The type scale tokens are used everywhere; no stray font sizes.
- [ ] Section spacing differs by section as specified; no uniform padding.
- [ ] Icons are Lucide only, stroke 1.5, never in circles, never decorative. No Phosphor in the storefront. No Basket glyph.
- [ ] Brass appears as plates only (and brass-on-paint text). Never more than 3 plates in a non-grid viewport section.
- [ ] Furniture drawings are flat lines and planes, with no wood texture or skeuomorphic lighting.

Content and honesty
- [ ] No invented numbers, ratings, testimonials, partner logos, scarcity, "best seller" or "trending" without data.
- [ ] No filler copy (elevate, seamless, effortless, curated, must-have, premium).
- [ ] Delivery, returns and payment statements match the policies; the VAT label follows `COMPANY.vatRegistered`.
- [ ] Footer: credentials from `COMPANY`, "trading name" line, Visa/Mastercard/PCI DSS in colour from `/payments/*.svg`, and a "Cookie settings" link.
- [ ] No electrical-store leftovers (copy, icons, categories, metadata, `SolvetaMark`, "Solvetaworld").

Function and accessibility
- [ ] Both themes are designed and verified; no `text-white` on paint fills.
- [ ] Focus rings are visible on every control, including bevelled ones (outline on the unclipped element).
- [ ] Every drawer, door, dialog, tab, slider and switch follows its ARIA pattern and works by keyboard.
- [ ] Reduced motion shows complete static designs; no pin, swing or sheen.
- [ ] Mobile is composed (portrait dresser, sticky add and checkout bars, filter drawer, accordion footer), not desktop stacked.
- [ ] Every homepage section has a distinct assortment, and empty sections are omitted.

Distinctness
- [ ] Side by side with Solvetaworld, every page differs in silhouette: header (cornice versus two light tiers), cards (shelves versus bordered boxes), buttons (bevelled chocolate versus rounded green), footer (chocolate plinth with brass plaque versus light three-column), homepage order, typefaces, icons and cart glyph.
- [ ] Nothing reads as Drop District, Blueprint Works, Chipwave, Aurora Signal, Console Deck or Avant Shop: no blue, green, lime, yellow or orange-red accents, no tape, stamps, title blocks, index numerals, tickers, glass or pills.
- [ ] Could a stranger mistake this for a generic template? If yes, find which section is generic and redo it with the motifs above.
