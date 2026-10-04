import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  SYNCED_BRANCH_CONFIG_FILE,
  getSyncedBranchConfigPath,
  parseSyncedBranchConfig,
  readSyncedBranchConfig,
  resolveSyncedBranchConfigPath,
  setSyncedBranchConfig,
  writeSyncedBranchConfig,
} = require("../app/.vite/build/worker/git-synced-branch-config.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const rejects = async (...args) => { assertions += 1; await assert.rejects(...args); };

function fixture(overrides = {}) {
  const calls = [];
  const repository = {
    host: {
      platformPath: async () => path.posix,
      readFile: async (...args) => {
        calls.push(["read", ...args]);
        return new TextEncoder().encode('{"branch":"refs/heads/main","lastSyncedTreeRef":"tree"}');
      },
      writeFile: async (...args) => { calls.push(["write", ...args]); },
      ...overrides.host,
    },
  };
  const dependencies = {
    getGitDir: async (...args) => { calls.push(["git-dir", ...args]); return "/repo/.git"; },
    logger: { warning: (...args) => calls.push(["warning", ...args]) },
    parseSchema: (value) =>
      value && typeof value.branch === "string" && typeof value.lastSyncedTreeRef === "string"
        ? {
            success: true,
            data: { branch: value.branch, lastSyncedTreeRef: value.lastSyncedTreeRef },
          }
        : { success: false, error: { message: "invalid config" } },
    resolveGitPath: async (...args) => { calls.push(["resolve", ...args]); return "/repo/.git/codex-synced-branch.json"; },
    ...overrides.dependencies,
  };
  return { calls, dependencies, repository };
}

equal(SYNCED_BRANCH_CONFIG_FILE, "codex-synced-branch.json");

{
  const state = fixture();
  const signal = new AbortController().signal;
  equal(
    await getSyncedBranchConfigPath(state.repository, signal, state.dependencies),
    "/repo/.git/codex-synced-branch.json",
  );
  deepEqual(state.calls[0], ["git-dir", state.repository, signal]);
}

{
  const state = fixture({ dependencies: { getGitDir: async () => null } });
  equal(await getSyncedBranchConfigPath(state.repository, undefined, state.dependencies), null);
  equal(state.calls.length, 0);
}

{
  const state = fixture();
  deepEqual(
    parseSyncedBranchConfig(
      '{"branch":"refs/heads/main","lastSyncedTreeRef":"tree","extra":true}',
      state.dependencies,
    ),
    { branch: "refs/heads/main", lastSyncedTreeRef: "tree" },
  );
  equal(state.calls.length, 0);
  equal(parseSyncedBranchConfig('{"branch":1}', state.dependencies), null);
  deepEqual(state.calls.at(-1), [
    "warning",
    "Invalid synced branch config",
    { safe: { parseErrorMessage: "invalid config" }, sensitive: {} },
  ]);
}

{
  const state = fixture({
    dependencies: { parseSchema: () => ({ success: false, error: {} }) },
  });
  equal(parseSyncedBranchConfig("{}", state.dependencies), null);
  equal(state.calls.at(-1)[2].safe.parseErrorMessage, "unknown error");
  equal(parseSyncedBranchConfig("{", state.dependencies), null);
  equal(state.calls.at(-1)[1], "Failed to parse synced branch config");
  equal(state.calls.at(-1)[2].sensitive.error instanceof SyntaxError, true);
}

{
  const state = fixture();
  deepEqual(await readSyncedBranchConfig(state.repository, undefined, state.dependencies), {
    branch: "refs/heads/main",
    lastSyncedTreeRef: "tree",
  });
  deepEqual(state.calls.map((call) => call[0]), ["git-dir", "read"]);
}

{
  const state = fixture({ dependencies: { getGitDir: async () => null } });
  equal(await readSyncedBranchConfig(state.repository, undefined, state.dependencies), null);
  equal(state.calls.some((call) => call[0] === "read"), false);
}

{
  const failure = new Error("denied");
  const state = fixture({ host: { readFile: async () => { throw failure; } } });
  equal(await readSyncedBranchConfig(state.repository, undefined, state.dependencies), null);
  equal(state.calls.some((call) => call[0] === "warning"), false);
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  await writeSyncedBranchConfig(
    state.repository,
    { branch: "refs/heads/topic", lastSyncedTreeRef: "tree-1" },
    signal,
    state.dependencies,
  );
  deepEqual(state.calls[0], ["git-dir", state.repository, signal]);
  deepEqual(state.calls[1], [
    "write",
    "/repo/.git/codex-synced-branch.json",
    '{\n  "branch": "refs/heads/topic",\n  "lastSyncedTreeRef": "tree-1"\n}\n',
  ]);
}

{
  const state = fixture();
  await setSyncedBranchConfig(
    state.repository,
    "refs/heads/topic",
    "tree-2",
    undefined,
    state.dependencies,
  );
  equal(state.calls.at(-1)[2].includes('"branch": "refs/heads/topic"'), true);
  equal(state.calls.at(-1)[2].includes('"lastSyncedTreeRef": "tree-2"'), true);
}

{
  const state = fixture({ dependencies: { getGitDir: async () => null } });
  await rejects(
    writeSyncedBranchConfig(state.repository, {}, undefined, state.dependencies),
    /No git repository found for synced branch config/,
  );
}

{
  const failure = new Error("write denied");
  const state = fixture({ host: { writeFile: async () => { throw failure; } } });
  await rejects(
    writeSyncedBranchConfig(state.repository, {}, undefined, state.dependencies),
    (value) => value === failure,
  );
}

{
  const state = fixture();
  const signal = new AbortController().signal;
  equal(
    await resolveSyncedBranchConfigPath(state.repository, signal, state.dependencies),
    "/repo/.git/codex-synced-branch.json",
  );
  deepEqual(state.calls.at(-1), [
    "resolve",
    state.repository,
    "codex-synced-branch.json",
    signal,
  ]);
}

console.log(`${assertions} worker git synced branch config assertions passed`);
