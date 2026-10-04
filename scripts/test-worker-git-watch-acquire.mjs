import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { acquireGitWatch, watchIsOpen } = require("../app/.vite/build/worker/git-watch-acquire.js");

assert.equal(watchIsOpen({ closingPromise: null }), true);
assert.equal(watchIsOpen({ closingPromise: Promise.resolve() }), false);

const calls = [];
const controller = new AbortController();
const watch = { refCount: 0, closingPromise: null, startPromise: Promise.resolve() };
const release = await acquireGitWatch({
  metadata: { root: "/repo", commonDir: "/common" },
  host: { id: "host" },
  signal: controller.signal,
  getWatchKey: (root, host) => `${host.id}:${root}`,
  getWatch: (key) => { calls.push(["get", key]); return watch; },
  createWatch: () => { throw new Error("must reuse open watch"); },
  releaseWatch: (...args) => calls.push(["release", ...args]),
});
assert.equal(watch.refCount, 1);
release();
release();
assert.equal(calls.filter(([name]) => name === "release").length, 1);

const aborted = new AbortController();
aborted.abort();
let created = false;
const noop = await acquireGitWatch({
  metadata: { root: "/repo", commonDir: "/common" }, host: { id: "host" }, signal: aborted.signal,
  getWatchKey: () => "key", getWatch: () => null,
  createWatch: () => { created = true; return watch; }, releaseWatch: () => { throw new Error("not released"); },
});
noop();
assert.equal(created, false);

let rejectRelease = 0;
await assert.rejects(acquireGitWatch({
  metadata: { root: "/repo", commonDir: "/common" }, host: { id: "host" },
  getWatchKey: () => "key", getWatch: () => ({ closingPromise: Promise.resolve(), refCount: 0 }),
  createWatch: () => ({ refCount: 0, startPromise: Promise.reject(new Error("start failed")) }),
  releaseWatch: () => { rejectRelease += 1; },
}), /start failed/);
assert.equal(rejectRelease, 1);

console.log("8 worker git watch acquire assertions passed");
