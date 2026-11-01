import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const syncSource = fs.readFileSync(new URL("../src/main/main-app/thread-catalog/sync-coordinator.ts", import.meta.url), "utf8");
const syncOutput = await transform(syncSource, { loader: "ts", format: "esm", target: "node22" });
const { createThreadCatalogSyncCoordinatorClass } = await import(`data:text/javascript;base64,${Buffer.from(syncOutput.code).toString("base64")}`);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const ThreadCatalogSyncCoordinator = createThreadCatalogSyncCoordinatorClass({
  runtime: {
    ar: (params) => params?.threadId ?? null,
    ir: (params) => params?.thread ?? null,
  },
  parseImportedThreadsNotification: (params) => params,
  projectThreadEntry: (thread, hostId) => ({
    threadId: thread.id,
    hostId,
    sourceUpdatedAt: thread.updatedAt,
  }),
});

const mutations = [];
let syncState = {
  catalogRevision: 0,
  isComplete: true,
  lastFullReconciliationAt: 1,
  sourceUpdatedAtWatermark: null,
};
const store = {
  hostId: "local",
  readSyncState: () => ({ ...syncState }),
  readScanCheckpoint: () => null,
  beginScan: (mode) => ({ mode }),
  applyScanPage: (_scan, entries) => {
    mutations.push(["page", entries]);
    return { changedThreadIds: [], removedThreadIds: [] };
  },
  completeScan: () => {
    syncState = {
      ...syncState,
      catalogRevision: syncState.catalogRevision + 1,
    };
  },
  abortScan: () => mutations.push(["abort"]),
  pruneEntriesOlderThan: () => false,
  applyObservedTitle: (threadId, title) => {
    mutations.push(["title", threadId, title]);
    return { changedThreadIds: [threadId], removedThreadIds: [] };
  },
  applyAuthoritativeRemoval: (threadId) => {
    mutations.push(["remove", threadId]);
    return { changedThreadIds: [], removedThreadIds: [threadId] };
  },
  applyObservedEntry: (entry) => {
    mutations.push(["entry", entry]);
    return { changedThreadIds: [entry.threadId], removedThreadIds: [] };
  },
  readEntry: (threadId) => ({ threadId, hostId: "local", sourceUpdatedAt: 1 }),
};
const pageCalls = [];
const client = {
  listPage: async (request, priority) => {
    pageCalls.push([request, priority]);
    return { items: [], nextCursor: null };
  },
  readItem: async () => null,
};
const errors = [];
const coordinator = new ThreadCatalogSyncCoordinator(client, store, {
  now: () => 10_000,
  onError: (error) => errors.push(error),
});

equal(coordinator.constructor.name, "ThreadCatalogSyncCoordinator");
equal(coordinator.readSyncState(), syncState);
const events = [];
const subscription = coordinator.subscribe((event) => events.push(event));
coordinator.handleNotification({
  method: "thread/name/updated",
  params: { threadId: "thread-1", threadName: "Renamed" },
});
equal(mutations.at(-1), ["title", "thread-1", "Renamed"]);
equal(events.at(-1).type, "delta");
equal(events.at(-1).entries[0].threadId, "thread-1");

coordinator.handleNotification({
  method: "thread/archived",
  params: { threadId: "thread-2" },
});
equal(mutations.at(-1), ["remove", "thread-2"]);
equal(events.at(-1).mutation.removedThreadIds, ["thread-2"]);

equal(await coordinator.requestStartupSync(), "completed");
equal(pageCalls, [[{ cursor: null, limit: 100 }, "background"]]);
equal(coordinator.readSyncState().catalogRevision, 1);
equal(errors, []);
subscription.dispose();
coordinator.dispose();
equal(coordinator.disposed, true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const catalogService = fs.readFileSync(
  new URL("../src/main/main-app/thread-catalog/service.ts", import.meta.url),
  "utf8",
);
equal(main.includes("int = createThreadCatalogSyncCoordinatorClass({"), true);
equal(main.includes("int = class"), false);
equal(catalogService.includes("new ThreadCatalogSyncCoordinator("), true);
equal(main.includes("parseImportedThreadsNotification: NI"), true);
equal(main.includes("projectThreadEntry: um"), true);

console.log(
  `${assertions} main thread catalog sync coordinator assertions passed`,
);
