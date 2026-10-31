import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/remote/codex-app-config-runtime.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { createCodexAppConfigRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const keys = {
  managedRemoteConnections: "managed",
  remoteProjects: "projects",
  projectOrder: "order",
  maxRetryAttempts: "retries",
  autoConnectByHostId: "auto-connect",
  appliedRemoteDeclarations: "applied",
};
const warnings = [];
let uuid = 0;
const runtime = createCodexAppConfigRuntime({
  keys,
  normalizeRemotePath: (path) => path.replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase(),
  canonicalizeRemotePath: (path) => `/${path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+$/, "")}`,
  defaultProjectLabel: (path) => path.split("/").filter(Boolean).at(-1) ?? "root",
  hostIdForSshAlias: (alias) => `discovered:${alias}`,
  randomUUID: () => `uuid-${++uuid}`,
  logger: { warning: (...args) => warnings.push(args) },
});

function createState(initial = {}) {
  const values = new Map(Object.entries(initial));
  const writes = [];
  return {
    values,
    writes,
    get: (key) => values.get(key),
    set(key, value) { values.set(key, structuredClone(value)); writes.push([key, structuredClone(value)]); },
  };
}

const stagedState = createState({
  managed: [{ hostId: "host-known", alias: " known " }],
  projects: [
    { id: "known-id", hostId: "host-known", remotePath: "/Repo/", label: "Repo" },
  ],
  applied: { removed: ["/old"], retained: ["/kept"] },
});
const stagedConfig = {
  remoteConnections: [
    { sshAlias: "known", projects: [{ remotePath: "/repo" }] },
    { sshAlias: "new-host", projects: [{ remotePath: "/new" }] },
    { sshAlias: "retained", projects: [] },
  ],
};
equal(runtime.stageRemoteConnectionDeclarations({ config: stagedConfig, globalState: stagedState }), true);
equal(stagedState.get("managed"), [
  { hostId: "host-known", alias: " known " },
  {
    hostId: "discovered:new-host",
    displayName: "new-host",
    source: "discovered",
    alias: "new-host",
    hostname: null,
    sshPort: null,
    identity: null,
  },
]);
equal(stagedState.get("applied"), {
  retained: ["/kept"],
  known: ["/repo"],
  "new-host": [],
});
equal(stagedState.get("applied").removed, undefined);
equal(stagedState.writes.map(([key]) => key), ["managed", "applied"]);
equal(runtime.stageRemoteConnectionDeclarations({ config: stagedConfig, globalState: stagedState }), false);
equal(stagedState.writes.length, 2);

const applyState = createState({
  managed: [
    { hostId: "host-alpha", alias: "alpha" },
    { hostId: "host-missing", alias: "missing" },
  ],
  projects: [
    { id: "existing-id", hostId: "host-alpha", remotePath: "/existing", label: "Old" },
    { id: "other-id", hostId: "host-other", remotePath: "/other", label: "Other" },
  ],
  order: ["existing-id", "other-id"],
  retries: 1,
  "auto-connect": { "host-alpha": false },
  applied: { alpha: [], silent: [], obsolete: ["/gone"] },
});
const config = {
  remoteConnectionMaxRetryAttempts: 4,
  remoteConnections: [
    {
      sshAlias: "alpha",
      projects: [
        { remotePath: "existing/", label: " Renamed " },
        { remotePath: "new-alpha", label: "" },
      ],
    },
    { sshAlias: "beta", projects: [{ remotePath: "beta-project" }] },
    { sshAlias: "missing", projects: [] },
    { sshAlias: "silent", projects: [] },
  ],
};
const consentCalls = [];
const orderCalls = [];
const result = await runtime.applyRemoteDeclarations({
  config,
  confirmProjectFolders: async (hostId, paths) => {
    consentCalls.push([hostId, paths]);
    return true;
  },
  globalState: applyState,
  setProjectOrder: async (order) => orderCalls.push(order),
  remoteConnections: [
    { hostId: "host-alpha", sshAlias: " alpha " },
    { hostId: "host-beta", sshAlias: "beta" },
  ],
});
equal(result.changedGlobalStateKeys, ["retries", "auto-connect", "projects", "order"]);
equal(result.remoteProjectsChanged, true);
equal(result.missingSshAliases, ["missing"]);
equal(result.remoteConnectionHostIdsToConnect, ["host-beta"]);
equal(consentCalls, [
  ["host-alpha", ["/new-alpha"]],
  ["host-beta", ["/beta-project"]],
]);
equal(applyState.get("retries"), 4);
equal(applyState.get("auto-connect"), { "host-alpha": false, "host-beta": true });
equal(applyState.get("projects"), [
  { id: "existing-id", hostId: "host-alpha", remotePath: "/existing", label: "Renamed" },
  { id: "uuid-1", hostId: "host-alpha", remotePath: "/new-alpha", label: "new-alpha" },
  { id: "uuid-2", hostId: "host-beta", remotePath: "/beta-project", label: "beta-project" },
  { id: "other-id", hostId: "host-other", remotePath: "/other", label: "Other" },
]);
equal(applyState.get("order"), ["existing-id", "other-id"]);
equal(orderCalls, [["uuid-1", "uuid-2", "existing-id", "other-id"]]);
equal(applyState.get("applied"), {
  alpha: ["/existing", "/new-alpha"],
  silent: [],
  obsolete: ["/gone"],
  beta: ["/beta-project"],
});
equal(warnings.length, 1);
equal(warnings[0], [
  "skipped_missing_ssh_aliases",
  { safe: { missingSshAliasCount: 1 }, sensitive: { sshAliases: ["missing"] } },
]);

const deniedState = createState({
  managed: [{ hostId: "host-denied", alias: "denied" }],
  projects: [],
  order: [],
  applied: { denied: ["/previously-applied"] },
});
const deniedResult = await runtime.applyRemoteDeclarations({
  config: {
    remoteConnections: [{
      sshAlias: "denied",
      projects: [
        { remotePath: "/previously-applied" },
        { remotePath: "/not-approved" },
      ],
    }],
  },
  confirmProjectFolders: async () => false,
  globalState: deniedState,
  setProjectOrder: async () => { throw new Error("order should not change"); },
  remoteConnections: [{ hostId: "host-denied", sshAlias: "denied" }],
});
equal(deniedResult.remoteProjectsChanged, false);
equal(deniedState.get("projects"), []);
equal(deniedState.get("applied"), { denied: ["/previously-applied"] });
equal(deniedResult.remoteConnectionHostIdsToConnect, ["host-denied"]);

const raceState = createState({
  managed: [{ hostId: "host-race", alias: "race" }],
  projects: [],
  order: [],
  applied: { race: [] },
});
const raceOrders = [];
const raceResult = await runtime.applyRemoteDeclarations({
  config: { remoteConnections: [{ sshAlias: "race", projects: [{ remotePath: "shared" }] }] },
  confirmProjectFolders: async () => {
    raceState.set("projects", [
      { id: "concurrent-id", hostId: "host-race", remotePath: "/shared", label: "Concurrent" },
    ]);
    return true;
  },
  globalState: raceState,
  setProjectOrder: async (order) => raceOrders.push(order),
  remoteConnections: [{ hostId: "host-race", sshAlias: "race" }],
});
equal(raceResult.remoteProjectsChanged, false);
equal(raceState.get("projects"), [
  { id: "concurrent-id", hostId: "host-race", remotePath: "/shared", label: "Concurrent" },
]);
equal(raceOrders, []);
equal(raceState.get("applied"), { race: ["/shared"] });

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/remote/codex-app-config-runtime.js")'), true);
equal(main.includes("createCodexAppConfigRuntime({"), true);
equal(main.includes("function dOe("), false);
equal(main.includes("async function fOe("), false);
equal(main.includes("async function hOe("), false);
equal(main.includes("function gOe("), false);
equal(windowContext.includes("stageRemoteConnectionDeclarations({"), true);
equal(windowContext.includes("await applyRemoteDeclarations({"), true);

console.log(`${assertions} main codex app config runtime assertions passed`);
