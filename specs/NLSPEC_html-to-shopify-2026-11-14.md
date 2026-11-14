# NLSpec: html-to-shopify-2026-11-14
# Source: generate-spec (from BRIEF + INTERVIEW, 2026-11-14)
# Theme: Shopify Horizon v3.5.1 · Store: zenn-space.myshopify.com · Preview theme 158313152668

A different agent could implement this blind. Spec is law; any ambiguity STOPS work.

---
## 1. Overview
### 1.1 Context
Convert three standalone Threads-of-Kaos HTML mockups into three NEW, self-contained
Horizon page types, faithful to the HTML "light luxury" look (cream + gold +
Cormorant Garamond serif), wired to real store data for product/collection/blog,
fully theme-editor configurable. Header/footer come from Horizon default groups.

Source HTML (read-only inputs, in `/home/bt-01/agent-workspace/`):
`threads-of-kaos-light-luxury-landing-page.html`, `threads-of-kaos-premium-pdp.html`,
`threads-of-kaos-collection.html`.

### 1.2 Non-goals / hard prohibitions
- Do NOT create, edit, or overwrite: `tok-*` sections, `main-luxury-pdp.liquid`,
  `main-product.liquid`, `main-collection.liquid`, any `*.threads-of-kaos.json`,
  `config/settings_data.json`, `.env*`, `layout/theme.liquid`, `assets/base.css`,
  `assets/tok-theme.css`, `sections/header-group.json`, `sections/footer-group.json`.
  (Reading them as reference is allowed.)
- Do NOT port the HTML nav/topbar/footer as functional chrome — Horizon
  header-group/footer-group provide header & footer. (A decorative in-section topbar
  strip is allowed as section content, but the real site header/footer are the groups.)
- No hex in `sections/` or `snippets/` (commit hook). No `color` schema settings with
  hex defaults.
- Never commit to `main`; never merge/publish. Preview theme 158313152668 only.

---
## 2. Architecture
### 2.1 New files (create only)
| File | Purpose |
|------|---------|
| `assets/html-pages.css` | All faithful scoped CSS + palette tokens (hex lives ONLY here). |
| `sections/html-landing.liquid` | Landing page section (editorial + real collection/blog links). |
| `sections/html-pdp.liquid` | Product-template section (editorial bands + native buy box). |
| `sections/html-collection.liquid` | Collection-template section (editorial + native grid/filters). |
| `templates/page.html-landing.json` | Page template → `html-landing`. |
| `templates/product.html-pdp.json` | Product template → `html-pdp`. |
| `templates/collection.html-collection.json` | Collection template → `html-collection`. |

Optional: `snippets/html-fonts.liquid` (the 3 Google-Font `<link>`s) rendered by each
section to avoid duplication. Allowed because it contains NO hex.

### 2.2 CSS & scoping (binding)
- Single `assets/html-pages.css`, referenced in each section:
  `{{ 'html-pages.css' | asset_url | stylesheet_tag }}`.
- Tokens on `.htmlp`: `--bg:#f7f3ec; --panel:#fffdf9; --accent:#c9af7a;
  --accent-deep:#a28656; --ink:#171614; --muted:#6f665d; --line:rgba(23,22,20,.12);
  --radius:24px; --shadow:0 18px 50px rgba(23,22,20,.10)`. No pure black.
- Each section's outermost element: `<div class="htmlp htmlp-landing">` (resp.
  `htmlp-pdp`, `htmlp-collection`). EVERY rule in the asset is prefixed with one of
  these — zero unprefixed/global selectors.
- Port the HTML's responsive breakpoints (1180 / 820 / 560px) and the reveal/hover
  transitions, each motion rule wrapped in `@media (prefers-reduced-motion:
  no-preference)`.

### 2.3 Fonts
Emit per section (or via `snippets/html-fonts.liquid`): preconnect ×2 + 
`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap`.
Headings/display → Cormorant Garamond; body/eyebrows/buttons → Inter.

