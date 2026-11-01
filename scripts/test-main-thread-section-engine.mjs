import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const rejects = async (operation, pattern) => {
  await assert.rejects(operation, pattern);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/sidebar/thread-section-engine.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "../misc/thread-errors")
      return { isThreadNotFoundError: (error) => error?.code === "missing" };
    throw new Error(`unexpected require ${specifier}`);
  },
  loaded,
  loaded.exports,
);
const { PINNED_THREAD_SECTION_ID, ThreadSectionEngine } = loaded.exports;
equal(PINNED_THREAD_SECTION_ID, "01984de2-8f74-7c91-a3b2-5c5e937cf318");

const calls = [];
const hostA = { hostId: "host-a", pinnedSectionId: "pinned-a", marker: "a" };
const hostB = { hostId: "host-b", pinnedSectionId: "pinned-b", marker: "b" };
let moveFailure = null;
let readThread = async (host, threadId) => ({ id: threadId, section: { id: host.pinnedSectionId } });
let resolveCreation;
let createDeferred = false;
let createCalls = 0;
const adapter = {
  async listThreads(host, request) {
    calls.push(["listThreads", host.hostId, request]);
    return request.cursor == null
      ? { data: [{ id: `${host.hostId}-1` }], nextCursor: "page-2" }
      : { data: [{ id: `${host.hostId}-2` }], nextCursor: null };
  },
  async listSections(host, request) {
    calls.push(["listSections", host.hostId, request]);
    return request.cursor == null
      ? {
          data: [
            { id: PINNED_THREAD_SECTION_ID, name: "Pinned" },
            { id: `${host.hostId}-section`, name: `Section ${host.hostId}` },
          ],
          nextCursor: "page-2",
        }
      : { data: [{ id: `${host.hostId}-second`, name: "Second" }], nextCursor: null };
  },
  async createSection(host, request) {
    createCalls += 1;
    calls.push(["createSection", host.hostId, request]);
    if (createDeferred)
      return new Promise((resolve) => { resolveCreation = resolve; });
    return { section: { id: `created-${createCalls}`, name: request.name } };
  },
  async updateSection(host, request) { calls.push(["updateSection", host.hostId, request]); },
  async deleteSection(host, request) { calls.push(["deleteSection", host.hostId, request]); },
  async readThread(...args) { calls.push(["readThread", args[0].hostId, args[1], args[2]]); return readThread(...args); },
  async moveThread(host, request) {
    calls.push(["moveThread", host.hostId, request]);
    if (moveFailure != null) {
      const failure = moveFailure;
      moveFailure = null;
      throw failure;
    }
  },
};
const engine = new ThreadSectionEngine(adapter);

equal(await engine.listHostSectionThreadIds(hostA), ["host-a-1", "host-a-2"]);
equal(calls[0], ["listThreads", "host-a", {
  cursor: null,
  limit: 100,
  modelProviders: [],
  sectionId: "pinned-a",
  sortKey: "section_position",
  useStateDbOnly: true,
}]);
equal(calls[1][2].cursor, "page-2");

equal(await engine.listSections([hostA, hostB]), {
  hostIds: ["host-a", "host-b"],
  sections: [
    { hostId: "host-a", id: "host-a-section", name: "Section host-a" },
    { hostId: "host-a", id: "host-a-second", name: "Second" },
    { hostId: "host-b", id: "host-b-section", name: "Section host-b" },
    { hostId: "host-b", id: "host-b-second", name: "Second" },
  ],
});
equal(calls.filter(([kind]) => kind === "listSections").length, 4);

createDeferred = true;
const firstCreation = engine.createSection(hostA, "Shared", "logical");
const secondCreation = engine.createSection(hostA, "Ignored", "logical");
await new Promise((resolve) => setImmediate(resolve));
equal(createCalls, 1);
resolveCreation({ section: { id: "created", name: "Shared" } });
equal(await firstCreation, { id: "created", name: "Shared" });
equal(await secondCreation, { id: "created", name: "Shared" });
createDeferred = false;
equal(await engine.createSection(hostA, "Again", "logical"), { id: "created-2", name: "Again" });

await engine.updateSection(hostA, "section", "Renamed");
await engine.deleteSection(hostA, "section");
equal(calls.at(-2), ["updateSection", "host-a", { sectionId: "section", name: "Renamed" }]);
equal(calls.at(-1), ["deleteSection", "host-a", { sectionId: "section" }]);

