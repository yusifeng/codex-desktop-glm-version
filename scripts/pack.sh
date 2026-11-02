#!/usr/bin/env bash
# Pack the app tree into shell/ChatGPT.app/Contents/Resources/app.asar.
# Rebuilds app/**/*.js from src/ first, so what gets packed always matches
# the sources. The shell has EmbeddedAsarIntegrityValidation=0, so a modified
# asar is accepted.
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/build.mjs
node scripts/build-renderer.mjs

# Semantic main-process modules keep these two upstream libraries external.
# Copy their installed package trees into the app payload before creating the
# asar so Node's ESM resolver can load them at runtime.
mkdir -p app/node_modules
for package_name in agent-base capnweb debug immer ip-address ms smart-buffer smol-toml socks socks-proxy-agent ws yaml zod; do
  rm -rf "app/node_modules/$package_name"
  cp -R "node_modules/$package_name" "app/node_modules/$package_name"
done

R=shell/ChatGPT.app/Contents/Resources
[[ -d "$R" ]] || ./scripts/setup-shell.sh

rm -rf "$R/app" "$R/app.asar" "$R/app.asar.unpacked"
# Same unpacked set as the official build (native modules + helpers).
npx -y @electron/asar pack app "$R/app.asar" \
  --unpack '*.node' \
  --unpack-dir '{node_modules/@worklouder/device-kit-oai,node_modules/better-sqlite3,node_modules/node-pty,node_modules/objc-js}'
echo "packed: $R/app.asar"
