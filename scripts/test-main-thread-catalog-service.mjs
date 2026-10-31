import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { createThreadCatalogServiceClass } from "../src/main/main-app/thread-catalog/service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const throws = (callback, pattern) => {
  assert.throws(callback, pattern);
  assertions += 1;
};

class PageSlotScheduler {
  clearHost() {}
  promoteHost() {}
  waitForPageSlot() {
    return Promise.resolve(true);
  }
  getBackgroundPageDispatchDelay() {
    return 0;
  }
  recordBackgroundPageDispatch() {}
  dispose() {
    this.disposed = true;
  }
}

class SyncCoordinator {
  constructor(client, store, options) {
    this.client = client;
    this.store = store;
    this.options = options;
    this.enabled = false;
    this.syncState = store.readSyncState();
  }
  setSyncEnabled(value) {
    this.enabled = value;
  }
  readSyncState() {
    return this.syncState;
  }
  subscribe(listener) {
    this.listener = listener;
    return {
      dispose: () => {
        this.listener = null;
      },
    };
  }
  subscribeThreadObservations(listener) {
    this.observer = listener;
    return {
      dispose: () => {
        this.observer = null;
      },
    };
  }
  pruneExpiredEntries() {
    this.pruned = true;
  }
  requestSync() {
    return Promise.resolve("completed");
  }
  requestForegroundSync() {
    return Promise.resolve("completed");
  }
  requestStartupSync() {
    return Promise.resolve("completed");
  }
  cancelQueuedSync() {
    this.cancelled = true;
  }
  handleNotification(notification) {
    this.notification = notification;
  }
  dispose() {
    this.disposed = true;
  }
}

const ThreadCatalogService = createThreadCatalogServiceClass({
  ThreadCatalogPageSlotScheduler: PageSlotScheduler,
  ThreadCatalogSyncCoordinator: SyncCoordinator,
  Buffer,
  createHash: crypto.createHash,
});

const pageRequests = [];
const entries = [{ hostId: "local", threadId: "thread-1", sourceUpdatedAt: 5 }];
const store = {
  hostId: "local",
  listHostIds: (kind) => (kind === "local" ? ["local"] : []),
  readSyncState: () => ({ catalogRevision: 4, isComplete: true }),
  readThreadHostId: (threadId) => (threadId === "thread-1" ? "local" : null),
  readThreadCount: () => entries.length,
  readPage: (request) => {
    pageRequests.push(request);
    return {
      entries,
      nextCursor: {
        sortKey: request.sortKey,
        sourceUpdatedAt: 5,
        sourceRecencyAt: 5,
        sourceCreatedAt: 4,
        threadId: "thread-1",
      },
    };
  },
  readEntries: (threadIds) =>
    entries.filter((entry) => threadIds.includes(entry.threadId)),
  pruneHost() {},
};
const scheduler = new PageSlotScheduler();
const service = new ThreadCatalogService(
  "local",
  () => store,
  () => {},
  scheduler,
);
equal(service.constructor.name, "ThreadCatalogService");
equal(service.readThreadHostId("thread-1"), "local");
equal(service.readThreadCount("local"), 1);

const source = {
  id: "local",
  hostKind: "local",
  listPage: async () => ({ items: [], nextCursor: null }),
  readItem: async () => null,
};
const coordinator = service.attachSource(source);
equal(coordinator instanceof SyncCoordinator, true);
equal(service.getCoordinator("local"), coordinator);

const filter = {
  includeAll: true,
  cwdValues: [],
  cwdPrefixes: [],
  includeThreadIds: [],
  excludeThreadIds: [],
};
const firstPage = service.readPage({
  hostId: "local",
  cursor: null,
  filter,
  limit: 20,
  manualOrder: null,
  sortKey: "updated_at",
});
equal(firstPage.entries, entries);
equal(typeof firstPage.nextCursor, "string");
service.readPage({
  hostId: "local",
  cursor: firstPage.nextCursor,
  filter,
  limit: 20,
  manualOrder: null,
  sortKey: "updated_at",
});
equal(pageRequests[1].cursor.threadId, "thread-1");
equal(coordinator.pruned, true);
equal(
  service.readEntries([{ hostId: "local", threadId: "thread-1" }]),
  entries,
);
throws(
  () =>
    service.readPage({
      hostId: "local",
      filter,
      limit: 0,
      manualOrder: null,
      sortKey: "updated_at",
    }),
  /between 1 and 100/,
);

const statuses = [];
const statusSubscription = service.subscribeStatus((status) =>
  statuses.push(status),
);
equal(statuses[0], {
  revision: 4,
  populationEnabled: false,
  hosts: [{ hostId: "local", isComplete: true, revision: 4 }],
});
statusSubscription.dispose();
service.dispose();
equal(coordinator.disposed, true);
equal(scheduler.disposed, true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes("dnt = createThreadCatalogServiceClass({"), true);
equal(main.includes("dnt = class"), false);
equal(windowContext.includes("new dnt("), true);
equal(main.includes("ThreadCatalogSyncCoordinator: int"), true);

console.log(`${assertions} main thread catalog service assertions passed`);
