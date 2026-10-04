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
const { getCanonicalHistoryEntries, findCanonicalHistoryIslandIndex } = await import(`${output}?test=${Date.now()}`);
const complete = { islands: [{ entries: ["old"], newerBoundary: { status: "exhausted" } }] };
assert.deepEqual(getCanonicalHistoryEntries(complete)?.entries, ["old"]);
assert.equal(
  getCanonicalHistoryEntries({ islands: [{ newerBoundary: { status: "loading" } }] }),
  null,
);
assert.equal(getCanonicalHistoryEntries({ islands: [] }), null);
assert.equal(getCanonicalHistoryEntries(null), null);
const boundary = { status: "available", boundaryId: "island-1:older", progressKey: "p1" };
const islands = [{ id: "island-1", entries: [], olderBoundary: boundary, newerBoundary: { status: "loading" } }];
assert.equal(findCanonicalHistoryIslandIndex(islands, { islandId: "island-1", edge: "older", boundaryId: "island-1:older", progressKey: "p1" }), 0);
assert.equal(findCanonicalHistoryIslandIndex(islands, { edge: "older", boundaryId: "island-1:older", progressKey: "p1" }), 0);
assert.equal(findCanonicalHistoryIslandIndex(islands, { edge: "newer", boundaryId: "island-1:newer", progressKey: "p1" }), null);
assert.equal(findCanonicalHistoryIslandIndex([{ ...islands[0] }, { ...islands[0], id: "island-2" }], { edge: "older", boundaryId: "island-1:older", progressKey: "p1" }), null);
console.log("app-initial canonical history: 8 assertions passed");
