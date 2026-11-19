# THEME_PROFILE.md — Zenn Space theme (codebase fingerprint)

> Draft, evidence-based. Skim and correct. How THIS theme is built; read alongside
> `specs/DESIGN.md` before writing any code. Paths are relative to the repo root
> `/home/bt-01/agent-workspace/Shopify-CLI-Demo`.

## 1. Identity
- **Theme:** Horizon **3.5.1**, author Shopify (`config/settings_schema.json` →
  `theme_info`: `"theme_name": "Horizon"`, `"theme_version": "3.5.1"`).
- **Store:** "Zenn Space", `primary_locale = en`, currency **INR** (Admin API — see §6).
- **File counts** (top-level files per dir):
  - `sections/` — **51** (49 `.liquid` + 2 group configs: `header-group.json`, `footer-group.json`)
  - `snippets/` — **104**
  - `blocks/` — **93**
  - `templates/` — **22** (OS 2.0 JSON + a few `.liquid`, e.g. `gift_card.liquid`)
  - `locales/` — **51** files (see §6)
  - `assets/` — 136 · `config/` — 2 · `layout/` — 2
- This is a standard **Horizon OS 2.0** theme (blocks + `content_for`, color schemes,
  JSON templates, section groups).
- **Page-builder / custom sections — DO NOT use as reference patterns.** These were
  hand-ported from Figma/HTML and break Horizon conventions (external Google Fonts,
  their own CSS files, or hardcoded hex):
  - `sections/tok-landing.liquid`, `tok-main-product.liquid`, `tok-main-collection.liquid`,
    `tok-main-cart.liquid` — load `assets/tok-theme.css` + Google Fonts (Cormorant/Inter) directly.
  - `sections/html-landing.liquid`, `html-pdp.liquid`, `html-collection.liquid` — load
    `assets/html-pages.css` (palette lives there; Liquid is hex-free but CSS is external).
  - `sections/shop-by-league.liquid` (7 hardcoded hex), `sections/tech-59fifty.liquid`
    (3 hardcoded hex) — pixel-accurate Figma ports.
  - Associated custom templates: `templates/*.threads-of-kaos*.json`, `*.html-*.json`,
    `page.landing.json`, `product.custom.json`.

## 2. Liquid conventions
Sampled: `sections/media-with-content.liquid`, `product-recommendations.liquid`,
`blocks/footer-copyright.liquid`, `product-card.liquid`, `snippets/button.liquid`,
`color-schemes.liquid`, `theme-styles-variables.liquid`, `scripts.liquid`.
- **Whitespace control:** mixed but intentional. `{%-`/`-%}` is used (~1103 occurrences in
  sections+blocks vs ~2113 plain `{%`), concentrated at tag boundaries and inside output;
  most logic lives in `{% liquid %}` multi-line blocks where trimming is moot. Follow the
  surrounding file; trim inline output that would leak whitespace into HTML.
- **`render` only, never `include`:** `{% render %}` appears ~469 times; `{% include %}`
  **0 times**. Always `{% render %}`.
- **Logic style:** top-of-file `{% liquid %}` / `{% assign %}` blocks build class modifier
  strings and captured `styles`, then a single HTML root. See `media-with-content.liquid`
  (lines 3–13) and `product-recommendations.liquid` (`capture styles ... echo '--var: ...'`).
- **CSS scoping:** per-section/-block `{% stylesheet %}` ... `{% endstylesheet %}` blocks
  (Shopify dedupes/concats these). Global tokens live in `{% style %}` snippets
  (`theme-styles-variables.liquid`, `color-schemes.liquid`).
- **Inline style injection:** dynamic values flow through `style="{% render 'spacing-style',
  settings: ... %} {% render 'border-override', ... %} --media-height: ...;"` — i.e. CSS
  custom properties set inline from settings, consumed by the scoped stylesheet.
- **Blocks:** composed with `{% content_for 'block', type: '...', id: '...' %}` and
  `{% content_for 'blocks' %}`; `{{ block.shopify_attributes }}` always emitted on the root.
- **Docs:** snippets/blocks use `{% doc %}`/`{%- doc -%}` headers documenting `@param`.

## 3. CSS conventions
- **Naming:** BEM-ish — `block__element--modifier`
  (`media-with-content__content`, `footer-utilities__group-copyright`,
  `media-with-content--media-right`). SCSS-style `&` nesting inside `{% stylesheet %}`.
- **Colors = RGB triplets in custom properties.** `snippets/color-schemes.liquid` emits,
  per scheme, both a ready `rgb()` var and a **space-separated RGB triplet** var:
  `--color-foreground: rgb({{ ...foreground.rgba }});` **and**
  `--color-foreground-rgb: {{ ...foreground.rgb }};` (e.g. `23 22 20`). Opacity variants are
  built as `rgb(var(--color-foreground-rgb) / var(--opacity-60))`. The comment at line 29
  explains why (iOS <16.4 lacks relative color syntax). **Never hardcode hex in new code** —
  use these vars (enforced by CLAUDE.md).
