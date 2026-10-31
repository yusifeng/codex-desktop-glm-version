import assert from "node:assert/strict";
import fs from "node:fs";
import { createWorktreeServiceClass } from "../src/main/main-app/workspace/worktree-service.ts";

class DisposableStore {
  disposables = [];
  add(disposable) {
    this.disposables.push(disposable);
    return disposable;
  }
  dispose() {
    for (const disposable of this.disposables.splice(0)) {
      if (typeof disposable === "function") disposable();
      else disposable.dispose();
    }
  }
}

const workerEvents = new Map();
const published = [];
const workerRequests = [];
const windowMessages = [];
const logs = [];
let disposedSubscriptions = 0;
let selectedProject = null;
const createResult = Promise.withResolvers();

const WorktreeService = createWorktreeServiceClass({
  runtime: {
    Wr: DisposableStore,
    Ns: (value) => value,
    Ps: (value) => value,
    Uo: (values) => values,
    V: async (root) => `id:${root}`,
    hs: { upstreamRefreshMode: { key: "upstream-refresh-mode" } },
    Na: { turnMode: { key: "turn-mode" } },
    iu: {
      LOCAL_PROJECTS: "local-projects",
      PROJECT_ORDER: "project-order",
      SELECTED_PROJECT: "selected-project",
    },
  },
  crypto: { randomUUID: () => "stream-1" },
  featureFlags: () => ({ workspaceDir: true }),
  logger: () => ({
    info: (...args) => logs.push(["info", ...args]),
    warning: (...args) => logs.push(["warning", ...args]),
  }),
  chunkItems: {
    default: (items, size) => {
      const chunks = [];
      for (let index = 0; index < items.length; index += size)
        chunks.push(items.slice(index, index + size));
      return chunks;
    },
  },
  cleanupChunkSize: 5,
  isProtectedWorkspaceRoot: () => false,
  readThreadMetadata: async () => ({}),
  hasUnavailablePinnedMetadata: () => false,
  getPinnedProtectedRoots: () => [],
  planWorktreeCleanup: () => ({ candidates: [] }),
  isPreMigrationProtectionActive: () => false,
  getProtectedWorkspaceRoots: () => [],
  getPinnedThreadIds: () => [],
  getSelectedProject: () => selectedProject,
  setSelectedProject: (_state, value) => {
    selectedProject = value;
  },
  maxOutputLength: 32_000,
  preservedOutputLines: ["[info] Starting worktree creation"],
});

const service = new WorktreeService({
  appServerConnection: {},
  desktopNotificationManager: { showNotification: () => assert.fail("unexpected notification") },
  globalState: {},
  settingsStore: {
    getEffective: (key) => (key === "turn-mode" ? "off" : "never"),
  },
  getHostConfigForHostId: () => ({ kind: "local" }),
  getHostWorktreeSettings: async () => ({
    autoCleanupEnabled: false,
    keepCount: 5,
    worktreesRoot: "/worktrees",
  }),
  executionHost: {},
  assignUnassignedThreadsBeforeProjectRootsChange: async () => {},
  createProjectForRoots: async () => null,
  hostConfig: { kind: "local" },
  hostId: "host-1",
  requestGitWorker: (request) => {
    workerRequests.push(request);
    if (request.method === "create-worktree") return createResult.promise;
    if (request.method === "delete-worktree") return Promise.resolve({});
    assert.fail(`unexpected worker request: ${request.method}`);
  },
  setSharedPendingWorktrees: (entries) => published.push(structuredClone(entries)),
  subscribeGitWorkerEvent: (type, callback) => {
    workerEvents.set(type, callback);
    return () => disposedSubscriptions++;
  },
  windowManager: {
    sendMessageToAllWindows: (message) => windowMessages.push(message),
    getPrimaryWindow: () => null,
  },
});

assert.deepEqual(service.getPendingWorktrees(), []);
assert.equal(workerEvents.size, 3);
assert.equal(published.length, 1);

