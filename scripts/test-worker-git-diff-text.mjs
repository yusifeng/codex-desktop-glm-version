import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  countGitDiffLines,
  isOctalDigit,
  isThreeDigitOctal,
  parseCombinedGitDiffPath,
  parseGitDiffHeader,
  parseGitPathEscape,
  parseGitQuotedPath,
  quoteGitDiffPath,
  rewriteGitRenameDiff,
  stripGitDiffPrefixes,
} = require("../app/.vite/build/worker/git-diff-text.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

equal(isOctalDigit("0"), true);
equal(isOctalDigit("7"), true);
equal(isOctalDigit("8"), false);
equal(isThreeDigitOctal("123"), true);
equal(isThreeDigitOctal("12"), false);
equal(isThreeDigitOctal("128"), false);

equal(parseGitQuotedPath("plain", 0), null);
deepEqual(parseGitQuotedPath('"a\\tb\\n"', 0), {
  nextIndex: 8,
  path: "a\tb\n",
  pathForUnquotedDiffHeader: "a\\tb\\n",
});
deepEqual(parseGitQuotedPath('x"path"', 1), {
  nextIndex: 7,
  path: "path",
  pathForUnquotedDiffHeader: "path",
});
deepEqual(parseGitQuotedPath('"\\303\\251"', 0), {
  nextIndex: 10,
  path: "é",
  pathForUnquotedDiffHeader: "\\303\\251",
});
equal(parseGitQuotedPath('"unterminated', 0), null);
equal(parseGitQuotedPath('"\\12"', 0), null);
deepEqual(parseGitPathEscape("\\", 0), {
  nextIndex: 1,
  path: "\\",
  pathForUnquotedDiffHeader: "\\",
});
deepEqual(parseGitPathEscape("x", 0), {
  nextIndex: 1,
  path: "x",
  pathForUnquotedDiffHeader: "x",
});

deepEqual(stripGitDiffPrefixes("a/file", "b/file"), {
  oldPath: "file",
  newPath: "file",
});
equal(stripGitDiffPrefixes("file", "b/file"), null);
deepEqual(parseGitDiffHeader("diff --git a/old.txt b/new.txt"), {
  oldPath: "old.txt",
  newPath: "new.txt",
});
deepEqual(
  parseGitDiffHeader('diff --git "a/old name.txt" "b/new name.txt"'),
  { oldPath: "old name.txt", newPath: "new name.txt" },
);
deepEqual(parseGitDiffHeader('diff --git "a/\\303\\251.txt" "b/\\303\\251.txt"'), {
  oldPath: "é.txt",
  newPath: "é.txt",
});
deepEqual(parseGitDiffHeader("diff --cc conflict.txt"), {
  oldPath: "conflict.txt",
  newPath: "conflict.txt",
});
deepEqual(parseGitDiffHeader('diff --combined "conflict name.txt"'), {
  oldPath: "conflict name.txt",
  newPath: "conflict name.txt",
});
equal(parseGitDiffHeader("index abc..def"), null);
equal(parseGitDiffHeader("diff --git old new"), null);
equal(parseCombinedGitDiffPath('"bad" trailing'), null);

equal(quoteGitDiffPath("plain/path"), "plain/path");
equal(quoteGitDiffPath('a\\b"c\n'), '"a\\\\b\\"c\\n"');
equal(
  rewriteGitRenameDiff("", "old name", "new name"),
  "diff --git a/old name b/new name\nsimilarity index 100%\nrename from old name\nrename to new name\n",
);
equal(
  rewriteGitRenameDiff(
    "diff --git a/old b/new\n--- a/old\n+++ b/new\n@@ -1 +1 @@\n-old\n+new\n",
    "before",
    "after",
  ),
  "diff --git a/before b/after\nsimilarity index 0%\nrename from before\nrename to after\n--- a/before\n+++ b/after\n@@ -1 +1 @@\n-old\n+new\n",
);

deepEqual(countGitDiffLines(""), { additions: 0, deletions: 0 });
deepEqual(
  countGitDiffLines(
    "diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1,2 +1,2 @@\n-old\n context\n+new\n",
  ),
  { additions: 1, deletions: 1 },
);
deepEqual(
  countGitDiffLines(
    "@@ -0,0 +1 @@\n+one\ndiff --git a/b b/b\n+outside\n@@ -1 +1 @@\n-two\n+three\n",
  ),
  { additions: 2, deletions: 1 },
);
equal(countGitDiffLines("GIT binary patch\nliteral 0\n"), null);
equal(countGitDiffLines("Binary files a/x and b/x differ\n"), null);

console.log(`${count} worker git diff text assertions passed`);
