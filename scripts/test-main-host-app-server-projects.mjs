import assert from "node:assert/strict";
import fs from "node:fs";
import { createHostAppServerProjectsClass } from "../src/main/main-app/projects/host-app-server-projects.ts";

const keys = {
  APP_SERVER_PROJECTS_MIGRATION_BY_HOST: "migration",
  APP_SERVER_PROJECT_ID_BY_LEGACY_PROJECT_ID_BY_HOST: "legacy-map",
  PROJECT_ORDER: "project-order",
};
const values = new Map();
const state = {
  get: (key) => values.get(key),
  set: (key, value) => values.set(key, value),
  update(key, updater) { values.set(key, updater(values.get(key))); },
  flushes: 0,
  async flushOrThrow() { this.flushes += 1; },
};
const assignmentCalls = [];
class Assignments {
  constructor(...args) { this.args = args; assignmentCalls.push(["construct", ...args]); }
  async observe(...args) { assignmentCalls.push(["observe", ...args]); }
  async refresh(...args) { assignmentCalls.push(["refresh", ...args]); }
  async syncAssignment(...args) { assignmentCalls.push(["sync", ...args]); }
  async migrate(...args) { assignmentCalls.push(["migrate", ...args]); }
  async write(...args) { assignmentCalls.push(["write", ...args]); await args[2](); }
  getServerProjectId(project) { assignmentCalls.push(["start-project", project]); return "server-start"; }
}
class Deletions {
  constructor(_state, finish) { this.finish = finish; this.records = new Map(); this.calls = []; }
  key(identity, projectId) { return `${identity}:${projectId}`; }
  get(identity, projectId) { return this.records.get(this.key(identity, projectId)); }
  getAll(identity) {
    return Object.fromEntries([...this.records].flatMap(([key, value]) => key.startsWith(`${identity}:`) ? [[key.slice(identity.length + 1), value]] : []));
  }
  set(identity, projectId, value) {
    this.calls.push(["set", identity, projectId, value]);
    const key = this.key(identity, projectId);
    value == null ? this.records.delete(key) : this.records.set(key, value);
  }
  resume(identity) { this.calls.push(["resume", identity]); }
  schedule(identity, projectId) { this.calls.push(["schedule", identity, projectId]); }
  stop() { this.calls.push(["stop"]); }
}
const requests = [];
const handlers = {};
const connection = {
  hostConfig: {},
  appServerVersion: "supported",
  async codexHome() { return "/codex-home"; },
  registerInternalThreadObservationHandler(handler) { handlers.observe = handler; return () => { handlers.observeDisposed = true; }; },
  registerInternalNotificationHandler(handler) { handlers.notify = handler; return () => { handlers.notifyDisposed = true; }; },
  registerInternalConnectionStateHandler(handler) { handlers.connection = handler; return () => { handlers.connectionDisposed = true; }; },
  async sendAppServerRequest(method, payload) {
    requests.push([method, payload]);
    if (method === "project/list") {
      return payload.cursor == null
        ? { data: [{ id: "server-one", name: "One", roots: [], metadata: {} }], nextCursor: "next" }
        : { data: [{ id: "server-two", name: "Two", roots: [], metadata: {} }], nextCursor: null };
    }
    if (method === "project/create" || method === "project/import")
      return { project: { id: `server-${payload.idempotencyKey}`, name: payload.name, roots: payload.roots, metadata: payload.metadata } };
    if (method === "project/update")
      return { project: { id: payload.projectId, name: payload.name ?? "Updated", roots: payload.roots ?? [], metadata: payload.metadata ?? {} } };
    if (method === "project/read") return { project: { metadata: { preserved: "yes" } } };
    return {};
  },
};
const cacheWrites = [];
const cacheUpdates = [];
const cache = {
  hostId: "local",
  getProjects: () => ({}),
  getAppearance: () => ({ color: "blue", marker: "dot" }),
  writeProject: (...args) => cacheWrites.push(args),
  updateProject: (...args) => cacheUpdates.push(args),
};
const log = [];
let clock = 10_000;
const projectOrderKey = Symbol("project-order");
const HostProjects = createHostAppServerProjectsClass({
  runtime: {
    iu: keys,
    ir: (params) => params.threadId,
    ar: (params) => params.threadId,
    Wu: () => true,
    zi: () => false,
  },
  createLogger: (name) => ({ info: (...args) => log.push(["info", name, ...args]), warning: (...args) => log.push(["warning", name, ...args]) }),
  ThreadProjectAssignmentWriter: Assignments,
  PendingProjectDeletionScheduler: Deletions,
  computeProjectOrderMoves: (before, after) => {
    assert.deepEqual(before, ["server-one", "server-two"]);
    assert.deepEqual(after, ["server-two", "server-one"]);
    return [{ projectId: "server-two", beforeProjectId: "server-one" }];
  },
  enqueueKeyed: async (pending, key, callback) => { pending.set(key, true); try { await callback(); } finally { pending.delete(key); } },
  projectListPageSize: 100,
  projectOrderKey,
  deletionGraceMs: 60_000,
  normalizeProjectRoot: (path) => `normalized:${path}`,
  now: () => clock,
});

