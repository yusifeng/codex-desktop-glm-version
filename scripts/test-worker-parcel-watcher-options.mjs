import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildParcelWatcherOptions } = require("../app/.vite/build/worker/parcel-watcher-options.js");
const pathApi = { relative(from, to) { return to.startsWith(`${from}/`) ? to.slice(from.length + 1) : to; } };

assert.deepEqual(buildParcelWatcherOptions(pathApi, "/repo", ["/repo/node_modules", "cache"]), {
  backend: "inotify",
  ignore: ["/repo/node_modules", "cache"],
});
assert.deepEqual(buildParcelWatcherOptions(pathApi, "/repo", ["/repo/foo*", "a[b]", "plain"]), {
  backend: "inotify",
  ignore: ["foo\\*{,/**}", "a\\[b\\]{,/**}", "plain"],
});
assert.deepEqual(buildParcelWatcherOptions(pathApi, "/repo", []), { backend: "inotify", ignore: [] });

console.log("5 worker parcel watcher option assertions passed");
