import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createProjectsManagerClass } from "../src/main/main-app/projects/projects-manager.ts";

class Schema {
  parse(value) { return value; }
  safeParse(value) { return { success: true, data: value }; }
  nullable() { return this; }
  optional() { return this; }
  int() { return this; }
  nonnegative() { return this; }
}
const schema = () => new Schema();
const keys = {
  LOCAL_PROJECTS: "local-projects",
  REMOTE_PROJECTS: "remote-projects",
  PROJECT_APPEARANCES: "appearances",
  PROJECT_ORDER: "order",
  SELECTED_PROJECT: "selected",
  PINNED_PROJECT_IDS: "pinned",
};
const first = { id: "local-one", name: "One", rootPaths: ["/one"], createdAt: 1, updatedAt: 1 };
const second = { id: "local-two", name: "Two", rootPaths: ["/two"], createdAt: 2, updatedAt: 2 };
const remote = { id: "remote-one", hostId: "ssh", remotePath: "/remote", label: "Remote" };
const values = new Map([
  [keys.LOCAL_PROJECTS, { [first.id]: first, [second.id]: second }],
  [keys.REMOTE_PROJECTS, [remote]],
  [keys.PROJECT_APPEARANCES, { [remote.id]: { color: "red" } }],
  [keys.PROJECT_ORDER, [first.id, second.id, remote.id]],
  [keys.PINNED_PROJECT_IDS, [first.id, remote.id]],
]);
const state = {
  get: (key) => values.get(key),
  set: (key, value) => values.set(key, value),
};
const runtime = {
  Uf: class {},
  iu: keys,
  wf: schema,
  Ef: schema,
  Of: schema,
  hf: schema,
  gf: schema,
  Cf: schema,
  Lo: schema(),
  Io: (value) => value ?? {},
  Fo: ({ projectAppearances, projectId, appearance }) => {
    const next = { ...projectAppearances };
    appearance == null ? delete next[projectId] : next[projectId] = appearance;
    return next;
  },
  Jo: (id) => id,
  ya: (remotePath) => remotePath.trim(),
  va: (remotePath) => remotePath.toLowerCase(),
  _a: (remotePath) => path.basename(remotePath),
  qo: (projects) => projects,
  zi: () => false,
  Es: () => false,
};
const backendCalls = [];
const backend = {
  async writeProject(method, project, appearance) {
    backendCalls.push(["write", method, project, appearance]);
    const projects = { ...(values.get(keys.LOCAL_PROJECTS) ?? {}) };
    method === "project/create" ? projects[project.id] = project : delete projects[project.id];
    values.set(keys.LOCAL_PROJECTS, projects);
  },
  async updateProject(projectId, update) {
    backendCalls.push(["update", projectId, update]);
    const projects = { ...values.get(keys.LOCAL_PROJECTS) };
    if (projects[projectId] != null)
      projects[projectId] = { ...projects[projectId], ...update, updatedAt: 1_000 };
    values.set(keys.LOCAL_PROJECTS, projects);
    if (update.appearance !== undefined)
      values.set(keys.PROJECT_APPEARANCES, runtime.Fo({
        projectAppearances: values.get(keys.PROJECT_APPEARANCES) ?? {},
        projectId,
        appearance: update.appearance,
      }));
  },
  async moveProject(...args) { backendCalls.push(["move", ...args]); },
  async setProjectOrder(...args) { backendCalls.push(["order", ...args]); },
  getProjectDeletionDeadline: () => 99_000,
};
const messages = [];
const windowManager = { sendMessageToAllWindows: (message) => messages.push(message) };
const confirmations = [];
const inferenceCalls = [];
const selected = [];
let uuid = 0;
const ProjectsManager = createProjectsManagerClass({
  runtime,
  createLogger: () => () => ({ warning: (...args) => backendCalls.push(["warning", ...args]) }),
  LocalProjectCache: class {},
  resolveProjectStorageCapabilities: async (value, options) => ({ value, options }),
  normalizeStoragePath: (value) => `storage:${value}`,
  getLocalProjects: (globalState) => globalState.get(keys.LOCAL_PROJECTS) ?? {},
  getWorkspaceRootOptions: () => ({ roots: ["/one", "/two"], labels: {} }),
  getCanonicalPathMapSync: () => ({ "/one": "/canonical/one" }),
  localHostConfig: { id: "local" },
  normalizeRoots: (roots) => [...roots],
  normalizeLabels: (labels) => ({ ...labels }),
  canonicalizeRoots: async (roots) => Object.fromEntries(roots.map((root) => [root, `canonical:${root}`])),
  normalizeProjectRoots: async (roots) => roots.map((root) => root.trim()),
  normalizeProjectRoot: async (root) => root.trim(),
  selectProject: (_state, project) => selected.push(project),
  randomUUID: () => `generated-${++uuid}`,
  path,
  assignUnassignedThreadsBeforeRootsChange: async (input) => inferenceCalls.push(input),
  normalizeDesktopRootPaths: (roots) => roots.map((root) => `desktop:${root}`),
  now: () => 5_000,
});
const threadAssignments = {
  async moveLocalProjectThreadsToProjectless(projectId) {
    backendCalls.push(["move-threads", projectId]);
    return [{ threadId: "thread-one", projectId }];
  },
  async assignIfUnassigned() {},
};
const manager = new ProjectsManager(
  state,
  threadAssignments,
  { id: "local" },
  windowManager,
  async (hostId, folders) => { confirmations.push([hostId, folders]); return true; },
  async () => ({ data: [], nextCursor: null }),
  async () => null,
  async () => null,
  async (name) => `/default/${name}`,
  backend,
);

