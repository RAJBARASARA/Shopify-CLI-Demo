#!/bin/bash
# Block commits with hardcoded hex colors in section/snippet files.
# Enforces CLAUDE.md Design System Hard Rule: always use CSS custom properties.
# Exit 0 = allow, Exit 2 = block (stderr sent to Claude as feedback)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
AUDIT_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/audit.log"

if echo "$COMMAND" | grep -q "git commit"; then
  # Check staged section and snippet files for hardcoded hex colors
  VIOLATIONS=$(git diff --cached -- sections/ snippets/ | \
    grep -E '^\+.*#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})[^0-9a-fA-F]' | \
    grep -vE '(rgb\(var|rgba\(var|var\(--|\/\/|comment|schema)' || true)

  if [ -n "$VIOLATIONS" ]; then
    COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|block-hardcoded-colors|FAIL|${SESSION}|${COUNT} hardcoded hex colors found" >> "$AUDIT_LOG"
    echo "Blocked: Hardcoded hex colors found in section/snippet files." >&2
    echo "Use CSS custom properties instead (see CLAUDE.md Design System Hard Rules):" >&2
    echo "  Text: rgb(var(--text-color))" >&2
    echo "  Buttons: rgb(var(--primary-button-background))" >&2
    echo "  Borders: rgb(var(--border-color))" >&2
    echo "" >&2
    echo "Violations:" >&2
    echo "$VIOLATIONS" | head -5 >&2
    exit 2
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|block-hardcoded-colors|PASS|${SESSION}|no hardcoded colors" >> "$AUDIT_LOG"
fi

exit 0