### 2.4 JS (interactivity)
- Reveal-on-scroll + rotating tagline: one small `defer`/`type="module"` script OR a
  tiny web component (`customElements.define`), guarded by `prefers-reduced-motion`
  (reduce → final state, rotator paused). No render-blocking JS.
- PDP buy box, variant selection, qty, add-to-cart, gallery, accordion: **native
  Horizon web components** (no custom JS needed — comes with the blocks).
- Collection filters/sort/infinite-scroll: native (keep `<results-list>` wrapper).

---
## 3. Section: html-landing
Template `page.html-landing.json`. Wrapper `.htmlp.htmlp-landing`. Schema
`enabled_on` omitted (page sections) or `{"templates":["page","index"]}` if needed.

### 3.1 Block-by-block mapping (HTML → Horizon)
1. **Topbar** → `topbar_text` (text). Decorative strip.
2. **Hero** → `hero_eyebrow` (text), `hero_title` (inline_richtext, serif H1 + sans
   sub-line), `hero_copy` (richtext), `hero_primary_label`+`hero_primary_link` (url),
   `hero_secondary_label`+`hero_secondary_link` (url), `hero_taglines` (textarea, one
   rotating line/row), collage images `hero_image_1..3` (image_picker) + each
   label/title/copy, `hero_float_title`/`hero_float_copy`. Placeholders when images
   empty (gradient panels from the HTML).
3. **The Drop** → `drop_kicker`, `drop_title`, `drop_copy` (richtext), `drop_side_*`,
   `featured_collection` (**collection**), slab/mini images (image_picker),
   `drop_button_label` + link (default → `featured_collection.url`).
4. **Brand story** → `story_kicker`, `story_title`, `story_copy` (richtext),
   `story_cta_label`+link, `story_art_mark` (text "TK"), `story_image` (image_picker).
5. **Symbols** → head (`symbols_kicker`,`symbols_title`,`symbols_copy`) + `symbol`
   blocks (≤6): {`glyph` text, `image` image_picker, `title` text, `copy` textarea}.
6. **Categories** → head + `category` blocks (≤6): {`image` image_picker, `title`
   text, `collection` (**collection**)}; href = collection.url.
7. **Founder** → `founder_kicker`,`founder_title`,`founder_quote` (richtext),
   `founder_body` (richtext), `founder_name`,`founder_role`, cta label+link,
   `founder_image` (image_picker).
8. **Social proof** → head + `metric` blocks (≤4): {`value` text, `label` text}.
9. **Email capture** → `email_kicker`,`email_title`,`email_copy` (richtext),
   `email_offer_chip` (text), `email_button_label`. Implement with
   `{% form 'customer' %}` (newsletter signup) + visually-hidden label +
   `autocomplete="email"` + `aria-live` success region.
10. **Journal** → head + `journal_blog` (**blog**) + `journal_limit` (range 1–6,
    default 3); loop `journal_blog.articles limit: journal_limit` → article
    url/title/image(`image_tag`)/excerpt. Fallback `journal` blocks (≤6):
    {`image`, `title`, `copy`, `link`}.
11. **Final CTA** → `final_title`, `final_copy` (richtext), cta label+link,
    `final_image` (image_picker).
12. Preset mirrors tok-landing (3 symbols, ~6 categories, 4 metrics, 3 journal).

---
## 4. Section: html-pdp
Template `product.html-pdp.json`. Wrapper `.htmlp.htmlp-pdp`. Schema `enabled_on:
{"templates":["product"]}`; `blocks` declares accepted commerce types via `@theme`
(or allow-list: `variant-picker, buy-buttons, price, product-title,
product-description, _product-media-gallery, accordion, _accordion-row, text,
group, _divider, icon, button`).

### 4.1 Real commerce (native, static placement) — mirror `sections/product-information.liquid`
- **Breadcrumbs** → plain Liquid from `collection`/`product` or static.
- **Gallery** → static `{% content_for 'block', type:'_product-media-gallery',
  id:'gallery', closest.product: product %}` (thumbnails style). Styled by
  `.htmlp-pdp` wrapper CSS to match the 5-thumb + main layout.