const owner = new HostProjects(state, connection, cache, () => {});
assert.equal(owner.logger != null, true);
assert.equal(owner.threadAssignments instanceof Assignments, true);
assert.equal(owner.pendingDeletions instanceof Deletions, true);
assert.equal(assignmentCalls[0][0], "construct");
assert.deepEqual(owner.projectMetadata(null, { "appearance.color": "red", keep: 1 }), { keep: 1 });
assert.deepEqual(owner.projectMetadata({ color: "green", marker: { type: "star" } }, { keep: 2 }), {
  keep: 2,
  "appearance.color": "green",
  "appearance.marker": "{\"type\":\"star\"}",
});

owner.migrationIdentity = "local:/codex-home";
owner.storeProject({ id: "server-one", name: "One", roots: [], metadata: {} }, "legacy-one");
assert.equal(owner.serverProjectsByLegacyId.get("legacy-one").id, "server-one");
assert.equal(owner.legacyProjectIdsByServerId.get("server-one"), "legacy-one");
assert.equal(values.get("legacy-map")["local:/codex-home"]["legacy-one"], "server-one");

requests.length = 0;
const listed = await owner.listProjects(new AbortController().signal);
assert.deepEqual(listed.map((project) => project.id), ["server-one", "server-two"]);
assert.deepEqual(requests.map((entry) => entry[1].cursor), [null, "next"]);
assert.equal(requests.every((entry) => entry[1].limit === 100), true);

owner.projectsReady = true;
owner.projectSupport = "supported";
owner.storeProject({ id: "server-two", name: "Two", roots: [], metadata: {} }, "legacy-two");
requests.length = 0;
await owner.setProjectOrder(["legacy-one", "legacy-two"], ["legacy-two", "legacy-one"]);
assert.deepEqual(requests, [["project/move", { projectId: "server-two", beforeProjectId: "server-one" }]]);
assert.equal(owner.pendingProjectWrites.size, 0);

requests.length = 0;
await owner.writeProject("project/create", { id: "legacy-new", name: "New", rootPaths: ["/root"] });
assert.equal(requests[0][0], "project/create");
assert.deepEqual(requests[0][1].roots, [{ path: "normalized:/root" }]);
assert.equal(requests[0][1].idempotencyKey, "legacy-new");
assert.equal(owner.serverProjectsByLegacyId.get("legacy-new").id, "server-legacy-new");
assert.equal(cacheWrites.at(-1)[0], "project/create");

requests.length = 0;
clock = 20_000;
await owner.writeProject("project/delete", { id: "legacy-new", name: "New", rootPaths: ["/root"] });
const pending = owner.pendingDeletions.get("local:/codex-home", "legacy-new");
assert.equal(pending.projectId, "server-legacy-new");
assert.equal(pending.deleteAfterMs, 80_000);
assert.equal(requests.length, 0);
assert.deepEqual(owner.pendingDeletions.calls.at(-1), ["schedule", "local:/codex-home", "legacy-new"]);
assert.equal(state.flushes, 2);

clock = 80_000;
requests.length = 0;
await owner.finishPendingDeletion("local:/codex-home", "legacy-new", pending);
assert.equal(requests[0][0], "project/delete");
assert.equal(owner.serverProjectsByLegacyId.has("legacy-new"), false);
assert.equal(owner.pendingDeletions.get("local:/codex-home", "legacy-new"), undefined);
assert.equal(state.flushes, 3);

owner.storeProject({ id: "server-one", name: "One", roots: [], metadata: {} }, "legacy-one");
requests.length = 0;
await owner.updateProject("legacy-one", { name: "Renamed", rootPaths: ["/new"], appearance: { color: "purple", marker: "pin" } });
assert.equal(requests.at(-1)[0], "project/update");
assert.deepEqual(requests.at(-1)[1].roots, [{ path: "normalized:/new" }]);
assert.equal(requests.at(-1)[1].metadata["appearance.color"], "purple");
assert.deepEqual(cacheUpdates.at(-1), ["legacy-one", { name: "Renamed", rootPaths: ["/new"], appearance: { color: "purple", marker: "pin" } }]);

owner.setThreadAssignmentsEnabled(true);
assert.equal(owner.threadAssignmentsEnabled, true);
owner.projectsReady = true;
owner.projectSupport = "supported";
assert.equal(await owner.getThreadStartProjectId({ projectKind: "local", projectId: "legacy-one" }), "server-start");
assert.equal(await owner.getThreadStartProjectId({ projectKind: "remote", projectId: "remote" }), null);

owner.projectSupport = "unsupported";
const dispose = owner.start();
assert.equal(typeof handlers.observe, "function");
assert.equal(typeof handlers.notify, "function");
assert.equal(typeof handlers.connection, "function");
handlers.connection("disconnected");
assert.equal(owner.connected, false);
assert.equal(owner.projectsReady, false);
dispose();
assert.equal(owner.disposed, true);
assert.equal(handlers.observeDisposed, true);
assert.equal(handlers.notifyDisposed, true);
assert.equal(handlers.connectionDisposed, true);
assert.equal(owner.pendingDeletions.calls.filter((call) => call[0] === "stop").length >= 2, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
assert.match(main, /Y6e = createHostAppServerProjectsClass\(\{/);
assert.doesNotMatch(main, /Y6e = class/);
assert.match(windowContext, /new Y6e\(this\.scopedState/);

console.log("host app-server projects assertions: 46");
