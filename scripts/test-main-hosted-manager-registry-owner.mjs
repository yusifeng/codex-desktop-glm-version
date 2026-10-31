import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";
import { createHostedManagerRegistryClass } from "../src/main/main-app/app-server/hosted-manager-registry.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/app-server/hosted-manager-registry.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
let classNode;
const visit = (node) => {
  if (node == null || typeof node !== "object") return;
  if (node.type === "ClassExpression" && node.id?.name === "HostedManagerRegistry") classNode = node;
  for (const value of Object.values(node)) Array.isArray(value) ? value.forEach(visit) : visit(value);
};
visit(ast);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 19);

const scheduled = [];
const Registry = createHostedManagerRegistryClass({
  identitiesEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right),
  scheduleMicrotask: (callback) => scheduled.push(callback),
});
const cleanups = [];
let principalHandler;
let notificationHandler;
let localStateHandler;
let connectionHandler;
const localConnection = {
  registerInternalAuthenticatedPrincipalChangeHandler(handler) {
    principalHandler = handler;
    return () => cleanups.push("principal");
  },
  registerInternalNotificationHandler(handler) {
    notificationHandler = handler;
    return () => cleanups.push("notification");
  },
  registerInternalConnectionStateHandler(handler) {
    localStateHandler = handler;
    return () => cleanups.push("local-state");
  },
  async getAuthenticatedPrincipal() {
    return { accountId: "account-1", userId: "user-1" };
  },
  getCachedAuthenticatedPrincipal() {
    return { accountId: "account-1", userId: "user-1" };
  },
};
const activeConnections = new Map();
const connections = {
  subscribe(handler) {
    connectionHandler = handler;
    return () => cleanups.push("connections");
  },
  getMaybeConnection(hostId) {
    return activeConnections.get(hostId) ?? null;
  },
};
const remoteStateHandlers = [];
const connection = {
  getConnectionState: () => "connected",
  registerInternalConnectionStateHandler(handler) {
    remoteStateHandlers.push(handler);
    return () => cleanups.push("remote-state");
  },
};
let context = {
  executionHostKey: "host-key-1",
  identity: { kind: "execution-storage", authMode: "api-key" },
};
const created = [];
const disposed = [];
const errors = [];
const registry = new Registry({
  localConnection,
  connections,
  readContext: async () => context,
  create: async (options) => {
    created.push(options);
    return { dispose: () => disposed.push(options.context.executionHostKey) };
  },
  onError: (error) => errors.push(error),
});

const observed = [];
const unsubscribe = registry.subscribe("host-1", (instance) =>
  observed.push(instance?.context.executionHostKey ?? null),
);
equal(observed, [null]);
activeConnections.set("host-1", connection);
connectionHandler({ type: "added", hostId: "host-1", connection });
equal(scheduled.length, 1);
scheduled.shift()();
await flush();
equal(created.length, 1);
equal(registry.getCurrent("host-1")?.context.executionHostKey, "host-key-1");
equal(observed, [null, "host-key-1"]);

context = {
  executionHostKey: "host-key-2",
  identity: { kind: "execution-storage", authMode: "api-key" },
};
await registry.refresh();
equal(disposed, ["host-key-1"]);
equal(created.length, 2);
equal(registry.getCurrent("host-1")?.context.executionHostKey, "host-key-2");
equal(observed, [null, "host-key-1", null, "host-key-2"]);

notificationHandler({ method: "account/updated", params: {} });
equal(scheduled.length, 1);
principalHandler({ current: { accountId: "account-1", userId: "user-1" } });
localStateHandler("connected");
equal(scheduled.length, 1);

activeConnections.delete("host-1");
connectionHandler({ type: "removed", hostId: "host-1", connection });
equal(registry.getCurrent("host-1"), null);
equal(disposed, ["host-key-1", "host-key-2"]);
equal(observed.at(-1), null);
equal(cleanups.includes("remote-state"), true);
unsubscribe();
registry.dispose();
equal(new Set(cleanups), new Set(["connections", "local-state", "notification", "principal", "remote-state"]));
equal(errors, []);
assert.throws(() => registry.subscribe("host-1", () => {}), /registry is disposed/);
assertions += 1;

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("HostedManagerRegistry = createHostedManagerRegistryClass({"), true);
equal(main.includes("LEe = createHostedManagerRegistryClass({"), false);
equal(/\bLEe\b/.test(main), false);

console.log(`${assertions} main hosted manager registry owner assertions passed`);
