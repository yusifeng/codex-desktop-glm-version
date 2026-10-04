#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/renderer/codex-micro-commands/index.ts"), "utf8");
assert.match(source, /from "\.\.\/app-initial\/runtime\/electron-command-policy"/);
assert.doesNotMatch(source, /mEt\s+as\s+isElectronCommandEnabled/);
const output = path.join(root, ".tmp-test-app-initial-electron-command-policy.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/electron-command-policy.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
  logLevel: "silent",
});
const { isElectronCommandEnabled, ELECTRON_COMMAND_IDS } = await import(`${output}?test=${Date.now()}`);
assert.equal(isElectronCommandEnabled("newTask"), true);
assert.equal(isElectronCommandEnabled("toggleTerminal"), true);
assert.equal(isElectronCommandEnabled("unknownCommand"), false);
assert.equal(ELECTRON_COMMAND_IDS.size, 25);
console.log("4 app-initial electron command policy assertions passed");
