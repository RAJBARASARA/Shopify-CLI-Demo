# Interview: html-to-shopify-2026-11-14
# Source: agent-interview
# Date: 2026-11-14 (phase start 09:51 IST, compiled 09:57 IST)
# Agents: shopify-dev-expert (data wiring) + design-merchant (design/schema)

All decisions verified against real theme files in
`/home/bt-01/agent-workspace/Shopify-CLI-Demo`. Confidence high unless noted.

---
## A. GOVERNING CONSTRAINT — hardcoded-color commit hook (verified myself)
`.claude/hooks/block-hardcoded-colors.sh` (wired in `.claude/settings.json` →
PreToolUse/Bash) blocks `git commit` when `git diff --cached -- sections/ snippets/`
adds a line containing hex (`#rgb`/`#rrggbb`) unless the line also contains
`var(--`, `rgb(var`, `rgba(var`, `//`, `comment`, or `schema`. **It does NOT scan
`assets/`.** Other active hooks: `block-settings-data-commit.sh`,
`check-theme-sync.sh` (PreToolUse), `mark-theme-synced.sh` (PostToolUse).

**Resolution (ACCEPTED):** all hex lives in a new, committed shared asset
`assets/html-pages.css`; the three `sections/*.liquid` + any snippets stay 100%
hex-free (no inline `<style>`, no `color` schema settings with hex defaults).

