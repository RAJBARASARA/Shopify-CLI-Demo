# Visual QA — Self-Check Loop Against the Design Reference

You are running the **visual-QA loop** for a Shopify theme feature. You implemented
something that has a design reference (PNG, PDF, Figma export, etc.) and you must
prove the rendered output matches the design **before** opening a PR to main.

**Hard rule:** A PR-to-main is NEVER the visual-QA loop. The QA loop runs against
a dev theme, with screenshots, and self-grades until convergence — *then* a human
signs off — *then* a PR is opened.

## Input

- Feature name: `$ARGUMENTS`
- Design reference: ask the user for the path or URL if not already known.
  Common locations: your local Downloads folder, `specs/design/*.png`, a Figma node URL.
- Pages/templates affected: derive from the implementation branch's diff
  (`git diff main..HEAD --name-only` and look for `templates/`, `sections/`, `snippets/`).

## Preconditions

Confirm before starting:

1. **Branch is the feature branch** (not `main`). `git rev-parse --abbrev-ref HEAD`
2. **Working tree is clean**. If not, commit first.
3. **Dev theme ID is known**. Default for this store: `158313152668` (your dev theme).
4. **Reference image exists and is readable**. Copy it into the repo at
   `specs/visual_check/$ARGUMENTS/reference.png` so it's auditable later.

If any precondition fails, stop and surface the failure.

## Phase 1 — Push to dev theme

Push only the affected files (don't blow away unrelated ones):

```bash
shopify theme push --theme=158313152668 --nodelete \
  --only=<file1> --only=<file2>
```

If the push fails, fix and retry. Do not proceed until push succeeds.

## Phase 2 — Screenshot via Playwright

Use the recipe in [`../playwright-setup.md`](../playwright-setup.md) (install it
first if `/visual-qa` has never run on this box). Run its `shot.js`:

- Preview URL pattern: `https://zenn-space.myshopify.com/<path>?preview_theme_id=158313152668`
  — fill the per-shop values (they live in `THEME_PROFILE.md` / this command's header).
- Run on the box with network access to the store; `scp` PNGs back if it differs
  from where the theme repo lives.
- Capture **at all viewports the design covers**: mobile-only → 390×844; desktop →
  1440×900 AND 1280×900; both → both.
- Save under `specs/visual_check/$ARGUMENTS/iter-<N>/<viewport>.png`.

## Phase 3 — Self-grade vs. the reference

For each viewport, **read both images yourself** (the reference and your render)
and answer in writing:

1. **Structural alignment** — is the page structure (sections, columns, card counts,
   button placement, image placement) identical to the design? List every divergence.
2. **Spacing** — are gaps/paddings visually similar? Don't pixel-count, but call out
   "way too much vertical space here" or "missing horizontal margin on the path grid."
3. **Typography** — does heading size hierarchy, font choice, and weight match?
4. **Colors** — do primary/secondary/accent colors visibly match? (Use CSS custom
   property names if you suspect a wrong token, e.g. `--secondary-background`.)
5. **Container width** — is content constrained to the same width as the design?
   On this theme, landing pages should hit `--container-max-width: 1128px` inside
   `#mt-static` / `#vt-static` (not the theme default 1600px).

Output a numbered list of divergences. Be specific. Don't say "looks close enough."

## Phase 4 — Iterate

If divergences exist:

- **Pick the highest-impact divergence.** Structural > spacing > typography > color.
- **Make ONE focused change** to the implementation (one Edit call where possible).
- **Re-push and re-screenshot** at the same viewports.
- **Re-grade.** Save under `iter-<N+1>/`.

Hard cap: **3 iterations.** If you haven't converged after 3, stop iterating and
escalate to the user with all 3 sets of screenshots and your divergence list.

## Phase 5 — Human sign-off

When self-grade reports zero structural divergences (or you hit the iteration cap):

1. Post a sign-off message on the shop's configured sign-off channel
   (`<SIGNOFF_CHANNEL>` — resolved from per-shop config / `THEME_PROFILE.md`),
   in the same thread the task came in on so the context is preserved.
2. Attach **all** final-iteration screenshots AND the reference image side by side.
3. Ask: "Visual QA complete — N iterations. Approve to open PR? Or call out
   anything I missed."
4. Wait for explicit approval. Do not open the PR until the user replies "approve",
   "ship it", "looks good", or equivalent.

If the user calls out a remaining issue, treat it as iteration N+1 (no cap reset)
and go back to Phase 4.

## Phase 6 — Open the PR

Only after sign-off:

1. Push the branch to the shop's git remote (`<git-remote>` — from per-shop config
   / `THEME_PROFILE.md`; usually `origin`).
2. Open a PR with `gh pr create -R RAJBARASARA/Shopify-CLI-Demo`.
3. Include the final iteration's screenshots in the PR body.
4. Link to the design reference path/URL.
5. **Stop.** Don't push more commits to the branch — squash-merge will drop them
   (see memory: squash_merge_after_push).

## Output

A short report at the end:

```text
Visual QA — $ARGUMENTS
- Iterations: N
- Final divergences: 0 (or list them if escalating)
- Screenshots: specs/visual_check/$ARGUMENTS/iter-N/
- Sign-off: <user> on <date>
- PR: <url>
```

## Why this exists

Without this loop, the PR-to-main becomes the visual-QA loop and the user becomes
the QA bottleneck. Memory entry `feedback_visual_qa_before_main.md` is explicit:
"Visual features go to a dev theme + screenshot-diff first; never use a PR-to-main
as the QA loop." This command operationalizes that rule.
