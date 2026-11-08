#!/bin/bash
# After git pull completes on main, mark the session as synced.
# This allows check-theme-sync.sh to pass for branch creation.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
AUDIT_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/audit.log"

if echo "$COMMAND" | grep -q 'git pull'; then
  touch "/tmp/claude-main-pulled-$SESSION"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|mark-main-pulled|PASS|${SESSION}|git pull completed, session marked synced" >> "$AUDIT_LOG"
fi

exit 0