service.create({
  id: "pending-1",
  sourceWorkspaceRoot: "/source",
  sourceWorkspaceRoots: ["/source"],
  startingState: { type: "branch", branchName: "feature" },
  localEnvironmentConfigPath: null,
  launchMode: "create-worktree",
  label: "Feature",
});
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(workerRequests.length, 1);
assert.equal(workerRequests[0].method, "create-worktree");
assert.equal(workerRequests[0].params.streamId, "stream-1");
assert.equal(workerRequests[0].params.operationSource, "worktree_pending_create");
assert.equal(workerRequests[0].params.useWorkspaceDir, true);
assert.equal(service.getPendingWorktrees()[0].phase, "creating");
assert.deepEqual(service.getRestartBlockers(), ["worktree.creating"]);

await workerEvents.get("create-worktree-path")({
  hostId: "host-1",
  streamId: "stream-1",
  worktreeGitRoot: "/worktrees/feature",
});
assert.equal(service.newbornWorktreeRoots.has("/worktrees/feature"), true);
assert.equal(service.newbornWorktreeRootsByStreamId.get("stream-1"), "/worktrees/feature");

workerEvents.get("create-worktree-stream")({
  streamId: "stream-1",
  data: new TextEncoder().encode("creating output\n"),
});
assert.match(service.getPendingWorktrees()[0].worktreeOutputText, /creating output/);

workerEvents.get("create-worktree-setup-started")({ streamId: "stream-1" });
assert.equal(service.getPendingWorktrees()[0].phase, "setting-up");
workerEvents.get("create-worktree-stream")({
  streamId: "stream-1",
  data: new TextEncoder().encode("setup output\n"),
});
assert.match(service.getPendingWorktrees()[0].setupOutputText, /setup output/);

createResult.resolve({
  worktreeGitRoot: "/worktrees/feature",
  worktreeWorkspaceRoot: "/worktrees/feature/workspace",
  setupError: null,
});
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(service.getPendingWorktrees()[0].phase, "worktree-ready");
assert.equal(service.getPendingWorktrees()[0].worktreeGitRoot, "/worktrees/feature");
assert.equal(service.statesById.get("pending-1").runtime, null);
assert.deepEqual(service.getRestartBlockers(), ["worktree.starting-conversation"]);
assert.equal(logs.some(([, message]) => message === "[worktree-create] ready"), true);

service.updateMetadata("pending-1", {
  type: "conversationStartResult",
  result: { conversationId: "thread-1" },
});
assert.deepEqual(service.getRestartBlockers(), []);
service.updateMetadata("pending-1", { type: "isPinned", isPinned: true });
assert.equal(service.getPendingWorktrees()[0].isPinned, true);

service.forgetNewbornWorktreeStream("stream-1");
assert.equal(service.newbornWorktreeRoots.size, 0);
assert.equal(service.newbornWorktreeRootsByStreamId.size, 0);

service.cancelledWorktreeStreamIds.add("cancelled-stream");
await workerEvents.get("create-worktree-path")({
  hostId: "host-1",
  streamId: "cancelled-stream",
  worktreeGitRoot: "/worktrees/cancelled",
});
assert.equal(workerRequests.at(-1).method, "delete-worktree");
assert.equal(workerRequests.at(-1).params.operationSource, "worktree_new_branch_cleanup");
assert.deepEqual(windowMessages.at(-1), {
  type: "worktrees-reload-requested",
  hostId: "host-1",
});

service.dispose();
assert.equal(disposedSubscriptions, 3);
assert.equal(service.cancelledWorktreeStreamIds.size, 0);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /XQe = createWorktreeServiceClass\(\{/);
assert.doesNotMatch(main, /XQe = class/);
assert.doesNotMatch(main, /function QZ\(/);
assert.doesNotMatch(main, /function ZQe\(/);
assert.doesNotMatch(main, /function QQe\(/);

console.log("worktree service assertions: 34");
