import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const ownerText = fs.readFileSync(new URL("../src/main/main-app/sidebar/pinned-threads-service.ts", import.meta.url), "utf8");
const ownerRuntime = await transform(ownerText, { loader: "ts", format: "cjs", target: "es2022" });
const ownerModule = { exports: {} };
Function("module", "exports", ownerRuntime.code)(ownerModule, ownerModule.exports);
const { createPinnedThreadsServiceClass } = ownerModule.exports;

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };
class DisposableBase {}
const serverInstances = [];
class PinnedThreadServer {
  constructor() { serverInstances.push(this); }
  listPinnedThreads = async () => ({ threadIds: ["server"], serverOrderedThreadIds: ["server"] });
  listPinnedThreadIds = async ({ hostId }) => [`server:${hostId}`];
  setThreadPinned = async () => true;
  movePinnedThread = async () => true;
  isLegacyThread = async () => true;
  listSections = async (request) => ({ request });
  listSectionThreadIds = async (request) => [request.sectionId];
  createSection = async () => ({ id: "created-section" });
  updateSection = async () => {};
  deleteSection = async () => {};
  setThreadSection = async () => true;
}
const managerInstances = [];
class SavedCustomSectionsManager {
  constructor(...args) { this.onServerChanged = args.at(-1); managerInstances.push(this); }
}
const PINNED = "pinned";
const reorder = ({ threadIds, threadId, beforeThreadId }) => {
  const next = threadIds.filter((id) => id !== threadId);
  next.splice(Math.max(0, next.indexOf(beforeThreadId)), 0, threadId);
  return next;
};
const PinnedThreadsService = createPinnedThreadsServiceClass({
  DisposableBase,
  PinnedThreadServer,
  SavedCustomSectionsManager,
  dedupe: (values) => [...new Set(values)],
  pinnedSectionId: PINNED,
  pinnedThreadIdsKey: "pinnedIds",
  readPinnedThreadIds: (state) => state.get("pinnedIds") ?? [],
  reorderPinnedThreadIds: reorder,
});
const values = new Map([["pinnedIds", ["a", "cloud", "a"]]]);
let flushes = 0;
const globalState = {
  get: (key) => values.get(key),
  set: (key, value) => values.set(key, value),
  flush: async () => { flushes += 1; },
};
const messages = [];
const windows = { sendMessageToAllRegisteredWindows: (message) => messages.push(message) };
const connections = new Map([["local", { getConnectionState: () => "connected" }]]);
const registry = { getMaybeConnection: (hostId) => connections.get(hostId) ?? null };
const service = new PinnedThreadsService(globalState, registry, windows, {});

equal(await service.list(), { threadIds: ["a", "cloud", "a"] });
equal(await PinnedThreadsService.getPinnedThreadIdsForWorktreeCleanup(service, "local"), ["a", "cloud", "a"]);
equal(await service.set({ threadId: "b", pinned: true }), { success: true });
equal(values.get("pinnedIds"), ["a", "cloud", "b"]);
equal(flushes, 1);
equal(messages.at(-1), { type: "pinned-threads-updated" });

values.set("pinnedIds", ["legacy", "cloud"]);
equal(await service.list({ useAppServerPins: true, cloudThreadIds: ["cloud"], hostId: "local" }), {
  threadIds: ["server", "cloud"],
  serverOrderedThreadIds: ["server"],
});
equal(await PinnedThreadsService.getPinnedThreadIdsForWorktreeCleanup(service, "local"), ["server:local"]);
connections.set("local", { getConnectionState: () => "disconnected" });
await rejects(PinnedThreadsService.getPinnedThreadIdsForWorktreeCleanup(service, "local"), /App server unavailable/);
connections.set("local", { getConnectionState: () => "connected" });

let refreshes = 0;
await managerInstances[0].onServerChanged("local", () => { refreshes += 1; }, {
  threadId: "server",
  sectionId: PINNED,
  previousSectionId: "custom",
  beforeThreadId: "legacy",
});
equal(refreshes, 2);
equal(values.get("pinnedIds"), ["server", "legacy", "cloud"]);
equal(messages.at(-1), {
  type: "pinned-threads-updated",
  customSectionHostId: "local",
  customSectionIds: ["custom"],
});

equal(await service.setThreadSection({ threadId: "x", sectionId: PINNED, previousSectionId: "custom", hostId: "local" }), { success: true });
equal(values.get("pinnedIds").at(-1), "x");
equal(await service.createSection({ hostId: "local", threadIdToMove: "x", previousSectionId: "old" }), { id: "created-section" });
equal(values.get("pinnedIds").includes("x"), false);
equal(await service.listSections({ hostId: "local" }), { request: { hostId: "local" } });
equal(await service.listSectionThreadIds({ hostId: "local", sectionId: "s" }), ["s"]);

let updateResolves;
let updateCalls = 0;
serverInstances[0].updateSection = () => new Promise((resolve) => { updateCalls += 1; updateResolves = resolve; });
const updateOne = service.updateSection({ hostId: "local", sectionId: "s", name: "name" });
const updateTwo = service.updateSection({ hostId: "local", sectionId: "s", name: "name" });
equal(updateCalls, 1);
updateResolves();
await Promise.all([updateOne, updateTwo]);

const uninitialized = new PinnedThreadsService(globalState, registry, windows, {});
await rejects(PinnedThreadsService.getPinnedThreadIdsForWorktreeCleanup(uninitialized, "local"), /has not been initialized/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("createPinnedThreadsServiceClass({"), true);
equal(main.includes("var jH = class"), false);
equal(main.includes("    jH,"), true);

console.log(`${assertions} main pinned threads service assertions passed`);
