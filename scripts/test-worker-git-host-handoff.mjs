import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  moveThreadToHostWorktree,
} = require("../app/.vite/build/worker/git-host-handoff.js");

let assertionCount = 0;
const equal = (...args) => {
  assertionCount++;
  assert.equal(...args);
};
const deepEqual = (...args) => {
  assertionCount++;
  assert.deepEqual(...args);
};
const match = (...args) => {
  assertionCount++;
  assert.match(...args);
};

const signal = new AbortController().signal;
const baseParams = {
  sourceRolloutPath: "/source/rollout.jsonl",
  sourceBranch: "feature",
  sourceCwd: "/source/workspace",
  destinationWorkspaceRoot: "/destination/workspace",
  destinationWorktreeGitRoot: null,
  destinationWorktreeWorkspaceRoot: null,
  stashDestinationWorktree: false,
  useWorkspaceDir: true,
};

function fixture(overrides = {}) {
  const calls = [];
  const progress = [];
  const repository = (root, host) => ({
    root,
    host,
    invalidateGitReadCachesForRepoChange: (change) =>
      calls.push(["invalidate", root, change]),
  });
  const sourceHost = {
    id: "source",
    platformPath: async () => path.posix,
    createDirectory: async (...args) => calls.push(["source-mkdir", ...args]),
    remove: async (...args) => calls.push(["source-remove", ...args]),
  };
  const destinationHost = {
    id: "destination",
    platformPath: async () => path.posix,
    createDirectory: async (...args) =>
      calls.push(["destination-mkdir", ...args]),
    remove: async (...args) => calls.push(["destination-remove", ...args]),
  };
  const gitManager = {
    getWorktreeRepositoryForRoot: (root, host) => {
      calls.push(["repository", root, host.id]);
      return repository(root, host);
    },
  };
  const successfulGit = (cwd, args, host, options) => {
    calls.push(["git", cwd, args, host.id, options]);
    if (args[0] === "rev-parse" && args[1] === "HEAD") {
      return {
        success: true,
        code: 0,
        command: "git rev-parse HEAD",
        stdout: "head-sha\n",
        stderr: "",
      };
    }
    return {
      success: true,
      code: 0,
      command: `git ${args.join(" ")}`,
      stdout: "",
      stderr: "",
    };
  };
  const deps = {
    randomUUID: () => "transfer-id",
    resolveRepositoryMetadata: async (_manager, cwd) => {
      calls.push(["metadata", cwd]);
      return {
        root: cwd.startsWith("/source") ? "/source/git" : "/destination/git",
      };
    },
    getTransferDirectory: async (host) => `/${host.id}/handoffs/transfer-id`,
    runGit: async (...args) => successfulGit(...args),
    inspectBranch: async (params) => {
      calls.push(["inspect", params]);
      return { status: "missing" };
    },
    getIndexTree: async (...args) => {
      calls.push(["index-tree", ...args]);
      return "tree-sha";
    },
    getUntrackedPaths: async (...args) => {
      calls.push(["untracked", ...args]);
      return { success: true, paths: [] };
    },
    getCommitTree: async (...args) => {
      calls.push(["commit-tree", ...args]);
      return "tree-sha\n";
    },
    createSnapshotCommit: async (...args) => {
      calls.push(["snapshot", ...args]);
      return { success: true, commitSha: "snapshot-sha\n" };
    },
    hasCommit: async (...args) => {
      calls.push(["has-commit", ...args]);
      return true;
    },
    findSharedBase: async (...args) => {
      calls.push(["shared-base", ...args]);
      return "base-sha";
    },
    transferFile: async (...args) => calls.push(["transfer", ...args]),
    createWorktree: async (...args) => {
      calls.push(["create-worktree", ...args]);
      return {
        success: true,
        worktreeGitRoot: "/destination/worktree/.git",
        worktreeWorkspaceRoot: "/destination/worktree",
      };
    },
    resolveCleanWorktreeCommit: async (...args) => {
      calls.push(["clean-commit", ...args]);
      return "head-sha";
    },
    getCurrentBranch: async (...args) => {
      calls.push(["current-branch", ...args]);
      return "old-worktree-branch";
    },
    getCurrentBranchSnapshot: async (...args) => {
      calls.push(["branch-snapshot", ...args]);
      return "detached-sha";
    },
    checkoutBranch: async (...args) => {
      calls.push(["checkout", ...args]);
      return { status: "success", stashRef: null };
    },
    prepareDestinationCheckout: async (...args) => {
      calls.push(["prepare-destination", ...args]);
      return { previousBranch: "destination-main", error: null };
    },
    forceBranch: async (...args) => {
      calls.push(["force-branch", ...args]);
      return null;
    },
    ensureBranch: async (...args) => {
      calls.push(["ensure-branch", ...args]);
      return null;
    },
    rollbackWorktree: async (...args) => calls.push(["rollback", ...args]),
    applyStash: async (...args) => {
      calls.push(["stash", ...args]);
      return { status: "success" };
    },
    formatExecOutput: (output) => ({ formatted: output.command }),
    warn: (...args) => calls.push(["warn", ...args]),
    ...overrides,
  };
  const options = {
    gitManager,
    sourceHost,
    destinationHost,
    signal,
    onProgress: (...args) => progress.push(args),
  };
  return {
    calls,
    deps,
    destinationHost,
    gitManager,
    options,
    progress,
    sourceHost,
  };
}

