# Agent Interview — Autonomous Resolution Phase

You are running the **Agent Interview** phase: two specialized sub-agents (`shopify-dev-expert` and `design-merchant`) interview each other and resolve the open questions from `specs/BRIEF_$ARGUMENTS.md`, **without** consuming user time. Your job in this command is to orchestrate them, merge their outputs, and surface anything that genuinely needs the user's eye.

This is the autonomous half of the cooperative-brief workflow. The user has already provided intent and context via `/brief`. You convert that into a fully-resolved interview that `/generate-spec` can turn into an NLSpec.

## Input

Feature: `$ARGUMENTS`

If empty, ask: "Which feature's brief should I run agent-interview on?"

## Phase 0: Preconditions

1. Read `specs/BRIEF_$ARGUMENTS.md`. If it doesn't exist → stop and tell the user to run `/brief $ARGUMENTS` first.
2. Read the brief's "Open questions for agent-interview" section. If empty → stop and recommend `/generate-spec $ARGUMENTS` directly (brief-only mode).
3. Note the brief's `## Sources` — sub-agents need to know what's primary vs reference vs excluded.

Tell the user one short message:

> "Spawning shopify-dev-expert and design-merchant on N open questions from BRIEF_$ARGUMENTS.md. This runs without further input — I'll come back when both agents converge or one needs your eye."

## Phase 1: Spawn the two sub-agents in parallel

Use the **Agent tool**. Both launches go in a single message (parallel execution).

### shopify-dev-expert launch prompt

```
You are the shopify-dev-expert sub-agent. Your persona, tool allowlist, and
rules are defined in .claude/agents/shopify-dev-expert.md — load that first.

Feature: $ARGUMENTS
Brief: specs/BRIEF_$ARGUMENTS.md

Task:
1. Read the brief in full.
2. From the brief's "Open questions for agent-interview" section, resolve every
   question that falls in YOUR domain (schema, Liquid, performance, accessibility,
   asset strategy, merchant-control types, translations, Shopify feature
   compatibility).
3. Skip questions that belong to design-merchant (visual layout, spacing,
   colors, copy from DESIGN_REF, merchant-editable surface area beyond control
   types).
4. For each question you tackle, emit a YAML decision record per the format in
   your persona file.
5. Verify any Shopify-technical claim via Shopify Dev MCP before deciding —
   `confidence: low` if you cannot verify.

Budget: $5 cap. Read-only. No code edits. No user questions.

Return: a single response containing
  (a) one-line summary "Resolved N, M low-confidence, K declined"
  (b) the YAML decision list
  (c) "Questions declined" with reasons
```

### design-merchant launch prompt

```
You are the design-merchant sub-agent. Your persona, tool allowlist, and
rules are defined in .claude/agents/design-merchant.md — load that first.

Feature: $ARGUMENTS
Brief: specs/BRIEF_$ARGUMENTS.md

Task:
1. Read the brief in full.
2. Read specs/DESIGN_REF_$ARGUMENTS.md if it exists; otherwise specs/DESIGN.md.
3. From the brief's "Open questions for agent-interview" section, resolve every
   question that falls in YOUR domain (visual layout, spacing, color tokens,
   typography, copy from DESIGN_REF, merchant-editable surface area, container
   width, motion).
4. Skip questions that belong to shopify-dev-expert (schema, Liquid patterns,
   performance hooks, asset loading).
5. For each question you tackle, emit a YAML decision record per the format in
   your persona file.
6. Where the design system's hard rules in CLAUDE.md conflict with the Figma
   design, follow the hard rule and note the deviation in `reasoning`.

Budget: $5 cap. Read-only. No code edits. No user questions.

Return: a single response containing
  (a) one-line summary "Resolved N, M low-confidence, K declined"
  (b) the YAML decision list
  (c) "Questions declined" with reasons
```

Use `subagent_type: shopify-dev-expert` and `subagent_type: design-merchant` respectively. Launch in parallel in a single message.

## Phase 2: Converge — merge the two agent outputs

Once both agents return:

1. **Verification-field check (HARD GATE):** every decision must have a non-empty `verification:` field. Any decision missing it is rejected — send that specific decision back to the originating sub-agent with the message: "Decision `<topic>` is missing the `verification:` field. Emit a concrete Playwright assertion or downgrade to `verification: not-runtime-testable` with justification." Do NOT proceed past this gate with missing-verification decisions.

2. **No-guessing check (HARD GATE):** scan every decision's `reasoning` field. If a decision says `confidence: high` or `medium` but the reasoning doesn't cite a specific source (THEME_PROFILE section, file path, MCP doc, DESIGN_REF frame ID, similar section), reject it back to the agent: "Decision `<topic>` claims `confidence: <level>` but reasoning does not cite a verifiable source. Either cite the source or downgrade to `confidence: low` with the failed verification step named."

3. **Coverage check:** every open question from the brief should appear in *one* agent's decision list. If a question was declined by both → it stays open and is escalated to the user.

4. **Conflict detection:** scan for any two decisions on the same `topic`. If the decisions differ, that's a conflict. Examples:
   - dev-expert: "use grid-gap 18px"; design-merchant: "32px gap from Figma"
   - dev-expert: "merchant-editable headline (text input)"; design-merchant: "headline is hardcoded from DESIGN_REF"

