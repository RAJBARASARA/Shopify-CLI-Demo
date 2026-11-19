# DESIGN.md — Zenn Space theme (design system)

> Draft, evidence-based. Skim and correct. The design tokens new code must use.
> Read with `specs/THEME_PROFILE.md`. Sources: `config/settings_data.json`,
> `snippets/theme-styles-variables.liquid`, `snippets/color-schemes.liquid`,
> `config/settings_schema.json`. Hard rules in `CLAUDE.md`.

## How colors work (read this first)
Colors are authored as **hex (with optional alpha)** in `config/settings_data.json`
`color_schemes`, then `snippets/color-schemes.liquid` converts each to CSS custom
properties in **two formats** per role:
- `--color-foreground: rgb(<r,g,b,a>)` — ready to use.
- `--color-foreground-rgb: <r g b>` — **space-separated RGB triplet** for opacity
  compositing: `rgb(var(--color-foreground-rgb) / var(--opacity-60))`.

**Always reference the vars.** Never hardcode hex; never pure black (CLAUDE.md). Hex in
`settings_data.json` may carry an alpha byte, e.g. `#000000cf` ≈ `rgb(0 0 0 / 81%)`.

## 1. Colors
Active palette = `config/settings_data.json` → `current.color_schemes`. Sections pick a
scheme via `color-{{ scheme }}` classes; the brand-forward scheme is **scheme-3** (cream/gold).

**scheme-3 — Zenn Space brand (cream + gold)**
| Role | Var (ready / triplet) | Value (`settings_data` current) |
|---|---|---|
| Background | `--color-background` / `--color-background-rgb` | `#F7F3EC` (warm cream) |
| Foreground (text) | `--color-foreground` / `-rgb` | `#171614` (near-black) |
| Heading | `--color-foreground-heading` | `#171614` |
| Primary | `--color-primary` / `-rgb` | `#171614` |
| Primary hover | `--color-primary-hover` | `#A28656` (gold) |
| Border | `--color-border` / `-rgb` | `#E3D9C3` (sand) |
| Shadow | `--color-shadow` / `-rgb` | `#171614` |
| Primary button bg | `--color-primary-button-background` | `#A28656` (gold) |
| Primary button text | `--color-primary-button-text` | `#FFFFFF` |
| Primary button hover bg | `--color-primary-button-hover-background` | `#8A7046` (dark gold) |
| Secondary button text/border | `--color-secondary-button-*` | `#171614`, transparent bg |

**Other schemes (present, for other surfaces):** scheme-1 white bg `#FFFFFF` / text `#000000cf`,
black primary button `#000000`→hover `#333333` (the default light scheme); scheme-2 light-grey
`#F5F5F5`; scheme-4 pale-blue `#E1EDF5`; scheme-5 dark `#333333` (light text); scheme-6
transparent/white-on-image; plus one UUID scheme (transparent bg, black text). Note the
`presets.Horizon` block in `settings_data.json` still carries Shopify's stock scheme-3
(`#eef1ea` green) — the **`current`** block is what renders (cream `#F7F3EC`).

**Global named colors** (`theme-styles-variables.liquid`): `--color-error #8B0000`,
`--color-success #006400`, `--color-white #FFFFFF` (+ `--color-white-rgb 255 255 255`),
`--color-black #000000`, `--color-instock #3ED660`, `--color-lowstock #EE9441`,
`--color-outofstock #C8C8C8`.

**Derived colors:** `--color-foreground-muted = rgb(var(--color-foreground-rgb) / var(--opacity-60))`;
input disabled colors derive from `--color-foreground-rgb` at opacity 5–50; an **opacity ramp**
(`--opacity-5` … `--opacity-90`, `--opacity-subdued-text: var(--opacity-70)`) plus
scheme-brightness-aware `--opacity-5-15 / 10-25 / 35-55 / 40-60 / 30-60` (set in
`color-schemes.liquid` based on `background | color_brightness`).

## 2. Typography
- **Family: Inter everywhere** (`settings_data` current): body `inter_n4` (weight 400),
  subheading `inter_n5` (500), heading `inter_n7` (700), accent `inter_n7` (700). Exposed as
  `--font-body--family`, `--font-subheading--family`, `--font-heading--family`,
  `--font-accent--family` (with `--family/--style/--weight` each). Loaded via `font_face` +
  `font-display: swap`.
