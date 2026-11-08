---
name: start-building
description: Orchestrates the full NLSpec development flow for a Shopify theme feature. Use when the user wants to build a new section, component, or feature. Guides through interview, spec generation, implementation, review, and deployment.
argument-hint: <feature-name>
---

# Start Building — Shopify Theme Workflow Orchestrator

You are a workflow orchestrator that guides the user through the full NLSpec
development flow for a Shopify theme feature. You detect current state, skip
completed phases, ask qualifying questions at each gate, and run sub-commands inline.

All rules, conventions, design system, accessibility, and performance requirements
are defined in CLAUDE.md — which is always in context. Do not restate them here.
All sub-commands also read CLAUDE.md. Use the Shopify Dev MCP to verify
Shopify-specific knowledge before acting.

## Input

Feature name: `$ARGUMENTS`

If $ARGUMENTS is empty, ask the user: "What feature should we build? Give it a
short name (e.g., `testimonials-section`, `hero-banner`, `product-tabs`)."

## Phase 0: Detect Current State

Before asking anything, silently check what already exists:

1. **Workspace setup:** Does `CLAUDE.md` exist? Does `specs/` exist? Does `.claude/settings.json` exist?
2. **Theme profile:** Does `specs/THEME_PROFILE.md` exist?
3. **Interview:** Does `specs/INTERVIEW_$ARGUMENTS.md` exist?
4. **NLSpec:** Does `specs/NLSPEC_$ARGUMENTS.md` exist?
5. **Branch:** Does branch `feature/$ARGUMENTS` exist? (`git branch --list "feature/$ARGUMENTS"`)
6. **Uncommitted changes:** Are there uncommitted changes? (`git status --porcelain`)
7. **Worktrees:** Are there active worktrees? (`git worktree list`)

Report a short status summary:

```text
Feature: $ARGUMENTS
Workspace:     [ok/missing]
Theme profile: [ok/missing]
Interview:     [ok/missing]
NLSpec:        [ok/missing]
Branch:        [ok/missing]
Working tree:  [clean/N uncommitted changes]
Worktrees:     [none/list]
```

**If workspace is not set up OR theme profile is missing:**
Say: "This theme hasn't been initialized yet. I need CLAUDE.md, specs/, and
THEME_PROFILE.md to work. Please set these up first."

Then say: "I'll walk you through each phase. We'll skip steps that are already
done — you confirm before each one."

---

## Phase 0.5: Design Ingestion (Figma)

**Why this phase exists:** If the design lives in Figma, the workflow MUST
extract it as a structured artifact BEFORE the interview. A textual sketch of a
design produces a textual-sketch implementation. The post-mortem on
`pdp-bedding-set` (see `specs/LESSONS_LEARNED.md`) was caused by skipping this
step — the spec was generated without ever reading the Figma, so visual details
were filled in with theme defaults.

### Step 1: Detect a Figma source

Look for a Figma URL (`figma.com/design/`, `figma.com/file/`) in:
1. The current `$ARGUMENTS` and recent user messages
2. Any existing `specs/INTERVIEW_$ARGUMENTS.md`
3. Any existing breakdown / scratch doc in `specs/` related to this feature
4. Any image attachments captioned with a Figma URL

If no Figma URL is found, ask the user once: "Is there a Figma design for this
feature? If yes, paste the URL. If not, say 'no figma' and we'll proceed from
text descriptions."

If the user says no figma → skip to Phase 1, but warn: "Without a visual source
of truth, visual details will be inferred from `specs/DESIGN.md` and may not
match anyone's mental picture."

### Step 2: Check for an existing DESIGN_REF

If `specs/DESIGN_REF_$ARGUMENTS.md` already exists:
- Show its line count, the Figma node IDs covered, and the date it was generated
- Ask: "A design reference already exists. **Use the existing reference**,
  **regenerate from Figma**, or **add missing nodes**?"
- If use existing → skip to Phase 1
- If regenerate or add → continue to Step 3

### Step 3: Extract from Figma via MCP

Use the Figma MCP server (`mcp__figma__*` or whatever tools are available in
this session). For the provided URL:

1. **`get_metadata`** on the root frame → understand the section/frame structure
2. **`get_variable_defs`** → pull every design token used: colors, typography,
   spacing, radii, shadows. Build a token-mapping table (Figma token → theme
   CSS variable). Flag any Figma tokens that have no theme equivalent.
3. For each meaningful frame (each section/block in the feature):
   - **`get_design_context`** with the node ID → component structure, text
     content, layout properties (auto-layout direction, padding, gap,
     alignment), constraints
   - **`get_screenshot`** with the node ID → save as
     `specs/design_ref/$ARGUMENTS/<node-id>.png` (create the directory)
4. Extract all visible **text content** verbatim. This becomes the source of
   truth for translation keys — never invent copy when Figma has it.

