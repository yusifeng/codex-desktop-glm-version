import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

globalThis.__cloudBackendTest = {
  fetch: async () => {
    throw new Error("unexpected fetch");
  },
  principalOfToken: () => null,
  supports: () => true,
};

const sharedStub = `
  import { z } from "zod";
  export const wf = z.object;
  export const Df = z.strictObject;
  export const Of = z.string;
  export const Cf = z.number;
  export const gf = z.boolean;
  export const hf = z.array;
  export const df = z.enum;
  export const bf = z.literal;
  export const vf = z.discriminatedUnion;
  export const xf = (shape) => z.object(shape).passthrough();
  export const jf = z.union;
  export const Mf = z.unknown;
  export const _s = "durable";
  export const _i = (token) => globalThis.__cloudBackendTest.principalOfToken(token);
  export const pr = { Open: 1 };
  export class Wn extends Error {}
  export const Wu = (...args) => globalThis.__cloudBackendTest.supports(...args);
  export class td { send(request) { return request; } }
  export const Ld = () => ({ default: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
`;

const cloudBuild = await build({
  entryPoints: [path.join(root, "src/main/main-app/app-server/cloud-backend.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  plugins: [{
    name: "cloud-backend-test-runtime",
    setup(builder) {
      builder.onResolve({ filter: /^@chunk\/shared$/ }, () => ({ path: "shared", namespace: "test-runtime" }));
      builder.onResolve({ filter: /^@chunk\/logger$/ }, () => ({ path: "logger", namespace: "test-runtime" }));
      builder.onResolve({ filter: /^@chunk\/bootstrap$/ }, () => ({ path: "bootstrap", namespace: "test-runtime" }));
      builder.onResolve({ filter: /^electron$/ }, () => ({ path: "electron", namespace: "test-runtime" }));
      builder.onLoad({ filter: /.*/, namespace: "test-runtime" }, ({ path: modulePath }) => ({
        loader: "js",
        resolveDir: root,
        contents: modulePath === "shared"
          ? sharedStub
          : modulePath === "logger"
            ? `export const createTaggedLogger = () => ({ warning() {} });`
            : modulePath === "bootstrap"
              ? `export const mt = (headers, token) => { headers.Authorization = \`Bearer \${token}\`; };`
              : `export const net = { fetch: (...args) => globalThis.__cloudBackendTest.fetch(...args) };`,
      }));
    },
  }],
});
const cloud = await import(
  `data:text/javascript;base64,${Buffer.from(cloudBuild.outputFiles[0].text).toString("base64")}`
);

equal(cloud.longLivedHostDescriptor({ ignored: true }), {
  id: "durable",
  display_name: "Long-lived",
  kind: "local",
  websocket_url: "wss://codex-cloud-backend.chatgpt.com/",
});
equal(cloud.requestInterceptor.constructor.name.length > 0, true);
equal(cloud.readOnlyRequestSchema.safeParse({
  id: 1,
  method: "thread/read",
  params: { threadId: "thread-1", includeTurns: false },
}).success, true);
equal(cloud.readOnlyRequestSchema.safeParse({
  id: 1,
  method: "thread/read",
  params: { threadId: "thread-1", includeTurns: true },
}).success, false);
equal(cloud.readOnlyRequestSchema.safeParse({
  id: "request-1",
  method: "thread/items/list",
  params: { threadId: "thread-1", turnId: "turn-1", sortDirection: "desc" },
}).success, true);
equal(cloud.readOnlyRequestSchema.safeParse({ id: 1, method: "thread/delete" }).success, false);

equal(cloud.composeEnablement({
  apps_mcp_path_override: true,
  auth_elicitation: false,
  tool_suggest: "invalid",
  ignored: true,
}, true, false, true, true), {
  memories: false,
  apps_mcp_path_override: true,
  auth_elicitation: false,
  mcp_2026_07_28: false,
  remote_plugin: true,
  background_paginated_rollout_migration: true,
  api_key_model_discovery: true,
});

