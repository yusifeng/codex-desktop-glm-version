import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isPathWithinRoot } = require("../app/.vite/build/worker/git-path-containment.js");
const api = {
  sep: "/",
  relative(root, candidate) {
    if (candidate === root) return "";
    if (candidate.startsWith(`${root}/`)) return candidate.slice(root.length + 1);
    if (candidate === "/other") return "../other";
    return "/absolute";
  },
  isAbsolute(value) { return value.startsWith("/"); },
};
assert.equal(isPathWithinRoot("/repo", "/repo", { isLocal: true }, { local: api, posix: api }), true);
assert.equal(isPathWithinRoot("/repo", "/repo/src/file", { isLocal: true }, { local: api, posix: api }), true);
assert.equal(isPathWithinRoot("/repo", "/other", { isLocal: true }, { local: api, posix: api }), false);
assert.equal(isPathWithinRoot("/repo", "/repo/src/file", { isLocal: false }, { local: api, posix: api }), true);
assert.equal(isPathWithinRoot("/repo", "/other", { isLocal: false }, { local: api, posix: api }), false);
console.log("5 worker git path containment assertions passed");
