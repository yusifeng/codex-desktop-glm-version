import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildUntrackedSubmoduleDiff, buildUntrackedSymlinkDiff } = require(
  "../app/.vite/build/worker/git-review-file-diff-policy.js",
);
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const quote = (value) => `<${value}>`;
const symlink = buildUntrackedSymlinkDiff("link", "target", "abcdef0123456789", quote);
equal(symlink.includes("new file mode 120000"), true);
equal(symlink.includes("+target\n\\ No newline at end of file"), true);
equal(buildUntrackedSymlinkDiff("link", "target\n", "abcdef0", quote).endsWith("+target\n"), true);
const submodule = buildUntrackedSubmoduleDiff("sub", "1234567890abcdef", quote);
equal(submodule.includes("new file mode 160000"), true);
equal(submodule.includes("+Subproject commit 1234567890abcdef"), true);
console.log(`${assertions} worker git review file diff policy assertions passed`);