{
  const client = new cloud.AppServerHttpClient(async () => null, {});
  await assert.rejects(() => client.fetch("/v2/models", { method: "GET" }), /authentication is required/);
  assertions += 1;
}

{
  const requests = [];
  globalThis.__cloudBackendTest.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200, json: async () => ({ data: [] }) };
  };
  const client = new cloud.AppServerHttpClient(async () => "token-1", {});
  await assert.rejects(() => client.fetch("//evil.example/path", { method: "GET" }), /path is unavailable/);
  assertions += 1;
  const result = await client.fetch("/v2/models", {
    method: "POST",
    body: "payload",
    trace: { traceparent: "trace-1", tracestate: "state-1" },
  });
  equal(result.token, "token-1");
  equal(requests[0].url, "https://codex-cloud-backend.chatgpt.com/v2/models");
  equal(requests[0].options.method, "POST");
  equal(requests[0].options.headers, {
    "Content-Type": "application/json",
    Authorization: "Bearer token-1",
    traceparent: "trace-1",
    tracestate: "state-1",
  });
  equal(requests[0].options.redirect, "error");
  equal(requests[0].options.cache, "no-store");
  equal(requests[0].options.body, "payload");
}

const principal = { accountId: "account-1", userId: "user-1" };
globalThis.__cloudBackendTest.principalOfToken = (token) => token === "token-1" ? principal : null;

{
  const fetched = [];
  const client = new cloud.AppServerHttpClient(async () => "token-1", {});
  client.fetch = async (requestPath, options) => {
    fetched.push({ requestPath, options });
    return {
      token: "token-1",
      response: { ok: true, status: 200, json: async () => ({ data: [{ id: 1 }], nextCursor: null }) },
    };
  };
  const transport = new cloud.HybridWebsocketHttpTransport({
    supportsReconnect: () => true,
    async connect() { throw new Error("not used"); },
  }, client);
  const response = await transport.readOverHttp({
    id: "request-1",
    method: "model/list",
    params: { cursor: "next", limit: 20, includeHidden: true },
  }, { authenticatedPrincipal: principal }, new AbortController().signal);
  equal(fetched[0].requestPath, "/v2/models?cursor=next&limit=20&includeHidden=true");
  equal(fetched[0].options.method, "GET");
  equal(response, { id: "request-1", result: { data: [{ id: 1 }], nextCursor: null } });

  client.fetch = async () => ({
    token: "token-1",
    response: { ok: false, status: 429, json: async () => ({ error: { code: 429, message: "slow down", data: { retry: 1 } } }) },
  });
  equal(await transport.readOverHttp({ id: 2, method: "model/list", params: {} }, { authenticatedPrincipal: principal }, new AbortController().signal), {
    id: 2,
    error: { code: 429, message: "slow down", data: { retry: 1 } },
  });

  client.fetch = async () => ({
    token: "token-1",
    response: { ok: true, status: 200, json: async () => ({ thread: { id: "thread/1", turns: [1], title: "Title" } }) },
  });
  equal(await transport.readOverHttp({ id: 3, method: "thread/read", params: { threadId: "thread/1" } }, { authenticatedPrincipal: principal }, new AbortController().signal), {
    id: 3,
    result: { thread: { id: "thread/1", turns: [], title: "Title" } },
  });

  globalThis.__cloudBackendTest.principalOfToken = () => ({ accountId: "other", userId: "user-1" });
  await assert.rejects(
    () => transport.readOverHttp({ id: 4, method: "model/list", params: {} }, { authenticatedPrincipal: principal }, new AbortController().signal),
    /account changed/,
  );
  assertions += 1;
  globalThis.__cloudBackendTest.principalOfToken = (token) => token === "token-1" ? principal : null;
}

