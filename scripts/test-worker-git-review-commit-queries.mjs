import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  MAX_REVIEW_COMMITS,
  MAX_REVIEW_COMMIT_OUTPUT_BYTES,
  getBranchCommits,
  getReviewCommitLineCounts,
  parseBranchCommits,
  parseReviewCommitLineCounts,
  readBranchCommits,
} = require("../app/.vite/build/worker/git-review-commit-queries.js");

let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};

function fixture(options = {}) {
  const calls = { cached: [], comparison: [], query: [], run: [] };
  const querySignal = new AbortController().signal;
  const repository = {
    root: "/repo",
    host: { id: "host" },
    queryClient: {
      fetchQuery: async (config) => {
        calls.query.push(config);
        return options.queryResult ?? config.queryFn();
      },
    },
  };
  const dependencies = {
    fetchQueryWithSignal: async (queryClient, config, signal) => {
      calls.cached.push([queryClient, config, signal]);
      return options.cachedResult ?? config.queryFn(querySignal);
    },
    getQueryMeta: () => ({ owner: "review" }),
    normalizeCommitSha: (sha) => `sha:${sha}`,
    queryKey: (...parts) => ["key", ...parts],
    resolveReviewComparisonArgs: async (params) => {
      calls.comparison.push(params);
      return options.comparison ?? { type: "success", args: ["resolved-base"] };
    },
    runGit: async (...args) => {
      calls.run.push(args);
      return options.gitResult ?? { success: true, stdout: options.stdout ?? "" };
    },
    staleTime: Infinity,
  };
  return { calls, dependencies, querySignal, repository };
}

equal(MAX_REVIEW_COMMITS, 100);
equal(MAX_REVIEW_COMMIT_OUTPUT_BYTES, 2_097_152);

let state = fixture();
deepEqual(parseReviewCommitLineCounts("", state.dependencies), []);
deepEqual(
  parseReviewCommitLineCounts(
    `\x1eabc\n2\t3\ta.ts\n4\t5\tb.ts\x1e`,
    state.dependencies,
  ),
  [{ additions: 6, deletions: 8, sha: "sha:abc" }],
);
deepEqual(
  parseReviewCommitLineCounts(
    `\x1ebinary\n-\t-\timage.png\x1emissing\n1\t2\x1ebad\n1.5\t2\ta\x1eunsafe\n9007199254740992\t1\ta`,
    state.dependencies,
  ),
  [
    { additions: null, deletions: null, sha: "sha:binary" },
    { additions: null, deletions: null, sha: "sha:missing" },
    { additions: null, deletions: null, sha: "sha:bad" },
    { additions: null, deletions: null, sha: "sha:unsafe" },
  ],
);
deepEqual(
  parseReviewCommitLineCounts(`\x1eempty-lines\n\n`, state.dependencies),
  [{ additions: 0, deletions: 0, sha: "sha:empty-lines" }],
);

deepEqual(parseBranchCommits("", state.dependencies), []);
deepEqual(
  parseBranchCommits(
    `abc\0${"2026-10-04T00:00:00Z"}\0subject\0body\x1e` +
      `missing-date\0\0subject\0body\x1e` +
      `empty-subject\0${"2026-10-04T00:00:00Z"}\0\0message\x1e`,
    state.dependencies,
  ),
  [
    {
      committedAt: "2026-10-04T00:00:00Z",
      message: "body",
      sha: "sha:abc",
      subject: "subject",
    },
    {
      committedAt: "2026-10-04T00:00:00Z",
      message: "message",
      sha: "sha:empty-subject",
      subject: "",
    },
  ],
);

state = fixture();
deepEqual(
  await getReviewCommitLineCounts(
    state.repository,
    [],
    false,
    undefined,
    state.dependencies,
  ),
  [],
);
equal(state.calls.cached.length, 0);
deepEqual(
  await getReviewCommitLineCounts(
    state.repository,
    Array.from({ length: 101 }, (_, index) => `${index}`),
    false,
    undefined,
    state.dependencies,
  ),
  [],
);
equal(state.calls.cached.length, 0);

const externalSignal = new AbortController().signal;
state = fixture({ stdout: `\x1eabc\n1\t2\ta.ts` });
let lineCounts = await getReviewCommitLineCounts(
  state.repository,
  ["abc"],
  true,
  externalSignal,
  state.dependencies,
);
deepEqual(lineCounts, [{ additions: 1, deletions: 2, sha: "sha:abc" }]);
equal(state.calls.cached.length, 1);
equal(state.calls.cached[0][0], state.repository.queryClient);
equal(state.calls.cached[0][2], externalSignal);
deepEqual(state.calls.cached[0][1].queryKey, [
  "key",
  "/repo",
  state.repository.host,
  "review-commit-line-counts",
  ["abc"],
  "ignore-whitespace",
]);
equal(state.calls.cached[0][1].gcTime, 250);
deepEqual(state.calls.cached[0][1].meta, { owner: "review" });
equal(state.calls.cached[0][1].staleTime, Infinity);
deepEqual(state.calls.run[0], [
  "/repo",
  [
    "log",
    "--no-walk=unsorted",
    "--format=%x1e%H",
    "--numstat",
    "--ignore-all-space",
    "--diff-merges=first-parent",
    "abc",
    "--",
  ],
  state.repository.host,
  { maxOutputBytes: 2_097_152, signal: state.querySignal },
]);

state = fixture({ gitResult: { success: false, stdout: "ignored" } });
deepEqual(
  await getReviewCommitLineCounts(
    state.repository,
    ["abc"],
    false,
    undefined,
    state.dependencies,
  ),
  [],
);
equal(state.calls.run[0][1].includes("--ignore-all-space"), false);

state = fixture({ comparison: { type: "error" } });
deepEqual(
  await getBranchCommits(
    state.repository,
    "main",
    externalSignal,
    state.dependencies,
  ),
  [],
);
equal(state.calls.query.length, 0);
deepEqual(state.calls.comparison[0], {
  baseBranch: "main",
  signal: externalSignal,
  source: "branch",
  worktreeRepo: state.repository,
});

state = fixture({ comparison: { type: "success", args: [] } });
deepEqual(
  await getBranchCommits(
    state.repository,
    "main",
    externalSignal,
    state.dependencies,
  ),
  [],
);
equal(state.calls.query.length, 0);

state = fixture({
  stdout: `abc\0${"2026-10-04"}\0subject\0message\x1e`,
});
let commits = await getBranchCommits(
  state.repository,
  "main",
  externalSignal,
  state.dependencies,
);
deepEqual(commits, [
  {
    committedAt: "2026-10-04",
    message: "message",
    sha: "sha:abc",
    subject: "subject",
  },
]);
equal(state.calls.query.length, 1);
deepEqual(state.calls.query[0].queryKey, [
  "key",
  "/repo",
  state.repository.host,
  "branch-commits",
  "resolved-base",
]);
equal(state.calls.query[0].gcTime, 250);
deepEqual(state.calls.query[0].meta, { owner: "review" });
equal(state.calls.query[0].staleTime, 250);
deepEqual(state.calls.run[0], [
  "/repo",
  [
    "log",
    "--max-count=100",
    "--format=%H%x00%cI%x00%s%x00%B%x1e",
    "resolved-base..HEAD",
  ],
  state.repository.host,
  { maxOutputBytes: 2_097_152, signal: externalSignal },
]);

state = fixture({ gitResult: { success: false, stdout: "ignored" } });
deepEqual(
  await readBranchCommits(
    state.repository,
    "base",
    externalSignal,
    state.dependencies,
  ),
  [],
);

console.log(`worker git review commit query tests passed (${count} assertions)`);
