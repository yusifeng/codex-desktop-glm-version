import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  moveThreadToWorktree,
} = require("../app/.vite/build/worker/git-move-to-worktree.js");
let count = 0;
const equal = (...args) => {
  count++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  count++;
  assert.deepEqual(...args);
};
const signal = new AbortController().signal;
const params = {
  sourceBranch: "feature",
  worktreeCheckoutBranch: "feature-worktree",
  localCheckoutBranch: "main",
  defaultBranch: "main",
  localCwd: "/repo",
  worktreeWorkspaceRoot: "/repo/worktree",
  worktreeGitRoot: "/repo/worktree/.git",
  stashTargetWorktree: true,
  createdWorktree: true,
};

function fixture(overrides = {}) {
  const calls = [],
    progress = [];
  let checkoutCount = 0;
  const host = { id: "local" };
  const gitManager = {
    async getWorktreeRepository(...args) {
      calls.push(["repository", ...args]);
      return {};
    },
  };
  const deps = {
    getCurrentBranch: async () => "feature",
    checkoutBranch: async (input, ...args) => {
      calls.push(["checkout", input, ...args]);
      checkoutCount++;
      return {
        status: "success",
        stashRef: checkoutCount === 1 ? "source-stash" : "target-stash",
      };
    },
    applyStash: async (...args) => {
      calls.push(["stash", ...args]);
      return { status: "success" };
    },
    restoreBranchAndStash: async (...args) => {
      calls.push(["restore", ...args]);
      return ["restore-error"];
    },
    removeWorktree: async (...args) => calls.push(["remove", ...args]),
    ...overrides,
  };
  return {
    calls,
    deps,
    host,
    gitManager,
    options: {
      host,
      gitManager,
      signal,
      onProgress: (...args) => progress.push(args),
    },
    progress,
  };
}
async function run(input = params, overrides = {}) {
  const state = fixture(overrides);
  state.result = await moveThreadToWorktree(input, state.options, state.deps);
  return state;
}

for (const [input, error] of [
  [{ ...params, sourceBranch: " " }, "invalid-params"],
  [{ ...params, worktreeCheckoutBranch: " " }, "invalid-params"],
  [{ ...params, worktreeCheckoutBranch: "main" }, "default-branch-blocked"],
]) {
  const state = await run(input);
  equal(state.result.value.error, error);
  equal(state.calls.length, 0);
}

let state = await run(params, { getCurrentBranch: async () => null });
equal(state.result.value.error, "local-not-on-branch");

state = await run();
equal(state.result.value.status, "success");
deepEqual(state.result.value.warnings, ["stashed-target-worktree-changes"]);
equal(state.calls.filter(([name]) => name === "checkout").length, 2);
deepEqual(
  state.calls
    .filter(([name]) => name === "stash")
    .map(([, input]) => input.mode),
  ["apply", "drop", "drop"],
);
deepEqual(state.progress, [
  ["apply-changes-to-worktree", "started"],
  ["apply-changes-to-worktree", "completed"],
]);

let checkoutCount = 0;
state = await run(params, {
  checkoutBranch: async () =>
    ++checkoutCount === 1
      ? { status: "success", stashRef: "source-stash" }
      : { status: "error", error: "target failed", execOutput: {} },
});
equal(state.result.value.error, "checkout-worktree-failed");
deepEqual(state.result.value.rollbackErrors, ["restore-error"]);
equal(state.calls.filter(([name]) => name === "restore").length, 1);
equal(state.calls.filter(([name]) => name === "remove").length, 1);

let stashCount = 0;
state = await run(params, {
  applyStash: async () =>
    ++stashCount === 1
      ? { status: "error", error: "apply failed", execOutput: {} }
      : { status: "error" },
});
equal(state.result.value.error, "apply-source-stash-failed");
deepEqual(state.result.value.rollbackErrors, [
  "restore-target-stash-failed",
  "restore-error",
]);
equal(state.calls.filter(([name]) => name === "remove").length, 1);
deepEqual(state.progress.at(-1), ["apply-changes-to-worktree", "failed"]);

state = await run(
  { ...params, sourceBranch: "other", stashTargetWorktree: false },
  {
    getCurrentBranch: async () => "main",
    checkoutBranch: async () => ({ status: "success", stashRef: null }),
  },
);
equal(state.result.value.status, "success");
equal(state.calls.filter(([name]) => name === "checkout").length, 0);
deepEqual(state.progress, [
  ["stash-source-changes", "skipped"],
  ["checkout-local-branch", "skipped"],
  ["stash-target-worktree-changes", "skipped"],
  ["apply-changes-to-worktree", "skipped"],
]);

stashCount = 0;
state = await run(params, {
  applyStash: async () => {
    if (++stashCount === 1) throw Error("unexpected");
    return { status: "success" };
  },
});
equal(state.result.value.error, "unexpected-error");
equal(state.calls.filter(([name]) => name === "restore").length, 1);
equal(state.calls.filter(([name]) => name === "remove").length, 1);

console.log(`${count} worker git move-to-worktree assertions passed`);