- **Breakpoints:** primary desktop breakpoint `@media screen and (min-width: 750px)`
  (pervasive). Token file also steps root vars at `40em` and `60em`.
- **Utility classes:** `section`, `section--page-width` / `section--full-width`,
  `color-{{ scheme }}`, `spacing-style`, `size-style`, `custom-typography`, `disable-section-top-offset`.
- **Layout grid vars:** `--full-page-grid-margin`, `--full-page-grid-central-column-width`,
  `--full-page-grid-with-margins` drive section grids.

## 4. JS conventions
- **Autonomous Web Components**, not customized built-ins. `customElements.define` appears
  in ~**59** asset files; `is="..."` appears **0** times. Tags are full custom elements
  (`<product-price>`, `<dialog-component>`, `<variant-picker>`, `<marquee-component>`,
  `<results-list>`, …).
- **Base class:** `Component extends DeclarativeShadowElement` in `assets/component.js`
  (declarative shadow-DOM hydration, `ref` attribute child references via MutationObserver,
  declarative event-listener wiring).
- **ESM + import map:** `snippets/scripts.liquid` emits `<script type="importmap">` mapping
  `@theme/*` aliases → `*.js` asset URLs (`@theme/component`, `@theme/utilities`,
  `@theme/variant-picker`, …). Modules import via these aliases.
- **Loading:** scripts are `type="module"` (deferred by spec); non-critical scripts carry
  `fetchpriority="low"` (e.g. `product-recommendations.js`). Idle work via
  `requestIdleCallback` (`utilities`). Media is lazy via `<deferred-media>`.

## 5. Schema conventions
- **Most-used setting `type`s** (sections+blocks): `range` 531, `select` 501, `header` 296,
  `text` 283, `checkbox` 166, `color_scheme` 67, `image_picker` 46, `group` 43, `url` 39,
  `paragraph` 37, `textarea` 36, `button` 34, `richtext` 29, `video` 27, `color` 27.
- **Color schemes (OS 2.0):** `"type": "color_scheme"` settings appear in ~64 files; the
  standard pattern is a `color_scheme` setting (often with an `inherit_color_scheme`
  checkbox gating it via `visible_if`). Sections apply it as `class="color-{{ section.settings.color_scheme }}"`.
- **Conditional settings:** `visible_if: "{{ block.settings.x == 'y' }}"` is used widely.
- **Naming / i18n:** every `label`, `name`, `content`, option `label` uses `t:` translation
  keys (`t:settings.*`, `t:names.*`, `t:options.*`, `t:content.*`, `t:categories.*`).
- **Presets:** rich nested `presets` with `blocks`, nested child blocks and `block_order`
  (see `media-with-content.liquid` and `product-card.liquid`).
- Private/static blocks are prefixed `_` (`_content-without-appearance`, `_media-without-appearance`,
  `_product-card-gallery`). Sections support `@app` and `@theme` block drops.

## 6. Translation keys & store language
- **Primary language: English.** The default storefront file is **`locales/en.default.json`**
  (confirmed by sampling copy: "Account", "Total items in cart", "Close dialog",
  "Apply a discount code", "Primary navigation", etc.). Admin API independently confirms
  `primary_locale = en`, currency **INR**, shop name **"Zenn Space"**.
- **Two locale layers:**
  - Storefront strings: `locales/en.default.json` — top-level namespaces
    `accessibility, actions, blocks, blogs, content, fields, gift_cards, placeholders, products`
    (~317 keys), nested 2–4 levels deep, referenced in Liquid as `{{ 'actions.add_to_cart' | t }}`.
  - Schema/editor strings: `locales/en.default.schema.json` — namespaces
    `categories, content, html_defaults, info, names, options, settings, text_defaults`
    (the `t:` keys used in `{% schema %}`).
- **Note:** both default-locale files begin with an auto-generated JS `/* ... */` comment
  banner, so they are **not** plain-`json.load`-parseable (strip the banner first).
- **Other locales present (50):** full set of `.json` translations — `bg, cs, da, de, el, es,
  fi, fr, hr, hu, id, it, ja, ko, lt, nb, nl, pl, pt-BR, pt-PT, ro, ru, sk, sl, sv, th, tr,
  vi, zh-CN, zh-TW` — about half also ship a matching `.schema.json`. These are the standard
  Horizon bundled translations; en is the only `.default`.