- **Base body size:** `type_size_paragraph = 14` (px), line-height `body-loose` = **1.6**.
- **Heading scale** (`type_size_h*`, px): **h1 56 · h2 48 · h3 32 · h4 24 · h5 14 · h6 12**.
  h1–h4 use the heading font; h5/h6 use subheading. Sizes **≥48px render as fluid `clamp()`**
  (min ≈ next-smaller size, preferred `vw`, max = the px value); smaller sizes are fixed rem.
- **Line-height tokens:** display tight/normal/loose = `1 / 1.1 / 1.2`; heading = `1.15 / 1.25 /
  1.35`; body = `1.2 / 1.4 / 1.6`. (h1/h2 display-tight, h3 display-normal, h4 display-tight,
  h5/h6 display-loose; paragraph body-loose.)
- **Letter-spacing tokens:** `--letter-spacing--{display|heading|body}-{tight -0.03em | normal
  0em | loose 0.03em}`; headings use `heading-normal` (0). Plus `--letter-spacing-sm 0.06em`,
  `--letter-spacing-md 0.13em`.
- **Measure/max-width:** `--max-width--body-normal 32.5em`, `--heading-narrow 19.5em`, etc.
- **Fixed size ramp** also available: `--font-size--3xs .625rem` … `--6xl 3.5rem`.

## 3. Spacing
From `theme-styles-variables.liquid` (`:root`). Three parallel rem scales:
- **Margin:** `--margin-3xs .125` · `2xs .3` · `xs .5` · `sm .7` · `md .8` · `lg 1` · `xl 1.25`
  · `2xl 1.5` · `3xl 1.75` · `4xl 2` · `5xl 3` · `6xl 5` (rem).
- **Padding:** `--padding-3xs .125` … `6xl 4` (rem).
- **Gap (grid/flex):** `--gap-3xs .125` · `2xs .3` · `xs .5` · `sm .7` · `md .9` · `lg 1` · `xl
  1.25` · `2xl 2` · `3xl 3` (rem).
- **Section rhythm:** `--section-height-small/medium/large` (responsive: 15/25/35rem → svh at
  40em/60em). Per-section top/bottom padding via `padding-block-start|end` range settings
  (px) rendered through `render 'spacing-style'`.
- **Page widths:** `--narrow-page-width 90rem`, `--normal 120rem`, `--wide 150rem` (current
  `page_width = "narrow"`). Content widths `--narrow/normal/wide-content-width 36/42/46rem`.
- **Spacing scales:** `--spacing-scale-sm .6 / -md .7 / -default 1.0`. `--scroll-margin 50px`.

## 4. Radius / borders / elevation
- **Radius scale:** `--style-border-radius-xs .2rem · -sm .6rem · -md .8rem · -lg 1rem · -50 50%`;
  also `--border-radius-sm .25rem`.
- **Component radii (settings → vars), current values:**
  - Buttons: `--style-border-radius-buttons-primary 14px`, `-secondary 14px`
    (`button_border_radius_primary/secondary = 14`; schema default secondary is 100).
  - Inputs: `--style-border-radius-inputs 4px` (`inputs_border_radius = 4`).
  - Popover/drawer: `--style-border-radius-popover 14px`.
  - Pills: `--style-border-radius-pills` from `pills_border_radius`.
  - Cards: `card_corner_radius = 4`; products `product_corner_radius = 0`.
  - Variant swatch radius 32px, variant button radius 14px.
  - Badges: `badge_corner_radius = 100` (pill/blob).
- **Borders:** `--style-border-width 1px`; button widths — primary `0`, secondary `1px`; input
  `1px`. `--border-color: rgb(var(--color-border-rgb) / var(--opacity-50))`; widths
  `--border-width-sm 1 / -md 2 / -lg 5 px`. Checkbox border `1px solid rgb(var(--color-
  foreground-rgb) / var(--opacity-35-55))`.
- **Focus ring:** `--focus-outline-width .09375rem` (~1.5px), `--focus-outline-offset .2em`.
  (Never remove focus styles — CLAUDE.md a11y rule.)
