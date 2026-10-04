import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { collectStartingDiff, resolveStartingReference, resolveWorktreeStartingState } = require(
  "../app/.vite/build/worker/git-worktree-starting-state.js",
);

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(overrides = {}, repositoryValue = { root: "/repo", host: { id: "local" } }) {
  const calls = { collect: [], current: 0, defaultBranch: 0, repo: [], resolve: [], run: [], starting: [] };
  const gitManager = {
    getWorktreeRepository: async (...args) => { calls.repo.push(args); return repositoryValue; },
  };
  const dependencies = {
    collectTrackedDiff: async (...args) => { calls.collect.push(args); return { type: "success", unifiedDiff: "diff" }; },
    getCurrentBranch: async () => { calls.current += 1; return "main"; },
    getLocallyKnownDefaultBranch: async () => { calls.defaultBranch += 1; return "trunk"; },
    getOrderedRemotes: async () => ["origin", "company/origin"],
    normalizeCwd: (cwd) => `normalized:${cwd}`,
    resolveRef: async (...args) => { calls.resolve.push(args); return "abc1234"; },
    resolveStartingRef: async (...args) => { calls.starting.push(args); return { ref: "refs/heads/topic" }; },
    runGit: async (...args) => { calls.run.push(args); return { success: true }; },
    ...overrides,
  };
  return { calls, dependencies, gitManager, repository: repositoryValue };
}

const signal = new AbortController().signal;
let state = fixture();
equal(
  await resolveStartingReference("/cwd", { type: "working-tree" }, state.gitManager, {}, signal, state.dependencies),
  "HEAD",
);
equal(state.calls.repo.length, 0);

state = fixture();
equal(
  await resolveStartingReference("/cwd", { type: "branch", branchName: "HEAD" }, state.gitManager, {}, signal, state.dependencies),
  "HEAD",
);
equal(state.calls.starting.length, 0);
deepEqual(state.calls.repo[0], ["normalized:/cwd", {}]);

state = fixture();
equal(
  await resolveStartingReference("/cwd", { type: "branch", branchName: "topic" }, state.gitManager, {}, signal, state.dependencies),
  "refs/heads/topic",
);
deepEqual(state.calls.starting[0].slice(1), ["topic", signal]);

state = fixture({ resolveStartingRef: async () => null });
equal(
  await resolveStartingReference("/cwd", { type: "branch", branchName: "topic" }, state.gitManager, {}, signal, state.dependencies),
  "topic",
);

state = fixture();
equal(
  await resolveStartingReference(
    "/cwd",
    { type: "branch", branchName: "topic", remoteRef: "refs/remotes/company/origin/topic" },
    state.gitManager,
    {},
    signal,
    state.dependencies,
  ),
  "abc1234",
);
deepEqual(state.calls.run[0], [
  "/repo",
  ["fetch", "company/origin", "+refs/heads/topic:refs/remotes/company/origin/topic"],
  state.repository.host,
  { signal },
]);
deepEqual(state.calls.resolve[0].slice(1), [
  "refs/remotes/company/origin/topic", signal, { fresh: true },
]);

state = fixture();
equal(
  await resolveStartingReference(
    "/cwd",
    { type: "branch", branchName: "topic", remoteRef: "refs/remotes/missing/topic" },
    state.gitManager, {}, signal, state.dependencies,
  ),
  "refs/remotes/missing/topic",
);
equal(state.calls.run.length, 0);

state = fixture({ runGit: async () => ({ success: false, stderr: "offline", stdout: "" }) });
await rejects(
  resolveStartingReference(
    "/cwd",
    { type: "branch", branchName: "topic", remoteRef: "refs/remotes/origin/topic" },
    state.gitManager, {}, signal, state.dependencies,
  ),
  /Failed to fetch latest origin\/topic: offline/,
);

state = fixture({ resolveRef: async () => null });
await rejects(
  resolveStartingReference(
    "/cwd",
    { type: "branch", branchName: "topic", remoteRef: "refs/remotes/origin/topic" },
    state.gitManager, {}, signal, state.dependencies,
  ),
  /Failed to resolve latest origin\/topic/,
);

state = fixture();
equal(
  await resolveStartingReference("/cwd", { type: "default" }, state.gitManager, {}, signal, state.dependencies),
  "main",
);
equal(state.calls.defaultBranch, 0);
state = fixture({ getCurrentBranch: async () => null });
equal(
  await resolveStartingReference("/cwd", { type: "default" }, state.gitManager, {}, signal, state.dependencies),
  "trunk",
);
state = fixture({ getCurrentBranch: async () => null, getLocallyKnownDefaultBranch: async () => null });
equal(
  await resolveStartingReference("/cwd", { type: "default" }, state.gitManager, {}, signal, state.dependencies),
  "HEAD",
);
state = fixture({}, null);
equal(
  await resolveStartingReference("/cwd", { type: "default" }, state.gitManager, {}, signal, state.dependencies),
  "HEAD",
);

state = fixture();
equal(
  await collectStartingDiff("/cwd", { type: "branch" }, state.gitManager, {}, [], signal, state.dependencies),
  null,
);
equal(state.calls.repo.length, 0);
state = fixture();
equal(
  await collectStartingDiff("/cwd", { type: "working-tree" }, state.gitManager, {}, ["safe"], signal, state.dependencies),
  "diff",
);
deepEqual(state.calls.collect[0], [state.repository, ["safe"], signal]);
state = fixture({}, null);
await rejects(
  collectStartingDiff("/cwd", { type: "working-tree" }, state.gitManager, {}, [], signal, state.dependencies),
  /Failed to collect working tree diff/,
);
state = fixture({ collectTrackedDiff: async () => ({ type: "error", error: { type: "diff-too-large", limitBytes: 42 } }) });
await rejects(
  collectStartingDiff("/cwd", { type: "working-tree" }, state.gitManager, {}, [], signal, state.dependencies),
  /42-byte limit/,
);

state = fixture();
deepEqual(
  await resolveWorktreeStartingState(
    "/cwd", { type: "working-tree" }, state.gitManager, {}, ["safe"], signal, state.dependencies,
  ),
  { startingRef: "HEAD", startingDiff: "diff" },
);

console.log(`${assertions} worker git worktree starting state assertions passed`);
