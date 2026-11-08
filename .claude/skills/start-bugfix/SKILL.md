---
name: start-bugfix
description: Orchestrates the bug fix workflow for a Shopify theme issue. Use when the user reports a bug, visual glitch, broken behavior, or wants to fix something that's not working correctly.
argument-hint: <bug-name>
---

# Start Bugfix — Shopify Theme Bug Fix Orchestrator

You are a workflow orchestrator that guides the user through diagnosing and fixing
a bug in a Shopify theme. You gather information, reproduce, diagnose, fix, review,
and deploy — with user confirmation at each gate.

All rules, conventions, design system, and quality requirements are defined in
CLAUDE.md — which is always in context. Use the Shopify Dev MCP to verify
Shopify-specific knowledge before acting.

## Input

Bug name: `$ARGUMENTS`

If $ARGUMENTS is empty, ask: "What's the bug? Give it a short name
(e.g., `broken-mobile-nav`, `cart-count-wrong`, `hero-image-overlap`)."

## Phase 0: Detect Current State

Before asking anything, silently check:

1. **Workspace setup:** Does `CLAUDE.md` exist? Does `specs/THEME_PROFILE.md` exist?
2. **Uncommitted changes:** `git status --porcelain`
3. **Current branch:** `git branch --show-current`
4. **Existing bugfix branch:** `git branch --list "bugfix/$ARGUMENTS"`

Report:

```text
Bug: $ARGUMENTS
Workspace:    [ok/missing]
Current branch: [branch name]
Bugfix branch: [exists/not found]
Working tree:  [clean/N uncommitted changes]
```

**If uncommitted changes exist:** Warn the user before creating a new branch.

---

## Phase 1: Gather Information

Ask the user (adapt to what's already known from $ARGUMENTS):

1. **What's broken?** Describe what you see vs what you expect.
2. **Where does it happen?** Which page, section, or template?
3. **When did it start?** After a recent change? Always been like this?
4. **Devices/browsers?** All devices or specific ones (mobile, desktop, Safari, etc.)?
5. **Can you share a URL or screenshot?**

Wait for answers before continuing.

---

## Phase 2: Reproduce & Diagnose

### Step 1: Read context
1. Read `specs/THEME_PROFILE.md` for theme patterns
2. Read `specs/DESIGN.md` for design system values
3. Check if a related NLSpec exists in `specs/` for the affected feature — if so,
   read it to understand the intended behavior and verify the bug is a deviation from spec
4. Identify the affected files from the user's description

### Step 2: Investigate
1. Read the affected section/snippet/template files
2. Read related CSS (inline `<style>` or asset files)
3. Read related JS if behavior is involved
4. Check `git log --oneline -10 -- <affected-files>` for recent changes
5. Check if the issue is in a specific section color scheme or responsive breakpoint

### Step 3: Report diagnosis

```text
## Diagnosis

Affected files:
  [list files with line numbers]

Root cause:
  [clear explanation of what's wrong and why]

Proposed fix:
  [what needs to change — be specific]

Risk assessment:
  [low/medium/high — what else could this affect?]
```

Ask: "Does this diagnosis look right? **Proceed with fix**, **investigate more**, or **adjust approach**?"

Do NOT proceed until the user confirms.

---

## Phase 2.9: Sync with Remote

Before branching, pull the latest `main` from GitHub. The live theme is connected
to `main` via Shopify's GitHub integration.

1. Ensure you are on `main` with a clean working tree
2. Run: `git pull origin main`
3. If there are conflicts or local changes, resolve them before branching
4. Report: "Local repo is in sync with remote."

---

## Phase 3: Fix

### Step 1: Branch
- If branch `bugfix/$ARGUMENTS` does NOT exist → `git checkout -b bugfix/$ARGUMENTS`
- If branch exists → `git checkout bugfix/$ARGUMENTS`

### Step 2: Apply fix
- Make the minimal change needed to fix the bug
- Do NOT refactor surrounding code, add features, or "improve" unrelated things
- Follow all CLAUDE.md rules (design system, conventions, accessibility, performance)
- If the fix touches CSS, verify it uses the correct CSS custom properties
- If the fix touches Liquid, verify whitespace control and variable patterns

### Step 3: Show what changed
After applying the fix, show:
```bash
git diff --stat
git diff
```

Ask: "Here's the fix. **Looks good**, **needs adjustment**, or **wrong approach**?"

---

## Phase 4: Review

Run `/review $ARGUMENTS` automatically against the changed files.

**If review finds failures:**
1. Show failures
2. Ask: "Fix these issues now, or proceed anyway?"

**If review passes:** Continue to Phase 5.

---

## Phase 5: Theme Check (optional)

Ask: "Run Shopify theme check?"
- If yes → run `/check-theme $ARGUMENTS`
- If no → skip

---

## Phase 6: Test

Ask the user to verify the fix:
- "Push to staging so you can preview?"
- If yes → `shopify theme push --theme=$SHOPIFY_STAGING_THEME_ID --store=$SHOPIFY_STORE --password=$SHOPIFY_CLI_PASSWORD --path=.`
- Share the preview link
- Wait for user confirmation: "Is the bug fixed?"

If not fixed → go back to Phase 2 with new information.

---

## Phase 7: Commit & Push

### 7.1 Prepare commit
Draft a commit message:
```text
fix($ARGUMENTS): <concise description of what was fixed>

<what was broken and why>
<what the fix does>
```

Ask: "**Approve**, **edit**, or **cancel**?"

### 7.2 Commit
```bash
git add <specific files>
git commit -m "<approved message>"
```

### 7.3 Push (optional)
Ask: "Push `bugfix/$ARGUMENTS` to remote?"

---

## Completion & Handover

This phase ensures clean state for the next workflow. It is mandatory.

### 8.1 Save state
- Verify fix is committed to `bugfix/$ARGUMENTS`
- If the bug revealed a pattern issue, update `specs/THEME_PROFILE.md` or `specs/DESIGN.md`
- Append a brief entry to `specs/LESSONS_LEARNED.md` if the bug had a non-obvious
  cause (e.g., theme editor override, CSS specificity, missing edge case in spec)

### 8.2 Report

```text
Bug fix complete: $ARGUMENTS

- Diagnosis:     [done]
- Fix:           [done]
- Review:        [done/skipped]
- Theme check:   [done/skipped]
- User verified: [yes/no/skipped]
- Commit:        [short hash/skipped]
- Push:          [pushed/skipped]
```

### 8.3 Clean up
- Ensure working tree is clean: `git status --porcelain`
- Switch back to `main`: `git checkout main`

**Important:** All persistent state must live in files — never rely on conversation
context surviving between workflows.

---

## Rules

- Always diagnose before fixing — never jump to code changes
- Minimal fixes only — do not refactor, add features, or clean up unrelated code
- The user confirms every phase transition
- If the fix might affect other sections, warn the user and list what could break
- Use `bugfix/` branch prefix (not `feature/`)
- Always complete the handover phase — never leave a workflow half-finished

$ARGUMENTS
