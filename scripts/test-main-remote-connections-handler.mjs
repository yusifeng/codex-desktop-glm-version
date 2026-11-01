import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/remote/remote-connections-handler.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", transpiled.code)(loaded, loaded.exports);
const { createRemoteConnectionsHandlerClass } = loaded.exports;

const logs = [];
const appValues = new Map();
const sharedValues = new Map();
const disposedHosts = [];
const createdConfigs = [];
const registryConnections = new Map();
const registry = {
  getMaybeConnection: (hostId) => registryConnections.get(hostId),
  addConnection: (hostId, connection) => registryConnections.set(hostId, connection),
};
const appState = {
  get: (key) => appValues.get(key),
  set: (key, value) => appValues.set(key, value),
};
const shared = {
  get: (key) => sharedValues.get(key),
  set: (key, value) => sharedValues.set(key, value),
};
let uuid = 0;
let discovered = ["devbox"];
let wslDefault = { distro: "Ubuntu", available: true };
let wslDistros = ["Ubuntu", "Debian"];
const remoteEntries = [
  { name: ".hidden", isDirectory: () => false },
  { name: "z.txt", isDirectory: () => false },
  { name: "src", isDirectory: () => true },
];
const runtime = {
  iu: {
    CODEX_MANAGED_REMOTE_CONNECTIONS: "managed",
    REMOTE_PROJECT_CONNECTION_BACKFILL_COMPLETED: "backfill",
    REMOTE_PROJECTS: "projects",
    REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID: "auto",
    REMOTE_CONNECTION_ANALYTICS_ID_BY_HOST_ID: "analytics",
  },
  ws: (connection) => connection?.source === "remote-control",
  ys: (alias) => `ssh:${alias}`,
  xs: (distro) => `wsl:${distro}`,
  zi: () => "posix",
  Es: () => false,
  Ii: async () => wslDefault,
  Pi: async () => wslDistros,
  Di: {
    stat: async () => ({ isDirectory: () => true }),
    readdir: async () => remoteEntries,
  },
};
const RemoteConnectionsHandler = createRemoteConnectionsHandlerClass({
  runtime,
  createLogger: (name) => () => ({
    info: (event, details) => logs.push([name, "info", event, details]),
    warning: (event, details) => logs.push([name, "warning", event, details]),
  }),
  deepEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right),
  discoverSshAliases: () => discovered,
  resolveSshAlias: async ({ sshAlias }) => ({
    hostId: `resolved:${sshAlias}`,
    displayName: sshAlias,
    source: "discovered",
    autoConnect: false,
    sshAlias,
    sshHost: `${sshAlias}.example`,
    sshPort: 22,
    identity: null,
  }),
  authorizeRemoteControlEnvironments: async () => {},
  renameRemoteControlEnvironment: async () => ({}),
  deleteRemoteControlEnvironment: async () => {},
  listRemoteControlEnvironments: async () => [],
  checkRemoteControlAuthorization: async () => ({ clientAuthorized: false, clientId: null }),
  requestRemoteControlEnrollmentStepUpToken: async () => null,
  RemoteControlFeatureUnavailableError: class extends Error {},
  RemoteControlPermissionError: class extends Error {},
  RemoteControlAuthError: class extends Error {},
  getSshHostConfig: (config) => config.kind === "ssh" ? config : null,
  RemoteCodexInstaller: class { async installCodex() {} },
  normalizeRemotePath: (path, style) => `${style}:${path}`,
  randomUUID: () => `uuid-${++uuid}`,
  homeDirectory: () => "/home/test",
  pathJoin: (...parts) => parts.join("/"),
  setTimer: (callback) => { callback(); return 1; },
});

const makeConnection = () => ({
  state: "disconnected",
  error: null,
  async connect() { this.state = "connected"; },
  getConnectionState() { return this.state; },
  getConnectionProgress() { return this.state === "connected" ? null : "waiting"; },
  getConnectionError() { return this.error; },
});
const handler = new RemoteConnectionsHandler(
  appState,
  shared,
  "local",
  registry,
  {},
  {},
  {},
  (hostId) => ({ kind: "ssh", hostId }),
  () => ({
    hostConfig: { kind: "ssh" },
    platformPath: async () => ({ join: (...parts) => parts.join("/"), dirname: (path) => path.split("/").slice(0, -1).join("/") || "/" }),
    codexHome: async () => "/remote/.codex",
  }),
  (config) => { createdConfigs.push(config); return makeConnection(); },
  (hostId) => { disposedHosts.push(hostId); registryConnections.delete(hostId); },
  () => {},
);

assert.deepEqual(handler.discoverRemoteConnections(), { sshAliases: ["devbox"] });
assert.equal(handler.getSharedRemoteConnections().length, 0);
assert.deepEqual(handler.getRemoteConnectionAutoConnectByHostId(), {});

