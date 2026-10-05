import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "renderer-merge-conflict-state-"));
const output = path.join(temp, "merge-conflict-state.mjs");
try {
  await build({
    absWorkingDir: root,
    entryPoints: ["src/renderer/app-shared/runtime/merge-conflict-state.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: output,
  });
  const { getMergeConflictState } = await import(`${output}?test=${Date.now()}`);
  assert.equal(getMergeConflictState({ mergeable: "CONFLICTING" }), "conflicts");
  assert.equal(getMergeConflictState({ mergeStateStatus: "DIRTY" }), "conflicts");
  assert.equal(getMergeConflictState({ mergeable: "UNKNOWN" }), "unknown");
  assert.equal(getMergeConflictState({ mergeable: "MERGEABLE" }), null);
  assert.equal(getMergeConflictState({ mergeable: "conflicting", mergeStateStatus: "clean" }), "conflicts");
  assert.equal(getMergeConflictState(null), null);
  console.log("renderer merge-conflict-state: 6 assertions passed");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
