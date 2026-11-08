# Generate NLSpec from Interview Answers — Shopify Theme

You are generating a complete NLSpec from interview answers and theme file analysis.
The NLSpec must be detailed enough that a DIFFERENT agent could implement the feature
without asking any clarifying questions.

**IMPORTANT — Shopify Dev MCP:** Before specifying Liquid filters, setting types,
schema options, or any Shopify API features in the spec, verify them against the
Shopify Dev MCP. The spec becomes the contract for implementation — if it references
a setting type that doesn't exist or a Liquid filter with wrong syntax, the
implementation will fail. Always confirm against current Shopify documentation.

## Input
- Interview answers: `specs/INTERVIEW_$ARGUMENTS.md`
- If no interview file exists, tell the user: "No interview found for '$ARGUMENTS'. Run `/interview $ARGUMENTS` first."

## Process

### Step 1: Read Interview Answers
Read the interview file to understand all decisions.

**Interview format detection:**
Read `specs/INTERVIEW_$ARGUMENTS.md` and check the header:

- **New format** — `# Source: agent-interview` line present. Verify:
  - No rows under "Conflicts Between Agents"
  - No rows under "Open Questions (declined by both)"
  - No decision with `block: true` left unresolved
  - A "Verification Plan" section exists
  If any of those checks fail, STOP and tell the user to resolve via
  `/agent-interview $ARGUMENTS` or by adding a `## User Resolutions` section.

- **Legacy format** — no `# Source:` header. Apply the original ambiguity gate:
  - An `## Ambiguity Resolutions` section (issues were found and resolved), OR
  - Crisp, specific answers throughout (no vague language, hedge words, or TBDs)
  If you find unresolved ambiguities, STOP and tell the user to complete the
  ambiguity check first (run `/interview $ARGUMENTS` again or fix inline).

Both formats are accepted by downstream steps. The format affects only this gate
and Step 4.6 (Agent Decisions propagation, new-format only).

### Step 2: Read CLAUDE.md, Theme Profile, Design System, Design Reference
1. Read CLAUDE.md for theme architecture, conventions, and glossary.
2. Read `specs/THEME_PROFILE.md` — this is the primary source of truth for this
   theme's patterns. It contains: Liquid conventions, CSS architecture, JS patterns,
   schema conventions, reference sections, and translation key structure.
   **Read the "Primary language" field (Section 1)** — every default copy string and
   translation value in this spec MUST be written in the store's primary language, not
   English or Dutch. If the profile doesn't record it, infer the language from the
   `locales/*.default.json` filename and existing product/section copy before writing.
   If the profile doesn't exist, warn the user and suggest running `/setup-my-theme-with-claude` first.
   You can still proceed by scanning the theme manually (Step 3), but the profile
   makes this faster and more accurate.
3. **Read `specs/DESIGN_REF_$ARGUMENTS.md` if it exists.** This is the
   feature-specific Figma extract — token map, frame screenshots, exact copy,
   layout values. **It is the source of truth for visual decisions.** If
   DESIGN_REF exists, every value in spec Section 5 (Styling) must trace back to
   either a DESIGN_REF entry or an explicit "no Figma value, using theme default"
   note. If DESIGN_REF was expected (Figma URL was reachable in Phase 0.5) but
   is missing or empty, STOP and tell the user — do not generate from theme
   defaults alone.
4. Read `specs/DESIGN.md` if it exists — this is the theme-wide visual design
   reference. Use it for any value DESIGN_REF doesn't cover.
   If the design doc and theme profile diverge, verify against the actual code
   and follow what the codebase does.

### Step 2.5: Context Verification (REQUIRED)

Before generating the spec, output this checklist with values filled in from the
context files you just read. This proves you read them and will generate a spec
that matches the real theme, not generic Shopify patterns.

