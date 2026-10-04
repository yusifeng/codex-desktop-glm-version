import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worktree-create-request-"));
const output = path.join(tempDir, "git-worktree-create-request.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-worktree-create-request.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { createWorktreeRequest } = createRequire(import.meta.url)(output);

const events = [];
const controllers = new Map();
const requestController = new AbortController();
const host = { id: "local-host" };
const gitManager = { id: "manager" };
let createParams;
let createResult = {
  success: true,
  worktreeGitRoot: "/repo/worktree",
  worktreeWorkspaceRoot: "/repo/worktree/subdir",
  setupError: new Error("setup continued"),
};
const deps = {
  gitManager,
  host,
  signal: requestController.signal,
  emit: (event) => events.push(event),
  upstreamRefreshControllers: controllers,
  createWorktree: async (params) => {
    createParams = params;
    assert.equal(controllers.get("pending")?.signal, params.upstreamRefreshSignal);
    params.onWorktreePathAllocated("/repo/worktree");
    params.onSetupStart();
    params.onLog("stdout", "installing");
    return createResult;
  },
};
const params = {
  cwd: "/repo/subdir",
  name: "feature",
  streamId: "stream-1",
  pendingWorktreeId: "pending",
  startingState: { type: "branch", branchName: "main" },
  upstreamRefreshMode: "always",
  localEnvironmentConfigPath: "/repo/setup.json",
  allowSetupFailure: true,
  worktreesRoot: "/managed",
  useWorkspaceDir: true,
};

assert.deepEqual(await createWorktreeRequest(params, deps), {
  type: "ok",
  value: {
    worktreeGitRoot: "/repo/worktree",
    worktreeWorkspaceRoot: "/repo/worktree/subdir",
    setupError: "setup continued",
  },
});
assert.equal(createParams.gitManager, gitManager);
assert.equal(createParams.host, host);
assert.equal(createParams.signal, requestController.signal);
assert.equal(createParams.workspaceRoot, "/repo/subdir");
assert.equal(createParams.name, "feature");
assert.equal(createParams.setUpSyncedBranch, true);
assert.equal(createParams.worktreesRoot, "/managed");
assert.equal(createParams.useWorkspaceDir, true);
assert.equal(controllers.has("pending"), false);
assert.deepEqual(events, [
  {
    type: "worker-event",
    event: {
      type: "create-worktree-path",
      hostId: "local-host",
      streamId: "stream-1",
      worktreeGitRoot: "/repo/worktree",
    },
  },
  {
    type: "worker-event",
    event: { type: "create-worktree-setup-started", streamId: "stream-1" },
  },
  {
    type: "worker-event",
    event: {
      type: "create-worktree-stream",
      streamId: "stream-1",
      stream: "stdout",
      data: "installing",
    },
  },
]);

createResult = { success: false, error: new Error("checkout failed") };
deps.createWorktree = async ({ upstreamRefreshSignal, ...rest }) => {
  createParams = rest;
  controllers.set("pending", new AbortController());
  return createResult;
};
assert.deepEqual(await createWorktreeRequest({ ...params, setUpSyncedBranch: false }, deps), {
  type: "error",
  error: { message: "checkout failed" },
});
assert.equal(createParams.setUpSyncedBranch, false);
assert.equal(controllers.has("pending"), true);

events.length = 0;
requestController.abort();
deps.createWorktree = async (options) => {
  options.onWorktreePathAllocated("/ignored");
  options.onSetupStart();
  options.onLog("stderr", "ignored");
  return { success: true, worktreeGitRoot: "/ok", worktreeWorkspaceRoot: "/ok", setupError: null };
};
const noPending = { ...params };
delete noPending.pendingWorktreeId;
assert.equal((await createWorktreeRequest(noPending, deps)).type, "ok");
assert.deepEqual(events, []);

console.log("24 worker git worktree create request assertions passed");
