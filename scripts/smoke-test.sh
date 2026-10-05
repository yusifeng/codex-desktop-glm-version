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
# 冒烟测试默认使用一次性 profile：避免旧 smoke 进程或单实例锁把新包的
# 启动请求转发到历史实例。调试时可显式传入固定路径保留 profile。
if [[ -n "${CODEX_SMOKE_USER_DATA_PATH:-}" ]]; then
  export CODEX_ELECTRON_USER_DATA_PATH="$CODEX_SMOKE_USER_DATA_PATH"
else
  export CODEX_ELECTRON_USER_DATA_PATH="$(mktemp -d "${TMPDIR:-/tmp}/codex-smoke.XXXXXX")"
fi

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

wait_for_log() {
  local pattern="$1"
  local label="$2"
  local deadline=$((SECONDS + 15))
  while (( SECONDS < deadline )); do
    if grep -q "$pattern" "$LOG"; then
      return 0
    fi
    if ! kill -0 "$PID" 2>/dev/null; then
      echo "FAIL: 进程在等待${label}时退出。日志尾部："
      tail -30 "$LOG"
      exit 1
    fi
    sleep 1
  done
  echo "FAIL: ${label}超时。日志尾部："
  tail -30 "$LOG"
  exit 1
}

if grep -Eiq 'fatal|uncaught exception|segmentation fault|module not found' "$LOG"; then
  echo "FAIL: 日志包含启动致命错误："
  grep -Ein 'fatal|uncaught exception|segmentation fault|module not found' "$LOG" | tail -20
  exit 1
fi

wait_for_log 'window main frame finished load' '主窗口 HTML 主 frame 加载'
wait_for_log 'initialize_handshake_result' 'app-server 核心 RPC 初始化握手'

if grep -Eiq 'renderer.*(fatal|crash|uncaught)|render-process-gone.*(crashed|killed)' "$LOG"; then
  echo "FAIL: renderer 出现致命错误："
  grep -Ein 'renderer.*(fatal|crash|uncaught)|render-process-gone.*(crashed|killed)' "$LOG" | tail -20
  exit 1
fi

echo "OK: 进程存活 ${DURATION}s。日志尾部："
tail -15 "$LOG" || true
