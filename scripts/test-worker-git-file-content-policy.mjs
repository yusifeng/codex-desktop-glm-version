import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const {
  isGitFilePathOutsideRepository,
  resolveGitFileObjectRef,
} = require("../app/.vite/build/worker/git-file-content-policy.js");

const posix = { isAbsolute: path.posix.isAbsolute };
assert.equal(isGitFilePathOutsideRepository("src/a.txt", posix), false);
assert.equal(isGitFilePathOutsideRepository("../secret", posix), true);
assert.equal(isGitFilePathOutsideRepository("..\\secret", posix), true);
assert.equal(isGitFilePathOutsideRepository("/etc/passwd", posix), true);
assert.equal(resolveGitFileObjectRef("src\\a.txt", "\\", "head"), "HEAD:src/a.txt");
assert.equal(resolveGitFileObjectRef("src/a.txt", "/"), ":src/a.txt");
assert.equal(resolveGitFileObjectRef(".", "/"), null);
assert.equal(resolveGitFileObjectRef("../secret", "/"), null);
console.log("8 worker Git file content policy assertions passed");
