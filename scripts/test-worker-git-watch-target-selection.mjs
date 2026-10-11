import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { selectGitWatchTargetsForMetadataRefresh } = require("../app/.vite/build/worker/git-watch-paths.js");
const targets = [
  { watchPath: "/repo", metadataDirectory: { missing: false } },
  { watchPath: "/other", metadataDirectory: { missing: false } },
  { watchPath: "/repo/no-metadata", metadataDirectory: null },
];
const isWithin = (root, candidate) => candidate === root || candidate.startsWith(`${root}/`);

assert.deepEqual(selectGitWatchTargetsForMetadataRefresh(targets, ["/repo"], isWithin), [targets[0]]);
assert.deepEqual(selectGitWatchTargetsForMetadataRefresh(targets, ["/missing"], isWithin), []);
assert.deepEqual(selectGitWatchTargetsForMetadataRefresh(targets, ["/repo", "/other"], isWithin), [targets[0], targets[1]]);

console.log("3 worker git watch target selection assertions passed");
