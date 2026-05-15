#!/usr/bin/env bash
# Start dev infra (postgres + redis) via docker-compose, but first detect any
# other process holding the ports and offer to stop it.
#
# Flags:
#   -y, --force, --yes : auto-confirm container stops (non-interactive)

set -uo pipefail

cd "$(dirname "$0")/.."

PORTS=(5432 6379)
PROJECT_NAME="vibestack"
FORCE=0
for arg in "$@"; do
  case "$arg" in
    -y|--force|--yes) FORCE=1 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "missing: docker" >&2
  exit 1
fi

# Read a y/n prompt from /dev/tty so pnpm/turbo can't swallow stdin.
ask() {
  local msg="$1"
  if [ "$FORCE" -eq 1 ]; then
    echo "y"
    return 0
  fi
  if [ -r /dev/tty ] && [ -w /dev/tty ]; then
    local ans=""
    printf "%s" "$msg" > /dev/tty
    IFS= read -r ans < /dev/tty || ans=""
    printf "%s" "$ans"
    return 0
  fi
  printf ""
}

conflict=0

# 1. Docker containers on the ports (excluding our own stack).
for port in "${PORTS[@]}"; do
  ids=$(docker ps --filter "publish=$port" --format '{{.ID}}|{{.Names}}|{{.Image}}|{{.Ports}}' || true)
  [ -z "$ids" ] && continue
  while IFS='|' read -r id name image ports; do
    [ -z "$id" ] && continue
    [[ "$name" == ${PROJECT_NAME}-* ]] && continue
    echo "[infra:start] port $port held by docker container:"
    echo "  id:    $id"
    echo "  name:  $name"
    echo "  image: $image"
    echo "  ports: $ports"
    ans=$(ask "stop this container (it will NOT be removed)? [y/N] ")
    if [[ "$ans" =~ ^[Yy]$ ]]; then
      docker stop "$id" >/dev/null
      echo "[infra:start] stopped $name"
    else
      echo "[infra:start] kept $name — to stop manually:"
      echo "  docker stop $id"
      echo "[infra:start] then rerun:  pnpm infra:start"
      conflict=1
    fi
  done <<< "$ids"
done

# 2. Non-docker host processes holding the ports.
for port in "${PORTS[@]}"; do
  pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)
  elif command -v ss >/dev/null 2>&1; then
    pid=$(ss -lptn "sport = :$port" 2>/dev/null | awk -F'pid=' 'NR>1{split($2,a,","); print a[1]; exit}' || true)
  fi
  if [ -n "$pid" ]; then
    docker_owns=$(docker ps -q --filter "publish=$port" || true)
    if [ -z "$docker_owns" ]; then
      name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "?")
      echo "[infra:start] port $port held by host process: pid=$pid ($name)"
      echo "[infra:start] not killing host processes — stop it manually, then rerun."
      conflict=1
    fi
  fi
done

if [ $conflict -ne 0 ]; then
  exit 1
fi

docker compose up -d
echo "[infra:start] done"
docker compose ps