If the Figma MCP is unavailable or rate-limited, STOP and tell the user. Do not
silently fall back to "the agent will guess".

### Step 4: Save `specs/DESIGN_REF_$ARGUMENTS.md`

Structure:

```text
# Design Reference: [Feature Name]
# Source: [Figma URL]
# Extracted: [date]

## 1. Token Map
| Figma token       | Theme CSS variable                | Notes                    |
|-------------------|-----------------------------------|--------------------------|
| color/primary    | --primary-button-background       | exact match              |
| color/sand        | (none — new token needed)         | propose --pdp-sand       |
| text/h1/desktop   | --heading-h1-font-size            | exact match              |
| spacing/24        | (none — use literal 24px)         |                          |

## 2. Frames
### 2.1 [Frame name] — node-id [X:Y]
Screenshot: design_ref/[feature]/[X-Y].png
Layout: [auto-layout direction, padding, gap, alignment]
Children:
  - [child name] — [type, dimensions, text content if applicable]
Text content (verbatim, for translations):
  - "[exact German/English string]"
Notes: [anything the agent needs to know]

### 2.2 [next frame] ...

## 3. New Tokens Required
[Any Figma tokens with no theme equivalent — these become decisions for the
interview: "introduce a new token" vs "approximate with existing token"]

## 4. Open Questions
[Anything ambiguous in the Figma — overlapping elements, missing states,
unclear interactions — that the interview must resolve]
```

### Step 5: Report and gate

Report:
- DESIGN_REF location and frame count
- Token map size, new tokens needed
- Any open questions for the interview to resolve

**Gate:** Do NOT proceed to Phase 1 until DESIGN_REF exists and has at least
one frame. The interview will read this file and base its visual questions on
the actual design, not on user description.

---

## Phase 1: Brief

The cooperative brief (`/brief`) captures intent + context in ≤4 user exchanges over
six fields (goal, context, sources, constraints, quality bar, definition of done).
This replaces the legacy 6-round `/interview` as the default path.
See `specs/NLSPEC_cooperative-brief-workflow.md` for the full flow.

**If brief exists** (`specs/BRIEF_$ARGUMENTS.md`):
- Show a 3-5 line summary of the brief
- Ask: "A brief already exists. **Use the existing brief** or **redo**?"
- If use → skip to Phase 1.5
- If redo → run `/brief $ARGUMENTS`

**If brief does NOT exist:**
- Say: "No brief found. The brief is a lightweight cooperative pass to capture
  goal, context, sources, constraints, quality bar, and definition of done.
  Target: 2-4 exchanges."
- Ask: "Ready to start the brief?"
- If yes → run `/brief $ARGUMENTS`
- If no → stop; resume later with `/start-building $ARGUMENTS`

After the brief completes, check the brief's `# Mode:` header:
- `Mode: brief-only` → skip Phase 1.5; go directly to Phase 2
- Otherwise → continue to Phase 1.5

**Legacy interview fallback:** if a `specs/INTERVIEW_$ARGUMENTS.md` exists from a
prior run of the deprecated `/interview` command (no `# Source: agent-interview`
header), accept it and skip directly to Phase 2. `/generate-spec` handles both
formats.

---

## Phase 1.5: Agent Interview

`/agent-interview` autonomously resolves the open questions from the brief by
spawning two sub-agents (`shopify-dev-expert` + `design-merchant`) that produce a
structured decision list with `confidence` + `verification:` fields per the rules
in `feedback_decisions_must_be_verifiable.md`. No user input is required during
this phase unless the agents conflict or hit a `block: true` decision.

**If interview exists** (`specs/INTERVIEW_$ARGUMENTS.md`) AND has `# Source: agent-interview`:
- Show summary: N high-confidence decisions, M medium, L low, K conflicts/blocks
- Ask: "An agent-interview already exists. **Use existing** or **rerun**?"
- If use → continue to the gate check below
- If rerun → run `/agent-interview $ARGUMENTS`

**If interview does NOT exist OR is legacy format:**
- Run `/agent-interview $ARGUMENTS`

**Gate:** Do NOT proceed to Phase 2 if `INTERVIEW_$ARGUMENTS.md` has any of:
- Rows under "Conflicts Between Agents"
- Rows under "Open Questions (declined by both)"
- Decisions with `block: true`

In those cases, surface the items to the user and wait for explicit resolution.
Record the user's decisions under a `## User Resolutions` section in
`INTERVIEW_$ARGUMENTS.md` before proceeding.

---

## Phase 2: Generate Spec

**If NLSpec exists:**
- Read the spec file. Report: line count, number of new files, number of section settings
- Ask: "A spec already exists. **Use the existing spec** or **regenerate from the interview**?"
- If use existing → skip to Phase 2 gate check
- If regenerate → run `/generate-spec $ARGUMENTS`

