#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="${BACKEND_DIR:-$FRONTEND_DIR/../childcare-assistant-backend}"

DEV_BYPASS_TOKEN="${DEV_BYPASS_TOKEN:-dev-e2e-token}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
FRONT_URL="${FRONT_URL:-http://127.0.0.1:5173}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_LOG="${BACKEND_LOG:-/tmp/community-policy-backend.log}"
FRONTEND_LOG="${FRONTEND_LOG:-/tmp/community-policy-frontend.log}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-$API_BASE_URL}"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "backend directory not found: $BACKEND_DIR"
  exit 1
fi

log() {
  printf '[community-e2e-local] %s\n' "$*"
}

is_listening() {
  local port="$1"
  lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
}

BACKEND_PID=""
FRONTEND_PID=""
STARTED_BACKEND=0
STARTED_FRONTEND=0

cleanup() {
  local status=$?
  trap - EXIT

  if [[ "$STARTED_FRONTEND" -eq 1 && -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
    wait "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ "$STARTED_BACKEND" -eq 1 && -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
    wait "$BACKEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ "$status" -ne 0 ]]; then
    log "failed. check logs:"
    log "backend: $BACKEND_LOG"
    log "frontend: $FRONTEND_LOG"
  fi
  exit "$status"
}

trap cleanup EXIT

if ! is_listening "$BACKEND_PORT"; then
  log "start backend on :$BACKEND_PORT"
  (
    cd "$BACKEND_DIR"
    AUTH_DEV_BYPASS_TOKEN="$DEV_BYPASS_TOKEN" \
    SERVER_PORT="$BACKEND_PORT" \
    ./gradlew bootRun >"$BACKEND_LOG" 2>&1
  ) &
  BACKEND_PID=$!
  STARTED_BACKEND=1
else
  log "reuse backend on :$BACKEND_PORT"
fi

if ! is_listening "$FRONTEND_PORT"; then
  log "start frontend on :$FRONTEND_PORT"
  (
    cd "$FRONTEND_DIR"
    VITE_API_BASE_URL="$VITE_API_BASE_URL" \
    npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1
  ) &
  FRONTEND_PID=$!
  STARTED_FRONTEND=1
else
  log "reuse frontend on :$FRONTEND_PORT"
fi

log "run e2e"
(
  cd "$FRONTEND_DIR"
  API_BASE_URL="$API_BASE_URL" \
  FRONT_URL="$FRONT_URL" \
  DEV_BYPASS_TOKEN="$DEV_BYPASS_TOKEN" \
  ./scripts/community-policy-e2e.sh
)
log "done"
