import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};

function schema(shape) {
  return {
    loose() { return this; },
    safeParse(value) {
      if (typeof value !== "object" || value == null) return { success: false };
      for (const [key, child] of Object.entries(shape)) {
        if (child === "string" && typeof value[key] !== "string") return { success: false };
        if (child !== "string" && !child.safeParse(value[key]).success) return { success: false };
      }
      return { success: true, data: value };
    },
  };
}

const source = fs.readFileSync(
  new URL("../src/main/main-app/threads/archive.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "@chunk/shared")
    return {
      Cs: (hostId) => hostId.startsWith("durable"),
      Of: () => "string",
      Za: ({ worktreesRoot, cwd }) => cwd === worktreesRoot || cwd.startsWith(`${worktreesRoot}/`),
      Wu: (version, feature) => version === "supports" && feature === "threadAttachments",
      wf: schema,
    };
  if (specifier === "../turns/canonical-history")
    return {
      conversationTurns: (conversation) =>
        conversation.turnHistory?.kind === "canonical"
          ? conversation.turnHistory.history.islands.flatMap((island) =>
              island.entries.map((entry) => conversation.turnHistory.history.entitiesByKey[entry.value]),
            )
          : conversation.turns,
    };
  if (specifier === "./projection") return { H_: (source) => source?.subagent === true ? {} : null };
  if (specifier === "./reference-capability") return { threadReferenceCapabilityKey: (id) => `cap:${id}` };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);

const {
  UnarchivedConversationLoadError,
  archiveContextFactory,
  archiveConversation,
  deleteArchivedConversation,
  performArchiveConversation,
  unarchiveConversation,
} = module.exports;

function factoryInput(overrides = {}) {
  const conversations = new Map();
  const threadStore = {
    conversations,
    threadsById: new Map(),
    listAllThreads: async () => [],
    isEphemeralConversation: () => false,
    getThreadSummary: () => null,
    isConversationSuppressed: () => false,
    suppressArchivedConversation() {},
    unsuppressArchivedConversation() {},
  };
  return {
    useAppServerPins: false,
    appServerVersion: "unsupported",
    threadStore,
    projectlessState: {},
    storage: {},
    archivingConversationIds: new Set(),
    archivedPinnedThreadPlacements: new Map(),
    runtime: { archiveUndoDurationMs: 10_000, hasDesktopRuntime: true, pinnedThreads: async () => null },
    isLocalHost: (hostId) => hostId === "local",
    worktreeRoots: {
      getManagedWorktreeRoots: async () => [],
      getConfiguredWorktreeRoot: async () => "/configured",
    },
    pendingThreadArchives: { add() {}, remove() {} },
    ipcBridge: {},
    inactiveThreadUnsubscriber: { clearConversationStreamOwnership() {} },
    manager: {
      logger: { info() {}, warning() {}, error() {} },
      getHostId: () => "local",
      discardConversationFromCache() {},
      readThread: async () => ({ thread: { cwd: "/read" } }),
      sendRequest: async () => {},
      hydrateBackgroundThreads: async () => {},
      getStreamRole: () => null,
    },
    events: { emitThreadArchived() {} },
    conversationCacheEvictor: { evictConversation() {} },
    ...overrides,
  };
}

let managedRootsCalls = 0;
const desktopContext = archiveContextFactory(factoryInput({
  appServerVersion: "supports",
  worktreeRoots: {
    getManagedWorktreeRoots: async () => { managedRootsCalls += 1; return []; },
    getConfiguredWorktreeRoot: async () => "/configured",
  },
}));
equal(await desktopContext.getManagedWorktreeCleanup("/anywhere"), true);
equal(managedRootsCalls, 0);

const rootsContext = archiveContextFactory(factoryInput({
  runtime: { archiveUndoDurationMs: 10_000, hasDesktopRuntime: false, pinnedThreads: async () => null },
  worktreeRoots: {
    getManagedWorktreeRoots: async () => ["/managed"],
    getConfiguredWorktreeRoot: async () => "/configured",
  },
}));
equal(await rootsContext.getManagedWorktreeCleanup("/managed/thread"), true);
equal(await rootsContext.getManagedWorktreeCleanup("/configured/thread"), true);
equal(await rootsContext.getManagedWorktreeCleanup("/outside"), false);

const ownershipEvents = [];
const ownershipContext = archiveContextFactory(factoryInput({
  manager: {
    logger: { info() {}, warning() {}, error() {} },
    getHostId: () => "local",
    getStreamRole: () => ({ role: "owner" }),
    sendRequest: async (method) => ownershipEvents.push(method),
    hydrateBackgroundThreads: async () => {},
    discardConversationFromCache() {},
    readThread: async () => ({ thread: { cwd: "/" } }),
  },
  inactiveThreadUnsubscriber: {
    clearConversationStreamOwnership: (id) => ownershipEvents.push(`clear:${id}`),
  },
}));
await ownershipContext.prepareOwnedThreadForUnarchive("thread");
equal(ownershipEvents, ["thread/unsubscribe", "clear:thread"]);

function archiveHarness(overrides = {}) {
  const events = [];
  const conversations = new Map([["thread", { id: "thread", turns: [] }]]);
  const context = {
    hostId: "local",
    logger: {
      info: (message) => events.push(`log:${message}`),
      warning: (message) => events.push(`warn:${message}`),
      error: (message) => events.push(`error:${message}`),
    },
    archiveUndoDurationMs: 1000,
    useAppServerPins: false,
    isElectronWindow: () => true,
    isEphemeralConversation: () => false,
    discardConversationFromCache: async () => events.push("discard"),
    getThreadSummary: () => null,
    beforeArchiveConversation: async () => events.push("before"),
    conversations,
    projectlessState: { removeConversation: async (id) => events.push(`projectless:${id}`) },
    storage: { writeValue: async (key) => events.push(`storage:${key}`) },
    threadsById: new Map(),
    archivingConversationIds: {
      add: (id) => events.push(`active+:${id}`),
      delete: (id) => events.push(`active-:${id}`),
    },
    archivedPinnedThreadPlacements: new Map(),
    isConversationSuppressedAfterArchive: () => false,
    addSuppressedArchivedConversationId: (id) => events.push(`suppress:${id}`),
    deleteSuppressedArchivedConversationId: (id) => events.push(`unsuppress:${id}`),
    listActiveThreads: async () => [],
    readThread: async () => ({ thread: { cwd: "/read" } }),
    archiveInactiveThread: async () => ({ success: false }),
    archiveThread: async (id) => events.push(`archive:${id}`),
    unarchiveThread: async (id) => events.push(`unarchive:${id}`),
    broadcastThreadArchived: async () => events.push("broadcast-archived"),
    broadcastThreadUnarchived: async () => events.push("broadcast-unarchived"),
    loadUnarchivedThread: async () => events.push("load-unarchived"),
    prepareOwnedThreadForUnarchive: async () => events.push("prepare-unarchive"),
    removeConversationFromCache: (id) => events.push(`evict:${id}`),
    emitThreadArchived: (id) => events.push(`emit:${id}`),
    pendingThreadArchives: {
      add: (id, value) => events.push(`pending+:${id}:${value.cleanupWorktree}`),
      remove: (id) => events.push(`pending-:${id}`),
    },
    getPinnedThreadIds: async () => ["first", "thread", "after"],
    setThreadPinned: async ({ pinned, beforeThreadId }) => events.push(`pin:${pinned}:${beforeThreadId}`),
    getManagedWorktreeCleanup: async () => true,
    ...overrides,
  };
  return { context, events, conversations };
}

{
  const { context, events } = archiveHarness();
  await performArchiveConversation(context, "thread", "/worktree", { cleanupWorktree: true, source: "user" });
  equal(events, [
    "log:Archive requested", "suppress:thread", "active+:thread", "pending+:thread:true",
    "archive:thread", "pin:false:undefined", "evict:thread", "broadcast-archived", "active-:thread",
  ]);
  equal(context.archivedPinnedThreadPlacements.get("local:thread").beforeThreadId, "after");
}

{
  const { context, events } = archiveHarness({
    archiveThread: async () => { throw { message: "no rollout found for thread id thread" }; },
    archiveInactiveThread: async () => ({ success: true, threadMissing: true }),
  });
  await performArchiveConversation(context, "thread", "/worktree", {
    cleanupWorktree: true,
    source: "realtime_voice_provisional",
  });
  ok(events.includes("log:Archive skipped because thread has no active rollout"));
  ok(events.includes("projectless:thread"));
  ok(events.includes("storage:cap:thread"));
  ok(events.includes("emit:thread"));
  equal(events.at(-1), "active-:thread");
}

{
  const failure = Error("network failed");
  const { context, events } = archiveHarness({ archiveThread: async () => { throw failure; } });
  await assert.rejects(
    performArchiveConversation(context, "thread", "/worktree", { cleanupWorktree: true }),
    (error) => error === failure,
  );
  assertions += 1;
  ok(events.includes("unsuppress:thread"));
  equal(events.at(-1), "active-:thread");
}

{
  const canonicalConversation = {
    id: "thread",
    turns: [],
    source: null,
    turnHistory: { kind: "canonical", history: {
      islands: [{ entries: [{ value: "turn:last" }] }],
      entitiesByKey: { "turn:last": { params: { cwd: "/canonical-cwd" } } },
    } },
  };
  let receivedCwd;
  const { context } = archiveHarness({
    conversations: new Map([["thread", canonicalConversation]]),
    threadsById: new Map(),
    archiveThread: async () => {},
    getManagedWorktreeCleanup: async (cwd) => { receivedCwd = cwd; return false; },
  });
  await archiveConversation(context, "thread", { cleanupWorktree: true, source: "user" });
  equal(receivedCwd, "/canonical-cwd");
}

{
  const { context, events, conversations } = archiveHarness();
  context.archivedPinnedThreadPlacements.set("local:thread", {
    beforeThreadId: "after", expiresAt: Date.now() + 1000,
  });
  await unarchiveConversation(context, "thread", true);
  equal(events.slice(0, 4), [
    "prepare-unarchive", "pending-:thread", "log:Unarchive requested", "unarchive:thread",
  ]);
  ok(events.includes("load-unarchived"));
  ok(events.includes("broadcast-unarchived"));
  ok(events.includes("pin:true:after"));
  equal(conversations.has("thread"), true);
}

{
  const { context, conversations } = archiveHarness();
  conversations.clear();
  await assert.rejects(
    unarchiveConversation(context, "missing"),
    (error) => error instanceof UnarchivedConversationLoadError,
  );
  assertions += 1;
}

{
  const deleted = { ids: ["one"] };
  let handled;
  equal(await deleteArchivedConversation({
    hostId: "local",
    runtime: { deleteArchivedThreads: async (hostId, id) => ({ ...deleted, hostId, id }) },
    handleThreadDeletion: (value) => { handled = value; },
  }, "one"), { ...deleted, hostId: "local", id: "one" });
  equal(handled.id, "one");
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
for (const oldDefinition of ["qge", "F_", "I_", "L_", "R_", "Jge", "z_", "B_", "zve", "ab", "ob", "ub", "db", "fb", "pb", "mb", "hb"])
  equal(new RegExp(`(?:async )?function ${oldDefinition.replace("$", "\\$")}\\(`).test(main), false);
equal(main.includes("Xge = class"), false);
equal(source.includes("threadAttachments"), true);
equal(source.includes("getConfiguredWorktreeRoot"), true);
equal(source.includes("Failed to clean up retired thread metadata"), true);

console.log(`${assertions} main thread archive owner assertions passed`);
