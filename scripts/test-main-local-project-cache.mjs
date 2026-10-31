import assert from "node:assert/strict";
import fs from "node:fs";
import { createLocalProjectCacheClass } from "../src/main/main-app/projects/local-project-cache.ts";

const keys = { LOCAL_PROJECTS: "projects", PROJECT_APPEARANCES: "appearances" };
const values = new Map([
  [keys.LOCAL_PROJECTS, { old: { id: "old", name: "Old", rootPaths: ["/old"], updatedAt: 1 } }],
  [keys.PROJECT_APPEARANCES, { old: { color: "red" } }],
]);
const state = {
  get: (key) => values.get(key),
  set: (key, value) => values.set(key, value),
};
const updates = [];
let clock = 500;
const LocalProjectCache = createLocalProjectCacheClass({
  runtime: {
    iu: keys,
    Io: (value) => value ?? {},
    Fo: ({ projectAppearances, projectId, appearance }) => {
      const next = { ...projectAppearances };
      appearance == null ? delete next[projectId] : next[projectId] = appearance;
      return next;
    },
  },
  hostId: "local-host",
  getLocalProjects: (globalState) => globalState.get(keys.LOCAL_PROJECTS) ?? {},
  updateLocalProject: (globalState, projectId, updater) => {
    updates.push(projectId);
    const projects = { ...(globalState.get(keys.LOCAL_PROJECTS) ?? {}) };
    const updated = updater(projects[projectId]);
    updated == null ? delete projects[projectId] : projects[projectId] = updated;
    globalState.set(keys.LOCAL_PROJECTS, projects);
  },
  now: () => clock,
});

const cache = new LocalProjectCache(state);
assert.equal(cache.hostId, "local-host");
assert.equal(cache.getProjects().old.name, "Old");
assert.deepEqual(cache.getAppearance("old"), { color: "red" });
assert.equal(cache.getAppearance("missing"), null);

const created = { id: "new", name: "New", rootPaths: ["/new"], updatedAt: 10 };
cache.writeProject("project/create", created, { color: "blue", marker: "dot" });
assert.equal(cache.getProjects().new, created);
assert.deepEqual(cache.getAppearance("new"), { color: "blue", marker: "dot" });
assert.deepEqual(updates, []);

cache.writeProject("project/delete", created, undefined);
assert.equal(cache.getProjects().new, undefined);
assert.deepEqual(cache.getAppearance("new"), { color: "blue", marker: "dot" });
assert.deepEqual(updates, ["new"]);

clock = 900;
cache.updateProject("old", { name: "Renamed" });
assert.equal(cache.getProjects().old.name, "Renamed");
assert.deepEqual(cache.getProjects().old.rootPaths, ["/old"]);
assert.equal(cache.getProjects().old.updatedAt, 900);
assert.deepEqual(cache.getAppearance("old"), { color: "red" });

clock = 1_200;
cache.updateProject("old", { appearance: { color: "green" } });
assert.equal(cache.getProjects().old.updatedAt, 900);
assert.deepEqual(cache.getAppearance("old"), { color: "green" });

cache.updateProject("old", { rootPaths: [] });
assert.deepEqual(cache.getProjects().old.rootPaths, []);
assert.equal(cache.getProjects().old.updatedAt, 1_200);

cache.updateAppearance("old", null);
assert.equal(cache.getAppearance("old"), null);
const appearancesBefore = values.get(keys.PROJECT_APPEARANCES);
cache.updateAppearance("old", undefined);
assert.equal(values.get(keys.PROJECT_APPEARANCES), appearancesBefore);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /p2 = createLocalProjectCacheClass\(\{/);
assert.doesNotMatch(main, /p2 = class/);
assert.equal((main.match(/new p2\(/g) ?? []).length, 2);

console.log("local project cache assertions: 21");
