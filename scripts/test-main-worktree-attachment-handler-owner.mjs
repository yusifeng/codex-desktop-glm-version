import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/workspace/worktree-attachment-handler.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createWorktreeAttachmentHandlerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, reject, resolve };
}

class RpcHandlerBase {}
const WorktreeAttachmentHandler = createWorktreeAttachmentHandlerClass({
  RpcHandlerBase,
  isCloudHost: (hostId) => hostId.startsWith("cloud"),
  normalizeConversationId: (threadId) => `conversation:${threadId}`,
  supportsFeature: (version, feature) => version === "supported" && feature === "threadAttachments",
});

function createHarness(overrides = {}) {
  const calls = [];
  const connection = {
    appServerVersion: "supported",
    async readThread(threadId) {
      calls.push(["readThread", threadId]);
      return { conversationId: threadId, cwd: "/repo" };
    },
    async sendAppServerRequest(method, params) {
      calls.push([method, params]);
      if (method === "thread/attachment/list") return { data: [], nextCursor: null };
      return {};
    },
    ...overrides.connection,
  };
  const service = {
    async archiveAttachedWorktree(...args) { calls.push(["archiveAttachedWorktree", ...args]); },
    async createManagedWorktree(options) {
      calls.push(["createManagedWorktree", options]);
      return { worktreeGitRoot: "/repo/.worktrees/feature", worktreeWorkspaceRoot: "/workspace" };
    },
    async handleArchiveCleanup(options) { calls.push(["handleArchiveCleanup", options]); },
    async setOwnerThread(options) { calls.push(["setOwnerThread", options]); },
    ...overrides.service,
  };
  const connections = {
    getConnection(hostId) {
      calls.push(["getConnection", hostId]);
      if (overrides.connectionError != null) throw overrides.connectionError;
      return connection;
    },
  };
  const handler = new WorktreeAttachmentHandler(connections, (hostId) => {
    calls.push(["getWorktreeService", hostId]);
    return service;
  });
  return { calls, connection, handler, service };
}

const cloudHarness = createHarness();
equal(await cloudHarness.handler.createForThread({
  callId: "call", hostId: "cloud-1", name: "feature", ref: "main", threadId: "thread",
}), {
  type: "error",
  message: "Managed worktrees require a local, SSH, or WSL task.",
}, "cloud worktree creation is rejected before connection lookup");
equal(cloudHarness.calls, [], "cloud creation has no downstream side effects");

const unsupported = createHarness({ connection: { appServerVersion: "old" } });
equal(await unsupported.handler.createForThread({
  callId: "call", hostId: "local", threadId: "thread",
}), {
  type: "error",
  message: "This host must support thread attachments before creating a managed worktree.",
}, "creation requires thread-attachment protocol support");
equal(unsupported.calls.slice(0, 2), [
  ["getConnection", "local"],
  ["readThread", "thread"],
], "feature admission preserves the original read-before-version order");

const missingThread = createHarness({
  connection: { async readThread() { return null; } },
});
equal(await missingThread.handler.createForThread({
  callId: "call", hostId: "local", threadId: "missing",
}), { type: "error", message: "The calling task could not be found." }, "missing calling threads are rejected");
equal(missingThread.calls.some(([name]) => name === "createManagedWorktree"), false, "missing threads cannot create worktrees");

const created = createHarness();
equal(await created.handler.createForThread({
  callId: "stream-1", hostId: "local", name: "feature", threadId: "thread-1",
}), {
  type: "created",
  worktreeGitRoot: "/repo/.worktrees/feature",
  worktreeWorkspaceRoot: "/workspace",
  registrationError: null,
}, "successful creation returns both managed roots");
const createOptions = created.calls.find(([name]) => name === "createManagedWorktree")[1];
equal(createOptions, {
  hostId: "local",
  cwd: "/repo",
  startingState: { type: "branch", branchName: "HEAD" },
  name: "feature",
  localEnvironmentConfigPath: null,
  streamId: "stream-1",
}, "creation preserves default ref, source cwd, and progress stream");
equal(created.calls.find(([name]) => name === "setOwnerThread")[1], {
  worktree: "/repo/.worktrees/feature",
  conversationId: "conversation:thread-1",
}, "owner registration uses the normalized conversation id");
equal(created.calls.find(([name]) => name === "thread/attachment/add")[1], {
  threadId: "thread-1",
  attachmentType: "worktree",
  identityKey: "/repo/.worktrees/feature",
  payload: {
    root: "/repo/.worktrees/feature",
    workspaceRoot: "/workspace",
    sourceCwd: "/repo",
  },
}, "app-server registration receives the complete attachment payload");

const registrationFailure = createHarness({
  service: {
    async setOwnerThread() { throw new Error("owner failed"); },
  },
  connection: {
    async sendAppServerRequest(method) {
      if (method === "thread/attachment/add") throw "transport failed";
      return { data: [], nextCursor: null };
    },
  },
});
equal((await registrationFailure.handler.createForThread({
  callId: "call", hostId: "local", ref: "feature", threadId: "thread",
})).registrationError, "owner failed; Worktree registration failed.", "parallel registration failures aggregate in stable order");

