#!/bin/bash
# Block commits that include settings_data.json (store-specific configuration)
# Exit 0 = allow, Exit 2 = block (stderr sent to Claude as feedback)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
AUDIT_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/audit.log"

if echo "$COMMAND" | grep -q "git commit"; then
  if git diff --cached --name-only | grep -q "config/settings_data.json"; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|block-settings-data|FAIL|${SESSION}|settings_data.json staged for commit" >> "$AUDIT_LOG"
    echo "Blocked: config/settings_data.json is protected. Unstage it with: git reset HEAD config/settings_data.json" >&2
    exit 2
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|block-settings-data|PASS|${SESSION}|commit clean" >> "$AUDIT_LOG"
fi

exit 0
