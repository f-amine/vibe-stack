#!/usr/bin/env bash
# Symlink each app/package .env to the repo root .env so a single file is
# the source of truth for all Next.js apps + Drizzle.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "missing .env at repo root — copy .env.example first" >&2
  exit 1
fi

for d in apps/web apps/marketing apps/admin packages/db; do
  rel="$(echo "$d" | sed 's|[^/]*|..|g')/.env"
  ln -sfn "$rel" "$d/.env"
  echo "linked $d/.env -> $rel"
done
