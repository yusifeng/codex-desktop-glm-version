import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildMergeBaseCandidates,
  queryBranchUpstream,
  queryHeadMergeBase,
  resolveMergeBase,
  resolveMergeBaseDirect,
} = require("../app/.vite/build/worker/git-merge-base.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

deepEqual(buildMergeBaseCandidates("topic", [], " origin/topic "), ["origin/topic"]);
deepEqual(buildMergeBaseCandidates("topic", ["origin", "upstream"], "origin/topic"), [
  "origin/topic",
  "refs/remotes/origin/topic",
  "upstream/topic",
  "refs/remotes/upstream/topic",
]);
deepEqual(buildMergeBaseCandidates("origin/topic", ["origin", "upstream"], null), [
  "refs/remotes/origin/topic",
  "upstream/origin/topic",
  "refs/remotes/upstream/origin/topic",
]);
deepEqual(buildMergeBaseCandidates("topic", ["origin"], " refs/remotes/origin/topic "), [
  "origin/topic",
  "refs/remotes/origin/topic",
]);

function fixture(overrides = {}) {
  const calls = [];
  const repository = {
    root: "/repo",
    host: { id: "host" },
    queryClient: {
      fetchQuery: async (options) => {
        calls.push(["query", options]);
        return options.queryFn();
      },
    },
  };
  const dependencies = {
    getConfigQueryMeta: () => ({ type: "config" }),
    getQueryMeta: () => ({ type: "query" }),
    getOrderedRemotes: async (...args) => { calls.push(["remotes", ...args]); return ["origin"]; },
    queryKey: (...args) => ["key", ...args],
    resolveRef: async (...args) => { calls.push(["resolve", ...args]); return "sha"; },
    runGit: async (...args) => {
      calls.push(["git", ...args]);
      return { success: true, code: 0, stdout: "merge-sha\n" };
    },
    staleTime: Infinity,
    ...overrides,
  };
  return { calls, dependencies, repository };
}

{
  const state = fixture({
    runGit: async (...args) => {
      state.calls.push(["git", ...args]);
      return { success: true, stdout: " origin/main \n" };
    },
  });
  equal(await queryBranchUpstream(state.repository, "main", state.dependencies), "origin/main");
  const query = state.calls[0][1];
  deepEqual(query.queryKey, ["key", "/repo", state.repository.host, "branch-upstream", "main"]);
  deepEqual(query.meta, { type: "config" });
  equal(query.staleTime, Infinity);
  deepEqual(state.calls[1].slice(1), [
    "/repo",
    ["for-each-ref", "--format=%(upstream:short)", "refs/heads/main"],
    state.repository.host,
  ]);
}

{
  const state = fixture({ runGit: async () => ({ success: false, stdout: "ignored" }) });
  equal(await queryBranchUpstream(state.repository, "main", state.dependencies), null);
}

for (const [result, expected] of [
  [{ success: false, code: 128, stdout: "" }, { mergeBase: null, requiresRefCheck: true }],
  [{ success: false, code: 1, stdout: "" }, { mergeBase: null, requiresRefCheck: false }],
  [{ success: true, code: 0, stdout: " base \n" }, { mergeBase: "base", requiresRefCheck: false }],
]) {
  const state = fixture({ runGit: async () => result });
  deepEqual(await queryHeadMergeBase(state.repository, "main", state.dependencies), expected);
  const query = state.calls[0][1];
  deepEqual(query.queryKey, ["key", "/repo", state.repository.host, "head-merge-base", "main"]);
  deepEqual(query.meta, { type: "query" });
}

{
  const state = fixture();
  equal(await resolveMergeBaseDirect(state.repository, "main", state.dependencies), "merge-sha");
  deepEqual(state.calls[0].slice(1), [
    "/repo",
    ["merge-base", "HEAD", "main"],
    state.repository.host,
    { allowedNonZeroExitCodes: [1] },
  ]);
}

{
  const state = fixture({ runGit: async () => ({ success: true, stdout: "" }) });
  equal(await resolveMergeBaseDirect(state.repository, "main", state.dependencies), null);
  state.dependencies.runGit = async () => ({ success: false, stdout: "" });
  await rejects(
    resolveMergeBaseDirect(state.repository, "main", state.dependencies),
    /Git merge-base failed/,
  );
}

{
  const state = fixture();
  equal(await resolveMergeBase(state.repository, "  ", state.dependencies), null);
  equal(state.calls.length, 0);
}

{
  const state = fixture();
  equal(await resolveMergeBase(state.repository, " main ", state.dependencies), "merge-sha");
  equal(state.calls.some((call) => call[0] === "resolve"), false);
}

function fallbackFixture(resolveRef, overrides = {}) {
  let mergeCalls = 0;
  return fixture({
    resolveRef,
    runGit: async (...args) => {
      const state = fallbackFixture.state;
      state?.calls.push(["git", ...args]);
      if (args[1][0] === "merge-base") {
        mergeCalls += 1;
        return mergeCalls === 1
          ? { success: false, code: 128, stdout: "" }
          : { success: true, code: 0, stdout: "fallback-base\n" };
      }
      return { success: true, stdout: "origin/topic\n" };
    },
    ...overrides,
  });
}

{
  const state = fallbackFixture(async (_repository, ref) => (ref === "HEAD" ? null : "sha"));
  fallbackFixture.state = state;
  equal(await resolveMergeBase(state.repository, "topic", state.dependencies), null);
  equal(state.calls.some((call) => call[0] === "remotes"), false);
}

{
  const state = fallbackFixture(async () => "sha");
  fallbackFixture.state = state;
  equal(await resolveMergeBase(state.repository, "topic", state.dependencies), "fallback-base");
  equal(state.calls.some((call) => call[0] === "remotes"), false);
}

{
  const resolvedRefs = [];
  const state = fallbackFixture(async (_repository, ref) => {
    resolvedRefs.push(ref);
    if (ref === "HEAD") return "head";
    if (ref === "topic") return null;
    return ref === "origin/topic" ? "remote" : null;
  });
  fallbackFixture.state = state;
  equal(await resolveMergeBase(state.repository, "topic", state.dependencies), "fallback-base");
  deepEqual(resolvedRefs.slice(0, 3), ["HEAD", "topic", "origin/topic"]);
}

{
  const state = fallbackFixture(async (_repository, ref) => {
    if (ref === "HEAD") return "head";
    if (ref === "topic") return null;
    return ref === "refs/remotes/upstream/topic" ? "remote" : null;
  }, {
    getOrderedRemotes: async () => ["origin", "upstream"],
  });
  fallbackFixture.state = state;
  equal(await resolveMergeBase(state.repository, "topic", state.dependencies), "fallback-base");
}

{
  const state = fallbackFixture(async (_repository, ref) =>
    ref === "HEAD" ? "head" : null,
    { getOrderedRemotes: async () => [] },
  );
  fallbackFixture.state = state;
  equal(await resolveMergeBase(state.repository, "topic", state.dependencies), null);
}

console.log(`${assertions} worker git merge base assertions passed`);
