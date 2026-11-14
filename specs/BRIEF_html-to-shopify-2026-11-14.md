# Brief: html-to-shopify-2026-11-14
# Source: cooperative-brief
# Mode: full
# Date: 2026-11-14

## 1. Goal
Convert three standalone HTML mockups (Threads of Kaos — landing, PDP, collection)
into three NEW, self-contained Shopify **Horizon** page types, faithful to the
HTML's "light luxury" design, wired to real store data where product/collection/blog
data belongs, and fully theme-editor configurable.

## 2. Context
- Theme: Shopify Horizon v3.5.1 (block-based OS 2.0). See `specs/THEME_PROFILE.md`,
  `specs/DESIGN.md`.
- Store: zenn-space.myshopify.com. Preview theme `158313152668` only.
- The HTML design is a warm cream + gold + Cormorant-Garamond-serif aesthetic that
  intentionally differs from the current theme's monochrome/Inter system.

## 3. Sources
- `~/agent-workspace/threads-of-kaos-light-luxury-landing-page.html`
- `~/agent-workspace/threads-of-kaos-premium-pdp.html`
- `~/agent-workspace/threads-of-kaos-collection.html`

## 4. Constraints (operator-set, binding)
- **New files only.** Create:
  - `sections/html-landing.liquid` + `templates/page.html-landing.json`
  - `sections/html-pdp.liquid` + `templates/product.html-pdp.json`
  - `sections/html-collection.liquid` + `templates/collection.html-collection.json`
- **Never touch / overwrite:** `tok-*` sections, `main-luxury-pdp.liquid`, any
  `*.threads-of-kaos.json` templates, `main-product.liquid`, `main-collection.liquid`,
  `config/settings_data.json`, `.env*`, `layout/theme.liquid`, `assets/base.css`.
- **Header/footer:** use Horizon default `header-group` / `footer-group`. Do NOT port
  the HTML nav/footer.
- **No images in source:** use theme image-picker settings + placeholders; real
  products/collections/blog where that data belongs.
- Branch `feature/html-to-shopify-2026-11-14` → preview theme `158313152668` only →
  open PR. **Never merge, never publish.**
- Record `date` at start + end of every phase; finish with a report.

## 5. Decisions (from cooperative brief, operator approved 2026-11-14)
1. **1a — Faithful.** Reproduce the cream/gold/serif look exactly, as section-scoped
   CSS. Accepted deviation from the theme color_scheme hard-rule for these 3 sections
   (palette still tokenized as section-local CSS vars; no pure black — HTML ink is
   `#171614`).
2. **Real data (yes):**
   - PDP buy box wired to the real product (variants→swatches/sizes, price, media
     gallery, working Add to Cart) via native Horizon components.
   - Collection renders the real product grid (dynamic loop) + real filters/sort.
   - Landing: category cards → real collections; "The Drop" → a featured collection;
     journal → real blog articles. Other editorial blocks stay static w/ image pickers.
3. **Native Horizon components** for buy box, variant picker, quantity, add-to-cart,
   accordion, cart, collection facets/sorting (real functionality, not visual-only JS).
4. **Editor-configurable:** expose settings + repeatable blocks with HTML copy as
   defaults.
5. **Preview** against existing store products/collections (demo catalog); no specific
   handle required.
6. **Cormorant Garamond via Google Fonts** approved.

## 6. Definition of Done
- Three new sections + three new templates, theme-check clean (0 errors/0 warnings).
- PDP add-to-cart, variant selection, and collection grid/filters/sort work against
  real data on the preview theme.
- Visual QA vs the HTML references converges (or escalates with divergence list).
- Faithful look at desktop + mobile; a11y (semantic tags, focus, reduced-motion,
  labelled inputs) and perf (image_tag, lazy below-fold, no render-blocking JS) honored.
- Branch pushed to preview theme; PR opened into `main` carrying the Decisions Report;
  never merged/published.

## 7. Open questions → resolved in agent-interview
- Exact native components for PDP buy box + collection facets (Shopify-dev agent).
- Section-scoped CSS + font-loading pattern without touching theme.liquid/base.css,
  and per-section schema design (design-merchant agent).
