import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parsePathStatusOutput } = require(
  "../app/.vite/build/worker/git-path-status-policy.js",
);

let assertions = 0;
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(parsePathStatusOutput(" M tracked.txt\0?? new.txt\0!! ignored.txt\0x\0"), {
  trackedPaths: ["tracked.txt"],
  untrackedPaths: ["new.txt"],
  ignoredPaths: ["ignored.txt"],
});
deepEqual(parsePathStatusOutput("?? one\0?? two\0"), {
  trackedPaths: [], untrackedPaths: ["one", "two"], ignoredPaths: [],
});
deepEqual(parsePathStatusOutput(""), { trackedPaths: [], untrackedPaths: [], ignoredPaths: [] });

console.log(`${assertions} worker git path status policy assertions passed`);