async function run(params = baseParams, overrides = {}) {
  const state = fixture(overrides);
  state.result = await moveThreadToHostWorktree(
    params,
    state.options,
    state.deps,
  );
  return state;
}

for (const [params, message] of [
  [{ ...baseParams, sourceRolloutPath: " " }, "Missing source rollout path"],
  [{ ...baseParams, sourceBranch: "" }, "Missing source branch"],
  [
    {
      ...baseParams,
      destinationWorktreeGitRoot: "/git",
      destinationWorktreeWorkspaceRoot: null,
    },
    "Destination worktree roots must be provided together",
  ],
]) {
  const state = await run(params);
  equal(state.result.value.error, "invalid-params");
  equal(state.result.value.message, message);
  equal(state.calls.length, 0);
}

let metadataCalls = 0;
let state = await run(baseParams, {
  resolveRepositoryMetadata: async () =>
    ++metadataCalls === 1 ? null : { root: "/destination/git" },
});
equal(state.result.value.error, "source-not-in-repository");
equal(metadataCalls, 2);
equal(
  state.calls.some(([name]) => name === "git"),
  false,
);

metadataCalls = 0;
state = await run(baseParams, {
  resolveRepositoryMetadata: async () =>
    ++metadataCalls === 1 ? { root: "/source/git" } : null,
});
equal(state.result.value.error, "destination-not-in-repository");
equal(metadataCalls, 2);

state = await run();
equal(state.result.type, "ok");
deepEqual(state.result.value, {
  status: "success",
  rolloutPath: "/destination/handoffs/transfer-id/rollout.jsonl",
  worktreeGitRoot: "/destination/worktree/.git",
  worktreeWorkspaceRoot: "/destination/worktree",
});
equal(state.calls.filter(([name]) => name === "transfer").length, 1);
equal(
  state.calls.some(([, , args]) => args?.[0] === "bundle"),
  false,
);
deepEqual(state.progress, [
  ["prepare-host-transfer", "started"],
  ["prepare-host-transfer", "completed"],
  ["transfer-host-artifacts", "started"],
  ["transfer-host-artifacts", "completed"],
  ["create-new-worktree", "started"],
  ["create-new-worktree", "completed"],
  ["apply-changes-to-worktree", "started"],
  ["apply-changes-to-worktree", "completed"],
]);
equal(
  state.calls.some(
    ([name, target, options]) =>
      name === "destination-remove" &&
      target === "/destination/handoffs/transfer-id/handoff.bundle" &&
      options.recursive === false,
  ),
  true,
);
equal(
  state.calls.filter(
    ([name, , args]) =>
      name === "git" && args[0] === "update-ref" && args[1] === "-d",
  ).length,
  2,
);

