#!/usr/bin/env bash
# Launch the rebuilt ChatGPT/Codex desktop app, reusing the account and
# config in ~/.codex.
#
# The app refuses stock Electron ("requires the Owl app shell"), so we run it
# inside a clone of the installed bundle (shell/ChatGPT.app) whose
# Resources/app.asar was replaced by our packed build. The shell's fuses
# allow this (OnlyLoadAppFromAsar=0, EmbeddedAsarIntegrityValidation=0).
set -euo pipefail
cd "$(dirname "$0")/.."

SHELL_APP="$PWD/shell/ChatGPT.app"
if [[ ! -d "$SHELL_APP" ]]; then
  ./scripts/setup-shell.sh
fi

# Account / config / sessions: the same ~/.codex used by the Codex CLI.
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
# Separate Electron profile so this can run alongside the installed app.
export CODEX_ELECTRON_USER_DATA_PATH="${CODEX_ELECTRON_USER_DATA_PATH:-$HOME/Library/Application Support/Codex (local-src)}"

exec "$SHELL_APP/Contents/MacOS/ChatGPT" --user-data-dir="$CODEX_ELECTRON_USER_DATA_PATH" "$@"
