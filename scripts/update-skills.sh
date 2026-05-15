#!/usr/bin/env bash
# Refresh the upstream-managed skills under .claude/skills/ from mattpocock/skills.
# Project-local skills (setup, plus anything you've added) are preserved.

set -euo pipefail

UPSTREAM="https://github.com/mattpocock/skills.git"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/.claude/skills"
TMP_DIR="$(mktemp -d)"

UPSTREAM_SKILLS=(
  grill-with-docs
  grill-me
  to-prd
  to-issues
  triage
  tdd
  diagnose
  improve-codebase-architecture
  prototype
  write-a-skill
)

echo "→ cloning $UPSTREAM"
git clone --depth 1 "$UPSTREAM" "$TMP_DIR/skills" >/dev/null

for skill in "${UPSTREAM_SKILLS[@]}"; do
  src="$TMP_DIR/skills/$skill"
  if [ ! -d "$src" ]; then
    echo "  ! upstream missing $skill — skipping"
    continue
  fi
  rm -rf "$SKILLS_DIR/$skill"
  cp -r "$src" "$SKILLS_DIR/$skill"
  echo "  ✓ $skill"
done

rm -rf "$TMP_DIR"
echo "done. review with: git diff -- .claude/skills/"
