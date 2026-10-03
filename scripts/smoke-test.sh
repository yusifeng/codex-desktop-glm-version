#!/usr/bin/env bash
# 冒烟测试：打包重写后的应用并启动若干秒，确认主进程没有崩溃。
#
# 用独立的 Electron profile（Codex (local-src)），不影响官方安装版。
# 用法：./scripts/smoke-test.sh [秒数，默认 15]
set -euo pipefail
cd "$(dirname "$0")/.."

DURATION="${1:-15}"

case "$DURATION" in
  ''|*[!0-9]*) echo "用法: $0 [持续秒数]" >&2; exit 2 ;;
esac

./scripts/pack.sh

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
# 冒烟测试用独立 profile：避免与正在运行的官方版/开发版实例争单实例锁。
export CODEX_ELECTRON_USER_DATA_PATH="$HOME/Library/Application Support/Codex (smoke-test)"

APP=shell/ChatGPT.app/Contents/MacOS/ChatGPT
LOG="$CODEX_ELECTRON_USER_DATA_PATH/smoke-test.log"
mkdir -p "$CODEX_ELECTRON_USER_DATA_PATH"

echo "启动应用（${DURATION}s）..."
"$APP" --user-data-dir="$CODEX_ELECTRON_USER_DATA_PATH" >"$LOG" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true; wait $PID 2>/dev/null || true' EXIT

sleep "$DURATION"

if ! kill -0 "$PID" 2>/dev/null; then
  echo "FAIL: 进程提前退出。日志尾部："
  tail -30 "$LOG"
  exit 1
fi

if grep -Eiq 'fatal|uncaught exception|segmentation fault|module not found' "$LOG"; then
  echo "FAIL: 日志包含启动致命错误："
  grep -Ein 'fatal|uncaught exception|segmentation fault|module not found' "$LOG" | tail -20
  exit 1
fi

echo "OK: 进程存活 ${DURATION}s。日志尾部："
tail -15 "$LOG" || true