---
## B. CSS & FONT ARCHITECTURE  (design-merchant)
1. **Scoped CSS → one shared `assets/html-pages.css`**, referenced per section via
   `{{ 'html-pages.css' | asset_url | stylesheet_tag }}`. Scope by wrapper class,
   not `{{ section.id }}` (asset CSS can't run Liquid, and `{% stylesheet %}` blocks
   can't interpolate `section.id` — verified in `marquee/hero/main-blog`).
   - Wrappers: `.htmlp` (shared tokens) + `.htmlp-landing` / `.htmlp-pdp` /
     `.htmlp-collection`. Every selector prefixed → no global leakage. base.css and
     theme.liquid untouched.
   - Palette tokens on `.htmlp`: `--bg:#f7f3ec; --panel:#fffdf9; --accent:#c9af7a;
     --accent-deep:#a28656; --ink:#171614; --muted:#6f665d;
     --shadow:0 18px 50px rgba(23,22,20,.10)`. No pure black (ink `#171614`);
     shadows tinted from ink. *Verification:* `sections/main-luxury-pdp.liquid:212+`
     ships the same section-local-var pattern.
   - ⚠ Lesson: TOK sections reference `assets/tok-theme.css` which **does not exist**
     (`assets/` has only base/overflow-list/template-giftcard) → they render
     unstyled. We must actually author + commit `assets/html-pages.css`. Leave
     tok-* untouched (out of scope).
2. **Fonts → inline Google Fonts `<link>` in each section** (preconnect ×2 +
   Cormorant Garamond + Inter, `&display=swap`). Verbatim precedent:
   `tok-landing.liquid:2-4` (+ tok-main-*). No hex → passes the hook. Shopify's
   `font_picker` has no Cormorant Garamond, so Google Fonts is correct.
3. **Accepted deviation from color-scheme hard rule** for these 3 sections only:
   palette tokenized as section-local CSS vars (spirit kept), not the theme
   `color_scheme`/RGB-triplet system (letter deviated). No pure black.
   **No `color` schema settings in v1** (hex defaults are hook-blocked); palette
   baked into the asset.

---
## C. PDP DATA WIRING — `sections/html-pdp.liquid` (shopify-dev-expert)
Buy box uses **native theme blocks**, placed statically for fixed-layout fidelity,
mirroring `sections/product-information.liquid:7-21` (`{% content_for 'block',
type:'…', id:'…', closest.product: closest.product %}`) and the block nesting in
`templates/product.custom.json`.
1. **Add to cart:** `buy-buttons` block (`blocks/buy-buttons.liquid:44`) =
   `<product-form-component>` + `{% form 'product' %}` + nested `quantity`,
   `add-to-cart`, `accelerated-checkout`. Real POST → `product-form.js:396`
   `fetch(cart_add_url)`. Components: `product-form-component`,
   `add-to-cart-component`.
2. **Variants (swatches + sizes):** `variant-picker` block
   (`snippets/variant-main-picker.liquid`) renders swatches when the option has
   `swatch` values + `show_swatches`, else radio buttons — **for free**. Component
   `variant-picker` (`variant-picker.js:504`).
3. **Media gallery (5 thumbs + main):** `_product-media-gallery` block
   (`snippets/product-media-gallery-content.liquid`) with
   `slideshow_controls_style:"thumbnails"`. Components `media-gallery`,
   `slideshow-component`, `zoom-dialog`. Do NOT hand-loop `product.media`.
4. **Price/compare:** `{% render 'price', product_resource: product %}`
   (`snippets/price.liquid:13-20,88-128`) or the `price` block. Sale/"Limited Drop"
   badge has no native block → custom pill markup using
   `selected_variant.compare_at_price > selected_variant.price` + DESIGN badge token.
5. **Accordion (Details/Fit/Shipping):** native `accordion` + `_accordion-row`
   (`<details>/<summary>` + `accordion-custom` component), rows as nested `text`
   blocks — per `blocks/_product-details.liquid:638-679`.
6. **Reviews:** no native source. **DECISION (operator-confirmed): editable static
   section blocks**, no reviews app, no metafield.
7. **Schema:** `enabled_on: {"templates":["product"]}`; declare accepted commerce
   block types via `@theme` or an allow-list (verified list
   `blocks/_product-details.liquid:71-131`).

---
## D. COLLECTION DATA WIRING — `sections/html-collection.liquid` (shopify-dev-expert)
Mirror `sections/main-collection.liquid:3-75`:
1. **Grid:** `{% paginate collection.products by products_per_page %}` →
   `{% for product in collection.products %}` → `{% content_for 'block',
   type:'_product-card', id:'product-card', closest.product: product %}` →
   `{% render 'product-grid', … %}`. Card contents = child blocks
   (`_product-card-gallery`, `product-title`, `price`, `swatches`) declared in the
   template JSON (`templates/collection.json:142-211`). Style via `.htmlp-collection`
   scoped CSS.
2. **Filters/sort (REAL):** `filters` block
   (`{% content_for 'block', type:'filters', id:'filters', results: collection,
   results_size: collection.products_count %}`) → `facets-form-component` + `sorting`.
   **Keep the `<results-list>` wrapper** (`results-list.js`) so AJAX faceting +
   infinite scroll work; without it filters still submit via full-page reload only.
3. **Pagination:** `products_per_page` section setting (default 24);
   `{% render 'pagination-controls' %}` when infinite scroll off.

---
## E. REAL LINKS — landing + collection editorial (design-merchant)
- **Category cards → per-block `collection` picker**; href = `block.settings.collection.url`.
  *Verification:* `tok-landing.liquid:384` `{"type":"collection","id":"featured_collection"}`.
- **Journal cards → one section-level `blog` picker + loop**
  `section.settings.journal_blog.articles limit: N` (title/url/image/excerpt). New
  posts flow in automatically. *Verification:* `sections/featured-blog-posts.liquid:84,25-38`.
  No single-`article` picker exists in Shopify. Keep a small manual `journal` block
  as curated fallback.
- **"The Drop" (landing) → `collection` picker** for the featured collection.
- **"Complete the Look" (PDP) → per-block `product` picker** (standard Shopify
  setting type) to pull real product image/title/price/url. (Low risk; `product`
  picker is standard — confirm exact usage during implement.)
- Images for real resources via `image_tag` (`… | image_url: width:N | image_tag:`).

---
## F. TEMPLATE MECHANICS (shopify-dev-expert)
- Template JSON = only the page's own section(s) + `order`. **Header/footer come
  from `sections/header-group.json` / `footer-group.json` automatically** — NOT in
  the template. *Verification:* `templates/product.custom.json`, `templates/collection.json`.
- `templates/product.html-pdp.json` → `{"sections":{"main":{"type":"html-pdp",…}},
  "order":["main"]}` (optionally a recommendations section). Collection analogous
  with `"type":"html-collection"`. Page: `templates/page.html-landing.json` →
  `{"sections":{"main":{"type":"html-landing",…}},"order":["main"]}`.
- Commerce blocks declared as `"static": true` in the template JSON where placement
  is fixed (precedent `collection.json:103-128`, `product.custom.json:16,44`).
- Template JSONs ARE committable (unlike `config/settings_data.json`).

---
## G. SECTION SCHEMAS (design-merchant) — settings + blocks, HTML copy as defaults
One section per page (editorial + commerce co-authored). Group settings with
`header`. Types used (all verified in-theme): `text`, `textarea`, `richtext`,
`inline_richtext`, `image_picker`, `url`, `collection`, `blog`, `range`, `select`,
`checkbox`, `product`. **No `color` settings (hook).**

**html-landing** blocks: `symbol`(≤6), `category`(≤6, w/ `collection`),
`metric`(≤4), `journal`(≤6 fallback). Top-level: topbar/nav, hero (+taglines
textarea, image pickers), the-drop (+`collection`), story, symbols head, categories
head, founder, social head, email (via `{% form 'customer' %}`), journal
(+`blog`,`range`), final CTA, footer. Preset mirrors `tok-landing`.

**html-pdp** editorial blocks: `meta`(≤3), `trust`(≤3), `accordion`(≤8, defaults),
`review`(≤6, static), `look`(≤3, `product` picker), `ugc`(≤3), `faq`(≤8). Top-level:
reviews score/count, brand-story band, final CTA, sticky-bar label. Commerce =
native blocks (section C).

**html-collection** editorial blocks: `category`(≤4, `collection`),
`journal`(≤3 fallback). Top-level: editorial hero (+3 image pickers), look panel,
categories head, journal (+`blog`,`range`), CTA band, `products_per_page` (range),
grid/filter toggles. Grid/filters = native (section D).

---
## H. ACCESSIBILITY / PERFORMANCE MUST-DOS (design-merchant)
1. Semantic tags (`nav/header/section/article/button/footer`); accordion/FAQ via
   real `<button aria-expanded>` or `accordion-custom`.
2. `@media (prefers-reduced-motion: no-preference)` guard on reveal-on-scroll AND
   the rotating tagline (pause rotator under reduce; show final state statically).
3. Email/newsletter input: visually-hidden `<label for>`, `autocomplete="email"`,
   `aria-*`, `aria-live` success region (fix tok-landing's placeholder-only input).
4. `image_tag` for all real images (auto srcset/width/height); decorative `alt=""`,
   meaningful real alt; above-fold hero eager + LCP, below-fold lazy.
5. Visible `:focus-visible` rings (never `outline:none` alone).
6. Contrast: `--muted #6f665d` on `--bg #f7f3ec` ≈4.6:1 (borderline — use `--ink`
   for small text). Gold `--accent` decorative only, never body text.
7. No render-blocking JS (`type="module"`/`defer`, ideally a tiny web component);
   no CSS `@import`.
8. `{%- -%}` trims, `{% render %}` only (never `{% include %}`).

---
## I. RESOLVED OPEN QUESTIONS (gate check — no blocking conflicts remain)
1. Color hook vs faithful palette → **shared `assets/html-pages.css`** (hook not
   bypassed, no human action needed). ACCEPTED.
2. No `color` schema overrides in v1. ACCEPTED.
3. New `assets/html-pages.css` (distinct name); tok-* left as-is. ACCEPTED.
4. **One section each** (editorial + commerce co-authored); font `<link>` +
   `stylesheet_tag` emitted once per section. ACCEPTED.
5. Reviews = static editable blocks, no app/metafield. OPERATOR-CONFIRMED.
6. "Complete the Look" uses `product` picker; verify exact usage at implement time.
   ACCEPTED (low risk).

**Data dependency (not a blocker):** native color swatches only render if the
store's products have Color option swatch values configured in admin; otherwise
color shows as text buttons. Size variants render as buttons if present. Preview
uses existing products (demo catalog) — section renders correctly with whatever
variant data exists. Flagged for visual QA.
