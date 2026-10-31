import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadReadStateRuntime } from "../src/main/main-app/thread-read-state/runtime.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

class DisposableStore {
  entries = [];
  disposed = false;

  add(entry) {
    this.entries.push(entry);
    return entry;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.entries.splice(0).reverse()) {
      if (typeof entry === "function") entry();
      else entry.dispose();
    }
  }
}

function createHarness({ coordinationEnabled = true, identityRead } = {}) {
  const state = {
    connectionEvents: [],
    sharedObjectEvents: [],
    principalEvents: [],
    notifications: [],
    hostConfigs: new Map(),
    registryConnections: new Map(),
    ownerInstances: [],
    coordinationInstances: [],
    loggerWarnings: [],
    hostConfigKeyCalls: [],
    cronCalls: [],
    authRequests: [],
    identityRead: identityRead ?? (async (read) => ({ kind: "chatgpt", ...(await read()) })),
  };

  const subscribe = (list, listener) => {
    list.push(listener);
    return () => {
      const index = list.indexOf(listener);
      if (index >= 0) list.splice(index, 1);
    };
  };

  const localConnection = {
    hostId: "local",
    hostConfig: { kind: "local", id: "local" },
    registerInternalAuthenticatedPrincipalChangeHandler: (listener) =>
      subscribe(state.principalEvents, listener),
    registerInternalNotificationHandler: (listener) => subscribe(state.notifications, listener),
    sendAppServerRequest(method, params) {
      state.authRequests.push({ method, params });
      return Promise.resolve({ accountId: "account", userId: "user" });
    },
  };
  state.registryConnections.set("local", localConnection);

  const connections = {
    getMaybeConnection: (hostId) => state.registryConnections.get(hostId) ?? null,
    getAllHostIds: () => [...state.registryConnections.keys()],
    subscribe: (listener) => subscribe(state.connectionEvents, listener),
  };
  const sharedObjects = {
    addSubscriber: (listener) => subscribe(state.sharedObjectEvents, listener),
  };

  class ThreadReadStateOwner {
    accepted = [];
    captures = new Map();
    disposed = 0;

    constructor(options) {
      this.options = options;
      this.stopIdentity = options.onIdentityChanged((event) => state.identityEvents.push(event));
      this.stopHosts = options.onHostsChanged(() => {
        state.hostChangeCount += 1;
      });
      state.ownerInstances.push(this);
    }

    acceptBroadcast(change) {
      this.accepted.push(change);
      return Promise.resolve({ status: "ok" });
    }

    captureContext(hostId) {
      return Promise.resolve(this.captures.get(hostId) ?? null);
    }

    dispose() {
      this.disposed += 1;
      this.stopIdentity();
      this.stopHosts();
    }
  }

  class ClientCoordination {
    constructor(client, errorReporter) {
      this.client = client;
      this.errorReporter = errorReporter;
      this.handlers = new Map();
      this.sent = [];
      this.waitCalls = [];
      this.waitResult = Promise.resolve();
      this.disposed = 0;
      this.removedHandlers = 0;
      state.coordinationInstances.push(this);
    }

    addBroadcastHandler(name, handler) {
      this.handlers.set(name, handler);
      return () => {
        this.handlers.delete(name);
        this.removedHandlers += 1;
      };
    }

    waitUntilInitialized(options) {
      this.waitCalls.push(options);
      return this.waitResult;
    }

    sendBroadcast(name, params) {
      this.sent.push({ name, params });
    }

    dispose() {
      this.disposed += 1;
    }
  }

  Object.assign(state, {
    identityEvents: [],
    hostChangeCount: 0,
    configuredHostIds: ["local", "configured"],
  });
  state.hostConfigs.set("local", localConnection.hostConfig);
  state.hostConfigs.set("configured", { kind: "ssh", id: "configured", hostname: "box" });

  const createRuntime = createThreadReadStateRuntime({
    DisposableStore,
    ThreadReadStateOwner,
    ClientCoordination,
    readAuthenticatedIdentity: (...args) => state.identityRead(...args),
    hostConfigKey: (hostConfig, websocketUrl) => {
      state.hostConfigKeyCalls.push({ hostConfig, websocketUrl });
      return `${hostConfig.kind}:${hostConfig.id}:${websocketUrl ?? "none"}`;
    },
    protocolVersion: (name) => (name === "thread-read-state-changed" ? 3 : -1),
    deepEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right),
    prepareCronTurnReadState: (options) => {
      state.cronCalls.push(options);
      return { prepared: options };
    },
    logger: {
      warning: (message, fields) => state.loggerWarnings.push({ message, fields }),
    },
  });
  const runtime = createRuntime({
    localClientCoordinationEnabled: coordinationEnabled,
    localConnection,
    connections,
    sharedObjects,
    globalState: { marker: "state" },
    errorReporter: { marker: "reporter" },
    getConfiguredHostIds: () => state.configuredHostIds,
    getHostConfig: (hostId) => state.hostConfigs.get(hostId) ?? null,
    getLocalWebsocketUrl: (hostConfig) => `ws://${hostConfig.id}`,
  });
  return {
    state,
    runtime,
    owner: state.ownerInstances[0],
    coordination: state.coordinationInstances[0],
    localConnection,
  };
}

