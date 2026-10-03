import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  moveThreadToLocal,
} = require("../app/.vite/build/worker/git-move-to-local.js");

let assertionCount = 0;
const equal = (...args) => {
  assertionCount++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertionCount++;
  assert.deepEqual(...args);
};

const signal = new AbortController().signal;
const params = {
  sourceBranch: "feature",
  sourceWorktreeCwd: "/repo/worktrees/feature",
  sourceWorktreeRoot: "/repo/worktrees/feature",
  localGitRoot: "/repo",
};

function fixture(overrides = {}) {
  const calls = [];
  const progress = [];
  const sourceRepository = { name: "source" };
  const localRepository = { name: "local" };
  const host = { id: "local", platformPath: async () => path.posix };
  const gitManager = {
    async getWorktreeRepository(cwd, receivedHost) {
      calls.push(["source-repository", cwd, receivedHost]);
      return sourceRepository;
    },
    getWorktreeRepositoryForRoot(root, receivedHost) {
      calls.push(["local-repository", root, receivedHost]);
      return localRepository;
    },
  };
  let currentBranchCalls = 0;
  let checkoutCalls = 0;
  const deps = {
    getCurrentBranch: async (repository) => {
      calls.push(["current-branch", repository]);
      return currentBranchCalls++ === 0 ? "feature" : "main";
    },
    listWorktrees: async (...args) => {
      calls.push(["worktrees", ...args]);
      return [];
    },
    getHeadCommit: async (...args) => {
      calls.push(["head", ...args]);
      return "head-sha";
    },
    checkoutBranch: async (checkoutParams, ...args) => {
      calls.push(["checkout", checkoutParams, ...args]);
      checkoutCalls++;
      return checkoutCalls === 1
        ? { status: "success", stashRef: "stash-sha" }
        : { status: "success", stashRef: null };
    },
    getStatus: async (...args) => {
      calls.push(["status", ...args]);
      return {
        type: "success",
        stagedCount: 0,
        unstagedCount: 0,
        untrackedCount: 0,
      };
    },
    ensureBranch: async (...args) => {
      calls.push(["ensure", ...args]);
      return null;
    },
    restoreSource: async (...args) => {
      calls.push(["restore-source", ...args]);
      return ["source-rollback"];
    },
    restoreBranchAndStash: async (...args) => {
      calls.push(["restore-local", ...args]);
      return ["local-rollback"];
    },
    applyStash: async (...args) => {
      calls.push(["stash", ...args]);
      return { status: "success" };
    },
    ...overrides,
  };
  return {
    calls,
    deps,
    gitManager,
    host,
    localRepository,
    options: {
      host,
      gitManager,
      signal,
      onProgress: (...args) => progress.push(args),
    },
    progress,
    sourceRepository,
  };
}

async function run(input = params, overrides = {}) {
  const state = fixture(overrides);
  state.result = await moveThreadToLocal(input, state.options, state.deps);
  return state;
}

let state = await run({ ...params, sourceBranch: " " });
equal(state.result.value.error, "invalid-params");
equal(state.calls.length, 0);

state = await run(params, {
  listWorktrees: async () => [
    { root: "/repo/other", headRef: { type: "branch", string: "feature" } },
  ],
});
equal(state.result.value.error, "branch-checked-out-elsewhere");
equal(
  state.calls.some(([name]) => name === "checkout"),
  false,
);

state = await run(params, { getHeadCommit: async () => null });
equal(state.result.value.error, "source-detach-failed");
equal(state.result.value.rollbackErrors.length, 0);

state = await run(params, {
  checkoutBranch: async () => ({
    status: "error",
    error: "detach failed",
    execOutput: { command: "git checkout" },
  }),
});
equal(state.result.value.message, "detach failed");
equal(state.result.value.execOutput.command, "git checkout");

state = await run(params, {
  getStatus: async () => ({ type: "error" }),
});
equal(state.result.value.error, "local-status-check-failed");
deepEqual(state.result.value.rollbackErrors, ["source-rollback"]);
equal(state.calls.filter(([name]) => name === "restore-source").length, 1);

state = await run(params, {
  getStatus: async () => ({
    type: "success",
    stagedCount: 1,
    unstagedCount: 0,
    untrackedCount: 0,
  }),
});
equal(state.result.value.error, "local-destination-has-tracked-changes");
deepEqual(state.result.value.rollbackErrors, ["source-rollback"]);

state = await run();
equal(state.result.value.status, "success");
deepEqual(state.result.value.warnings, []);
equal(state.calls.filter(([name]) => name === "checkout").length, 2);
equal(state.calls.filter(([name]) => name === "ensure").length, 1);
deepEqual(
  state.calls
    .filter(([name]) => name === "stash")
    .map(([, stashParams]) => stashParams.mode),
  ["apply", "drop"],
);
deepEqual(state.progress, [
  ["apply-changes-to-local", "started"],
  ["apply-changes-to-local", "completed"],
]);

let branchCalls = 0;
state = await run(params, {
  getCurrentBranch: async () => (++branchCalls === 1 ? "feature" : "feature"),
  checkoutBranch: async () => ({ status: "success", stashRef: null }),
});
equal(state.result.value.status, "success");
equal(
  state.calls.some(([name]) => name === "ensure"),
  false,
);
deepEqual(state.progress, [
  ["checkout-local-branch", "skipped"],
  ["apply-changes-to-local", "skipped"],
]);

state = await run(params, {
  ensureBranch: async () => ({
    message: "branch mismatch",
    execOutput: { command: "git branch" },
  }),
});
equal(state.result.value.error, "local-branch-head-mismatch");
deepEqual(state.result.value.rollbackErrors, ["source-rollback"]);

let stashCalls = 0;
state = await run(params, {
  applyStash: async () =>
    ++stashCalls === 1
      ? { status: "error", error: "apply failed", execOutput: {} }
      : { status: "success" },
});
equal(state.result.value.error, "apply-source-stash-failed");
deepEqual(state.result.value.rollbackErrors, [
  "local-rollback",
  "source-rollback",
]);
deepEqual(state.progress.at(-1), ["apply-changes-to-local", "failed"]);

stashCalls = 0;
state = await run(params, {
  applyStash: async () =>
    ++stashCalls === 2
      ? { status: "error", error: "drop failed" }
      : { status: "success" },
});
equal(state.result.value.status, "success");
deepEqual(state.result.value.warnings, ["drop-source-stash-failed"]);

state = await run(params, {
  applyStash: async () => {
    throw new Error("unexpected");
  },
});
equal(state.result.value.error, "unexpected-error");
deepEqual(state.result.value.rollbackErrors, [
  "local-rollback",
  "source-rollback",
]);

console.log(`${assertionCount} worker git move-to-local assertions passed`);
