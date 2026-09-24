#!/usr/bin/env bash
# (Re)create shell/ChatGPT.app: an APFS clone of the installed app (the
# "Owl" Electron shell the app requires), then pack ./app into it.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC_APP="${SRC_APP:-/Applications/ChatGPT.app}"
mkdir -p shell
rm -rf shell/ChatGPT.app
cp -Rc "$SRC_APP" shell/ChatGPT.app
xattr -dr com.apple.quarantine shell/ChatGPT.app 2>/dev/null || true
./scripts/pack.sh
