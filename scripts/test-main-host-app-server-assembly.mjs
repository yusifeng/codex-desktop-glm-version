import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const coordinationSource = fs.readFileSync(
  new URL("../src/main/main-app/app-server/host-client-coordination.ts", import.meta.url),
  "utf8",
);
const coordinationModule = await transform(coordinationSource, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const { createHostClientCoordinationClass } = await import(
  `data:text/javascript;base64,${Buffer.from(coordinationModule.code).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const clients = [];
const serviceCalls = [];
const readiness = [];
let ownerOptions;
let ownerDisposed = 0;

class ClientCoordination {
  constructor(clientId, errorReporter) {
    this.clientId = clientId;
    this.errorReporter = errorReporter;
    this.handlers = new Map();
    this.requests = [];
    this.disposed = false;
    clients.push(this);
  }

  addBroadcastHandler(name, handler) {
    this.handlers.set(name, handler);
    return () => this.handlers.delete(name);
  }

  sendRequest(method, params, options) {
    const request = { method, params, options };
    this.requests.push(request);
    return request;
  }

  dispose() {
    this.disposed = true;
  }
}

class ClientCoordinationService {
  constructor(client, getThreadReadStateContext) {
    this.client = client;
    this.getThreadReadStateContext = getThreadReadStateContext;
  }
}

for (const method of [
  "setThreadOwnership",
  "threadArchived",
  "threadUnarchived",
  "threadStreamFollowingChanged",
  "threadStreamFollowingStatusRequested",
  "threadStreamStateChanged",
  "threadQueuedFollowUpsChanged",
]) {
  ClientCoordinationService.prototype[method] = function (input) {
    serviceCalls.push([method, input]);
    return input;
  };
}

const HostClientCoordination = createHostClientCoordinationClass({
  ClientCoordination,
  ClientCoordinationService,
  createThreadOwnerRegistration(options) {
    ownerOptions = options;
    return () => {
      ownerDisposed += 1;
    };
  },
  protocolVersion: (name) => (name === "event" ? 4 : 7),
  async waitUntilInitialized(client, timeoutMs) {
    readiness.push([client, timeoutMs]);
    return timeoutMs == null ? 91 : timeoutMs - 1;
  },
});

let currentChecks = 0;
const coordination = new HostClientCoordination(
  "remote-a",
  "reporter",
  "read-context",
  () => {
    currentChecks += 1;
  },
);
equal(clients.length, 0, "coordination session must remain lazy");
equal(coordination.client.clientId, "desktop");
equal(clients.length, 1);
equal(coordination.service.getThreadReadStateContext, "read-context");
equal(coordination.client, clients[0], "client getter must reuse the session");

const broadcasts = [];
const removeBroadcast = coordination.bridge.registerBroadcastHandler("event", (event) =>
  broadcasts.push(event.params),
);
await clients[0].handlers.get("event")({ version: 3, params: "stale" });
await clients[0].handlers.get("event")({ version: 4, params: "fresh" });
equal(broadcasts, ["fresh"], "broadcasts must reject mismatched protocol versions");
removeBroadcast();
equal(clients[0].handlers.has("event"), false);

const request = await coordination.bridge.request(
  "thread/read",
  { threadId: "thread-1" },
  { timeoutMs: 50, targetClientId: "renderer-1" },
);
equal(readiness, [[clients[0], 50]]);
equal(request, {
  method: "thread/read",
  params: { threadId: "thread-1" },
  options: { hostId: "remote-a", targetClientId: "renderer-1", timeoutMs: 49 },
});
equal(currentChecks, 2, "request must validate lifetime before and after readiness");

const aborted = new AbortController();
aborted.abort();
await assert.rejects(
  coordination.bridge.request("thread/read", {}, { signal: aborted.signal }),
  /aborted/,
);
assertions += 1;
equal(readiness.length, 1, "pre-aborted requests must not wait for initialization");

coordination.bridge.threadStreamFollowingChanged({
  conversationId: "thread-1",
  targetClientIds: ["renderer-1"],
});
coordination.bridge.threadStreamStateChanged({
  conversationId: "thread-1",
  targetClientIds: ["renderer-2"],
  change: { revision: 2 },
});
equal(serviceCalls.slice(-2), [
  [
    "threadStreamFollowingChanged",
    {
      params: { conversationId: "thread-1" },
      targetClientIds: ["renderer-1"],
    },
  ],
  [
    "threadStreamStateChanged",
    {
      params: { conversationId: "thread-1", change: { revision: 2 } },
      targetClientIds: ["renderer-2"],
    },
  ],
]);

coordination.queuedMessages.broadcast({ conversationId: "thread-1" });
equal(serviceCalls.at(-1), [
  "threadQueuedFollowUpsChanged",
  { conversationId: "thread-1", hostId: "remote-a" },
]);
const queued = [];
coordination.queuedMessages.registerBroadcastHandler((event) => queued.push(event.params.value));
const queuedHandler = clients[0].handlers.get("thread-queued-followups-changed");
await queuedHandler({ version: 7, params: { hostId: "remote-b", value: "wrong" } });
await queuedHandler({ version: 7, params: { hostId: "remote-a", value: "right" } });
equal(queued, ["right"], "queued-message broadcasts must be host scoped");

const manager = {
  getHostId: () => "remote-a",
  getStreamRole: (conversationId) =>
    conversationId === "owned" ? { role: "owner" } : { role: "follower" },
  handleThreadFollowerRequest: (request) => ({ forwarded: request }),
};
coordination.bind(manager);
equal(ownerOptions.hostId, "remote-a");
equal(ownerOptions.ipcClient, clients[0]);
equal(await ownerOptions.canHandle({ conversationId: "owned" }, "remote-a"), true);
equal(await ownerOptions.canHandle({ conversationId: "owned" }, "remote-b"), false);
equal(await ownerOptions.discoverOwner("not-owned"), false);
equal(await ownerOptions.requestThreadFollower({ request: "follow" }), {
  forwarded: "follow",
});

coordination.dispose();
equal(ownerDisposed, 1);
equal(clients[0].disposed, true);
assert.throws(() => coordination.client, /coordination is disposed/);
assertions += 1;

const local = new HostClientCoordination("local", null, null, () => {});
const localRequest = await local.bridge.request("ping", {}, {});
equal(localRequest.options.hostId, undefined, "local requests must omit hostId");
local.dispose();

const root = new URL("../", import.meta.url);
const main = fs.readFileSync(
  new URL(".reference/originals/main/main-C-Mhak1n.ts", root),
  "utf8",
);
const assembly = fs.readFileSync(
  new URL("src/main/main-app/app-server/host-assembly.ts", root),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("src/main/main-app/window/window-context.ts", root),
  "utf8",
);
for (const token of [
  "createHostClientCoordinationClass({",
  "createHostedAppServerManagerFactory({",
  "createCodexHomeServiceClass(n.Uf)",
  "createHostedManagerRegistryClass({",
]) {
  equal(main.includes(token), true, `${token} must be wired in the main composition root`);
}
for (const removed of [
  "function yEe(",
  "var bEe = class",
  "IT = class",
  "var xEe = class",
  "async function FEe(",
  "var IEe = class",
  "LEe = createHostedManagerRegistryClass",
]) {
  equal(main.includes(removed), false, `${removed} must be physically removed`);
}
for (const token of [
  "new AppServerConversationManager({",
  "new AppServerRequestSender(",
  "createThreadStreamBroadcastHandlers(",
  "router.bind(hostedManager)",
  "subscribeCatalogThreads({",
  "AppServerConversationManager.dispose(hostedManager)",
]) {
  equal(assembly.includes(token), true, `${token} must remain in semantic host assembly`);
}
equal(windowContext.includes("new HostedManagerRegistry({"), true);
equal(windowContext.includes("createHostedAppServerManager({"), true);
equal(windowContext.includes("new CodexHomeService(this.fetchHandler)"), true);
equal(/\b(FEe|IEe|LEe)\b/.test(windowContext), false);

console.log(`${assertions} main host app-server assembly assertions passed`);
