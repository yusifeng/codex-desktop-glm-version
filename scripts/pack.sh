#!/usr/bin/env bash
# Pack the app tree into shell/ChatGPT.app/Contents/Resources/app.asar.
# Rebuilds app/**/*.js from src/ first, so what gets packed always matches
# the sources. The shell has EmbeddedAsarIntegrityValidation=0, so a modified
# asar is accepted.
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/build.mjs

R=shell/ChatGPT.app/Contents/Resources
[[ -d "$R" ]] || ./scripts/setup-shell.sh

rm -rf "$R/app" "$R/app.asar" "$R/app.asar.unpacked"
# Same unpacked set as the official build (native modules + helpers).
npx -y @electron/asar pack app "$R/app.asar" \
  --unpack '*.node' \
  --unpack-dir '{node_modules/@worklouder/device-kit-oai,node_modules/better-sqlite3,node_modules/node-pty,node_modules/objc-js}'
echo "packed: $R/app.asar"
