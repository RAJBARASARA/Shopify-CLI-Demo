#!/bin/bash
# Block creating feature/bugfix branches if main hasn't been pulled.
# The live theme is connected to main via GitHub integration — always pull first.
# Exit 0 = allow, Exit 2 = block

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
AUDIT_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/audit.log"

if echo "$COMMAND" | grep -qE 'git (checkout -b|switch -c) (feature|bugfix)/'; then
  if [ ! -f "/tmp/claude-main-pulled-$SESSION" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|check-main-pulled|FAIL|${SESSION}|branch creation blocked — main not pulled" >> "$AUDIT_LOG"
    echo "Blocked: Run 'git pull origin main' before creating a feature/bugfix branch. The live theme is connected to main — always pull first to avoid overwriting others' changes." >&2
    exit 2
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|check-main-pulled|PASS|${SESSION}|main pulled, branch creation allowed" >> "$AUDIT_LOG"
fi

exit 0