{
  const sent = [];
  let inner;
  const client = new cloud.AppServerHttpClient(async () => "token-1", {});
  client.fetch = async () => ({
    token: "token-1",
    response: { ok: true, status: 200, json: async () => ({ data: [], nextCursor: null }) },
  });
  const transport = new cloud.HybridWebsocketHttpTransport({
    supportsReconnect: () => true,
    async connect() {
      inner = {
        authenticatedPrincipal: principal,
        readyState: 1,
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
        send: (value) => sent.push(value),
        close: () => {},
      };
      return inner;
    },
  }, client);
  equal(transport.supportsReconnect(), true);
  const socket = await transport.connect();
  socket.send(JSON.stringify({ id: 1, method: "thread/delete", params: {} }));
  equal(sent.length, 1);
  const messages = [];
  socket.onmessage = (event) => messages.push(
    event.data.startsWith(`{`) ? JSON.parse(event.data) : event.data,
  );
  socket.send(JSON.stringify({ id: 2, method: "model/list", params: {} }));
  await new Promise((resolve) => setImmediate(resolve));
  equal(messages, [{ id: 2, result: { data: [], nextCursor: null } }]);
  inner.onmessage({ data: "passthrough" });
  equal(messages.at(-1), "passthrough");
}

{
  let registryListener;
  let evaluationListener;
  let registryDisposed = 0;
  let evaluationDisposed = 0;
  let connectionDisposed = 0;
  const changed = [];
  const calls = [];
  const assignments = {
    defaultEnableFeatures: { apps_mcp_path_override: true },
    values: {
      experimentalFeatureGates: {
        curatedRemoteMarketplace: true,
        mcp20260728: true,
        codexAppsMcp20260728: true,
        backgroundPaginatedRolloutMigration: true,
        localThreadStoreCompression: true,
        apiKeyModelDiscovery: true,
      },
    },
  };
  const evaluations = {
    onDidChange(listener) { evaluationListener = listener; return () => { evaluationDisposed += 1; }; },
    async readExecutionAssignments() { return assignments; },
    readReadyExecutionAssignments() { return assignments; },
  };
  const registry = {
    subscribe(listener) { registryListener = listener; return () => { registryDisposed += 1; }; },
  };
  const connection = {
    hostId: "local",
    appServerVersion: "1.0.0",
    getConnectionState: () => "connected",
    registerInternalConnectionStateHandler() { return () => { connectionDisposed += 1; }; },
    async sendAppServerRequest(method, params, guard) {
      guard?.();
      calls.push({ method, params });
    },
  };
  const owner = new cloud.AppServerFeatureEnablement(registry, evaluations, (hostId) => changed.push(hostId));
  registryListener({ type: "added", hostId: "local", connection });
  await new Promise((resolve) => setImmediate(resolve));
  equal(calls[0].method, "rollout/compress");
  equal(calls[1].method, "experimentalFeature/enablement/set");
  equal(calls[1].params.enablement, {
    memories: false,
    apps_mcp_path_override: true,
    mcp_2026_07_28: true,
    remote_plugin: true,
    background_paginated_rollout_migration: true,
    api_key_model_discovery: true,
    codex_apps_mcp_2026_07_28: true,
    windows_sandbox_service: true,
  });
  equal(changed, ["local"]);
  evaluationListener();
  await new Promise((resolve) => setImmediate(resolve));
  equal(calls.filter(({ method }) => method === "rollout/compress").length, 1);
  registryListener({ type: "removed", hostId: "local", connection });
  equal(connectionDisposed, 1);
  owner.dispose();
  equal(registryDisposed, 1);
  equal(evaluationDisposed, 1);
}