```text
## Context Verification

Theme: [name] by [author] v[version]
Store language: [primary language + locale file, e.g. Polish (locales/pl.default.json)] ← all copy in this spec will be in this language
Heading font: [font name] | Body font: [font name] | Base size: [X]px
Primary button bg: [CSS var] | Border radius: [CSS var] ([X]px)
Card bg: [CSS var] | Card radius: [CSS var] ([X]px)
Input border: [exact CSS value]
Section spacing: [CSS var] ([mobile]px / [desktop]px)
JS pattern: [Web Components / vanilla / other]
Liquid whitespace: [{%- -%} dominant / other]
Section wrapper pattern: [blends_with_background / other]
```

If you cannot fill in a value, STOP and read the missing file.
Do NOT proceed to Step 3 with any blanks.

### Step 3: Scan Theme for Patterns (supplement the profile)
Read these files to fill in any gaps not covered by the profile, and to find the
most similar existing section to use as a reference:
- `sections/` — read the most similar section (use profile Section 9 for candidates)
- `snippets/` — check for reusable snippets (use profile Section 7)
- `templates/` — read relevant template JSON to understand section placement
- `config/settings_schema.json` — check for theme-wide settings that affect this feature
- `locales/en.default.json` — verify translation key patterns match profile Section 6

### Step 3.5: Existing Section Audit (REQUIRED if forking)

If the spec proposes to fork an existing section (e.g.
`main-product` → `main-product-bedding`), you MUST first audit the existing
section's capabilities. This prevents the "reinvented the variant picker" failure
documented in the `pdp-bedding-set` post-mortem.

For the existing section being forked:

1. Read the entire file (Liquid + schema)
2. Read every snippet it renders
3. List **every feature it already supports** as a numbered table:

```text
| # | Feature                      | Mechanism              | Reuse status |
|---|------------------------------|------------------------|--------------|
| 1 | Variant image dropdowns      | variant_image_options  | reuse        |
| 2 | Color swatches via metaobj   | product-connector      | reuse        |
| 3 | Quick-buy modal              | product-quick-buy      | drop         |
| 4 | PhotoSwipe lightbox          | product-media          | replace      |
| ... |                            |                        |              |
```

4. For each feature, decide: **reuse** (use as-is), **drop** (not needed),
   **replace** (custom implementation in the new section), or **extend** (build
   on top). Justify any "replace" decision in the spec — the default should be
   "reuse" wherever the existing behavior matches the requirements.

5. Save this table as Section 1.4 of the NLSpec ("Existing Feature Inventory")
   so the implementer reads it before writing custom code.

Skip this step only if the spec creates an entirely new section with no
existing analog.

### Step 4: Generate NLSpec

Produce a complete NLSpec following this structure:

---

# NLSpec: [Feature Name]
# Version: 1.0
# Date: [today]
# Source: specs/INTERVIEW_[name].md

## 1. Context
### 1.1 Problem Statement
[What the merchant/customer needs — from interview Round 1]

### 1.2 Prior Art
[YOU find this by scanning the theme — what existing sections/snippets relate?]

### 1.3 Scope
**IN scope:** [From interview]
**OUT of scope — do NOT implement:** [From interview. Be exhaustive.]

### 1.4 Existing Feature Inventory (REQUIRED if forking)
[If this spec forks an existing section, paste the audit table from Step 3.5
here. Each row labeled reuse / drop / replace / extend, with a one-line
justification for any replace decision.]

## 2. Architecture
### 2.1 New Files
[Full paths determined from theme conventions]
```text
sections/[feature-name].liquid
snippets/[feature-name]-item.liquid   (if needed)
assets/[feature-name].css             (if separate CSS needed)
assets/[feature-name].js              (if JavaScript needed)
```

### 2.2 Modified Files
[Full paths + exact changes — typically just template JSON to add the section]

### 2.3 Template Registration
[If the section needs to be added to a template JSON file, show the exact JSON change]

## 3. Section Schema
### 3.1 Settings
[Complete JSON schema for section settings. For EACH setting:]
```json
{
  "type": "[text|textarea|image_picker|color|range|select|checkbox|url|richtext|html|number]",
  "id": "[setting_id]",
  "label": "[Display label]",
  "default": "[default value]",
  "info": "[helper text if needed]"
}
```

