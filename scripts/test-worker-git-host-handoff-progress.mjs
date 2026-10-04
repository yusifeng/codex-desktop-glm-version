import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-host-handoff-progress-"));
const out = path.join(dir, "progress.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-host-handoff-progress.ts")], outfile: out, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createHostHandoffProgress } = createRequire(import.meta.url)(out);
const events = [];
const state = createHostHandoffProgress((step, status) => events.push([step, status]));
assert.equal(state.activeStep, null);
state.progress("prepare-host-transfer", "started");
assert.equal(state.activeStep, "prepare-host-transfer");
state.progress("prepare-host-transfer", "completed");
assert.equal(state.activeStep, null);
state.progress("transfer-host-artifacts", "started");
state.failActive();
assert.equal(state.activeStep, null);
assert.deepEqual(events, [
  ["prepare-host-transfer", "started"],
  ["prepare-host-transfer", "completed"],
  ["transfer-host-artifacts", "started"],
  ["transfer-host-artifacts", "failed"],
]);
state.progress("first", "started");
state.progress("second", "started");
state.progress("first", "completed");
assert.equal(state.activeStep, "second");
state.progress("second", "completed");
assert.equal(state.activeStep, null);
state.failActive();
assert.equal(events.length, 8);
console.log("10 worker host handoff progress assertions passed");
