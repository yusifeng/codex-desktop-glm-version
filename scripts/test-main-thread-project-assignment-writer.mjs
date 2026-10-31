import assert from "node:assert/strict";
import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { createThreadProjectAssignmentWriterClass } from "../src/main/main-app/thread-catalog/thread-project-assignment-writer.ts";

const keys = {
  THREAD_PROJECT_ASSIGNMENTS: "assignments",
  PROJECTLESS_THREAD_IDS: "projectless",
  LOCAL_PROJECTS: "projects",
  APP_SERVER_PROJECTS_MIGRATION_BY_HOST: "migration",
};
const values = new Map([
  [keys.THREAD_PROJECT_ASSIGNMENTS, { "thread-1": { projectKind: "local", projectId: "project-1" } }],
  [keys.PROJECTLESS_THREAD_IDS, []],
  [keys.LOCAL_PROJECTS, { "project-1": { id: "project-1" } }],
]);
const state = {
  get: (key) => values.get(key),
  set: (key, value) => values.set(key, value),
  update: (key, updater) => values.set(key, updater(values.get(key))),
};
const requests = [];
const connection = {
  sendAppServerRequest: async (method, params) => {
    requests.push([method, params]);
    if (method === "thread/read") return { thread: { projectId: "server-1" } };
    if (method === "thread/list") return { data: [{ id: "thread-1", projectId: "server-1" }], nextCursor: null };
    return {};
  },
};
const enqueueKeyed = async (pending, key, operation) => {
  const next = (pending.get(key) ?? Promise.resolve()).catch(() => {}).then(operation);
  pending.set(key, next);
  try { await next; } finally { if (pending.get(key) === next) pending.delete(key); }
};
const runtime = {
  iu: keys,
  ua: ["local"],
  $u: (id) => id,
  sa: (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null),
  oa: (records, changes) => {
    const assignments = { ...records.assignments };
    let projectlessThreadIds = [...records.projectlessThreadIds];
    const memberships = {};
    for (const change of changes) {
      if (change.assignment == null) delete assignments[change.threadId];
      else assignments[change.threadId] = change.assignment;
      projectlessThreadIds = projectlessThreadIds.filter((id) => id !== change.threadId);
      if (change.projectless) projectlessThreadIds.push(change.threadId);
      memberships[change.threadId] = true;
    }
    return { records: { assignments, projectlessThreadIds }, memberships };
  },
};
const Writer = createThreadProjectAssignmentWriterClass({
  runtime,
  timers: { setTimeout: delay },
  enqueueKeyed,
  pageSize: 100,
  batchSize: 8,
});
const published = [];
const writer = new Writer(
  state,
  connection,
  (legacyId) => legacyId === "project-1" ? "server-1" : undefined,
  () => true,
  (serverId) => serverId === "server-1" ? "project-1" : null,
  (memberships) => published.push(memberships),
);
const signal = new AbortController().signal;

assert.equal(writer.matches("thread-1", "server-1"), true);
assert.equal(writer.matches("thread-1", null), false);
assert.equal(writer.getServerProjectId({ projectKind: "local", projectId: "project-1" }), "server-1");
assert.equal(writer.getServerProjectId({ projectKind: "remote", projectId: "remote" }), null);

writer.adopt("thread-1", null);
assert.equal(values.get(keys.THREAD_PROJECT_ASSIGNMENTS)["thread-1"], undefined);
assert.deepEqual(values.get(keys.PROJECTLESS_THREAD_IDS), ["thread-1"]);
assert.equal(published.length, 1);
assert.equal(writer.isExplicitlyProjectless("thread-1"), true);

writer.adopt("thread-1", "server-1");
assert.deepEqual(values.get(keys.THREAD_PROJECT_ASSIGNMENTS)["thread-1"], {
  projectKind: "local",
  projectId: "project-1",
});
assert.deepEqual(values.get(keys.PROJECTLESS_THREAD_IDS), []);

await writer.refresh("thread-1", signal);
assert.equal(requests.some(([method]) => method === "thread/read"), true);

let committed = 0;
await writer.write(
  "thread-1",
  null,
  async () => committed++,
  async () => true,
  signal,
  undefined,
  "local",
);
assert.equal(committed, 1);
assert.deepEqual(requests.findLast(([method]) => method === "thread/metadata/update")[1], {
  threadId: "thread-1",
  projectId: "",
});

const migrated = [];
await writer.migrate("local", signal, (id) => migrated.push(id));
assert.deepEqual(migrated, ["thread-1"]);
assert.equal(requests.some(([method, params]) => method === "thread/list" && params.limit === 100), true);
assert.equal(values.get(keys.APP_SERVER_PROJECTS_MIGRATION_BY_HOST).local.threadAssignmentsReadMigrated, true);
assert.deepEqual(values.get(keys.APP_SERVER_PROJECTS_MIGRATION_BY_HOST).local.pendingThreadAssignmentIds, []);
assert.equal(writer.pendingWrites.size, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /W6e = createThreadProjectAssignmentWriterClass\(\{/);
assert.doesNotMatch(main, /W6e = class/);
assert.match(main, /async function d2\(/);

console.log("thread project assignment writer assertions: 22");
