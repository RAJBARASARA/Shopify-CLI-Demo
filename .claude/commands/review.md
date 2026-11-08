# Review Theme Implementation Against NLSpec

You are reviewing a Shopify theme feature implementation for compliance with its
NLSpec and theme best practices.

**IMPORTANT — Shopify Dev MCP:** When reviewing Liquid code, schema definitions,
and Shopify-specific patterns, verify correctness against the Shopify Dev MCP.
Flag any usage of deprecated filters, incorrect setting types, or outdated
patterns. The MCP has current Shopify documentation — use it to catch issues
that a generic code review would miss.

## Input
- Feature name: $ARGUMENTS
- NLSpec: `specs/NLSPEC_$ARGUMENTS.md` (if exists)
- Theme profile: `specs/THEME_PROFILE.md` (if exists — use to verify code matches theme conventions)
- Design system: `specs/DESIGN.md` (if exists — use to verify visual styling matches design intent)
- If no NLSpec exists, review against CLAUDE.md rules, theme profile, and design system only, and note the gap

## Review Checklist

### 1. NLSpec Compliance (if NLSpec exists)

**Section Schema (Section 3):**
- [ ] All settings from spec are present (no missing)
- [ ] No extra settings added beyond spec
- [ ] Setting types match spec exactly (text, image_picker, color, range, etc.)
- [ ] Default values match spec
- [ ] Block types match spec (if applicable)
- [ ] Presets match spec

**Liquid Logic (Section 4):**
- [ ] Data sources match spec (correct Shopify objects used)
- [ ] Rendering logic matches spec step-by-step
- [ ] Empty states handled as specified
- [ ] Snippets match spec interface (parameters, output)

**Styling (Section 5):**
- [ ] Layout approach matches spec (Grid, Flexbox, etc.)
- [ ] Responsive breakpoints implemented as specified
- [ ] Theme integration: uses correct CSS variables, fonts, colors

**JavaScript (Section 6, if applicable):**
- [ ] Behavior matches spec
- [ ] Progressive enhancement: works without JS (if specified)
- [ ] Implementation approach matches spec

**Translations (Section 7):**
- [ ] All translation keys from spec exist in locales file
- [ ] All user-facing strings use translation keys (no hardcoded text)
- [ ] Keys were added to the store's primary `locales/<lang>.default.json`
      (THEME_PROFILE Section 1), not `en.default.json` by reflex
- [ ] **All copy is in the store's primary language** — read the actual default
      string values and confirm the language matches the store (e.g. Polish copy on
      a Polish store, never Dutch/English by default). A wrong-language string is a FAIL.

**Constraints (Section 9):**
- [ ] No forbidden approaches used
- [ ] Performance requirements met
- [ ] Accessibility requirements met

### 2. Theme Profile Compliance (if specs/THEME_PROFILE.md exists)

- [ ] Liquid whitespace control matches theme convention (profile Section 2)
- [ ] Variable assignment style matches theme convention (profile Section 2)
- [ ] CSS architecture matches theme pattern (profile Section 3)
- [ ] CSS naming convention matches theme pattern (profile Section 3)
- [ ] CSS custom properties used correctly (profile Section 3)
- [ ] JavaScript pattern matches theme convention (profile Section 4)
- [ ] Schema setting ID naming matches theme convention (profile Section 5)
- [ ] Translation key structure matches theme pattern (profile Section 6)
- [ ] Existing snippets reused where applicable (profile Section 7)

### 3. Design System Compliance (if specs/DESIGN.md exists)

- [ ] Colors use CSS custom properties (`--primary-button-background`, `--text-color`, etc.) — no hardcoded hex values
- [ ] Buttons follow theme pattern: uppercase, letter-spacing, `--button-border-radius` (4px), gradient hover
- [ ] Typography uses `--heading-font-family` / `--text-font-family` and responsive `--heading-*-font-size` variables
- [ ] Spacing uses `--vertical-breather` for section spacing, theme spacing values (6/12/18/24px) for component gaps
- [ ] Border radius uses `--block-border-radius` (8px) for cards/images, `--button-border-radius` (4px) for inputs/buttons
- [ ] Borders on inputs use `rgba(var(--text-color), .15)`, structural borders use `rgb(var(--border-color))`
- [ ] Shadows are minimal and use `rgba(var(--text-color), opacity)` — not pure black, not brand-tinted
- [ ] Product cards use `--secondary-background` with `--block-border-radius` and 12px padding
- [ ] Focus states use inset box-shadow ring: `0 0 0 1px rgb(var(--text-color)) inset`
- [ ] Section backgrounds use the `blends_with_background` / `section__color-wrapper` pattern

### 4. Theme Best Practices (always check)

Verify the implementation follows ALL hard rules from CLAUDE.md. Check each
category — flag any violation as FAIL:

- [ ] **Accessibility** — all rules from CLAUDE.md "Accessibility Rules" section
- [ ] **Performance / CWV** — all rules from CLAUDE.md "Performance Rules" section
- [ ] **Design System** — all rules from CLAUDE.md "Design System Hard Rules" section
- [ ] **Conventions** — all rules from CLAUDE.md "Conventions" section
- [ ] **Responsive** — works on mobile (<750px), tablet (750-989px), desktop (>=990px), no horizontal scroll
- [ ] **Theme Editor** — section appears correctly, settings have labels/defaults, blocks reorderable

### 5. No Side Effects
- [ ] No existing sections modified (unless spec says to)
- [ ] `config/settings_data.json` NOT modified
- [ ] No new external dependencies added
- [ ] No global CSS that could affect other sections

### 6. Theme Check Verification
Run and report results:
```bash
shopify theme check
```

## Output

Report each item as:
- ✅ PASS
- ❌ FAIL — [specific issue]
- ⚠️  SKIPPED — [reason]

**Summary:** X passed, Y failed, Z skipped.

If NLSpec exists: "Spec compliance: X/Y items match spec exactly."

**Verdict:**
- ✅ READY — implementation matches spec and passes all checks
- 🔧 NEEDS FIXES — list the specific changes needed
- 🚫 REDO — fundamental issues require reimplementation

$ARGUMENTS