{
  const harness = createHarness();
  equal(harness.state.ownerInstances.length, 1);
  equal(harness.state.coordinationInstances.length, 1);
  equal(harness.coordination.client, "desktop");
  equal(harness.coordination.errorReporter, { marker: "reporter" });
  equal(harness.owner.options.globalState, { marker: "state" });
  equal(harness.state.principalEvents.length, 1);
  equal(harness.state.notifications.length, 1);
  equal(harness.state.connectionEvents.length, 1);
  equal(harness.state.sharedObjectEvents.length, 1);

  equal(harness.owner.options.listHostKeys(), {
    local: "local:local:ws://local",
    configured: "ssh:configured:none",
  });
  equal(harness.owner.options.getHostKey("missing"), null);
  equal(harness.state.hostConfigKeyCalls.some((call) => call.websocketUrl === "ws://local"), true);
  equal(harness.state.hostConfigKeyCalls.some((call) => call.websocketUrl === null), true);

  equal(await harness.owner.options.readIdentity(), {
    kind: "chatgpt",
    accountId: "account",
    userId: "user",
  });
  equal(harness.state.authRequests, [{
    method: "getAuthStatus",
    params: { includeToken: true, refreshToken: false },
  }]);

  harness.state.principalEvents[0]({ current: { accountId: "next", userId: "person" } });
  harness.state.principalEvents[0]({ current: null });
  harness.state.notifications[0]({ method: "irrelevant" });
  harness.state.notifications[0]({ method: "account/updated", params: { authMode: "chatgpt" } });
  harness.state.notifications[0]({ method: "account/updated", params: { authMode: null } });
  equal(harness.state.identityEvents, [
    { type: "identity", identity: { kind: "chatgpt", accountId: "next", userId: "person" } },
    { type: "refresh" },
    { type: "refresh" },
    { type: "logout" },
  ]);
}

{
  const gate = deferred();
  const harness = createHarness({
    identityRead: async (read) => {
      await gate.promise;
      return read();
    },
  });
  const pending = harness.owner.options.readIdentity();
  harness.state.registryConnections.set("local", { ...harness.localConnection });
  gate.resolve();
  equal(await pending, null, "identity must be discarded when the local connection changes in flight");
  harness.state.registryConnections.delete("local");
  equal(await harness.owner.options.readIdentity(), null, "identity read must not start without local connection ownership");
}

{
  const harness = createHarness();
  const remoteConnection = { hostConfig: { kind: "wsl", id: "wsl", distro: "Ubuntu" } };
  harness.state.registryConnections.set("remote", remoteConnection);
  harness.state.connectionEvents[0]({ type: "added", hostId: "remote", connection: remoteConnection });
  equal(harness.state.hostChangeCount, 1);
  harness.state.connectionEvents[0]({ type: "updated", hostId: "remote", connection: remoteConnection });
  equal(harness.state.hostChangeCount, 1, "stable host projections must not retire sessions");
  harness.state.sharedObjectEvents[0]("unrelated");
  equal(harness.state.hostChangeCount, 1);
  harness.state.hostConfigs.set("configured", { kind: "ssh", id: "configured-2" });
  harness.state.sharedObjectEvents[0]("remote_ssh_connections");
  equal(harness.state.hostChangeCount, 2);
  harness.state.hostConfigs.set("configured", { kind: "ssh", id: "configured-3" });
  harness.state.sharedObjectEvents[0]("remote_wsl_connections");
  harness.state.hostConfigs.set("configured", { kind: "ssh", id: "configured-4" });
  harness.state.sharedObjectEvents[0]("remote_control_connections");
  equal(harness.state.hostChangeCount, 4);
  harness.state.connectionEvents[0]({ type: "removed", hostId: "local", connection: harness.localConnection });
  equal(harness.state.hostChangeCount, 5, "local removal must always retire current sessions");
}