{
  const handlers = new Map();
  const disposed = [];
  const bridgeCalls = [];
  const bridge = {
    registerBroadcastHandler(name, handler) {
      handlers.set(name, handler);
      return () => disposed.push(name);
    },
    threadStreamFollowingStatusRequested: (params) => bridgeCalls.push(["status", params]),
    threadStreamStateChanged: (params) => bridgeCalls.push(["state", params]),
    threadStreamFollowingChanged: (params) => bridgeCalls.push(["following", params]),
    setThreadOwnership: (params) => bridgeCalls.push(["ownership", params]),
  };
  const targetCalls = [];
  const stream = cloud.createThreadStreamBroadcastHandlers(bridge, (state) => ({ serialized: state }));
  const dispose = stream.register({
    onFollowingChanged: (...args) => targetCalls.push(["following", ...args]),
    onFollowingStatusRequested: (...args) => targetCalls.push(["status", ...args]),
    onStreamStateChanged: (...args) => targetCalls.push(["state", ...args]),
    onClientStatusChanged: (...args) => targetCalls.push(["client", ...args]),
    onConnectionReset: (...args) => targetCalls.push(["reset", ...args]),
  });
  handlers.get("thread-stream-following-changed")({
    params: { conversationId: "thread-1", hostId: "host-1", following: true },
    sourceClientId: "client-1",
  });
  handlers.get("thread-stream-following-status-requested")({
    params: { conversationId: "thread-1", hostId: "host-1" },
    sourceClientId: "client-2",
  });
  handlers.get("thread-stream-state-changed")({
    params: { conversationId: "thread-1", hostId: "host-1", change: { revision: 2 } },
    sourceClientId: "client-3",
  });
  handlers.get("client-status-changed")({ params: { online: true } });
  handlers.get("ipc-connection-reset")({});
  equal(targetCalls, [
    ["following", "thread-1", "host-1", "client-1", true],
    ["status", "thread-1", "host-1", "client-2"],
    ["state", "thread-1", "host-1", { revision: 2 }, "client-3"],
    ["client", { online: true }],
    ["reset"],
  ]);
  stream.requestFollowingStatus("thread-1", "host-1");
  stream.sendPatches("thread-1", "host-1", ["client-1"], 1, 2, [{ op: "replace" }], ["change-1"]);
  stream.sendSnapshot("thread-1", "host-1", undefined, 3, { turns: [] });
  stream.sendFollowingChanged("thread-1", "host-1", false, ["client-2"]);
  stream.setThreadOwnership("thread-1", "host-1", true);
  equal(bridgeCalls, [
    ["status", { conversationId: "thread-1", hostId: "host-1" }],
    ["state", {
      conversationId: "thread-1",
      hostId: "host-1",
      targetClientIds: ["client-1"],
      change: {
        type: "patches",
        baseRevision: 1,
        revision: 2,
        patches: [{ op: "replace" }],
        acceptedTextChanges: ["change-1"],
      },
    }],
    ["state", {
      conversationId: "thread-1",
      hostId: "host-1",
      targetClientIds: undefined,
      change: { type: "snapshot", revision: 3, conversationState: { serialized: { turns: [] } } },
    }],
    ["following", {
      conversationId: "thread-1",
      hostId: "host-1",
      following: false,
      targetClientIds: ["client-2"],
    }],
    ["ownership", { conversationId: "thread-1", hostId: "host-1", ownsThread: true }],
  ]);
  dispose();
  equal(disposed, [
    "thread-stream-following-changed",
    "thread-stream-following-status-requested",
    "thread-stream-state-changed",
    "client-status-changed",
    "ipc-connection-reset",
  ]);
}