### 3.2 Blocks (if applicable)
[Complete block type definitions with their settings]

### 3.3 Presets
[Section presets for the theme editor — name and default block configuration]

## 4. Liquid Logic
### 4.1 Data Sources
[What Shopify objects are used: product, collection, section.settings, block.settings, etc.]

### 4.2 Rendering Logic
[Step-by-step description of the Liquid template logic:]
1. Assign settings to local variables
2. Conditional display logic (what shows/hides based on settings)
3. Loop logic (for blocks, products, etc.)
4. Empty state handling (what shows when there's no content)

### 4.3 Snippet Usage
[If snippets are used, define each one's interface:]
- Snippet name
- Parameters passed via `{% render 'name', param: value %}`
- What it renders

## 5. Styling

### 5.1 CSS Structure
[Layout approach: CSS Grid, Flexbox, etc.]

### 5.2 Responsive Behavior
[Exact breakpoint behavior:]
- Desktop (>= 990px): [layout description]
- Tablet (750px - 989px): [layout description]
- Mobile (< 750px): [layout description]

### 5.3 Per-Element Visual Specs (REQUIRED if visual feature)

For EACH visible element/component in the feature, specify the values below.
Every value must trace back to one of:
- A `specs/DESIGN_REF_$ARGUMENTS.md` entry (cite the frame/node ID)
- A theme CSS variable (cite the variable name)
- An explicit "no Figma value, using theme default X because Y" note

If you cannot fill in a value because Figma was not extracted, STOP. Do not
guess. Tell the user to run Phase 0.5 (Design Ingestion) first.

```text
#### [Element name] — DESIGN_REF frame [name / node-id]

Container:
  - Width:           [value or token]
  - Padding:         [inline / block, value or token]
  - Background:      [token, e.g. rgb(var(--secondary-background))]
  - Border:          [width, color token, radius token]
  - Border radius:   [token, e.g. var(--block-border-radius)]

Layout (if container holds children):
  - Display:         [grid / flex]
  - Direction:       [row / column]
  - Gap:             [value or token]
  - Alignment:       [main-axis, cross-axis]

Typography (if text element):
  - Font family:     [token, e.g. var(--text-font-family)]
  - Size:            [token or px, e.g. var(--base-font-size) or 14px]
  - Weight:          [normal / bold / token]
  - Line height:     [value]
  - Letter spacing:  [value]
  - Text transform:  [none / uppercase]
  - Color:           [token]

Dimensions (if media/icon):
  - Width × Height:  [px or aspect-ratio]
  - Object fit:      [cover / contain]

Copy text (verbatim from DESIGN_REF — no inventing):
  - "[exact string]"
```

Repeat for every distinct element. The bar is: a different agent reading this
section should produce CSS that matches the Figma without making any visual
decisions.

### 5.4 Theme & Design System Integration

[How it uses existing theme CSS variables, fonts, and colors. Cross-reference
DESIGN_REF token map (if exists) and DESIGN.md.]
- Colors from: design system palette / theme settings / custom section settings
- Fonts from: design system typography / theme typography settings
- Spacing: design system spacing scale / theme spacing scale
- Elevation: design system tonal layering / theme shadow patterns
- Component styling: design system component rules (buttons, cards, inputs)
- New tokens needed: [list any from DESIGN_REF Section 3, or "none"]

## 6. JavaScript (if needed)
### 6.1 Behavior
[What the JS does — interactions, animations, dynamic behavior]

### 6.2 Implementation
[Approach: match the theme profile's JS pattern (Web Components, vanilla, etc.).
Fall back to Web Components if the theme has no established pattern.]

### 6.3 Progressive Enhancement
[What works without JS. What requires JS.]

### 6.4 Loading Strategy
[How JS is loaded: `defer`, `type="module"`, or inline. Must not be render-blocking.]

## 7. Translations
### 7.1 Translation Keys
[Target locale file: the store's primary `locales/<lang>.default.json` from
THEME_PROFILE Section 1 (e.g. `locales/pl.default.json`) — NOT `en.default.json`
unless English is the store's primary language. All default string values below MUST
be written in the store's primary language. List additional published locales that
also need these keys.]
```json
{
  "sections": {
    "[feature_name]": {
      "heading": "[Default heading text — in the store's primary language]",
      "button": "[Button text — in the store's primary language]"
    }
  }
}
```

## 8. Reference Patterns
### 8.1 Reference Section
[YOU pick the most similar existing section from the theme]

### 8.2 What to Replicate
[Specific patterns with file references]

### 8.3 What NOT to Replicate
[Patterns from the reference that don't apply]

## 9. Constraints
### 9.1 Forbidden Approaches
- Do NOT use inline styles (use CSS classes)
- Do NOT use jQuery (unless theme already uses jQuery)
- Do NOT modify settings_data.json
- Do NOT use deprecated `{% include %}` — use `{% render %}`
- Do NOT use CSS `@import`
- Do NOT use `all_products['handle']`
- [Feature-specific constraints from interview]

### 9.2 Performance & Core Web Vitals
**Fold position:** [above-the-fold / below-the-fold / configurable]

**If above the fold:**
- LCP candidate image: `loading="eager"`, `fetchpriority="high"`
- Add `<link rel="preload">` for the primary image asset
- No lazy-loading on any image in this section

**If below the fold:**
- All images: `loading="lazy"`

All other performance, accessibility, and code quality rules: follow CLAUDE.md
(Performance Rules, Accessibility Rules, Conventions). These are always in context.

### 9.3 Accessibility
Apply all rules from CLAUDE.md "Accessibility Rules (Hard Requirements)".
Add feature-specific accessibility notes here (e.g., carousel keyboard behavior).

### 9.4 Code Quality
Apply all rules from CLAUDE.md "Conventions" section.
Add feature-specific constraints here.

## 10. Theme Editor Impact
[How this section appears and behaves in the Shopify theme editor:]
- Where it can be added (homepage, product page, all pages, etc.)
- Live preview behavior
- Settings organization and grouping

## 11. Acceptance Criteria
### 11.1 Visual
- [ ] Matches described layout on desktop
- [ ] Responsive: correct layout on tablet and mobile
- [ ] Uses theme colors and fonts correctly
- [ ] Empty states handled (no broken layout when content is missing)

### 11.2 Theme Editor
- [ ] All settings appear in the theme editor
- [ ] Settings have clear labels and defaults
- [ ] Blocks can be added/removed/reordered (if applicable)
- [ ] Live preview updates when settings change

### 11.3 Technical
- [ ] `shopify theme check` passes with no errors
- [ ] No console errors in browser
- [ ] Works without JavaScript (if progressive enhancement specified)
- [ ] Translations used for all user-facing text
- [ ] Images use `image_tag` filter with proper `width`, `height`, and `alt`
- [ ] Accessible (keyboard navigation, screen reader friendly)

### 11.4 Performance (Core Web Vitals)
- [ ] Above-fold images use `loading="eager"` and `fetchpriority="high"`
- [ ] Below-fold images use `loading="lazy"`
- [ ] All images have explicit `width` and `height` attributes (CLS)
- [ ] No render-blocking JavaScript
- [ ] CSS is scoped — no global style leaks
- [ ] Whitespace-stripped Liquid tags (`{%- -%}`) used throughout

### 11.5 Browser/Device
- [ ] Chrome, Safari, Firefox (latest)
- [ ] iOS Safari, Android Chrome
- [ ] [Additional requirements from interview]

---

## Quality Rules (self-check before saving)

- Every section setting has an explicit type, id, label, and default
- CSS is scoped to the section (no global style leaks)
- All user-facing strings use translation keys
- **Every default copy string is written in the store's primary language**
  (THEME_PROFILE Section 1), and Section 7 targets that locale's `default.json` —
  not English/Dutch by reflex
- Empty state / missing content is handled in Liquid
- The spec references real files verified against the theme (not guessed paths)
- Responsive behavior is explicit for all three breakpoints
- **Section 9.2 (Performance) specifies fold position and image loading strategy**
- **Section 10 (Theme Editor Impact) is present**
- **Section 11.4 (Performance acceptance criteria) is present**
- **Section 5.3 (Per-Element Visual Specs) is present and every value traces
  back to DESIGN_REF, a theme token, or an explicit note**

### Step 4.5: Spec Sanity-Check Pass (REQUIRED)

Before saving, lint the spec for the failure modes documented in
`specs/LESSONS_LEARNED.md` (PDP Bedding Set entry). Scan for:

1. **Arithmetic on Liquid `money` values.** Any `divided_by`, `times`, `plus`,
   `minus` involving a price? Verify against Shopify docs:
   - `money` filter operates on the raw price (already in storefront
     currency's smallest unit, e.g. cents). The `divided_by` filter divides
     the *raw* number, not the formatted output.
   - Common bug: dividing by `1200` for "12 installments × 100 cents". This
     is wrong — divide by `12`.
   - Common bug: dividing by `36500` for "365 days × 100 cents". This is
     wrong — divide by `365`.
   - If you find any, fix them in the spec before saving.

2. **Hardcoded user-facing strings in spec text.** If a spec example shows
   `<span>Some Product Name</span>` or any other hardcoded user-visible string,
   that string must be a translation key (`{{ 'sections.foo.bar' | t }}`). Flag and fix.

3. **Self-contradicting metafield architecture.** If Section 4 introduces
   a metafield as one type, then later in the same section says "actually we
   need a different type" — pick one and remove the other. Self-contradiction
   means the implementer has to guess.

4. **Reference to forbidden APIs.** Scan for `all_products[`, `{% include %}`,
   `@import`, `padding-left`, `margin-right`, hardcoded hex colors in CSS
   examples. These are forbidden by CLAUDE.md. Fix them in the spec.

5. **Metafield output without `metafield_tag` filter.** A `rich_text_field`
   or `metaobject_reference` rendered as `{{ ... }}` will print raw JSON or
   IDs. The correct pattern is `{{ field | metafield_tag }}` for
   user-visible rendering. Flag and fix.

6. **Liquid range schema with default not divisible by step.** A `range`
   setting with `min: 400, max: 900, step: 10, default: 552` is invalid
   (552 is not on the step grid). Round defaults to the nearest step value.

If any of these are found, fix them in the spec text before saving. The
implementer follows the spec literally — bugs in the spec become bugs in code.

### Step 4.6: Propagate Agent Decisions (new-format interviews only)

If the interview was generated by `agent-interview` (header `# Source: agent-interview`),
append a `## Agent Decisions` section to the NLSpec before saving. This makes the
sub-agent decisions visible to the user during Phase 3 review and to `/visual-qa`
during verification.

Structure:

```markdown
## Agent Decisions

### High Confidence (auto-resolved)
| # | Topic | Decision | Source | Verification |
|---|-------|----------|--------|--------------|

### Medium Confidence (auto-resolved; user glance)
<same columns>

### Low Confidence (user reviews in Phase 3)
<same columns — flagged for user attention>

### User Resolutions
<if conflicts/blocks were resolved manually before reaching this step>

### Verification Plan (consumed by /visual-qa)
Copy the YAML Verification Plan block verbatim from `specs/INTERVIEW_$ARGUMENTS.md`.
```

Every decision in this section was already verified by `/agent-interview` per the
no-guessing + Playwright-verifiable rules in `feedback_decisions_must_be_verifiable.md`.
Do NOT re-verify here — just propagate the tables and the Verification Plan.

If the interview is **legacy format** (no `# Source:` header), skip this step
entirely — there are no agent decisions to propagate.

### Step 5: Save and Report

Save output to: `specs/NLSPEC_$ARGUMENTS.md`

Report to user:
- Spec location and line count
- Number of new files to create
- Number of section settings defined
- Number of block types (if any)
- Any gaps where interview answers were ambiguous
- Next step: "Review the spec, then run `/implement $ARGUMENTS`"

$ARGUMENTS