**If NLSpec does NOT exist:**
- Say: "No spec found. I'll generate a complete NLSpec from the interview + your theme files."
- Ask: "Ready to generate the spec?"
- If yes → run `/generate-spec $ARGUMENTS`

### Phase 2 Gate Check: Theme Editor Impact

After the spec exists, verify Section 10 (Theme Editor Impact):
1. Read `specs/NLSPEC_$ARGUMENTS.md`
2. Confirm Section 10 has clear information about where the section can be added
   and how it appears in the theme editor
3. If missing → BLOCK and ask the user about theme editor behavior

---

## Phase 3: User Review

Say: "The spec is ready for your review."

Show the spec location: `specs/NLSPEC_$ARGUMENTS.md`

Ask: "Please review the spec. When you're done, let me know:
- **Looks good** — proceed to implementation
- **Needs changes** — tell me what to update"

If user requests changes → make edits, show what changed, re-ask.

Do NOT proceed to implementation until the user explicitly approves.

---

## Phase 3.5: Permissions — Agent Autonomy Level

Before spawning any agent, the user decides how much autonomy it gets.

### Step 1: Analyze the NLSpec

Read Section 2 (Architecture) and classify:
1. **New files** — list all files to create
2. **Modified files** — list all existing files to change
3. **Protected file conflicts** — cross-reference against settings.json deny list

### Step 2: Present options

```text
## File Impact Analysis

New files to create:      [N] files
  [list paths]
Existing files to modify: [N] files
  [list paths]
Protected file conflicts: [none / list]

## Choose Autonomy Level

Supervised  — Agent shows full plan before writing any code.
Guided      — Agent works, asks before editing existing files. (recommended)
Autonomous  — Agent works independently. You review at the end.
```

---

## Phase 3.9: Sync with Remote

Before branching, pull the latest `main` from GitHub. The live theme is connected
to `main` via Shopify's GitHub integration — theme editor changes and other
developers' work auto-commit to `main`.

1. Ensure you are on `main` with a clean working tree
2. Run: `git pull origin main`
3. If there are conflicts or local changes, resolve them before branching
4. Report: "Local repo is in sync with remote."

---

## Phase 4: Implement

**Branch check:**
- If branch `feature/$ARGUMENTS` does NOT exist → create it
- If branch exists → check it out

**Run implementation:**
Run `/implement $ARGUMENTS` with the chosen autonomy level from Phase 3.5.

After implementation completes, continue to Phase 5.

---

## Phase 5: Stage Changes from Worktree

1. Confirm the agent reported its worktree branch name
2. If agent reported failures → do NOT merge, ask user how to proceed
3. Squash-merge from worktree: `git merge --squash <worktree-branch>`
4. Resolve any conflicts
5. Clean up worktree:
   ```
   git worktree remove .claude/worktrees/<name>
   git branch -D <worktree-branch>
   ```
6. Show summary: `git diff --cached --stat`

---

## Phase 6: Review (AUTOMATIC)

Say: "Changes are staged on `feature/$ARGUMENTS`. Running the design system and
spec compliance review automatically."

Run `/review $ARGUMENTS` — this is NOT optional. Every implementation must pass
review before proceeding to theme check or commit.

**If review finds failures (any FAIL items):**
1. Show the failures to the user
2. Ask: "Fix these issues now, or proceed anyway?"
   - If fix → address each failure, then re-run `/review $ARGUMENTS`
   - If proceed → note skipped failures in Phase 8 commit message

**If review passes:**
Continue to Phase 6.5.

---

## Phase 6.5: Visual Validation (MANDATORY for visual features)

**Why this phase exists:** Code review can pass with green checkmarks on a
result that looks nothing like the design. The `pdp-bedding-set` post-mortem
documents this exact failure. The fix is an automated screenshot loop with
self-grading — *then* a human sign-off — *then* a PR.

This phase is **mandatory if any of these are true**:
- `specs/DESIGN_REF_$ARGUMENTS.md` exists (the feature has a Figma source)
- The NLSpec touches visual concerns (CSS, layout, components)
- The user can see the result on a page

It can be skipped only for non-visual features (data migrations, server-side
helpers, build tooling).

### Run /visual-qa

Hand off to the dedicated visual-QA loop:

```text
/visual-qa $ARGUMENTS
```

That command owns the full loop end-to-end:

1. Push the affected files to the dev theme (`158313152668`).
2. Screenshot via VPS Playwright at every viewport the design covers.
3. **Self-grade** — read both the reference and the render, list every
   structural divergence in writing.
4. Iterate up to **3 times** (push → screenshot → self-grade), each iteration
   saved under `specs/visual_check/$ARGUMENTS/iter-<N>/`.
