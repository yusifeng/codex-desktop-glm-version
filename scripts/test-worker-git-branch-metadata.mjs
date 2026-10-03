import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getBranchMetadata,
  normalizeLocalBranchRef,
} = require("../app/.vite/build/worker/git-branch-metadata.js");

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
  const calls = {
    currentBranch: [],
    defaultRemoteBranch: [],
    normalizeBranch: [],
    repository: [],
    snapshot: [],
  };
  const host = { id: "local" };
  const repository = { root: "/repo", host };
  const dependencies = {
    getCurrentBranch: async (...args) => {
      calls.currentBranch.push(args);
      return Object.hasOwn(options, "currentBranch")
        ? options.currentBranch
        : "feature";
    },
    getDefaultRemoteBranch: async (...args) => {
      calls.defaultRemoteBranch.push(args);
      return options.defaultRemoteBranch === undefined
        ? { branch: "main", remote: "origin" }
        : options.defaultRemoteBranch;
    },
    normalizeBranch: (branch) => {
      calls.normalizeBranch.push(branch);
      return `normalized:${branch}`;
    },
    normalizeCwd: (cwd) => `cwd:${cwd}`,
    readBranchSnapshot: async (...args) => {
      calls.snapshot.push(args);
      return options.snapshot === undefined
        ? { branch: "refs/heads/snapshot" }
        : options.snapshot;
    },
  };
  const gitManager = {
    getWorktreeRepository: async (...args) => {
      calls.repository.push(args);
      return options.repository === undefined ? repository : options.repository;
    },
  };
  return { calls, dependencies, gitManager, host, repository };
}

let state = fixture();
equal(
  normalizeLocalBranchRef("refs/heads/feature", state.dependencies),
  "normalized:feature",
);
deepEqual(state.calls.normalizeBranch, ["feature"]);
equal(
  normalizeLocalBranchRef("origin/main", state.dependencies),
  "normalized:origin/main",
);
deepEqual(state.calls.normalizeBranch, ["feature", "origin/main"]);
equal(
  normalizeLocalBranchRef("refs/heads/refs/heads/nested", state.dependencies),
  "normalized:refs/heads/nested",
);

const signal = new AbortController().signal;
state = fixture({ repository: null });
deepEqual(
  await getBranchMetadata(
    state.gitManager,
    "/missing",
    state.host,
    signal,
    state.dependencies,
  ),
  {
    gitRoot: null,
    branch: null,
    baseBranch: null,
    baseBranchRemote: null,
  },
);
deepEqual(state.calls.repository, [["cwd:/missing", state.host]]);
equal(state.calls.currentBranch.length, 0);
equal(state.calls.defaultRemoteBranch.length, 0);
equal(state.calls.snapshot.length, 0);

state = fixture();
deepEqual(
  await getBranchMetadata(
    state.gitManager,
    "/workspace",
    state.host,
    signal,
    state.dependencies,
  ),
  {
    gitRoot: "/repo",
    branch: "feature",
    baseBranch: "main",
    baseBranchRemote: "origin",
  },
);
deepEqual(state.calls.repository, [["cwd:/workspace", state.host]]);
deepEqual(state.calls.currentBranch, [[state.repository]]);
deepEqual(state.calls.defaultRemoteBranch, [[state.repository]]);
equal(state.calls.snapshot.length, 0);
equal(state.calls.normalizeBranch.length, 0);

state = fixture({ currentBranch: null });
deepEqual(
  await getBranchMetadata(
    state.gitManager,
    "/workspace",
    state.host,
    signal,
    state.dependencies,
  ),
  {
    gitRoot: "/repo",
    branch: "normalized:snapshot",
    baseBranch: "main",
    baseBranchRemote: "origin",
  },
);
deepEqual(state.calls.snapshot, [[state.repository, signal]]);
deepEqual(state.calls.normalizeBranch, ["snapshot"]);

state = fixture({
  currentBranch: "",
  defaultRemoteBranch: { branch: null },
  snapshot: { branch: "detached-snapshot" },
});
deepEqual(
  await getBranchMetadata(
    state.gitManager,
    "/workspace",
    state.host,
    signal,
    state.dependencies,
  ),
  {
    gitRoot: "/repo",
    branch: "normalized:detached-snapshot",
    baseBranch: null,
    baseBranchRemote: null,
  },
);
deepEqual(state.calls.normalizeBranch, ["detached-snapshot"]);

state = fixture({
  currentBranch: undefined,
  defaultRemoteBranch: null,
  snapshot: null,
});
deepEqual(
  await getBranchMetadata(
    state.gitManager,
    "/workspace",
    state.host,
    signal,
    state.dependencies,
  ),
  {
    gitRoot: "/repo",
    branch: null,
    baseBranch: null,
    baseBranchRemote: null,
  },
);
equal(state.calls.snapshot.length, 1);
equal(state.calls.normalizeBranch.length, 0);

let releaseCurrent;
let releaseDefault;
const currentGate = new Promise((resolve) => {
  releaseCurrent = resolve;
});
const defaultGate = new Promise((resolve) => {
  releaseDefault = resolve;
});
state = fixture();
state.dependencies.getCurrentBranch = async () => {
  state.calls.currentBranch.push([state.repository]);
  await currentGate;
  return "parallel";
};
state.dependencies.getDefaultRemoteBranch = async () => {
  state.calls.defaultRemoteBranch.push([state.repository]);
  await defaultGate;
  return { branch: "trunk", remote: "upstream" };
};
const pending = getBranchMetadata(
  state.gitManager,
  "/workspace",
  state.host,
  signal,
  state.dependencies,
);
await new Promise((resolve) => setImmediate(resolve));
equal(state.calls.currentBranch.length, 1);
equal(state.calls.defaultRemoteBranch.length, 1);
releaseCurrent();
releaseDefault();
deepEqual(await pending, {
  gitRoot: "/repo",
  branch: "parallel",
  baseBranch: "trunk",
  baseBranchRemote: "upstream",
});

console.log(`${count} worker git branch metadata assertions passed`);
