# /profile-theme — Generate THEME_PROFILE.md + DESIGN.md for a new shop

Onboard a new Shopify theme by scanning its codebase and design system, then
writing two docs every other command reads before touching code:

- `specs/THEME_PROFILE.md` — the **codebase fingerprint** (how THIS theme is built)
- `specs/DESIGN.md` — the **design system** (colors, type, spacing, components)

Run this once per shop (and re-run after a major theme change). The output is a
draft — skim it and fix anything the scan guessed wrong before relying on it.

## Before you start
- Confirm you're in the theme's repo root (you should see `sections/`,
  `snippets/`, `templates/`, `assets/`, `config/`, `locales/`).
- Use the **shopify-dev-mcp** to verify any Liquid filter / setting type / schema
  attribute you're unsure about. Never guess — `/profile-theme` documents what's
  *actually* there, so accuracy matters.

## Step 1 — Scan the codebase → `specs/THEME_PROFILE.md`

Inspect the theme and fill the template at
`modules/shopify-dev/templates/THEME_PROFILE.template.md`. Concretely:

1. **Identity** — read `config/settings_schema.json` (theme_info) for theme name +
   version; count `sections/`, `snippets/`, `templates/`, `locales/`. Note if it's
   Dawn-based or a third-party theme (Focal, Impulse, etc.) and any page-builder
   sections (GemPages/Shogun) that follow *different* patterns and must NOT be used
   as references.
2. **Liquid conventions** — sample 10–15 sections: whitespace control (`{%-` vs
   `{%`) ratio, `{% render %}` vs `{% include %}`, how sections scope CSS
   (`#shopify-section-{{ section.id }}` etc.), assign style.
3. **CSS conventions** — naming (BEM?), how colors are expressed (hex vs RGB
   triplets in CSS custom properties), breakpoints, utility classes.
4. **JS conventions** — Web Components / `is="…"` / custom elements? defer/module
   loading? lazy-loaded libs (Flickity, Swiper, PhotoSwipe)?
5. **Schema conventions** — most common setting types (`grep` `"type"` across
   sections), color-scheme usage (OS 2.0 `color_scheme` vs individual color
   settings), naming.
6. **Translation keys & store language** — structure/depth from
   `locales/*.default.json`. **Determine the store's primary language**: the locale
   whose file is named `*.default.json` is Shopify's default — record both the
   language and that filename (e.g. `pl` → Polish, `locales/pl.default.json`).
   Confirm by sampling the actual copy in that file and in real product/section text;
   if the filename and the copy language disagree, trust the copy and flag it. List
   every other published locale present in `locales/`. This primary language is what
   every later command writes generated copy in — getting it right here is what stops
   the agent shipping Dutch/English copy to a non-Dutch/English store.
7. **Snippet library** — which snippets exist and which sections use each.
8. **Reference sections** — pick the 2–3 cleanest, most representative sections;
   say *why* each is a good template to copy from.
9. **Performance patterns** — image loading (eager/lazy, fetchpriority, dimensions),
   render-blocking JS, `@import` usage, whitespace stripping.
10. **Gotchas** — anything a new contributor would trip on (RGB-triplet colors,
    a global `window.themeVariables`, page-builder sections, etc.).

## Step 2 — Extract the design system → `specs/DESIGN.md`

Fill `modules/shopify-dev/templates/DESIGN.template.md` from
`config/settings_data.json` (the live settings) + the CSS in `assets/`:

1. **Colors** — pull the palette from `settings_data.json` and the CSS custom
   properties they map to. Record both the human value (hex) AND the var
   (`--text-color`, `--primary-button-background`, …) and the format the theme uses
   (e.g. RGB triplets `R, G, B`). Note derived colors (border = mix of bg+text).
2. **Typography** — font families, base size + range, responsive heading scale,
   line-heights.
3. **Spacing** — section rhythm vars (`--vertical-breather`…), grid gaps, common
   pad values.
4. **Radius / borders / elevation** — button vs card radius vars, input borders,
   focus ring, shadow recipe (flag if shadows are neutral-tinted, never pure black).
5. **Buttons** — case, letter-spacing, height vars, variants, hover behavior.
6. **Components** — product card, badges, separators — padding/bg/radius.
7. **Motion** — durations/easings; confirm `prefers-reduced-motion` handling.

## Step 3 — Wire it up
- Save both files under `specs/`.
- Make sure the shop's `CLAUDE.md` (from `CLAUDE.shopify.md`) references them and
  that `interview`, `generate-spec`, `implement`, `review` read them (they do by
  default).
- Report a short summary: theme name/version, # sections, the reference sections
  you chose, and anything you were unsure about (so the human can confirm).
