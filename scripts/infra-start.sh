#!/usr/bin/env bash
# Start dev infra (postgres + redis) via docker-compose, but first detect any
# other process holding the ports and offer to stop it.
set -euo pipefail

cd "$(dirname "$0")/.."

PORTS=(5432 6379)
PROJECT_NAME="starter-saas"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 1; }
}
require docker

# 1. Find conflicting docker containers on each port (excluding our own stack).
conflict=0
for port in "${PORTS[@]}"; do
  ids=$(docker ps --filter "publish=$port" --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Ports}}' || true)
  if [ -n "$ids" ]; then
    while IFS='|' read -r id name image ports; do
      [ -z "$id" ] && continue
      if [[ "$name" == ${PROJECT_NAME}-* ]]; then
        continue
      fi
      echo "[infra:start] port $port held by docker container:"
      echo "  id:    $id"
      echo "  name:  $name"
      echo "  image: $image"
      echo "  ports: $ports"
      read -rp "stop and remove this container? [y/N] " ans
      if [[ "$ans" =~ ^[Yy]$ ]]; then
        docker stop "$id" >/dev/null
        echo "[infra:start] stopped $name"
      else
        echo "[infra:start] aborted — port $port still in use"
        conflict=1
      fi
    done <<< "$ids"
  fi
done

# 2. Find non-docker processes holding the ports (lsof if available).
for port in "${PORTS[@]}"; do
  pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)
  elif command -v ss >/dev/null 2>&1; then
    pid=$(ss -lptn "sport = :$port" 2>/dev/null | awk -F'pid=' 'NR>1{split($2,a,","); print a[1]; exit}' || true)
  fi
  if [ -n "$pid" ] && ! docker ps -q --filter "publish=$port" | grep -q .; then
    name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "?")
    echo "[infra:start] port $port held by host process: pid=$pid ($name)"
    echo "[infra:start] not killing host processes — stop it manually, then rerun."
    conflict=1
  fi
done

if [ $conflict -ne 0 ]; then
  exit 1
fi

# 3. All clear — bring up our compose stack.
docker compose up -d
echo "[infra:start] done"
docker compose ps
