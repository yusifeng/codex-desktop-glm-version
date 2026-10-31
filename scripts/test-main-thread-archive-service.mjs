import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadArchiveServiceClass } from "../src/main/main-app/threads/thread-archive-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness({
  remote = false,
  archiveResult = true,
  readThreadResult = null,
  readThreadError,
  removeResult = true,
  removeError,
  notificationError,
  sideEffectError,
  coordinator = true,
  deletedOne = ["one"],
  deletedAll = ["one", "two"],
} = {}) {
  const calls = [];
  const warnings = [];
  const appServer = {
    async readThread(threadId, options) {
      calls.push(["readThread", threadId, options]);
      if (readThreadError) throw readThreadError;
      return readThreadResult;
    },
    handleArchivedThreadSideEffects(threadId) {
      calls.push(["sideEffects", threadId]);
      if (sideEffectError) throw sideEffectError;
    },
    notifyAutomationRunsUpdated() {
      calls.push(["notifyAutomationRunsUpdated"]);
    },
  };
  const localCoordinator = coordinator
    ? {
        removeThreadFromCatalog(threadId) {
          calls.push(["removeThreadFromCatalog", threadId]);
          if (removeError) throw removeError;
          return removeResult;
        },
        handleNotification(notification) {
          calls.push(["handleNotification", notification]);
          if (notificationError) throw notificationError;
        },
      }
    : null;
  const ThreadArchiveService = createThreadArchiveServiceClass({
    runtime: {
      Es: (hostConfig) => hostConfig.remote,
      async Jr(options) {
        calls.push(["archiveRollout", options]);
        return archiveResult;
      },
      async Xr(options) {
        calls.push(["deleteArchivedThread", options]);
        return deletedOne;
      },
      async Yr(options) {
        calls.push(["deleteAllArchivedThreads", options]);
        return deletedAll;
      },
    },
    RpcHandlerBase: class {},
    createLogger: (name) => ({
      warning(message, details) {
        warnings.push([name, message, details]);
      },
    }),
  });
  const service = new ThreadArchiveService(
    {
      get(hostId) {
        calls.push(["getHost", hostId]);
        return {
          hostConfig: { remote },
          async codexHome() {
            calls.push(["codexHome"]);
            return "/codex-home";
          },
        };
      },
    },
    {
      getConnection(hostId) {
        calls.push(["getConnection", hostId]);
        return appServer;
      },
    },
    localCoordinator,
  );
  return { appServer, calls, service, warnings };
}

const archiveOptions = {
  hostId: "local",
  threadId: "thread-1",
  removeCatalogEntryIfMissing: true,
  discardProvisionalThread: false,
};

{
  const { calls, service } = createHarness({ remote: true });
  await assert.rejects(service.archiveInactiveThread(archiveOptions), /only supported locally/);
  assertions += 1;
  equal(calls, [["getHost", "local"]]);
}

{
  const { calls, service } = createHarness({ archiveResult: false });
  equal(await service.archiveInactiveThread(archiveOptions), { success: false });
  equal(calls.some(([name]) => name === "getConnection"), false);
}

{
  const { calls, service } = createHarness();
  equal(await service.archiveInactiveThread(archiveOptions), { success: true });
  equal(calls.includes(calls.find(([name]) => name === "handleNotification")), true);
  equal(calls.find(([name]) => name === "handleNotification")[1], {
    method: "thread/archived",
    params: { threadId: "thread-1" },
  });
  equal(calls.at(-1), ["sideEffects", "thread-1"]);
}

{
  const { service, warnings } = createHarness({
    notificationError: Error("catalog failed"),
    sideEffectError: Error("side effect failed"),
  });
  equal(await service.archiveInactiveThread(archiveOptions), { success: true });
  equal(warnings.map((entry) => entry[1]), [
    "Failed to remove archived thread from catalog",
    "Failed to apply archived thread side effects",
  ]);
}

{
  const { calls, service } = createHarness({ archiveResult: null });
  equal(
    await service.archiveInactiveThread({ ...archiveOptions, removeCatalogEntryIfMissing: false }),
    { success: false },
  );
  equal(calls.some(([name]) => name === "getConnection"), false);
}

{
  const { service } = createHarness({ archiveResult: null, coordinator: false });
  equal(await service.archiveInactiveThread(archiveOptions), { success: false });
}

{
  const { calls, service } = createHarness({ archiveResult: null, readThreadResult: { id: "thread-1" } });
  equal(await service.archiveInactiveThread(archiveOptions), { success: false });
  equal(calls.some(([name]) => name === "removeThreadFromCatalog"), false);
  equal(
    await service.archiveInactiveThread({ ...archiveOptions, discardProvisionalThread: true }),
    { success: true, threadMissing: true },
  );
}

{
  const { calls, service } = createHarness({
    archiveResult: null,
    readThreadError: Error("thread not loaded: thread-1"),
  });
  equal(await service.archiveInactiveThread(archiveOptions), { success: true, threadMissing: true });
  equal(calls.some(([name]) => name === "removeThreadFromCatalog"), true);
  equal(calls.at(-1), ["sideEffects", "thread-1"]);
}

{
  const { service, warnings } = createHarness({
    archiveResult: null,
    readThreadError: Error("transport failed"),
  });
  equal(await service.archiveInactiveThread(archiveOptions), { success: false });
  equal(warnings[0][1], "Failed to confirm archived thread state");
  equal(warnings[0][2].sensitive.threadId, "thread-1");
}

{
  const { service } = createHarness({ archiveResult: null, removeResult: false });
  equal(await service.archiveInactiveThread(archiveOptions), { success: false });
}

{
  const { service, warnings } = createHarness({
    archiveResult: null,
    removeError: Error("catalog write failed"),
  });
  equal(await service.archiveInactiveThread(archiveOptions), { success: false });
  equal(warnings[0][1], "Failed to remove archived thread from catalog");
}

{
  const { appServer, calls, service } = createHarness();
  equal(await service.deleteArchivedThread({ hostId: "local", threadId: "thread-1" }), {
    deletedThreadIds: ["one"],
  });
  equal(calls.find(([name]) => name === "deleteArchivedThread")[1], {
    appServer,
    threadId: "thread-1",
  });
  equal(calls.at(-1), ["notifyAutomationRunsUpdated"]);
}

{
  const populated = createHarness();
  equal(await populated.service.deleteAllArchivedThreads({ hostId: "local" }), {
    deletedThreadIds: ["one", "two"],
  });
  equal(populated.calls.at(-1), ["notifyAutomationRunsUpdated"]);
  const empty = createHarness({ deletedAll: [] });
  equal(await empty.service.deleteAllArchivedThreads({ hostId: "local" }), {
    deletedThreadIds: [],
  });
  equal(empty.calls.some(([name]) => name === "notifyAutomationRunsUpdated"), false);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("Xtt = createThreadArchiveServiceClass({"), true);
equal(main.includes("new Xtt("), true);
equal(main.includes("Xtt = class"), false);
equal(main.includes("logger = r.r(`ThreadArchiveService`)"), false);

console.log(`${assertions} main thread archive service assertions passed`);