const ssh = { hostId: "ssh:devbox", displayName: "devbox", source: "codex-managed", autoConnect: true, hostname: "devbox", alias: null };
handler.reconcileRemoteConnections([ssh, { ...ssh, hostId: "local" }]);
assert.equal(createdConfigs.length, 1);
assert.equal(registryConnections.has("ssh:devbox"), true);
assert.equal(handler.remoteConnectionsByHostId.size, 1);
handler.reconcileRemoteConnections([ssh]);
assert.equal(createdConfigs.length, 1);
handler.reconcileRemoteConnections([{ ...ssh, autoConnect: false }]);
assert.equal(disposedHosts.includes("ssh:devbox"), true);
assert.equal(handler.remoteConnectionsByHostId.get("ssh:devbox").autoConnect, false);

handler.reconcileRemoteConnections([ssh]);
const connected = await handler.ensureRemoteConnectionConnected("ssh:devbox");
assert.equal(connected.state, "connected");
assert.equal((await handler.appServerConnectionState("ssh:devbox")).state, "connected");
const disconnected = await handler.disconnectRemoteConnection("ssh:devbox");
assert.equal(disconnected.state, "disconnected");
assert.equal(registryConnections.has("ssh:devbox"), false);

const withIds = handler.addConnectionAnalyticsIds([
  { hostId: "one" },
  { hostId: "two", connectionAnalyticsId: "provided" },
]);
assert.equal(withIds[0].connectionAnalyticsId, "uuid-1");
assert.equal(withIds[1].connectionAnalyticsId, "provided");
assert.deepEqual(appValues.get("analytics"), { one: "uuid-1", two: "provided" });
assert.equal(handler.addConnectionAnalyticsIds([{ hostId: "one" }])[0].connectionAnalyticsId, "uuid-1");

appValues.set("managed", [
  { hostId: "direct", displayName: "Direct", sshAlias: null, sshHost: "host", sshPort: 22, identity: "id" },
  { hostId: "alias", displayName: "Alias", sshAlias: " devbox ", sshHost: null, sshPort: null, identity: null },
]);
appValues.set("backfill", true);
const saved = handler.loadSavedRemoteConnections();
assert.equal(saved[0].source, "codex-managed");
assert.equal(saved[0].hostname, "host");
assert.equal(saved[1].source, "discovered");
assert.equal(saved[1].alias, "devbox");
assert.equal(appValues.get("managed")[1].alias, "devbox");

const refreshed = await handler.refreshRemoteConnections();
assert.equal(refreshed.remoteConnections.length, 2);
assert.equal(sharedValues.get("remote_ssh_connections").length, 2);
assert.equal(sharedValues.get("remote_ssh_connections")[1].sshHost, "devbox.example");

const wsl = await handler.setRemoteWslConnectionsEnabled(true);
assert.deepEqual(wsl.remoteWslConnections.map((entry) => entry.hostId), ["wsl:Ubuntu", "wsl:Debian"]);
assert.equal(wsl.remoteWslConnections[0].autoConnect, true);
assert.equal(sharedValues.get("remote_wsl_connections").length, 2);
wslDefault = { distro: null, available: false };
wslDistros = [];
const emptyWsl = await handler.refreshRemoteWslConnections();
assert.deepEqual(emptyWsl.remoteWslConnections, []);

const directory = await handler.remoteWorkspaceDirectoryEntries("ssh:devbox", "/work", false);
assert.equal(directory.directoryPath, "posix:/work");
assert.equal(directory.parentPath, "posix:/");
assert.deepEqual(directory.entries.map((entry) => entry.name), ["src", "z.txt", ".hidden"]);
assert.equal(directory.entries[0].type, "directory");
const directoriesOnly = await handler.remoteWorkspaceDirectoryEntries("ssh:devbox", "/work", true);
assert.deepEqual(directoriesOnly.entries.map((entry) => entry.name), ["src"]);

const disabledRemoteControl = await handler.setRemoteControlConnectionsEnabled(false);
assert.deepEqual(disabledRemoteControl, { remoteControlConnections: [] });
assert.deepEqual(sharedValues.get("remote_control_connections_state"), {
  available: false,
  accessRequired: false,
  authRequired: false,
  clientAuthorized: false,
});
assert.equal(logs.some((entry) => entry[2] === "reconcile_completed"), true);
assert.equal(logs.some((entry) => entry[2] === "refresh_completed"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /D5e = createRemoteConnectionsHandlerClass\(\{/);
assert.doesNotMatch(main, /D5e = class/);
assert.doesNotMatch(main, /function O5e\(/);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
assert.match(windowContext, /this\.remoteConnectionsHandler = new D5e\(/);

console.log("remote connections handler assertions: 43");
