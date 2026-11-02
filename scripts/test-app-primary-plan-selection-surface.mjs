#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const relative of ["src/renderer/plan-tab-content/index.ts", "src/renderer/plan-summary-item-content/index.ts"]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.match(source, /from "\.\.\/app-primary\/runtime\/plan-selection-surface"/);
  assert.doesNotMatch(source, /\bCt\s+as\s+/);
}
const output = path.join(root, ".tmp-test-app-primary-plan-selection-surface.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-primary/runtime/plan-selection-surface.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { PLAN_SELECTION_SURFACE_ATTRIBUTE } = await import(`${output}?test=${Date.now()}`);
assert.equal(PLAN_SELECTION_SURFACE_ATTRIBUTE, "data-plan-selection-surface");
console.log("5 app-primary plan selection surface assertions passed");