5. Once divergences are zero (or the iteration cap is hit), post the final
   screenshots + reference to the shop's sign-off channel and wait for explicit
   human sign-off.

**Gate:** Do NOT proceed to Phase 7 until `/visual-qa` reports sign-off.
The agent is responsible for converging — the user only signs off at the end,
not for every iteration.

If `/visual-qa` escalates after 3 iterations without converging, treat it as a
fix-now decision: loop back to Phase 4 with the divergence list as the
implementation target, then re-enter Phase 6.5.

---

## Phase 7: Theme Check (MANDATORY)

Theme check is **not optional and not skippable**, regardless of autonomy
level. The post-mortem on `pdp-bedding-set` was triggered partly because the
agent reported "theme check passed" without actually running it, then three
Liquid syntax errors surfaced on first preview.

1. Run `/check-theme $ARGUMENTS` against the actual files in the worktree (or
   the staged feature branch if already merged from worktree).
2. **Paste the actual output verbatim.** Do not summarize. Do not say "passed"
   without showing the line that says "0 errors, 0 warnings".
3. If theme check reports any errors → BLOCK. Do not proceed to Phase 8.
   - Tell the user the exact errors
   - Fix them
   - Re-run theme check
   - Only proceed when output is clean
4. If theme check itself fails to run (binary missing, network error, etc.) →
   BLOCK and tell the user. Do not silently skip.

---

## Phase 8: Commit & Push

### 8.1 Prepare commit

Draft a commit message:
1. Read the NLSpec title and Section 1.1 for context
2. Look at files created vs modified (`git diff --cached --stat`)
3. Draft:
   ```
   feat($ARGUMENTS): <concise summary>

   <2-5 bullet points describing what was built>

   NLSpec: specs/NLSPEC_$ARGUMENTS.md
   ```

Ask: "**Approve**, **edit**, or **cancel**?"

### 8.2 Commit
```bash
git commit -m "<approved message>"
```

### 8.3 Push (optional)
Ask: "Push `feature/$ARGUMENTS` to remote?"

---

## Completion & Handover

This phase ensures clean state for the next workflow. It is mandatory.

### 9.1 Save state to files
- Verify all code is committed to `feature/$ARGUMENTS`
- Verify NLSpec and interview are saved in `specs/`
- If anything was learned about the theme's patterns during this workflow
  (new conventions, gotchas, corrections), update `specs/THEME_PROFILE.md`
  or `specs/DESIGN.md`
- Append a brief entry to `specs/LESSONS_LEARNED.md` if anything unexpected
  happened during this workflow (spec ambiguity that caused rework, hook that
  blocked incorrectly, design system gap, performance issue discovered)

### 9.2 Report completion

```text
Feature workflow complete: $ARGUMENTS

Completed phases:
- Interview:       [new/existing]
- Ambiguity check: [clean/N issues resolved]
- Spec:            [new/existing/regenerated]
- Editor check:    [done]
- User review:     [approved]
- Permissions:     [supervised/guided/autonomous]
- Implementation:  [done]
- Staged:          [squash-merged to feature/$ARGUMENTS]
- Review:          [done/skipped]
- Theme check:     [done/skipped]
- Commit:          [short hash/skipped]
- Push:            [pushed/skipped]
```

### 9.3 Clean up
- Ensure no stale worktrees remain: `git worktree list`
- Ensure working tree is clean: `git status --porcelain`
- Switch back to `main`: `git checkout main`

**Important:** All persistent state must live in files (specs/, CLAUDE.md, memory,
git history) — never rely on conversation context surviving between workflows.
Each workflow runs in its own session with a clean context.

---

## Rules

- Always detect state first — never re-run a phase without asking
- Gate on ambiguity check — no spec generation until all answers are crisp
- Gate on permissions — user chooses autonomy level before any agent is spawned
- The user confirms every phase transition — never auto-advance silently
- If the user says "skip" at any phase, skip it but note in the completion report
- All implementation happens in worktrees — the main working tree stays clean
- Always complete the handover phase — never leave a workflow half-finished

### Autonomy scope (CRITICAL)

User-granted autonomy ("just keep going", "don't ask between steps",
`bypassPermissions` mode) applies **only to implementation phases (Phase 4
Implement and Phase 5 Stage)**. It NEVER covers:

- Phase 6: Review (must run, must report results)
- Phase 6.5: Visual validation (must run, must surface to user)
- Phase 7: Theme check (must run, must paste real output)

If the user says "don't re-verify what's already done", that means do not
re-run earlier *implementation* steps — it does NOT mean skip *verification*
steps that haven't run yet. When in doubt, run the verification step and
explain why.

Verification steps are guardrails, not chores. Skipping them produces the
exact failure mode that the `pdp-bedding-set` post-mortem documents:
confidently-reported "ready to preview" on broken code.

$ARGUMENTS
