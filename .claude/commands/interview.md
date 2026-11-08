# NLSpec Interview — Gather Requirements for a Theme Feature

> **NOTE — Legacy command.** The cooperative-brief workflow (`/brief` + `/agent-interview`) is the preferred path as of 2026-05-22. This long-form interview is kept as a fallback for cases where the user wants the old 6-round Q&A. The `/start-building` orchestrator no longer calls `/interview` by default. See `specs/NLSPEC_cooperative-brief-workflow.md` for the new flow.

You are conducting a structured interview to gather all the decisions needed to
write a complete NLSpec for a Shopify theme feature. The user provides their
vision. You provide technical knowledge about Shopify themes.

**IMPORTANT — Shopify Dev MCP:** Before asking technical questions about what's
possible in Shopify (setting types, section capabilities, Liquid features, API
options), check the Shopify Dev MCP for current documentation. This ensures your
questions and suggestions reflect what Shopify actually supports today — not
outdated assumptions.

## Your Role
- Ask only questions the user must answer (what they want, how it should look, what merchants can customize)
- Do NOT ask questions you can answer by reading the theme files (existing patterns, section structures, available settings types)
- **If `specs/DESIGN_REF_$ARGUMENTS.md` exists, read it FIRST** — it contains the
  Figma-extracted design reference for this specific feature: token map, frame
  screenshots, exact text content, layout specs. It overrides `specs/DESIGN.md`
  for visual questions. Do not ask about visual details the DESIGN_REF already
  answers — instead, surface the open questions it lists.
- If `specs/DESIGN.md` exists, read it for the theme-wide design system. Use it
  to pre-answer styling questions when DESIGN_REF doesn't cover them.
- After the interview, YOU fill in all technical details by reading the actual theme files
- When suggesting options to the user (setting types, layout approaches, etc.), verify them against the MCP first

## Interview Process

### Before Starting
1. Read CLAUDE.md for theme architecture and conventions
2. Read `specs/THEME_PROFILE.md` if it exists — this tells you the theme's exact
   patterns, reference sections, and conventions. Use it to ask smarter questions
   and skip questions you can already answer from the profile.
   If the profile doesn't exist, suggest running `/setup-my-theme-with-claude` first.
3. **Read `specs/DESIGN_REF_$ARGUMENTS.md` if it exists.** This is the
   feature-specific Figma extract: token map, frame screenshots, verbatim text
   content, open questions. It is the visual source of truth for this feature.
4. Read `specs/DESIGN.md` for the theme-wide design system.
5. Read the feature description provided in $ARGUMENTS
6. Scan the theme for related existing sections and snippets to understand context

### Round 1 — What & Where
Ask these (adapt to the feature):
- What page should this appear on? (homepage, product page, collection page, cart, etc.)
- Is this a new section or a modification to an existing section?
- What problem does this solve for your customers?
- What's IN scope for this version?
- What's explicitly OUT of scope?

Wait for answers before continuing.

### Round 2 — Visual & UX
- Describe what it should look like (layout, content, style)
- How should it behave on mobile vs desktop?
- Any animations or hover effects?
- Should colors come from the theme settings or be custom to this section?
- Do you have a reference/inspiration (URL, screenshot, another store)?

Wait for answers before continuing.

### Round 3 — Merchant Controls (Theme Editor)
- What should the merchant be able to customize in the theme editor?
- For each customizable element, what type of control?
  (text field, image picker, color picker, range slider, dropdown, checkbox, etc.)
- Should the section support repeatable blocks? (e.g., slides, testimonials, features)
- If yes — what's the minimum and maximum number of blocks?
- Any default values for settings?

Wait for answers before continuing.

### Round 4 — Content & Data
- Does this use product data, collection data, or page content?
- Does this need metafields? If so, which ones?
- Is the content static (entered by merchant) or dynamic (from Shopify data)?
- Does this need to pull from a specific collection or product list?

Wait for answers before continuing.