- **Title** → `{{ product.title }}` in custom serif markup (or `product-title` block).
- **Rating row** → static (reviews score/count settings, section 4.2).
- **Price/compare/badge** → `{% render 'price', product_resource: product %}`;
  custom "Limited Drop" pill when `product.selected_or_first_available_variant.
  compare_at_price > …price`.
- **Meta cards (Fabric/Fit/Feeling)** → `meta` blocks (≤3): {`title`, `copy`}.
- **Variant picker (color swatches + sizes)** → static `{% content_for 'block',
  type:'variant-picker', id:'variant-picker', closest.product: product %}`. Renders
  swatches/buttons from the product's real options. (Data dependency: color chips
  only if admin swatch values exist; else text buttons — acceptable.)
- **Purchase box (qty + Add to Bag + Buy Now)** → static `{% content_for 'block',
  type:'buy-buttons', id:'buy-buttons', closest.product: product %}` (brings
  quantity + add-to-cart + accelerated-checkout + real cart POST). "Save"/"Gift"
  sub-CTAs = optional static buttons (visual).
- **Trust row** → `trust` blocks (≤3): {`label`, `copy`}.
- **Accordion (Details/Fit/Shipping)** → native `accordion` + `_accordion-row`
  blocks with default copy from the HTML (declared in template JSON).

### 4.2 Editorial bands (section settings/blocks)
- **Reviews band** → `reviews_score` (text "4.9"), `reviews_count_label` (text
  "128 reviews") + `review` blocks (≤6, STATIC): {`author`, `rating` range 1–5,
  `body` textarea}. No app/metafield.
- **Brand-story band** → `pdp_story_title`, `pdp_story_copy` (richtext),
  `pdp_story_image` (image_picker).
- **Complete the Look** → `look` blocks (≤3): {`product` (**product** picker)} →
  real image(`image_tag`)/title/price/url; fallback {`image`,`title`,`copy`,`link`}.
- **UGC** → `ugc` blocks (≤3): {`image`, `handle`/`title`, `link`}.
- **FAQ** → `faq` blocks (≤8): {`question`, `answer` richtext}.
- **Final CTA** → `pdp_cta_title`, `pdp_cta_copy` (richtext), cta label (default
  anchors to buy box).
- **Sticky add-to-bag bar** → styling only; shows product title + price; its button
  scrolls to / submits the buy box (reuse native form or anchor). Hidden until the
  main buy box scrolls out (IntersectionObserver in the small guarded script).

---
## 5. Section: html-collection
Template `collection.html-collection.json`. Wrapper `.htmlp.htmlp-collection`.
Schema `enabled_on: {"templates":["collection"]}`.

### 5.1 Editorial (settings/blocks)
- **Hero** → `coll_eyebrow`, `coll_title` (inline_richtext), `coll_copy` (richtext),
  cta label+link, `coll_hero_image_1..3` (image_picker), `coll_meta_line` (text).
- **Editorial/look panels** → `look_title`, `look_copy` (richtext), `look_image`
  (image_picker), cta.
- **Category pivot** → head + `category` blocks (≤4): {`image`, `title`,
  `collection`}.
- **Journal** → `coll_journal_title` + `coll_journal_blog` (**blog**) +
  `coll_journal_limit` (range, default 3) loop; fallback `journal` blocks (≤3).
- **CTA band** → `coll_cta_title`, `coll_cta_copy` (richtext), cta.

### 5.2 Real grid + filters (native) — mirror `sections/main-collection.liquid`
- Keep the `<results-list>` wrapper + Section Rendering API flow.
- Toolbar: static `{% content_for 'block', type:'filters', id:'filters',
  results: collection, results_size: collection.products_count %}` (facets + sort).
- Grid: `{% paginate collection.products by products_per_page %}` →
  `{% for product in collection.products %}` →
  `{% content_for 'block', type:'_product-card', id:'product-card',
  closest.product: product %}` → `{% render 'product-grid', section:, children:,
  products:, paginate:, enable_infinite_scroll: %}`.
- `products_per_page` (range, default 24), `enable_infinite_scroll` (checkbox).
- Card look matched to HTML via `.htmlp-collection` scoped CSS over the native card.

