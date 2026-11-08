# Check Theme — Run Shopify Theme Linter

Run `shopify theme check` and report the results in a structured format.

**IMPORTANT:** Before running any Shopify CLI command, use the Shopify Dev MCP
to verify the correct command syntax and flags for the current CLI version.

## Process

### Step 1: Run Theme Check

Use the Shopify Dev MCP to confirm the correct `shopify theme check` syntax,
then run it. The typical command is:
```bash
shopify theme check --output json 2>&1 || true
```

If `shopify theme check` is not available (Shopify CLI not installed), tell the user:
"Shopify CLI is not installed. Install it with `npm install -g @shopify/cli` then try again."

### Step 2: Categorize Results

Group findings by severity:

**🔴 Errors** — Must fix. These will cause problems in production.
**🟡 Warnings** — Should fix. Best practice violations.
**🔵 Suggestions** — Nice to fix. Minor improvements.

### Step 3: Report

```text
## Theme Check Results

🔴 Errors: [N]
🟡 Warnings: [N]
🔵 Suggestions: [N]

### Errors (must fix)
[List each with file path, line number, and description]

### Warnings (should fix)
[List each with file path, line number, and description]

### Suggestions (nice to fix)
[List each grouped by category]
```

### Step 4: If Feature Name Provided

If $ARGUMENTS is not empty, filter results to only show issues in files related
to the feature. Still show a count of total issues across the theme.

```text
## Theme Check — $ARGUMENTS

Feature files: [N] issues
  🔴 [N] errors | 🟡 [N] warnings | 🔵 [N] suggestions

Full theme: [N] total issues (showing only feature-related below)
```

### Step 5: Custom Performance Checks (CWV Guard)

After `shopify theme check`, scan for violations of CLAUDE.md Performance Rules
that the linter doesn't catch. Scan feature files (or all sections if no $ARGUMENTS):

**5.1 — Images:** Flag missing `loading` attr, `loading="lazy"` on first section
(LCP harm), missing `fetchpriority="high"` on above-fold sections, missing
`width`/`height`, manual `<img>` tags that should use `image_tag` filter.

**5.2 — JavaScript:** Flag render-blocking `<script>` (no `defer`/`async`/`type="module"`),
inline scripts over 50 lines.

**5.3 — CSS:** Flag `@import` (render-blocking chain), unscoped selectors (global leaks).

**5.4 — Liquid:** Flag `{% include %}` (use `{% render %}`), `all_products['handle']`
(slow), missing `{%- -%}` whitespace control.

Report custom checks separately:

```text
## Custom Performance Checks (CWV Guard)

🔴 Errors: [N]
🟡 Warnings: [N]
🔵 Suggestions: [N]

### Image Loading
[findings]

### JavaScript Loading
[findings]

### CSS
[findings]

### Liquid
[findings]
```

### Step 6: Quick Fixes

For each error (from both `shopify theme check` and custom checks), suggest the fix:
- What line to change
- What to change it to
- Why

Ask: "Want me to fix the errors automatically?"

$ARGUMENTS
