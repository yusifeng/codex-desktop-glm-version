import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const entry = path.join(root, "src/main/main-app/projects/local-data-migrations.ts");
const bundle = await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { createProjectLocalDataMigrationRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const keys = Object.fromEntries([
  "PROJECT_WRITABLE_ROOTS",
  "LOCAL_PROJECTS",
  "WORKSPACE_ROOT_OPTIONS",
  "WORKSPACE_ROOT_LABELS",
  "ACTIVE_WORKSPACE_ROOTS",
  "ACTIVE_REMOTE_PROJECT_ID",
  "REMOTE_PROJECTS",
  "SELECTED_PROJECT",
  "PROJECT_ORDER",
  "PINNED_PROJECT_IDS",
  "PROJECT_APPEARANCES",
  "PROJECT_FILES",
  "SIDEBAR_PROJECT_THREAD_ORDERS",
  "THREAD_PROJECT_ASSIGNMENTS",
  "REMOTE_CWDS_BY_HOST_AND_WORKSPACE",
  "SELECTED_REMOTE_HOST_ID",
].map((key) => [key, key]));
const automationCwds = [];
let automationTargetMapper = null;
const runtime = {
  iu: keys,
  Jo: (value) => value,
  No: (value) => value ?? {},
  Io: (value) => value ?? {},
  Po: (value) => value ?? {},
  Ca: (value) => value ?? {},
  ca: (value) => value ?? {},
  qo: () => { throw new Error("raw shared project parser must not be used"); },
  Wo: (paths) => paths[0] ?? null,
  Go: ({ localProjects, projectId, project }) => ({ ...localProjects, [projectId]: project }),
  Ir: async (mapper) => {
    let count = 0;
    for (const cwd of automationCwds) if (await mapper(cwd) != null) count += 1;
    return count;
  },
  Rr: (mapper) => {
    automationTargetMapper = mapper;
    return 1;
  },
  vl: (cwd) => path.isAbsolute(cwd),
  Tl: (cwd) => cwd,
  _l: (cwd) => path.normalize(cwd),
};
const logEvents = [];
const logger = () => ({
  info: (message, details) => logEvents.push(["info", message, details]),
  warning: (message, details) => logEvents.push(["warning", message, details]),
});

class Store {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
    this.flushes = 0;
  }
  get(key) { return this.values.get(key); }
  getStored(key) { return this.values.get(key); }
  set(key, value) { this.values.set(key, value); }
  delete(key) { this.values.delete(key); }
  async flushOrThrow() { this.flushes += 1; }
}

let uuidIndex = 0;
const migrations = createProjectLocalDataMigrationRuntime({
  runtime,
  createHash: crypto.createHash,
  randomUUID: () => `remote-${++uuidIndex}`,
  path,
  uniqueBy: (items, key) => [...new Map(items.map((item) => [key(item), item])).values()],
  createLogger: () => logger,
  readSelectedProject: (store) => store.getStored(keys.SELECTED_PROJECT),
  now: () => 1_000,
});

const localId = (rootPath) =>
  `local-${crypto.createHash("sha256").update(rootPath).digest("hex").slice(0, 32)}`;
const selectionId = (ids) =>
  `local-selection-${crypto.createHash("sha256").update(JSON.stringify(ids)).digest("hex").slice(0, 32)}`;

const localStore = new Store({
  [keys.PROJECT_WRITABLE_ROOTS]: {
    "/alpha": [{ path: "/alpha" }],
    "/beta": [{ path: "/beta" }],
  },
  [keys.LOCAL_PROJECTS]: {},
  [keys.WORKSPACE_ROOT_OPTIONS]: ["/alpha", "/beta"],
  [keys.WORKSPACE_ROOT_LABELS]: { "/alpha": "Alpha", "/beta": "Beta" },
  [keys.ACTIVE_WORKSPACE_ROOTS]: ["/alpha", "/beta"],
  [keys.REMOTE_PROJECTS]: [],
});
migrations.migrateLegacyLocalProjects(localStore);
const alphaId = localId("/alpha");
const betaId = localId("/beta");
const combinedId = selectionId([alphaId, betaId]);
equal(localStore.getStored(keys.LOCAL_PROJECTS)[alphaId].name, "Alpha");
equal(localStore.getStored(keys.LOCAL_PROJECTS)[betaId].rootPaths, ["/beta"]);
equal(localStore.getStored(keys.LOCAL_PROJECTS)[combinedId].rootPaths, ["/alpha", "/beta"]);
equal(localStore.getStored(keys.SELECTED_PROJECT), { type: "local", projectId: combinedId });

