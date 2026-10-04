import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  fetchRemoteStartingRef,
  formatLocalBranchRef,
  getRemoteStartingRefCandidates,
  normalizeLocalBranchCandidate,
  resolveWorktreeStartingRef,
} = require("../app/.vite/build/worker/git-worktree-starting-ref.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

equal(formatLocalBranchRef("main"), "refs/heads/main");
equal(formatLocalBranchRef("refs/tags/v1"), "refs/tags/v1");
equal(normalizeLocalBranchCandidate("main"), "refs/heads/main");
equal(normalizeLocalBranchCandidate("refs/heads/main"), "refs/heads/main");
equal(normalizeLocalBranchCandidate("refs/tags/v1"), null);
deepEqual(getRemoteStartingRefCandidates("topic", ["origin", "upstream"]), [
  { remote: "origin", branchName: "topic", ref: "refs/remotes/origin/topic" },
  { remote: "upstream", branchName: "topic", ref: "refs/remotes/upstream/topic" },
]);
deepEqual(getRemoteStartingRefCandidates("origin/topic", ["origin", "upstream"]), [
  { remote: "origin", branchName: "topic", ref: "refs/remotes/origin/topic" },
]);
deepEqual(getRemoteStartingRefCandidates("refs/remotes/upstream/topic", ["origin", "upstream"]), [
  { remote: "upstream", branchName: "topic", ref: "refs/remotes/upstream/topic" },
]);
deepEqual(getRemoteStartingRefCandidates("refs/tags/v1", ["origin"]), []);
deepEqual(getRemoteStartingRefCandidates("refs/remotes/missing/topic", ["origin"]), []);

function fixture(overrides = {}) {
  const calls = { compare: [], remotes: 0, resolve: [], run: [], upstream: [] };
  const repository = { root: "/repo", host: { id: "local" } };
  const dependencies = {
    compareBranches: async (...args) => { calls.compare.push(args); return { state: "equal" }; },
    getOrderedRemotes: async () => { calls.remotes += 1; return ["origin"]; },
    getUpstreamRef: async (...args) => { calls.upstream.push(args); return null; },
    resolveRef: async (...args) => { calls.resolve.push(args); return null; },
    runGit: async (...args) => { calls.run.push(args); return { success: false, code: 2 }; },
    ...overrides,
  };
  return { calls, dependencies, repository };
}

const signal = new AbortController().signal;
let state = fixture({ resolveRef: async (...args) => { state.calls.resolve.push(args); return "abc1234"; } });
deepEqual(await resolveWorktreeStartingRef(state.repository, "HEAD", signal, state.dependencies), { ref: "HEAD" });
equal(state.calls.upstream.length, 0);
deepEqual(state.calls.resolve[0].slice(1, 3), ["HEAD^{commit}", signal]);

state = fixture({
  getUpstreamRef: async () => "origin/main",
  resolveRef: async (...args) => { state.calls.resolve.push(args); return "abc1234"; },
  compareBranches: async (...args) => { state.calls.compare.push(args); return { state: "right-ahead" }; },
});
deepEqual(await resolveWorktreeStartingRef(state.repository, "main", signal, state.dependencies), {
  ref: "refs/remotes/origin/main",
});
deepEqual(state.calls.compare[0].slice(1, 4), [
  "refs/heads/main", "refs/remotes/origin/main", signal,
]);

state = fixture({
  getUpstreamRef: async () => "origin/main",
  resolveRef: async () => null,
});
deepEqual(await resolveWorktreeStartingRef(state.repository, "main", signal, state.dependencies), {
  ref: "refs/heads/main",
});

state = fixture({
  resolveRef: async (_repo, ref) => ref === "refs/heads/topic^{commit}" ? "abc1234" : null,
});
deepEqual(await resolveWorktreeStartingRef(state.repository, "topic", signal, state.dependencies), {
  ref: "refs/heads/topic",
});
equal(state.calls.remotes, 0);

state = fixture({
  resolveRef: async (_repo, ref) => ref === "refs/remotes/origin/topic^{commit}" ? "abc1234" : null,
});
deepEqual(await resolveWorktreeStartingRef(state.repository, "topic", signal, state.dependencies), {
  ref: "refs/remotes/origin/topic", remoteRef: "refs/remotes/origin/topic",
});

state = fixture({
  resolveRef: async (...args) => {
    state.calls.resolve.push(args);
    return args[3]?.fresh ? "abc1234" : null;
  },
  runGit: async (...args) => {
    state.calls.run.push(args);
    return args[1][0] === "ls-remote" ? { success: true, code: 0 } : { success: true };
  },
});
deepEqual(await resolveWorktreeStartingRef(state.repository, "topic", signal, state.dependencies), {
  ref: "refs/remotes/origin/topic", remoteRef: "refs/remotes/origin/topic",
});
deepEqual(state.calls.run.map((call) => call[1]), [
  ["ls-remote", "--exit-code", "origin", "refs/heads/topic"],
  ["fetch", "origin", "+refs/heads/topic:refs/remotes/origin/topic"],
]);
deepEqual(state.calls.run[0][3], { allowedNonZeroExitCodes: [2], signal });
deepEqual(state.calls.resolve.at(-1).at(-1), { fresh: true });

state = fixture({
  runGit: async () => ({ success: true, code: 2 }),
  resolveRef: async (_repo, ref) => ref === "deadbeef^{commit}" ? "deadbeef" : null,
});
deepEqual(await resolveWorktreeStartingRef(state.repository, "deadbeef", signal, state.dependencies), {
  ref: "deadbeef",
});

state = fixture({ runGit: async () => ({ success: false, code: null, stderr: "offline" }) });
await rejects(
  resolveWorktreeStartingRef(state.repository, "topic", signal, state.dependencies),
  /Failed to validate/,
);

const aborted = new AbortController();
aborted.abort();
state = fixture({ runGit: async () => ({ success: false, code: null }) });
await rejects(
  resolveWorktreeStartingRef(state.repository, "topic", aborted.signal, state.dependencies),
  /Failed to validate/,
);

state = fixture({
  resolveRef: async () => null,
  runGit: async (...args) => args[1][0] === "ls-remote"
    ? { success: true, code: 0 }
    : { success: false },
});
await rejects(
  fetchRemoteStartingRef(
    state.repository,
    { remote: "origin", branchName: "topic", ref: "refs/remotes/origin/topic" },
    signal,
    state.dependencies,
  ),
  /Failed to fetch/,
);

console.log(`${assertions} worker git worktree starting ref assertions passed`);