const facadeBuild = await build({
  entryPoints: [path.join(root, "src/main/shared/zod-facade.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const facade = await import(
  `data:text/javascript;base64,${Buffer.from(facadeBuild.outputFiles[0].text).toString("base64")}`
);
equal(facade.Mf().safeParse({ nested: true }).success, true);
equal(facade.If().safeParse("2026-11-01").success, true);
equal(facade.If().safeParse("2026-11-01T12:00:00Z").success, false);
equal(facade.Lf({ offset: true }).safeParse("2026-11-01T12:00:00+08:00").success, true);
equal(facade.gf().safeParse(true).success, true);
equal(facade.gf().safeParse("true").success, false);
equal(facade.Pf().safeParse("550e8400-e29b-41d4-a716-446655440000").success, true);
equal(facade.Nf().safeParse("https://example.com/path").success, true);
equal(facade.Ef(facade.Of(), facade.Cf()).safeParse({ one: 1 }).success, true);
equal(facade.hf(facade.Of()).safeParse(["one", "two"]).success, true);
equal(facade.Af([facade.Of(), facade.Cf()]).safeParse(["one", 2]).success, true);
equal(facade.Df({ name: facade.Of() }).safeParse({ name: "one", extra: true }).success, false);
equal(facade.xf({ name: facade.Of() }).parse({ name: "one", extra: true }), { name: "one", extra: true });
equal(facade.vf("type", [
  facade.wf({ type: facade.bf("one"), value: facade.Of() }),
  facade.wf({ type: facade.bf("two"), value: facade.Cf() }),
]).safeParse({ type: "two", value: 2 }).success, true);
equal(facade.mf().safeParse(undefined).success, true);
equal(facade.mf().safeParse(null).success, false);
equal(facade.pf().safeParse(null).success, true);
equal(facade.Sf().safeParse(undefined).success, false);
equal(facade.yf().safeParse({ nested: [1, true, null] }).success, true);
equal(facade.yf().safeParse(undefined).success, false);
equal(facade.if().parse("42"), 42);
equal(facade.rf.object({ enabled: facade.rf.boolean() }).parse({ enabled: true }), { enabled: true });
equal(facade.Tf((value) => Number(value), facade.Cf()).parse("7"), 7);
equal(facade._f((value) => value === "ok").safeParse("ok").success, true);
equal(facade.ff(Date).safeParse(new Date()).success, true);
equal(facade.Of().optional() instanceof facade.lf, true);
equal(facade.Of().nullable() instanceof facade.sf, true);
equal(facade.Of().default("value") instanceof facade.of, true);
equal(facade.hf(facade.Of()) instanceof facade.af, true);
equal(facade.wf({}) instanceof facade.cf, true);
equal(facade.Ef(facade.Of(), facade.Of()) instanceof facade.uf, true);
equal(facade.Rf(facade.Df({ name: facade.Of(), count: facade.Cf().optional() })), {
  type: "object",
  properties: {
    name: { type: "string" },
    count: { type: "number" },
  },
  required: ["name"],
  additionalProperties: false,
});

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
const statsig = fs.readFileSync(path.join(root, "src/main/main-app/account/statsig-adapter.ts"), "utf8");
const windowContext = fs.readFileSync(path.join(root, "src/main/main-app/window/window-context.ts"), "utf8");
const messageHandler = fs.readFileSync(path.join(root, "src/main/main-app/window/electron-message-handler.ts"), "utf8");
equal(main.includes('require("./main-app/app-server/cloud-backend.js")'), true);
equal(main.includes("configureStatsigAdapterRuntime({"), true);
equal(statsig.includes("@main-vendor/statsig"), false);
equal(statsig.includes("mf as undefinedSchema"), true);
equal(statsig.includes("nullSchema"), false);
equal(main.includes("new AppServerHttpClient(getAuthToken, options)"), true);
equal(main.includes("AuthenticatedTransport: HybridWebsocketHttpTransport"), true);
equal(main.includes("AppServerFeatureEnablement,"), true);
equal(main.includes("requestInterceptor,"), true);
equal(windowContext.includes("new AppServerFeatureEnablement("), true);
equal(windowContext.includes("longLivedHostDescriptor({"), true);
equal(messageHandler.includes("requestInterceptor.send(t.request)"), true);
for (const oldOwner of ["var lEe =", "function OT(", "var kT = class", "hEe = class", "function _Ee(", "var vEe = class"]) {
  equal(main.includes(oldOwner), false);
}
for (const oldStatsigOwner of ["Xw = {", "Zw =", "function hTe(", "function xTe(", "function tT("]) {
  equal(main.includes(oldStatsigOwner), false);
}

console.log(`${assertions} main cloud backend runtime assertions passed`);
