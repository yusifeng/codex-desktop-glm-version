import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const search = require("../app/.vite/build/worker/git-branch-search.js");
let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

equal(
  search.normalizeGitBranchSearchText(" Feature/foo_bar.BAZ "),
  "feature foo bar baz",
);
equal(search.normalizeGitBranchSearchText("---"), "");
deepEqual(search.buildGitBranchSearchRefPatterns("refs/heads", ["feature"]), [
  "refs/heads",
]);
deepEqual(search.buildGitBranchSearchRefPatterns("refs/remotes", ["a", "!!"]), [
  "refs/remotes",
]);
deepEqual(
  search.buildGitBranchSearchRefPatterns("refs/remotes", ["ab", "feature"]),
  [
    "refs/remotes/**/*[fF][eE][aA][tT][uU][rR][eE]*",
    "refs/remotes/**/*[fF][eE][aA][tT][uU][rR][eE]*/**",
  ],
);
deepEqual(search.buildGitBranchSearchRefPatterns("refs/remotes", ["ok"]), [
  "refs/remotes/**/*[oO][kKK]*",
  "refs/remotes/**/*[oO][kKK]*/**",
]);
equal(
  search.parseGitBranchSearchRef("refs/heads/feature/x", false),
  "feature/x",
);
equal(
  search.parseGitBranchSearchRef("refs/remotes/origin/feature/x", false),
  "feature/x",
);
equal(
  search.parseGitBranchSearchRef("refs/remotes/origin/feature/x", true),
  "refs/remotes/origin/feature/x",
);
equal(search.parseGitBranchSearchRef("refs/remotes/origin/HEAD", false), null);
equal(search.parseGitBranchSearchRef("refs/remotes/origin", false), null);
equal(search.parseGitBranchSearchRef("refs/tags/v1", false), null);
equal(
  search.stripGitRemoteRefPrefix("refs/remotes/upstream/topic"),
  "upstream/topic",
);
equal(search.stripGitRemoteRefPrefix("topic"), "topic");
equal(search.gitBranchNameFromRef("refs/remotes/upstream/topic/x"), "topic/x");
equal(search.gitBranchNameFromRef("topic/x"), "topic/x");

console.log(`${count} worker git branch-search assertions passed`);