const reusedCheckoutCalls = [];
state = await run(
  {
    ...baseParams,
    destinationWorktreeGitRoot: "/destination/reused/.git",
    destinationWorktreeWorkspaceRoot: "/destination/reused",
    stashDestinationWorktree: true,
  },
  {
    checkoutBranch: async (...args) => {
      reusedCheckoutCalls.push(args);
      return reusedCheckoutCalls.length === 1
        ? { status: "success", stashRef: "stash-sha" }
        : { status: "success", stashRef: null };
    },
  },
);
equal(state.result.value.status, "success");
equal(
  state.calls.some(([name]) => name === "create-worktree"),
  false,
);
equal(
  state.calls.some(([name]) => name === "force-branch"),
  true,
);
equal(
  state.calls.some(([name]) => name === "ensure-branch"),
  false,
);
equal(reusedCheckoutCalls.length, 2);
equal(
  state.calls.find(([name]) => name === "prepare-destination")[1]
    .canDetachDefaultBranch,
  true,
);
deepEqual(state.calls.find(([name]) => name === "stash").slice(1, 3), [
  { cwd: "/destination/reused", stashRef: "stash-sha", mode: "drop" },
  state.destinationHost,
]);

state = await run(baseParams, { hasCommit: async () => false });
equal(state.result.value.status, "success");
equal(state.calls.filter(([name]) => name === "transfer").length, 2);
deepEqual(
  state.calls
    .filter(([name, , args]) => name === "git" && args[0] === "bundle")
    .map(([, , args]) => args[1]),
  ["create", "unbundle"],
);
equal(
  state.calls.some(
    ([name, , args]) => name === "git" && args.at(-1) === "^base-sha",
  ),
  true,
);

const resetFailure = {
  success: false,
  command: "git reset",
  stdout: "",
  stderr: "reset failed",
};
state = await run(baseParams, {
  runGit: async (cwd, args) =>
    args[0] === "rev-parse"
      ? {
          success: true,
          command: "git rev-parse HEAD",
          stdout: "head-sha\n",
          stderr: "",
        }
      : args[0] === "reset"
        ? resetFailure
        : {
            success: true,
            command: `git ${args.join(" ")}`,
            stdout: "",
            stderr: "",
          },
});
equal(state.result.value.error, "restore-worktree-state-failed");
equal(state.result.value.execOutput.formatted, "git reset");
equal(state.calls.filter(([name]) => name === "rollback").length, 1);
deepEqual(state.progress.at(-1), ["apply-changes-to-worktree", "failed"]);

state = await run(baseParams, {
  ensureBranch: async () => ({
    message: "branch failed",
    execOutput: { command: "git branch" },
  }),
});
equal(state.result.value.message, "branch failed");
equal(state.calls.filter(([name]) => name === "rollback").length, 1);
equal(
  state.calls.some(([name]) => name === "checkout"),
  false,
);

state = await run(baseParams, {
  checkoutBranch: async () => {
    return {
      status: "error",
      error: "checkout failed",
      execOutput: { command: "git checkout" },
    };
  },
});
equal(state.result.value.message, "checkout failed");
equal(state.calls.filter(([name]) => name === "rollback").length, 1);
equal(state.result.value.execOutput.command, "git checkout");

state = await run(baseParams, {
  ensureBranch: async () => {
    throw new Error("unexpected branch exception");
  },
});
equal(state.result.value.error, "unexpected-error");
match(state.result.value.message, /unexpected branch exception/);
equal(state.calls.filter(([name]) => name === "rollback").length, 1);
deepEqual(state.progress.at(-1), ["apply-changes-to-worktree", "failed"]);
equal(
  state.calls.some(
    ([name, target, options]) =>
      name === "destination-remove" &&
      target === "/destination/handoffs/transfer-id" &&
      options.recursive === true,
  ),
  true,
);
equal(
  state.calls.some(
    ([name, target, options]) =>
      name === "source-remove" &&
      target === "/source/handoffs/transfer-id" &&
      options.force === true,
  ),
  true,
);

console.log(`${assertionCount} worker git host handoff assertions passed`);