{
  const harness = createHarness();
  const context = { identity: { kind: "chatgpt", accountId: "a", userId: "u" }, executionHostKey: "key" };
  harness.owner.options.onAcceptedChange({
    hostId: "host",
    threadId: "thread",
    hasUnreadTurn: true,
    context,
  });
  await Promise.resolve();
  await Promise.resolve();
  equal(harness.coordination.waitCalls, [{ timeoutMs: 5000 }]);
  equal(harness.coordination.sent, [{
    name: "thread-read-state-changed",
    params: { conversationId: "thread", hostId: "host", hasUnreadTurn: true, context },
  }]);

  const handler = harness.coordination.handlers.get("thread-read-state-changed");
  await handler({ version: 2, params: {} });
  equal(harness.owner.accepted.length, 0);
  await handler({
    version: 3,
    params: { conversationId: "incoming", hostId: "remote", hasUnreadTurn: false, context },
  });
  equal(harness.owner.accepted, [{
    hostId: "remote",
    threadId: "incoming",
    hasUnreadTurn: false,
    context,
  }]);

  const cronResult = harness.runtime.prepareCronTurnReadState({ threadId: "cron-thread" });
  equal(cronResult.prepared.threadId, "cron-thread");
  equal(cronResult.prepared.owner, harness.owner);
  equal(harness.state.cronCalls.length, 1);

  harness.owner.captures.set("current", { context: { host: "current" }, isCurrent: () => true });
  harness.owner.captures.set("stale", { context: { host: "stale" }, isCurrent: () => false });
  equal(await harness.runtime.getContext("current"), { host: "current" });
  equal(await harness.runtime.getContext("stale"), null);
  equal(await harness.runtime.getContext("missing"), null);
}

{
  const harness = createHarness();
  const failure = Error("coordination failed");
  harness.coordination.waitResult = Promise.reject(failure);
  harness.owner.options.onAcceptedChange({ hostId: "h", threadId: "t", hasUnreadTurn: true, context: {} });
  await Promise.resolve();
  await Promise.resolve();
  equal(harness.state.loggerWarnings, [{
    message: "Failed to broadcast thread read state",
    fields: { safe: {}, sensitive: { error: failure } },
  }]);
}

{
  const harness = createHarness({ coordinationEnabled: false });
  equal(harness.state.coordinationInstances.length, 0);
  harness.owner.options.onAcceptedChange({ hostId: "h", threadId: "t", hasUnreadTurn: true, context: {} });
  await Promise.resolve();
  equal(harness.state.loggerWarnings.length, 0);
  harness.runtime.dispose();
  harness.runtime.dispose();
  equal(harness.owner.disposed, 1);
  equal(harness.state.principalEvents.length, 0);
  equal(harness.state.notifications.length, 0);
  equal(harness.state.connectionEvents.length, 0);
  equal(harness.state.sharedObjectEvents.length, 0);
}

{
  const harness = createHarness();
  harness.runtime.dispose();
  harness.runtime.dispose();
  equal(harness.owner.disposed, 1);
  equal(harness.coordination.disposed, 1);
  equal(harness.coordination.removedHandlers, 1);
  equal(harness.coordination.handlers.size, 0);
  equal(harness.state.principalEvents.length, 0);
  equal(harness.state.notifications.length, 0);
  equal(harness.state.connectionEvents.length, 0);
  equal(harness.state.sharedObjectEvents.length, 0);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createThreadReadStateRuntime({"), true);
equal(main.includes("function Ant("), false);
equal(main.includes("var Ant = createThreadReadStateRuntime({"), true);
equal(main.includes("ThreadReadStateOwner: Ont"), true);

console.log(`${assertions} main thread read-state runtime assertions passed`);
