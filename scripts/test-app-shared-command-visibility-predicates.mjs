#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-command-visibility-predicates.mjs");
await build({ entryPoints: [path.join(root, "src/renderer/app-shared/runtime/command-visibility-predicates.ts")], bundle: true, format: "esm", platform: "node", outfile: output });
const { hasRequiredCommandAccess, isRealtimeVoiceCommand } = await import(`${output}?test=${Date.now()}`);
assert.equal(isRealtimeVoiceCommand("composer.startVoiceMode"), true);
assert.equal(isRealtimeVoiceCommand("realtimeVoice.custom"), true);
assert.equal(isRealtimeVoiceCommand("composer.startDictation"), false);
assert.equal(hasRequiredCommandAccess({ requiredAccess: "codexLocal" }, { codexLocal: false, workLocal: true }), false);
assert.equal(hasRequiredCommandAccess({ requiredAccess: "codexOrWorkLocal" }, { codexLocal: false, workLocal: true }), true);
assert.equal(hasRequiredCommandAccess({}, { codexLocal: false, workLocal: false }), true);
console.log("6 app-shared command visibility assertions passed");