assert.equal(manager.getLocalProjects()[first.id], first);
assert.deepEqual(manager.getRemoteProjects(), [remote]);
assert.deepEqual(manager.getProjectAppearances()[remote.id], { color: "red" });
assert.deepEqual(manager.getProjectRootPathsForHost("local"), ["/one", "/two"]);
assert.deepEqual(manager.getProjectRootPathsForHost("ssh"), ["/remote"]);
assert.deepEqual(manager.getLocalWorkspaceRootOptionsSync(), {
  canonicalPathByRoot: { "/one": "/canonical/one" },
  roots: ["/one", "/two"],
  labels: {},
});
assert.deepEqual(await manager.getProjectStorageCapabilities("/one"), {
  value: "storage:/one",
  options: { allowWslPaths: false },
});

await manager.setProjectOrder([second.id, remote.id, first.id]);
assert.deepEqual(backendCalls.find((call) => call[0] === "order"), [
  "order",
  [first.id, second.id],
  [second.id, first.id],
]);
assert.deepEqual(values.get(keys.PROJECT_ORDER), [second.id, remote.id, first.id]);
assert.deepEqual(messages.at(-1), { type: "global-state-updated", keys: [keys.PROJECT_ORDER] });

const duplicate = await manager.createProjectForRoot("/one", "Ignored");
assert.equal(duplicate.id, first.id);
const writesBefore = backendCalls.filter((call) => call[0] === "write").length;
const created = await manager.createProjectForRoot(" /new ", "  New name  ");
assert.equal(created.id, "generated-1");
assert.equal(created.name, "New name");
assert.deepEqual(created.rootPaths, ["/new"]);
assert.equal(created.createdAt, 5_000);
assert.equal(backendCalls.filter((call) => call[0] === "write").length, writesBefore + 1);
assert.deepEqual(confirmations.at(-1), ["local", ["/new"]]);
assert.deepEqual(inferenceCalls.at(-1).affectedRootPaths, ["/new"]);
assert.equal(values.get(keys.PROJECT_ORDER)[0], "generated-1");

assert.equal(await manager.editLocal({ projectId: first.id, name: " Renamed ", sources: [" /one ", " /extra "] }), true);
assert.deepEqual(backendCalls.at(-1), [
  "update",
  first.id,
  { name: "Renamed", rootPaths: ["/one", "/extra"] },
]);
assert.equal(manager.getLocalProjects()[first.id].name, "Renamed");

const removal = await manager.removeLocal(second.id);
assert.deepEqual(removal.previousMemberships, [{ threadId: "thread-one", projectId: second.id }]);
assert.equal(removal.undoExpiresAtMs, 99_000);
assert.equal(manager.getLocalProjects()[second.id], undefined);
assert.equal(values.get(keys.PROJECT_ORDER).includes(second.id), false);
assert.equal(values.get(keys.PINNED_PROJECT_IDS).includes(second.id), false);

const createdRemote = await manager.createRemote({
  appearance: { color: "blue" },
  hostId: "ssh-two",
  label: " Remote two ",
  remotePath: " /srv/repo ",
});
assert.equal(createdRemote.id, "generated-2");
assert.equal(createdRemote.label, "Remote two");
assert.equal(createdRemote.remotePath, "/srv/repo");
assert.equal(manager.getRemoteProjects()[0].id, createdRemote.id);
assert.deepEqual(manager.getProjectAppearances()[createdRemote.id], { color: "blue" });

await manager.renameRemote({ projectId: createdRemote.id, name: " Updated remote " });
assert.equal(manager.getRemoteProjects().find((project) => project.id === createdRemote.id).label, "Updated remote");
await manager.upsertRemote({ index: 0, project: { ...remote, label: "Moved" } });
assert.equal(manager.getRemoteProjects()[0].id, remote.id);
await manager.removeRemote(createdRemote.id);
assert.equal(manager.getRemoteProjects().some((project) => project.id === createdRemote.id), false);

await manager.setAppearance({ projectId: first.id, appearance: { color: "green" } });
assert.deepEqual(manager.getProjectAppearances()[first.id], { color: "green" });
await manager.setAppearance({ projectId: remote.id, appearance: null });
assert.equal(manager.getProjectAppearances()[remote.id], undefined);

await manager.assignUnassignedThreadsBeforeProjectRootsChange(["/one"], {
  excludedThreadIds: new Set(["skip"]),
  matchRootsByCanonicalHostIdentity: true,
});
assert.deepEqual(inferenceCalls.at(-1).affectedRootPaths, ["/one"]);
assert.equal(inferenceCalls.at(-1).matchRootsByCanonicalHostIdentity, true);
assert.equal(inferenceCalls.at(-1).threadProjectAssignments, threadAssignments);
assert.equal(messages.some((message) => message.type === "workspace-root-options-updated"), true);
assert.equal(selected.length, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /o8e = createProjectsManagerClass\(\{/);
assert.doesNotMatch(main, /o8e = class/);
assert.doesNotMatch(main, /function m2\(/);
assert.match(main, /this\.projectsManager = new o8e\(/);

console.log("projects manager assertions: 45");