## 7. Snippet / block library (key reusables)
- **Design-token source (read first):** `snippets/theme-styles-variables.liquid` (all global
  `:root` tokens — spacing, radius, type scale, animation, z-index), `snippets/color-schemes.liquid`
  (per-scheme color vars + body color).
- **Style helpers rendered inline:** `spacing-style`, `size-style`, `typography-style`,
  `border-override`, `gap-style`, `spacing-padding`, `layout-panel-style`.
- **Scripts/head:** `scripts.liquid` (importmap + module preloads), `stylesheets.liquid`,
  `fonts.liquid` / `html-fonts.liquid`, `meta-tags.liquid`.
- **Commerce building blocks:** `product-card.liquid`, `price.liquid`, `media.liquid`,
  `product-media.liquid`, `quick-add*.liquid`, `variant-swatches.liquid`, `swatch.liquid`,
  `buy-buttons-styles.liquid`, `cart-*.liquid`, `product-badges-styles.liquid`.
- **Blocks** are the editor-facing composition layer; the `product-card` **block**
  (`blocks/product-card.liquid`) simply captures `content_for 'blocks'` and delegates to the
  `product-card` **snippet** — a representative block→snippet pattern.

## 8. Reference sections (copy these)
1. **`sections/media-with-content.liquid`** — the cleanest full Horizon section: top
   `{% liquid %}` class-modifier logic, `section-background` + `section section--{{ width }}
   color-{{ scheme }} spacing-style` root, inline CSS-var injection via `render 'spacing-style'`
   / `render 'border-override'`, a scoped `{% stylesheet %}` using `&` nesting + grid areas,
   a `color_scheme` setting, static `content_for 'block'` slots, and rich nested presets.
   Best template for a new content/storytelling section.
2. **`sections/product-recommendations.liquid`** — reference for performance + product data:
   `type="module"` + `fetchpriority="low"` script, `capture styles`/`echo '--var: ...'`
   pattern, rendering of shared `quick-add`/`badges` styles, resource-list grid/carousel vars.
3. **`blocks/footer-copyright.liquid`** — minimal, correct **block**: `block.settings`,
   `render 'typography-style'`, `{{ block.shopify_attributes }}`, fully `t:`-keyed schema with
   a preset + category. Good skeleton for a small new block.
   (`blocks/product-card.liquid` is the reference for a block that delegates to a snippet via
   `content_for 'blocks'`.)

## 9. Performance patterns
- **Images:** rendered via `image_tag` (auto `srcset`/`width`/`height`) in ~36 files; above-fold
  `loading="eager"`, below-fold `loading="lazy"`; `<deferred-media>` defers video/heavy media.
- **JS:** no render-blocking scripts — import map + `type="module"` (deferred), `fetchpriority="low"`
  on non-critical bundles, `requestIdleCallback` for idle work.
- **CSS:** **no `@import`** found anywhere in `snippets`/`sections`. Styles are per-section
  `{% stylesheet %}` blocks (concatenated by Shopify) + global token `{% style %}` snippets.
- **Fonts:** `font_face` with `font_display: 'swap'`, de-duplicated via a `rendered_fonts`
  accumulator (`theme-styles-variables.liquid` lines 45–123).
- **Type scale:** sizes ≥48px become fluid `clamp(...)`; smaller sizes are fixed rem.
- **Reduced motion:** `prefers-reduced-motion` handled in ~21 files.

## 10. Gotchas
- **Colors are RGB triplets, not hex.** New CSS must use `--color-*` vars (or
  `rgb(var(--color-*-rgb) / var(--opacity-*))`), never literal hex, never pure black
  (`DESIGN.md` + CLAUDE.md hard rule). The hex in `config/settings_data.json` includes alpha
  suffixes (e.g. `#000000cf` ≈ 81% alpha) — don't copy those as plain hex.
- **`{% render %}` only** — `{% include %}` is banned (and absent).
- **Page-builder / Figma-port sections are NOT references** (see §1): `tok-*`, `html-*`,
  `shop-by-league`, `tech-59fifty` pull external CSS/fonts or hardcode hex. Copying them will
  violate the design-system hooks.
- **`config/settings_data.json` is protected** — never edit/commit it (CLAUDE.md + hooks).
  It is the live merchant config, auto-generated.
- **Default-locale JSON files have a `/* */` banner** — parsing requires stripping it first.
- **Global design tokens live in snippets, not a stylesheet asset** — edit
  `theme-styles-variables.liquid` / `color-schemes.liquid` for tokens, not an `.css` asset.
- **Web Components are autonomous custom elements** (`<foo-bar>`), extending the `Component`
  base in `assets/component.js` and wired through the `@theme/*` import map — don't introduce
  `is="..."` customized built-ins or ad-hoc `<script>` tags.

## Last generated
2026-11-19 — Draft generated by `/profile-theme`. Skim and correct; values cited from the
files named above.