5. **Bucket the decisions:**
   - **Resolved (high confidence)** — `confidence: high`, has `verification:`, no conflict.
   - **Resolved (medium confidence)** — `confidence: medium`, has `verification:`, no conflict. User should glance.
   - **Needs your eye (low confidence)** — `confidence: low`, has `verification:`, no conflict. User decides during Phase 3 spec review.
   - **Blocks Phase 2** — anything with `block: true`. These MUST be resolved before `/generate-spec` runs.
   - **Conflicts** — competing decisions on the same topic. Always blocks Phase 2.
   - **Stylistic / non-testable** — decisions with `verification: not-runtime-testable`. Surface separately; the user decides whether they belong in the spec at all (most are stylistic preferences that don't need to be hard spec items).

## Phase 3: Write the interview artifact

Write `specs/INTERVIEW_$ARGUMENTS.md`:

```text
# Interview: <Feature Name>
# Date: <yyyy-mm-dd>
# Brief: specs/BRIEF_$ARGUMENTS.md
# Agents: shopify-dev-expert, design-merchant
# Source: agent-interview (autonomous)

## Resolved Decisions (high confidence)
| # | Topic | Decision | Reasoning (source) | Verification | Owner agent |
|---|-------|----------|---------------------|--------------|-------------|
| 1 | ...   | ...      | THEME_PROFILE §3.2  | `page.locator(...).getAttribute('loading') === 'eager'` | dev-expert |

## Resolved Decisions (medium confidence)
<same columns>

## Decisions That Need Your Eye (low confidence)
<same columns — user reviews in Phase 3 of /start-building>

## Stylistic / Non-Testable
<decisions with `verification: not-runtime-testable` — user decides whether
these belong in the spec or are just stylistic preferences>

## Conflicts Between Agents
<if any — blocks Phase 2 until resolved>

## Open Questions (declined by both)
<if any — blocks Phase 2 until user decides>

## Verification Plan (handoff to /visual-qa)
A consolidated list of every `verification:` assertion across all resolved
decisions. /visual-qa reads this directly and runs each assertion against the
rendered theme after implementation. Format:

```yaml
- topic: <decision topic>
  assertion: <playwright code or pseudocode>
  viewport: <if viewport-conditional, list which>
  preconditions: <e.g., "merchant sets setting X = Y first">
```

## Budget
- shopify-dev-expert: $X.XX
- design-merchant:   $Y.YY
```

## Phase 4: Report to user

Three possible outcomes:

### 4a. Clean — proceed

If no conflicts, no blocks, no declined-by-both questions:

> "Agent interview complete: N decisions resolved (H high, M medium, L low confidence). Interview at specs/INTERVIEW_$ARGUMENTS.md. Ready for `/generate-spec $ARGUMENTS`."

### 4b. Needs your eye but unblocked

If there are low-confidence decisions but no blocks/conflicts/declines:

> "Agent interview complete with L decisions flagged for your review. None of them block spec generation — they'll surface in the spec review checkpoint (Phase 3 of /start-building). Run `/generate-spec $ARGUMENTS` when ready, or look at the 'Decisions That Need Your Eye' section first."

### 4c. Blocked — escalate now

If there are conflicts, `block: true` items, or questions declined by both:

> "Agent interview hit N blocking items I need you to resolve before `/generate-spec`:
>
> [list each conflict / block / declined question with both proposed decisions]
>
> Reply with your call on each, and I'll update the interview before generating the spec."

Wait for the user's decisions; update `specs/INTERVIEW_$ARGUMENTS.md` to record the user resolution under a new `## User Resolutions` section.

## Rules

- **Parallel sub-agents** — single message, two Agent tool calls.
- **Read-only orchestrator** — this command writes only `specs/INTERVIEW_$ARGUMENTS.md`. No code edits.
- **Budget caps enforced** — $5 per sub-agent. If a sub-agent exits over budget without a complete decision list, treat its partial output as best-effort and flag remaining questions as "declined — budget hit."
- **No guessing — ever.** Reject any decision with `confidence: high|medium` whose `reasoning` does not cite a verifiable source. (Hard gate at Phase 2 step 2.)
- **Verification field is required.** Every decision must have a `verification:` field with a concrete Playwright assertion (or `not-runtime-testable` with justification). Decisions without it are rejected back to the sub-agent. (Hard gate at Phase 2 step 1.)
- **Conflicts always escalate.** Do not pick a winner yourself.
- **Block flags always escalate.** Do not let a `block: true` decision slip through unresolved.
- **Low confidence does NOT block** by default — surface for review, but don't force the user to decide synchronously. (Per the resolved decisions in §5 of the workflow spec.)
- **Silent-hang guardrail** — if either sub-agent exceeds 10 minutes wall-clock, kill it and escalate. (See `feedback_vps_autonomous_agents.md`.)
- **No context bleed** — the sub-agents read the brief and the persona file; don't pass them assumptions from the user's chat history that aren't in the brief.

Feature to interview:

$ARGUMENTS
