import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  isGitHubHost,
  parseBlamePorcelain,
  parseGitHubAuthorLogin,
} = require("../app/.vite/build/worker/git-blame-file-policy.js");

assert.equal(isGitHubHost("github.com"), true);
assert.equal(isGitHubHost("enterprise.github.com"), true);
assert.equal(isGitHubHost("github.example.com"), false);

let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions += 1; assert.deepEqual(actual, expected); };

equal(parseGitHubAuthorLogin("<123+octocat@users.noreply.github.com>"), "octocat");
equal(parseGitHubAuthorLogin("<user@example.com>"), null);
const sha = "a".repeat(40);
deepEqual(parseBlamePorcelain([
  `${sha} 1 7 1`,
  "author Alice",
  "author-mail <123+alice@users.noreply.github.com>",
  "author-time 1700000000",
  "summary First line",
  "\tcontent one",
  `${sha} 2 8 1`,
  "\tcontent two",
].join("\n")), [
  { author: "Alice", authorLogin: "alice", authorTime: 1700000000, commitSha: sha, lineNumber: 7, summary: "First line" },
  { author: "Alice", authorLogin: "alice", authorTime: 1700000000, commitSha: sha, lineNumber: 8, summary: "First line" },
]);
deepEqual(parseBlamePorcelain("bad-header\nauthor-time nope\n\tline\n"), [{
  author: null, authorLogin: null, authorTime: null, commitSha: "bad-header", lineNumber: 0, summary: null,
}]);
deepEqual(parseBlamePorcelain(`${sha} 1 1 1\nauthor Dangling`), []);

console.log(`${assertions} worker git blame-file-policy assertions passed`);