const creationError = createHarness({
  service: { async createManagedWorktree() { throw new Error("disk full"); } },
});
equal(await creationError.handler.createForThread({
  callId: "call", hostId: "local", threadId: "thread",
}), { type: "error", message: "disk full" }, "creation errors retain their message");

const creationGate = deferred();
const pending = createHarness({
  service: {
    async createManagedWorktree() {
      await creationGate.promise;
      return { worktreeGitRoot: "/worktree", worktreeWorkspaceRoot: "/workspace" };
    },
  },
});
const pendingCreation = pending.handler.createForThread({
  callId: "call", hostId: "local", threadId: "thread",
});
await Promise.resolve();
let cleanupFinished = false;
const cleanupSignal = { throwIfAborted() { pending.calls.push(["throwIfAborted"]); } };
const cleanup = pending.handler.cleanupForArchivedThread(
  "local",
  { conversationId: "thread", cwd: "/repo" },
  cleanupSignal,
).then(() => { cleanupFinished = true; });
await Promise.resolve();
equal(cleanupFinished, false, "archive cleanup waits for matching pending creations");
equal(pending.calls.some(([name]) => name === "handleArchiveCleanup"), false, "cleanup cannot overtake worktree registration");
creationGate.resolve();
await Promise.all([pendingCreation, cleanup]);
equal(cleanupFinished, true, "archive cleanup resumes after pending creation settles");
const barrierTail = pending.calls.slice(-3).map(([name]) => name);
equal(barrierTail, ["throwIfAborted", "getWorktreeService", "handleArchiveCleanup"], "abort gate runs immediately before cleanup delegation");

const aborted = createHarness();
await assert.rejects(
  aborted.handler.cleanupForArchivedThread(
    "local",
    { conversationId: "thread" },
    { throwIfAborted() { throw new Error("aborted"); } },
  ),
  /aborted/,
);
assertions += 1;
equal(aborted.calls.some(([name]) => name === "handleArchiveCleanup"), false, "aborted cleanup has no service side effect");

let page = 0;
const removal = createHarness({
  connection: {
    async sendAppServerRequest(method, params) {
      removal.calls.push([method, params]);
      if (method === "thread/attachment/list") {
        page += 1;
        return page === 1
          ? { data: [{ attachmentType: "worktree", identityKey: "/other" }], nextCursor: "next" }
          : { data: [{ attachmentType: "worktree", identityKey: "/target" }], nextCursor: null };
      }
      return {};
    },
  },
});
equal(await removal.handler.removeFromThread({
  hostId: "local", threadId: "thread", root: "/target",
}), { type: "removed" }, "matching attachment is archived and removed");
equal(page, 2, "removal paginates until the matching identity is found");
equal(removal.calls.find(([name]) => name === "archiveAttachedWorktree"), [
  "archiveAttachedWorktree", "thread", "/repo", "/target",
], "removal archives the checkout before detaching it");
const archiveIndex = removal.calls.findIndex(([name]) => name === "archiveAttachedWorktree");
const removeIndex = removal.calls.findIndex(([name]) => name === "thread/attachment/remove");
equal(archiveIndex < removeIndex, true, "archive side effect precedes attachment removal");

const absent = createHarness();
equal(await absent.handler.removeFromThread({
  hostId: "local", threadId: "thread", root: "/missing",
}), { type: "removed" }, "already-absent attachments are idempotently removed");
equal(absent.calls.some(([name]) => name === "archiveAttachedWorktree"), false, "absent attachments do not archive anything");

const missingRemovalThread = createHarness({
  connection: {
    async sendAppServerRequest(method) {
      return method === "thread/attachment/list"
        ? { data: [{ attachmentType: "worktree", identityKey: "/target" }], nextCursor: null }
        : {};
    },
    async readThread() { return null; },
  },
});
equal(await missingRemovalThread.handler.removeFromThread({
  hostId: "local", threadId: "missing", root: "/target",
}), { type: "error", message: "The task could not be found." }, "removal requires the thread cwd for archive");

const cloudRemoval = createHarness();
equal(await cloudRemoval.handler.removeFromThread({
  hostId: "cloud-1", threadId: "thread", root: "/target",
}), { type: "error", message: "Worktree attachments are unavailable on this host." }, "cloud removal is unavailable");

const removalError = createHarness({ connectionError: new Error("connection lost") });
equal(await removalError.handler.removeFromThread({
  hostId: "local", threadId: "thread", root: "/target",
}), { type: "error", message: "connection lost" }, "removal normalizes connection failures");

ok(assertions >= 25, "worktree attachment owner has broad state and lifecycle coverage");
console.log(`${assertions} main worktree attachment handler owner assertions passed`);
