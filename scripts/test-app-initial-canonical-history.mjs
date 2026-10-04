import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-app-initial-canonical-history.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-initial/runtime/canonical-history.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
  logLevel: "silent",
});
const { getCanonicalHistoryEntries } = await import(`${output}?test=${Date.now()}`);
const complete = { islands: [{ entries: ["old"], newerBoundary: { status: "exhausted" } }] };
assert.deepEqual(getCanonicalHistoryEntries(complete)?.entries, ["old"]);
assert.equal(
  getCanonicalHistoryEntries({ islands: [{ newerBoundary: { status: "loading" } }] }),
  null,
);
assert.equal(getCanonicalHistoryEntries({ islands: [] }), null);
assert.equal(getCanonicalHistoryEntries(null), null);
console.log("app-initial canonical history: 4 assertions passed");
