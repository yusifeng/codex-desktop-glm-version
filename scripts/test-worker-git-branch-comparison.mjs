import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { compareGitBranches, parseLeftRightCommitCounts } = require(
  "../app/.vite/build/worker/git-branch-comparison.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };

deepEqual(parseLeftRightCommitCounts("2\t3\n"), { leftAhead: 2, rightAhead: 3 });
deepEqual(parseLeftRightCommitCounts("1x 0 extra"), { leftAhead: 1, rightAhead: 0 });
for (const value of ["", "  ", "1", "x 2", "1 x"])
  equal(parseLeftRightCommitCounts(value), null);

function fixture(result) {
  const calls = { fetch: [], run: [] };
  const repository = {
    root: "/repo",
    host: { id: "local" },
    queryClient: {
      fetchQuery: async (options) => {
        calls.fetch.push(options);
        return options.queryFn();
      },
    },
  };
  const dependencies = {
    getQueryMeta: () => ({ family: "refs" }),
    queryKey: (...parts) => ["key", ...parts],
    runGit: async (...args) => { calls.run.push(args); return result; },
    staleTime: Infinity,
  };
  return { calls, dependencies, repository };
}

const signal = new AbortController().signal;
for (const [stdout, expectedState] of [
  ["0 0", "equal"],
  ["2 0", "left-ahead"],
  ["0 3", "right-ahead"],
  ["2 3", "diverged"],
]) {
  const state = fixture({ success: true, stdout });
  const result = await compareGitBranches(
    state.repository, "main", "topic", signal, state.dependencies,
  );
  equal(result.state, expectedState);
  deepEqual([result.leftAhead, result.rightAhead], stdout.split(" ").map(Number));
  if (expectedState === "equal") {
    deepEqual(state.calls.fetch[0].queryKey, [
      "key", "/repo", state.repository.host, "left-right-commit-counts", "main", "topic",
    ]);
    deepEqual(state.calls.fetch[0].meta, { family: "refs" });
    equal(state.calls.fetch[0].staleTime, Infinity);
    deepEqual(state.calls.run[0], [
      "/repo", ["rev-list", "--left-right", "--count", "main...topic"],
      state.repository.host, { allowedNonZeroExitCodes: [128, 1], signal },
    ]);
  }
}

let state = fixture({ success: false, stdout: "1 2" });
equal(await compareGitBranches(state.repository, "a", "b", signal, state.dependencies), null);
state = fixture({ success: true, stdout: "bad" });
equal(await compareGitBranches(state.repository, "a", "b", signal, state.dependencies), null);

console.log(`${assertions} worker git branch comparison assertions passed`);