---
## 6. Templates (JSON)
Each contains ONLY its main section + `order`; header/footer from groups.
- `page.html-landing.json`: `{"sections":{"main":{"type":"html-landing","settings":
  {…defaults…},"blocks":{…},"block_order":[…]}},"order":["main"]}`.
- `product.html-pdp.json`: main `html-pdp` with the static commerce blocks declared
  (`"static": true`) matching the section's `content_for` ids
  (gallery, variant-picker, buy-buttons incl. quantity/add-to-cart/accelerated,
  accordion+rows). Optionally a `product-recommendations` section after.
- `collection.html-collection.json`: main `html-collection` with static `filters` +
  `_product-card` (child blocks: `_product-card-gallery`, `product-title`, `price`).
- Match the exact block nesting precedent in `templates/product.custom.json` and
  `templates/collection.json`.

---
## 7. Accessibility & performance (must pass /review + /check-theme)
Per INTERVIEW §H: semantic tags; reduced-motion guard; labelled email input +
aria-live; `image_tag` for all real images (eager LCP hero, lazy below-fold);
`:focus-visible` rings; contrast (use `--ink` for small text); no `@import`; no
render-blocking JS; `{%- -%}` trims; `{% render %}` only. Theme check must report
0 errors / 0 warnings.

---
## 8. Acceptance criteria
1. The six new files exist; no prohibited file created/modified; `git status` shows
   only the new files (+ specs).
2. `shopify theme check` (or `/check-theme`) = **0 errors, 0 warnings** on the new
   files.
3. On preview theme 158313152668:
   - A page using `page.html-landing` renders all landing bands faithfully; category
     cards link to real collections; journal shows real blog articles; newsletter
     form submits.
   - A product using `product.html-pdp` shows the real gallery, real price,
     functional variant selection, and **Add to Cart adds the real variant to the
     cart**; accordion expands; sticky bar appears on scroll.
   - A collection using `collection.html-collection` shows the real product grid;
     **filters and sort actually filter/sort**; pagination/infinite scroll works.
4. Horizon default header + footer present on all three (from groups).
5. Faithful look at desktop + mobile (visual-QA vs the 3 HTML references converges or
   escalates with a divergence list).
6. Commit succeeds (no hook violation ⇒ confirms zero hex in sections/snippets).
7. Branch `feature/html-to-shopify-2026-11-14` pushed to preview theme; PR opened
   into `main` with the Decisions Report; NOT merged, NOT published.

---
## 9. Risks / data dependencies
- Color swatches depend on admin swatch values; demo catalog may show text buttons —
  acceptable, flag in QA.
- Demo products may have only a default variant (no sizes) — buy box still works;
  QA against whatever exists. `/productsetup` adds S/M/L/XL if the operator wants
  real sizes later (out of scope here).
- `product` picker usage for Complete-the-Look confirmed at implement time (Rule 0).
- `check-theme-sync.sh` hook may require `main` be synced before edits — run
  `git checkout main && git pull origin main` first (Phase 3.9).

---
## 10. Theme Editor Impact
- **Where sections appear:** `html-pdp` only on product templates
  (`enabled_on templates:["product"]`), `html-collection` only on collection
  templates, `html-landing` on pages. They will NOT clutter unrelated template
  pickers.
- **How to use:** merchant creates/edits a Page and selects the "html-landing"
  template; assigns "product.html-pdp" / "collection.html-collection" as the template
  on chosen products/collections (Online Store → Pages/Products/Collections →
  Theme template). Existing default templates are untouched, so nothing changes until
  a resource is explicitly switched to the new template.
- **Editable in the theme editor:** all headings, copy, CTAs, images, taglines,
  featured collection, category→collection links, journal blog, reviews, FAQ, meta,
  trust, Complete-the-Look products, products-per-page, filters/sort (native), and
  block add/remove/reorder within documented `max_blocks`.
- **Not editable via color pickers** (by design — palette baked into
  `assets/html-pages.css` to satisfy the commit hook). A future enhancement could add
  RGB-triplet-based overrides.
