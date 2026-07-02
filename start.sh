#!/bin/bash
set -e

# Build the API server (idempotent — fast if nothing changed)
echo "[start] Building API server..."
pnpm --filter @workspace/api-server run build

# Clean up background processes on exit/interrupt
cleanup() {
  echo "[start] Shutting down..."
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null
  [ -n "$PHP_PID" ] && kill "$PHP_PID" 2>/dev/null
  wait "$API_PID" 2>/dev/null || true
  wait "$PHP_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start API server on port 8080 in background
echo "[start] Starting API server on port 8080..."
PORT=8080 pnpm --filter @workspace/api-server run start &
API_PID=$!

# Start PHP admin panel on port 6000 in background
echo "[start] Starting PHP admin panel on port 6000..."
php -S 0.0.0.0:6000 -t /home/runner/workspace/admin &
PHP_PID=$!

# Wait for API to be ready before starting frontend
echo "[start] Waiting for API to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/api/healthz > /dev/null 2>&1; then
    echo "[start] API is ready"
    break
  fi
  sleep 1
done

# Start frontend on port 5000 (foreground — workflow waits on this)
echo "[start] Starting frontend on port 5000..."
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/sports-app run dev