- **Elevation / shadows:**
  - `--shadow-button: 0 2px 3px rgb(0 0 0 / 20%)` — **hardcoded pure black** (flag: the one
    shadow token not scheme-tinted).
  - `--shadow-drawer: 0px 4px 20px rgb(var(--color-shadow-rgb) / var(--opacity-15))` and
    `--shadow-popover` (same recipe) — **neutral/scheme-tinted** via `--color-shadow-rgb`
    (the scheme's `shadow` color; scheme-3 shadow = `#171614`, most others `#000000`).
  - `--gradient-image-overlay: linear-gradient(to top, rgb(0 0 0 / .5), transparent)`.
  - Follow CLAUDE.md: shadows neutral-tinted (use the `--color-shadow-rgb` recipe), never pure
    black — i.e. prefer the drawer/popover recipe over copying `--shadow-button`.

## 5. Buttons
- **Case:** `button_text_case_primary` / `_secondary` default **`default`** (no transform;
  `uppercase` is the only alternate). `current` has no override → buttons are not uppercased.
  Exposed as `--button-text-case(-primary/-secondary)`.
- **Font:** `type_font_button_primary/secondary = body` → Inter body
  (`--button-font-family-primary: var(--font-body--family)`).
- **Letter-spacing:** inherits body/none (no button-specific tracking token).
- **Height / sizing:** `--button-size: var(--minimum-touch-target)` = **44px**; smaller
  variants `--button-size-sm 30px`, `--button-size-md 36px`. Padding
  `--button-padding-inline 24px`, `--button-padding-block 16px`. Buy-button height
  `calc(var(--padding-lg) * 2 + var(--icon-size-sm))`.
- **Variants:** primary (solid gold in scheme-3, border width 0), secondary (outline, border
  1px, transparent bg), and the `link` style class (see `snippets/button.liquid`, class
  `link`/`style_class`). Radius 14px both.
- **Hover (scheme-3):** primary bg `#A28656` → `#8A7046`; secondary hover bg `#ffffff5c`.
  Hover easing via `--animation-timing-hover`.

## 6. Components
- **Product card:** block `blocks/product-card.liquid` → snippet `snippets/product-card.liquid`,
  composed from child blocks `_product-card-gallery`, `product-title`, `price` (default
  `block_order`). Default vertical gap 16px (`product_card_gap`); inherits color scheme by
  default (`inherit_color_scheme = true`); `card_corner_radius 4`. Title preset: body font,
  1rem, `color: var(--color-foreground)`; price preset: `h6`, 1rem, sale price first.
- **Badges:** `badge_position = top-right`, `badge_corner_radius 100` (pill/blob),
  `badge_text_transform none`; sale badge uses `scheme-1`, sold-out uses `scheme-3`. Padding
  tokens `--badge-blob-padding-*` / `--badge-rectangle-padding-*` (responsive at 750px). Styled
  via `snippets/product-badges-styles.liquid`.
- **Separators / dividers:** `blocks/divider.liquid` / `_divider.liquid` + `sections/divider.liquid`
  (+ `snippets/divider.liquid`); `blocks/spacer.liquid` for whitespace.
- **Inputs:** padding `--input-padding .8rem .8rem`; box-shadow border recipe
  `0 0 0 var(--style-border-width-inputs) var(--color-input-border)`; radius 4px; disabled
  states derived from `--color-foreground-rgb` opacities.
- **Cart:** drawer type (`cart_type = drawer`), drawer drop shadow on; discount code field shown.

## 7. Motion
- **Durations:** `--animation-speed .125s` (base), `-fast .0625s`, `-medium .15s`, `-slow .2s`;
  drawer `--drawer-animation-speed .2s`.
- **Easings:** default `--animation-easing: ease-in-out`; cubic-beziers `--ease-out-cubic`,
  `--ease-out-quad`, `--ease-in-out-quad`, plus intent eases `--animation-timing-hover/active/
  bounce/default/fade-in/fade-out`; slideshow `cubic-bezier(0.4,0,0.2,1)`. Spring presets as
  `linear(...)` curves (`--spring-d300-b0-easing` … `--spring-d180-b0-easing`) with matching
  `-duration` vars.
- **Composite tokens:** `--animation-values`, `-fast`, `-slow`, `-allow-discrete`.
- **View transitions:** `--view-transition-old/new-main-content` defined; but
  `page_transition_enabled = false` and `transition_to_main_product = false` in current
  settings (page transitions currently off).
- **Reduced motion:** `prefers-reduced-motion` is honored across ~21 files (CLAUDE.md requires
  it for any new animation).

## Last generated
2026-11-19 — Draft generated by `/profile-theme`. Skim and correct; values cited from
`config/settings_data.json` (`current`), `settings_schema.json`, and the token snippets above.
