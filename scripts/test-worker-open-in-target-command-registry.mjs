import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "open-target-command-registry-"));
const output = path.join(tempDir, "registry.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/open-in-target-command-registry.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createOpenInTargetCommandRegistry, getOpenInTargetCommandKey } = createRequire(import.meta.url)(output);

const first = { target: "cursor", customTarget: { command: "cursor" } };
assert.equal(getOpenInTargetCommandKey(first), JSON.stringify(["cursor", "cursor"]));
let detectCount = 0;
let resolveDetection;
const registry = createOpenInTargetCommandRegistry(async (request) => {
  detectCount += 1;
  if (request.target === "fail") throw new Error("detect failed");
  if (request.target === "slow" && request.customTarget?.command === "one") return new Promise((resolve) => { resolveDetection = resolve; });
  return `${request.target}:${request.customTarget?.command ?? "default"}`;
});
const slowA = registry.getTargetCommand({ target: "slow", customTarget: { command: "one" } });
const slowB = registry.getTargetCommand({ target: "slow", customTarget: { command: "one" } });
assert.equal(slowA, slowB);
assert.equal(detectCount, 1);
resolveDetection("slow:one");
assert.equal(await slowA, "slow:one");
assert.equal(await registry.getTargetCommand({ target: "slow", customTarget: { command: "two" } }), "slow:two");
assert.equal(detectCount, 2);
await assert.rejects(registry.getTargetCommand({ target: "fail" }), /detect failed/);
await assert.rejects(registry.getTargetCommand({ target: "fail" }), /detect failed/);
assert.equal(detectCount, 4);
console.log("test-worker-open-in-target-command-registry: 7 assertions passed");