readThread = async (host, threadId, forDiscovery) =>
  host === hostA
    ? { id: threadId, section: { id: forDiscovery ? "custom" : host.pinnedSectionId } }
    : null;
equal(await engine.findThreadOwner("thread", [hostA, hostB]), {
  ...hostA,
  isPinned: true,
  sectionId: "pinned-a",
});
equal((await engine.findThreadOwner("thread", [hostA], { forDiscovery: true })).sectionId, "custom");
readThread = async (host) => { throw Object.assign(new Error(host.hostId), { code: "missing" }); };
equal(await engine.findThreadOwner("missing", [hostA]), null);
readThread = async () => { throw { code: "missing" }; };
await rejects(() => engine.findThreadOwner("missing", [hostA]), undefined);
readThread = async (host) => { throw Object.assign(new Error(host.hostId), { code: "missing" }); };
await rejects(
  () => engine.findThreadOwner("missing", [hostA], { throwOnMissingThread: true }),
  /host-a/,
);
readThread = async (host, threadId) => ({ id: threadId, section: { id: host.pinnedSectionId } });
await rejects(
  () => engine.findThreadOwner("thread", [hostA, hostB], { throwOnAmbiguousOwner: true }),
  /ambiguous/,
);

const pinnedOwner = { ...hostA, isPinned: true, sectionId: "pinned-a" };
const unpinnedOwner = { ...hostA, isPinned: false, sectionId: null };
equal(await engine.setThreadPinned(pinnedOwner, { threadId: "thread", pinned: true }), false);
calls.length = 0;
readThread = async (host, threadId) => ({ id: threadId, section: { id: "custom" } });
equal(await engine.setThreadPinned(unpinnedOwner, {
  threadId: "thread",
  pinned: true,
  beforeThreadId: "not-pinned",
}), true);
equal(calls.at(-1), ["moveThread", "host-a", {
  beforeThreadId: null,
  sectionId: "pinned-a",
  threadId: "thread",
}]);

equal(await engine.setThreadSection(
  { ...hostA, isPinned: false, sectionId: "old" },
  { threadId: "thread", sectionId: "new", previousSectionId: "other" },
), false);
equal(await engine.setThreadSection(
  { ...hostA, isPinned: false, sectionId: "new" },
  { threadId: "thread", sectionId: "new" },
), false);

calls.length = 0;
const customOwner = { ...hostA, isPinned: false, sectionId: "old" };
equal(await engine.setThreadSection(customOwner, {
  threadId: "thread",
  sectionId: "new",
  beforeThreadId: "before",
}), true);
equal(calls, [
  ["moveThread", "host-a", { beforeThreadId: null, sectionId: "new", threadId: "thread" }],
  ["moveThread", "host-a", { beforeThreadId: "before", sectionId: "new", threadId: "thread" }],
]);

calls.length = 0;
moveFailure = new Error("final move failed");
let moveCount = 0;
adapter.moveThread = async (host, request) => {
  calls.push(["moveThread", host.hostId, request]);
  moveCount += 1;
  if (moveCount === 2) throw moveFailure;
};
await rejects(
  () => engine.setThreadSection(customOwner, {
    threadId: "thread",
    sectionId: "new",
    beforeThreadId: "before",
  }),
  /final move failed/,
);
equal(calls.at(-1), ["moveThread", "host-a", {
  beforeThreadId: null,
  sectionId: "old",
  threadId: "thread",
}]);
equal(calls.length, 3);

equal(await engine.movePinnedThread(unpinnedOwner, { threadId: "thread", beforeThreadId: null }), false);
adapter.moveThread = async (host, request) => calls.push(["moveThread", host.hostId, request]);
equal(await engine.movePinnedThread(pinnedOwner, { threadId: "thread", beforeThreadId: "before" }), true);
equal(calls.at(-1), ["moveThread", "host-a", {
  beforeThreadId: "before",
  sectionId: "pinned-a",
  threadId: "thread",
}]);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/sidebar/thread-section-engine.js")'), true);
equal(main.includes("ThreadSectionEngine,"), true);
equal(main.includes("pinnedThreadSectionId: PINNED_THREAD_SECTION_ID"), true);
equal(main.includes("var Se = class"), false);
equal(main.includes("ye = new Map()"), false);
equal(main.includes("pinnedSectionId: ve"), false);

console.log(`${assertions} thread section engine assertions passed`);
