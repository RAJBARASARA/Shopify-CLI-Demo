# Brief — Lightweight Cooperative Capture

You are running the **Brief** phase: a short, cooperative session with the user that captures the six fields needed to plan a theme feature, *without* the long six-round Q&A of the legacy `/interview`. The agent-interview phase (`/agent-interview`) handles deep technical/visual resolution autonomously *after* this brief is done.

This command is the article's "useful question" applied to our workflow: capture intent and context cooperatively, then hand off.

## Input

Feature: `$ARGUMENTS`

If empty, ask once: "What feature should we brief? Short slug, e.g. `testimonials-section`."

## Phase 0: Pre-read (silent)

Before asking the user *anything*, read what's already on disk. This anchors the brief and prevents you from asking questions you can answer yourself.

1. `CLAUDE.md` — project rules.
2. `specs/THEME_PROFILE.md` — exact theme patterns, reference sections, conventions.
3. `specs/DESIGN.md` — theme-wide design system.
4. `specs/DESIGN_REF_$ARGUMENTS.md` if it exists — feature-specific Figma extract (visual source of truth).
5. Any existing `specs/INTERVIEW_$ARGUMENTS.md` or `specs/BRIEF_$ARGUMENTS.md` (continuation case).
6. Scan `sections/` and `snippets/` for similar existing work.

If `specs/THEME_PROFILE.md` is missing, stop and say so — the brief depends on it.

## Phase 1: Anchor — tell the user what you already know

Open the conversation by **showing**, not asking. One short message:

> "I've read the theme profile, design system, and existing sections. Here's what I already know about `<feature>`:
>
> - **Pattern match:** <closest similar section in the theme, e.g. `sections/featured-collection.liquid`>
> - **Design ref:** <exists / doesn't exist; key tokens it covers>
> - **Visual defaults from DESIGN.md:** <relevant ones, e.g. button style, container width, spacing>
>
> A few things I need from you to scope this. Skip any that don't apply."

Then ask the six fields in **one combined message**, not six rounds:

```
1. **Goal** — One sentence: what outcome are we building, not what activity?
2. **Where + scope edges** — Which page(s)? What's IN scope? What's explicitly OUT?
3. **Sources** — Any Figma URL, reference site, existing section, or doc I should use as the source of truth?
4. **Constraints** — Any hard nos? (e.g. "must not break the cart drawer", "no external JS libraries", "must work without theme editor settings")
5. **Quality bar** — What would make this *bad* even if it shipped looking correct? (e.g. "merchant can't edit copy", "feels slow on mobile", "doesn't match other sections' density")
6. **Definition of done** — Where do you want to sign off? (a) draft → Playwright screenshot → your sign-off → PR, (b) autonomous to PR, or (c) brief-only — small scope, skip agent-interview and go straight to spec?
```

## Phase 2: Cooperative back-and-forth (in flight)

After the user replies, you have three jobs in the *same response*:

1. **Reflect back** what you heard in 1-3 sentences. Anchor any drift before it grows.
2. **Surface any ambiguity *now*** — don't save it for the end. If the user said "some testimonials" name it: "By 'some' do you mean 3, or up to 8 with merchant control?" Same exchange.
3. **Identify gaps you can't fill** — list them as "open questions for agent-interview" so the user knows what *won't* require their attention.

Target: 2-4 user exchanges total. If you're at exchange 5 and still asking, you're doing the old interview — stop and write the brief with what you have, list the rest as open questions.

## Phase 3: Shape-first escape hatch

If after the anchor message the user says something like "I don't know yet" / "I haven't decided" / "let's explore" — switch modes explicitly:

> "Switching to shape-first mode. I'll ask exploratory questions, map options, and surface tensions. We won't write a brief until the intent is clear."

In shape-first mode: ask open questions, propose 2-3 alternative directions, name the tradeoffs. **Do not write `specs/BRIEF_*.md` until the user re-anchors** by saying "OK now write the brief" or equivalent.

## Phase 4: Write the brief artifact

Once the six fields have content (even if some are "agent-interview will resolve"), write `specs/BRIEF_$ARGUMENTS.md` using this exact structure:

```text
# Brief: <Feature Name>
# Date: <yyyy-mm-dd>
# Pre-read: <comma list of files read in Phase 0>
# Mode: standard | brief-only | shape-first→standard

## Goal
<one paragraph — outcome, not activity>

## Context
<what the agent already knew from pre-reads; what the user added; why now>

## Sources
- <file or URL>: <role: primary | reference | example | excluded>
- ...

## Constraints
- IN scope: <bulleted>
- OUT of scope: <bulleted>
- Hard nos: <bulleted>

## Quality bar
<what "good" looks like; what would make it bad even if shipped>

## Definition of done
<exact deliverable + stopping point>

## Open questions for agent-interview
- <numbered list of explicit gaps; this is what /agent-interview will resolve>
```

## Phase 5: Hand-off prompt

After writing the brief, post one message:

```
Brief captured at specs/BRIEF_$ARGUMENTS.md.

Six fields covered. N open questions handed to agent-interview.

Next:
  - `/agent-interview $ARGUMENTS`  — autonomous resolution (recommended)
  - brief-only?                    — skip to `/generate-spec $ARGUMENTS` for small scope
  - edit-brief                     — make changes before handing off
```

## Brief-only detection

If the user picked option (c) "brief-only" in the definition of done **and** the open-questions list has ≤2 items, recommend brief-only mode explicitly: "This is small scope. Skip `/agent-interview` and go straight to `/generate-spec`." Otherwise, recommend the standard agent-interview path.

## Rules

- **Pre-read before asking.** Anchor the brief in what you already know.
- **One combined ask, not six rounds.** The user gets one message with the six fields, not a phased Q&A.
- **Surface ambiguity in flight**, not at the end. No mandatory ambiguity scan loop.
- **2-4 exchanges target.** If you're past 5, write the brief and let agent-interview do the rest.
- **Shape-first is a separate mode** — name it explicitly, don't slide into it.
- **Brief is the contract for agent-interview.** Open questions are explicit; they're what the sub-agents will resolve.
- **Do NOT** answer brief-mode questions with deep technical analysis — that's `shopify-dev-expert`'s job in the next phase.
- **Do NOT** invent verbatim copy if DESIGN_REF has it — pass through.
- **Do NOT** call destructive tools (no `Edit` on theme files, no `Bash` writes, no theme push). This command is read-only on the codebase, write-only to `specs/BRIEF_*.md`.

Feature to brief:

$ARGUMENTS