const remoteStore = new Store({
  [keys.WORKSPACE_ROOT_OPTIONS]: ["/srv/project"],
  [keys.REMOTE_CWDS_BY_HOST_AND_WORKSPACE]: { hostA: { "/srv/project": "/srv/project" } },
  [keys.SELECTED_REMOTE_HOST_ID]: "hostA",
  [keys.WORKSPACE_ROOT_LABELS]: { "/srv/project": "Remote Project" },
  [keys.ACTIVE_WORKSPACE_ROOTS]: ["/srv/project"],
  [keys.PROJECT_ORDER]: ["/srv/project"],
  [keys.REMOTE_PROJECTS]: [],
});
migrations.migrateStringRemoteProjects(remoteStore);
equal(remoteStore.getStored(keys.REMOTE_PROJECTS), [{
  id: "remote-1",
  hostId: "hostA",
  remotePath: "/srv/project",
  label: "Remote Project",
}]);
equal(remoteStore.getStored(keys.PROJECT_ORDER), ["remote-1"]);
equal(remoteStore.getStored(keys.SELECTED_PROJECT), { type: "remote", projectId: "remote-1" });
equal(remoteStore.getStored(keys.REMOTE_CWDS_BY_HOST_AND_WORKSPACE), {
  hostA: { "/srv/project": "/srv/project" },
});

automationCwds.push("/new-project", "~", "relative-project");
const automationStore = new Store({
  [keys.PROJECT_WRITABLE_ROOTS]: {},
  [keys.LOCAL_PROJECTS]: {},
  [keys.PROJECT_ORDER]: [],
  [keys.WORKSPACE_ROOT_OPTIONS]: [],
});
equal(await migrations.migrateAutomationProjectTargets(automationStore), 2);
equal(Object.values(automationStore.getStored(keys.LOCAL_PROJECTS))[0].rootPaths, ["/new-project"]);
equal(automationStore.flushes, 1);
equal(logEvents.some(([level]) => level === "warning"), true);

const canonical = localId("/legacy");
const repairStore = new Store({
  [keys.LOCAL_PROJECTS]: {
    "/legacy": { id: "/legacy", name: "Legacy", rootPaths: ["/legacy"], createdAt: 1, updatedAt: 2 },
    [canonical]: { id: canonical, name: "/legacy", rootPaths: ["/legacy/new"], createdAt: 1, updatedAt: 3 },
  },
  [keys.PROJECT_ORDER]: [canonical],
  [keys.SELECTED_PROJECT]: { type: "local", projectId: canonical },
});
equal(migrations.repairMetadataLocalProjects(repairStore), 1);
equal(repairStore.getStored(keys.LOCAL_PROJECTS)["/legacy"].rootPaths, ["/legacy/new"]);
equal(repairStore.getStored(keys.PROJECT_ORDER), ["/legacy"]);
equal(repairStore.getStored(keys.SELECTED_PROJECT), { type: "local", projectId: "/legacy" });
equal(automationTargetMapper(canonical), "/legacy");

const ledgerStore = new Store({
  "electron-completed-local-data-migration-ids": ["done"],
  "electron-browser-download-history": [{ id: "download" }],
});
const ran = [];
await migrations.runLocalDataMigrations(ledgerStore, [
  { id: "done", runAsync: async () => ran.push("done") },
  { id: "next", runAsync: async () => ran.push("next") },
]);
equal(ran, ["next"]);
equal(ledgerStore.get("electron-completed-local-data-migration-ids"), ["done", "next"]);
equal(ledgerStore.flushes, 1);
await migrations.clearLegacyBrowserDownloadHistoryOnStartup(ledgerStore);
equal(ledgerStore.getStored("electron-browser-download-history"), undefined);
equal(ledgerStore.flushes, 2);
equal(migrations.migrations.map(({ id }) => id), [
  "2026-07-13-string-based-remote-projects",
  "2026-07-13-automation-project-targets",
  "2026-07-13-local-projects",
  "2026-07-13-remap-legacy-automation-project-targets",
  "2026-07-13-clear-legacy-browser-download-history",
  "2026-07-14-repair-metadata-local-projects",
]);

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/projects/local-data-migrations.js")'), true);
equal(main.includes("await runLocalDataMigrations(V.globalState, projectLocalDataMigrations)"), true);
equal(main.includes("await clearLegacyBrowserDownloadHistoryOnStartup(V.globalState)"), true);
equal(main.includes("function oce("), false);
equal(main.includes("function Ace("), false);
equal(main.includes("var Pce = ["), false);
equal(main.includes("async function Ice("), false);

console.log(`${assertions} main project local data migration assertions passed`);
