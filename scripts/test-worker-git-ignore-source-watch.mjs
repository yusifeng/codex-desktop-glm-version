import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { reconcileGitIgnoreSourceWatches } = require("../app/.vite/build/worker/git-ignore-source-watch.js");

const calls = [];
const oldTarget = { handlers: [], retryTimer: null };
const context = {
  changedIgnoreSourcePaths: new Set(["/repo/.gitignore"]),
  ignoreSourceWatches: new Map([["/repo/.gitignore", { target: oldTarget, handler: null, paths: new Set(["/repo/a"]) }]]),
  watchTargets: [oldTarget],
  pathApi: { relative: (root, path) => path.startsWith(root) ? path.slice(root.length + 1) : `../${path}`, isAbsolute: (path) => path.startsWith("/") },
  isWithinPath: (api, root, path) => path === root || path.startsWith(`${root}/`),
  disposeSession: async (target) => calls.push(["dispose", target]),
  addWatchHandler: (path, recursive, handler) => { const target = { path, recursive, handler, handlers: [handler], retryTimer: null }; context.watchTargets.push(target); return target; },
  tryStartWatchSession: async (target) => calls.push(["start", target.path]),
};
context.ignoreSourceWatches.get("/repo/.gitignore").handler = oldTarget.handlers[0] = { changeType: "config" };
const changed = await reconcileGitIgnoreSourceWatches(context, new Map([["/repo/.gitignore", new Set(["/repo/b"])], ["/repo/.git/info/exclude", new Set(["/repo/c"])]]));
assert.equal(changed, true);
assert.equal(context.changedIgnoreSourcePaths.size, 0);
assert.deepEqual([...context.ignoreSourceWatches.get("/repo/.gitignore").paths], ["/repo/b"]);
assert.equal(context.ignoreSourceWatches.has("/repo/.git/info/exclude"), true);
assert.equal(calls.some(([kind]) => kind === "start"), true);

console.log("5 worker git ignore-source watch assertions passed");
