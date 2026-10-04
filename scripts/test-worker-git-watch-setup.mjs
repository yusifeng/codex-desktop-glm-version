import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { scheduleGitWatchSetup } = createRequire(import.meta.url)(
  "../app/.vite/build/worker/git-watch-setup.js",
);

let releaseDependency;
const dependency = new Promise((resolve) => { releaseDependency = resolve; });
const events = [];
let current = true;
let active;
const deps = {
  hostKey: "local",
  watchKey: "local|repo",
  hostIsLocal: true,
  commonDir: "/repo/.git",
  indexPath: (commonDir) => `${commonDir}/index`,
  statIndex: async (path) => { events.push(["stat", path]); return { size: 2048 }; },
  bucketIndexSize: (size) => events.push(["bucket", size]),
  isCurrent: () => current,
  startWatcher: async () => { events.push("start"); },
  clearOriginQueries: () => events.push("clear-origin"),
  markReady: () => events.push("ready"),
  closeWatch: async () => { events.push("close"); },
  getActiveSetup: () => active,
  setActiveSetup: (value) => { active = value; },
  clearActiveSetup: (value) => { if (active === value) active = undefined; },
  setStartTrace: (trace) => events.push(["trace", trace]),
  getTrace: () => "trace-1",
};

const setup = scheduleGitWatchSetup(dependency, deps);
assert.deepEqual(events.slice(0, 1), [["trace", "trace-1"]]);
releaseDependency();
await setup;
assert.equal(events.some((event) => Array.isArray(event) && event[0] === "stat" && event[1] === "/repo/.git/index"), true);
assert.equal(events.includes("start"), true);
assert.equal(events.includes("clear-origin"), true);
assert.equal(events.includes("ready"), true);
await Promise.resolve();
assert.equal(active, undefined);

current = false;
const stale = scheduleGitWatchSetup(undefined, deps);
await stale;
assert.equal(events.includes("close"), true);

let rejected = false;
const failing = scheduleGitWatchSetup(undefined, {
  ...deps,
  isCurrent: () => true,
  startWatcher: async () => { throw new Error("boom"); },
});
await assert.rejects(failing, /boom/);
rejected = true;
assert.equal(rejected, true);
assert.equal(events.filter((event) => event === "close").length >= 2, true);

console.log("11 git watch setup assertions passed");
