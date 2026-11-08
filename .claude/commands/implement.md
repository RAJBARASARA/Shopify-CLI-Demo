# Implement Theme Feature from NLSpec

You are implementing a Shopify theme feature from a complete NLSpec. The spec
contains every decision — your job is to execute it exactly, not to make design choices.

**IMPORTANT — Shopify Dev MCP:** Before writing Liquid code, schema JSON, or
using any Shopify-specific features (filters, tags, setting types, section
schema options, JavaScript APIs), verify the correct syntax and approach against
the Shopify Dev MCP. This prevents implementation errors from outdated or
incorrect Shopify knowledge. Check the MCP especially for:
- Liquid filter syntax and available filters
- Section schema setting types and their properties
- Block schema options
- JavaScript Section Rendering API
- Image handling (image_url, srcset patterns)

## Input
- NLSpec: `specs/NLSPEC_$ARGUMENTS.md`
- If no NLSpec file found, tell the user:
  "No NLSpec found for '$ARGUMENTS'. Run `/interview $ARGUMENTS` first, then `/generate-spec $ARGUMENTS`."

## Process

### Step 0: Sync & Branch Setup

**0a. Sync with remote (if on `main`):**
Before branching, pull the latest main from GitHub. The live theme is connected
to `main` via Shopify's GitHub integration.
```bash
git pull origin main
```
Skip only if a feature branch already exists and is checked out.

**0b. Branch:**
1. Ensure a feature branch exists and is checked out: `feature/$ARGUMENTS`
   - If it doesn't exist: `git checkout -b feature/$ARGUMENTS`
   - If it exists: `git checkout feature/$ARGUMENTS`
2. Never implement directly on `main`.

### Step 1: Worktree Setup
All implementation MUST happen in an isolated Git worktree.

When spawning the implementation agent via the Task tool, use `isolation: "worktree"`.
Pass the `mode` parameter to control the agent's permission level:
- `mode: "plan"` — Supervised: agent presents plan before writing code
- `mode: "default"` — Guided: agent works normally, edits prompt for approval
- `mode: "bypassPermissions"` — Autonomous: agent works independently

If `/implement` is invoked directly (not via the orchestrator), default to `mode: "default"`.

If you are the implementation agent running inside a worktree, proceed directly to Step 2.

### Step 2: Read Context
1. Read CLAUDE.md for theme architecture, conventions, and **Design System Hard Rules**
2. Read `specs/THEME_PROFILE.md` — this defines the theme's exact Liquid style,
   CSS patterns, JS approach, and schema conventions. Match these precisely.
   **Note the "Primary language" field (Section 1).** This is the store's own
   language — every customer-facing string you write (default copy, schema labels,
   placeholders, translation values) MUST be authored in that language, NOT in your
   own default. Never assume English or Dutch; write in the store's language. If the
   profile has no primary language, infer it from the existing `locales/*.default.json`
   filename and the language of current product/section copy before writing any text.
3. **Read `specs/DESIGN_REF_$ARGUMENTS.md` if it exists.** This is the
   feature-specific Figma extract: token map, frame screenshots, exact copy
   text, layout values. **It overrides all other visual references for this
   feature.** When the NLSpec and DESIGN_REF disagree, follow DESIGN_REF and
   flag the discrepancy in your final report. View the screenshots in
   `specs/design_ref/$ARGUMENTS/` before writing CSS — do not implement visual
   layouts without seeing the source frame.
4. Read `specs/DESIGN.md` if it exists — this defines the theme-wide visual
   design system (colors, typography, spacing, borders, shadows, component
   patterns). Use it for anything DESIGN_REF doesn't cover.
   If the design doc and theme profile diverge, verify against the actual code
   and follow what the codebase does.
5. Read the NLSpec completely — all sections — before writing any code
6. Read the reference section files mentioned in NLSpec Section 8 AND
   the reference sections from the theme profile (Section 9)

### Step 2.5: Context Verification (REQUIRED)

Before writing ANY code, output this checklist with values filled in from
the context files you just read. This proves you read them and will apply them.

```text
## Context Verification

Theme: [name] by [author] v[version]
Store language: [primary language + locale file, e.g. Polish (locales/pl.default.json)] ← all copy I write will be in this language
Heading font: [font name] | Body font: [font name] | Base size: [X]px
Primary button bg: [CSS var] | Border radius: [CSS var] ([X]px)
Card bg: [CSS var] | Card radius: [CSS var] ([X]px)
Input border: [exact CSS value]
Section spacing: [CSS var] ([mobile]px / [desktop]px)
JS pattern: [Web Components / vanilla / other]
Liquid whitespace: [{% or {%-]
Section wrapper pattern: [blends_with_background / other]
Reference section: [name from NLSpec Section 8]
```

If you cannot fill in a value, STOP and read the missing file.
Do NOT proceed to Step 3 with any blanks.

### Step 3: Announce Plan
Before writing any code, state:
- New files to create (list with full paths)
- Existing files to modify (list — should be minimal)
- Which existing section you're using as your structural template
- Confirm you read the "do NOT" constraints in Section 9

### Step 4: Implement (in this exact order)

1. **Section Schema** — Write the `{% schema %}` block first. This is the data contract
   for the theme editor. Match NLSpec Section 3 exactly.

