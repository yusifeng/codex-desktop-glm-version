import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  collectNonEmptySections,
  collectUntrackedDiffSections,
  defaultMaxBytes,
  defaultMaxConcurrency,
} = require("../app/.vite/build/worker/git-review-patch-sections.js");

let count = 0;
const equal = (...args) => { count += 1; assert.equal(...args); };
const deepEqual = (...args) => { count += 1; assert.deepEqual(...args); };

equal(defaultMaxBytes, 67_108_864);
equal(defaultMaxConcurrency, 8);
deepEqual(
  collectNonEmptySections([" one ", "", null], ["\n two\n", undefined, "   "]),
  ["one", "two"],
);

const signal = new AbortController().signal;
deepEqual(
  await collectUntrackedDiffSections(async () => { throw new Error("not called"); }, { success: false }, signal),
  { success: false, error: { type: "unknown" } },
);
deepEqual(
  await collectUntrackedDiffSections(async () => { throw new Error("not called"); }, { success: true, paths: [] }, signal),
  { success: true, sections: [] },
);

const releases = new Map();
const started = [];
const orderedPromise = collectUntrackedDiffSections(
  (path, receivedSignal) => {
    equal(receivedSignal, signal);
    started.push(path);
    return new Promise((resolve) => releases.set(path, resolve));
  },
  { success: true, paths: ["a", "b", "c"] },
  signal,
  { maxConcurrency: 2 },
);
await new Promise((resolve) => setImmediate(resolve));
deepEqual(started, ["a", "b"]);
releases.get("b")({ type: "success", unifiedDiff: "diff-b", unifiedDiffBytes: 6 });
await new Promise((resolve) => setImmediate(resolve));
deepEqual(started, ["a", "b", "c"]);
releases.get("c")({ type: "success", unifiedDiff: "   ", unifiedDiffBytes: 3 });
releases.get("a")({ type: "success", unifiedDiff: "diff-a", unifiedDiffBytes: 6 });
deepEqual(await orderedPromise, { success: true, sections: ["diff-a", "diff-b"] });

let reads = 0;
deepEqual(
  await collectUntrackedDiffSections(
    async (path) => {
      reads += 1;
      return path === "bad"
        ? { type: "error", error: { type: "read-failed" } }
        : { type: "success", unifiedDiff: path };
    },
    { success: true, paths: ["bad", "not-started"] },
    signal,
    { maxConcurrency: 1 },
  ),
  { success: false, error: { type: "read-failed" } },
);
equal(reads, 1);

deepEqual(
  await collectUntrackedDiffSections(
    async (path) => ({
      type: "success",
      unifiedDiff: path === "bytes" ? "x" : "12345",
      ...(path === "bytes" ? { unifiedDiffBytes: 4 } : {}),
    }),
    { success: true, paths: ["bytes", "length"] },
    signal,
    { maxBytes: 8, maxConcurrency: 1 },
  ),
  { success: false, error: { type: "diff-too-large", limitBytes: 8 } },
);

deepEqual(
  await collectUntrackedDiffSections(
    async () => ({ type: "success", unifiedDiff: "1234", unifiedDiffBytes: 4 }),
    { success: true, paths: ["exact", "limit"] },
    signal,
    { maxBytes: 8, maxConcurrency: 1 },
  ),
  { success: true, sections: ["1234", "1234"] },
);

console.log(`${count} worker git review patch section assertions passed`);