### Round 5 — Performance & Fold Position
- Will this section appear above the fold (visible without scrolling) on any page?
  If yes: which pages? (This determines image loading strategy — above-the-fold
  images need eager loading and preload hints to protect LCP scores.)
- Does this section contain a large hero image or banner that could be the
  Largest Contentful Paint (LCP) element?
- Does this need JavaScript? What behavior? (carousel, tabs, accordion, etc.)
- Any external libraries needed? (swiper, etc.)
- Does this need to work without JavaScript (progressive enhancement)?
- Should text be translatable (multi-language store)?
- Any performance concerns? (large images, many products, heavy animations, etc.)

Wait for answers before continuing.

### Round 6 — Verification
- How do you test this looks right? What should you see on the page?
- What devices/browsers must it work on?
- Anything that would be really bad if it broke?

## Output

Save `specs/INTERVIEW_$ARGUMENTS.md` with this structure:

```text
# Interview: [Feature Name]
# Date: [today]

## Round 1 — What & Where
Q: [question]
A: [user's answer]

## Round 2 — Visual & UX
...

## Round 3 — Merchant Controls
...

## Round 4 — Content & Data
...

## Round 5 — Performance & Fold Position
...

## Round 6 — Verification
...

## Ambiguity Resolutions
[if any were found and resolved]
```

## After Interview is Complete

1. Save the user's answers to `specs/INTERVIEW_$ARGUMENTS.md`
2. Proceed immediately to the **Ambiguity Check** below.

---

## Ambiguity Check (MANDATORY)

After all interview rounds are complete and answers are saved, perform a thorough
ambiguity analysis BEFORE telling the user the interview is done.

### What to scan for

Re-read every answer in `specs/INTERVIEW_$ARGUMENTS.md` and flag ANY of these:

1. **Vague quantifiers** — "some", "a few", "many", "various", "etc."
   These MUST become exact numbers or exhaustive lists.
2. **Hedge words** — "maybe", "probably", "I think", "not sure", "TBD"
   These MUST become firm decisions.
3. **Missing specifics** — "make it look good" without describing layout, spacing, colors.
4. **Undefined behavior** — "it should be responsive" without saying how it changes on mobile.
5. **Contradictions** — answers in one round that conflict with another.
6. **Implicit assumptions** — "same as the hero section" without specifying what exactly.
7. **Incomplete lists** — enumerations ending with "etc." or clearly missing items.
8. **Missing edge cases** — what if there's no image? What if text is very long? Empty collection?
9. **Missing fold position** — if the section could appear above the fold but fold
   position wasn't specified, flag it. This determines critical performance decisions.

### How to present findings

If ambiguities are found, present them as a numbered list:

```text
## Ambiguity Check — [N] issues found

1. **[Category]** — Round [X], Question: "[original question]"
   > "[quoted ambiguous text from the answer]"
   → Clarification needed: [specific question to resolve this]
```

Then ask: "I found [N] ambiguities that need to be resolved before we can generate
a reliable spec. Let's go through them."

### Resolution process

1. Wait for the user to answer ALL flagged ambiguities
2. If a resolution is still vague, push back: "That's still ambiguous. Can you give me
   [a specific number / an exact description / a firm yes-or-no]?"
3. Once ALL resolved, update `specs/INTERVIEW_$ARGUMENTS.md` with an `## Ambiguity Resolutions` section
4. Re-scan one more time. Repeat until clean.

### If NO ambiguities found

Say: "Ambiguity check passed — all answers are specific and actionable. The
interview is ready for spec generation."

### Completion

Only after the ambiguity check passes (zero issues remaining), tell the user:
"Interview complete. Run `/generate-spec $ARGUMENTS` to generate the full NLSpec."

---

## Rules
- Group questions into rounds. Ask one round at a time.
- Skip questions that clearly don't apply to this feature.
- Add questions you think of that aren't listed above.
- When the user says "I'm not sure," push for a decision: "Pick one for now — we can
  change it later. The agent will guess wrong if we leave it ambiguous."
- Keep it friendly — many users are not technical. Explain Shopify concepts when needed.

Feature to interview about:

$ARGUMENTS