2. **Liquid Markup** — Write the HTML structure with Liquid logic.
   Match NLSpec Section 4 (Liquid Logic) step by step.
   - Assign settings to variables at the top
   - Render conditional content
   - Loop through blocks
   - Handle empty states

3. **CSS** — Write styles scoped to the section.
   Match NLSpec Section 5 (Styling).
   - Desktop-first or mobile-first as specified
   - All three breakpoints: desktop, tablet, mobile
   - Use theme CSS variables where specified

4. **JavaScript** (if needed) — Write JS behavior.
   Match NLSpec Section 6.
   - Progressive enhancement: works without JS first
   - Minimal footprint
   - No jQuery unless the theme already uses it

5. **Snippets** (if needed) — Create reusable partials.
   Match NLSpec Section 4.3.

6. **Translation Keys** — Add keys to the store's primary `locales/<lang>.default.json`
   (the file flagged in THEME_PROFILE Section 1, e.g. `locales/pl.default.json`), NOT
   `en.default.json` unless English is actually the store's primary language. The
   default string values MUST be written in the store's primary language. If the store
   has additional published locales, add the same keys to each `locales/<lang>.json`
   with that locale's translation. Match NLSpec Section 7.

7. **Template JSON** (if needed) — Add the section to the appropriate template.
   Match NLSpec Section 2.3.

### Step 4.5: Decisions Checkpoint (REQUIRED)

After all files are written but BEFORE staging from the worktree or creating a PR,
post a structured report to the user. This is the cooperative checkpoint required
by `feedback_cooperative_brief_workflow.md` — the agent reports decisions made,
the user (or PR reviewer) catches drift before it ships.

```text
## Implementation Decisions Report

### Followed from the NLSpec
- [decision topic] → [how implemented] → [verification reference from spec]
- ...

### Decisions I made on my own (not in the NLSpec)
- [topic] → [what I chose] → [why] → [proposed verification]
- ...

### Surprises / Deviations from the NLSpec
- [topic] → [spec said X, I did Y] → [reason] → [needs user confirmation?]
- ...

### Files changed
[git status output from inside the worktree]
```

The report MUST list at least one entry in each of the three categories — even if
the entry is "none" — so it's visible the agent actively considered each bucket.

Then:
- **Supervised / Guided mode** — wait for the user's "go" before proceeding to
  Step 5 (Commit). If the user requests changes, loop back to Step 4.
- **Autonomous mode** — proceed without waiting, BUT include the full report in
  the PR description as a "Decisions Report" section. The user reviews it in the PR.

### Step 5: Commit in Worktree
After implementation is complete, commit all changes inside the worktree:
- Stage only the files you created or modified
- Use a descriptive commit message referencing the feature name
- Do NOT push — the orchestrator will merge the worktree branch back

### Step 6: Hard Rules

**Spec compliance:**
- Follow the NLSpec EXACTLY — do not add settings, blocks, or styles not in the spec
- Do not deviate from file paths in the spec
- When the spec says "do NOT", treat it as a hard constraint
- If the spec is ambiguous on any point, STOP and ask — do not guess
- Use the reference section for structural patterns

**Codebase-first principle:**
- Match the patterns documented in `specs/THEME_PROFILE.md` — JS architecture,
  CSS strategy, Liquid conventions, schema patterns
- If the theme profile is silent on a pattern, follow CLAUDE.md defaults

**Protected files:**
- Do NOT modify `config/settings_data.json`

**Code quality:**
- Do NOT use inline styles — use CSS classes
- Do NOT use `{% include %}` — use `{% render %}`
- Do NOT use CSS `@import`
- Do NOT hardcode colors, spacing, or font sizes — use CSS custom properties
- Do NOT use `padding-left`/`margin-right` etc. — use CSS logical properties
  (`padding-inline`, `margin-block`, `inset`) for RTL support
- All user-facing text MUST use translation keys
- All copy you author (default translation values, schema labels, placeholders, alt
  text) MUST be in the store's primary language from THEME_PROFILE Section 1 — never
  default to English or Dutch. A wrong-language string on a live storefront is a
  correctness failure, not a polish issue.
- Schema labels, names, and presets MUST use `t:sections.*` translation keys
- New snippets MUST include `{% doc %}` blocks documenting parameters
- Snippet parameters MUST use `| default:` filter for safe fallbacks
- Use `{%- -%}` whitespace-stripping tags consistently
- CSS MUST use BEM naming (`block__element--modifier`)

**Accessibility, Performance, Images, JavaScript:**
Follow all hard rules from CLAUDE.md (Accessibility Rules, Performance Rules, Design System Hard Rules).
These are always in context — do not deviate from them.

### Step 7: Verify
1. Run `shopify theme check` — fix any errors
2. Check that section renders without JavaScript (if progressive enhancement specified)
3. Walk through NLSpec Section 11 (Acceptance Criteria) checkbox by checkbox

### Step 8: Report
For each acceptance criterion from Section 11, report:
- ✅ PASS — with brief evidence
- ❌ FAIL — with what went wrong
- ⚠️  MANUAL — cannot verify automatically (visual checks, browser testing)

List any spec ambiguities you encountered and how you resolved them.

Include the **worktree branch name** in your report so the orchestrator can merge it.

$ARGUMENTS
