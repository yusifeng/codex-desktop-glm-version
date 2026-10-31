import assert from "node:assert/strict";
import fs from "node:fs";
import { createAppServerTransportFactory } from "../src/main/main-app/app-server/transport-factory.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

function constructor(kind) {
  return class {
    constructor(...args) {
      this.kind = kind;
      this.args = args;
      this.options = args[0];
    }
  };
}

function createHarness() {
  const state = {
    info: [],
    warnings: [],
    caCalls: [],
    overrideCalls: [],
  };
  const factory = createAppServerTransportFactory({
    isRemoteControlHostConfig: (hostConfig) => hostConfig.kind === "remote-control",
    isWslHostConfig: (hostConfig) => hostConfig.kind === "wsl",
    resolveSshWebsocketConfig: (hostConfig) => hostConfig.sshWebsocket ?? null,
    SshWebsocketTransport: constructor("ssh-websocket"),
    RemoteControlTransport: constructor("remote-control"),
    isRemoteStdioHostConfig: (hostConfig) => hostConfig.remoteStdio === true,
    RemoteStdioTransport: constructor("remote-stdio"),
    resolveWebsocketUrl: (hostConfig) => hostConfig.websocketUrl ?? null,
    isCloudHostId: (hostId) => hostId.startsWith("cloud-"),
    accountIdFromToken: (token) => token.accountId,
    authenticatedPrincipalFromToken: (token) => ({ accountId: token.accountId, userId: token.userId }),
    protocolsForToken: (token) => ["authorization", token.value],
    resolveSocksProxyUrl: (hostConfig, websocketUrl) =>
      hostConfig.proxy ? `socks5://${hostConfig.proxy}?target=${websocketUrl}` : null,
    getCACertificates(store) {
      state.caCalls.push(store);
      if (state.caError) throw state.caError;
      return store === "default" ? ["default-ca"] : ["system-ca"];
    },
    WebsocketTransport: constructor("websocket"),
    AuthenticatedTransport: constructor("authenticated"),
    DesktopApiTokenClient: constructor("token-client"),
    LocalStdioTransport: constructor("local-stdio"),
    async getConfigOverrides(options) {
      state.overrideCalls.push(options);
      return new Set(["one", "two"]);
    },
    logger: {
      info: (message, fields) => state.info.push({ message, fields }),
      warning: (message, fields) => state.warnings.push({ message, fields }),
    },
  });
  const baseOptions = {
    transportKind: "standard",
    hostConfig: { kind: "local", id: "local" },
    repoRoot: "/repo",
    resourcesPath: "/resources",
    defaultOriginator: "desktop",
    desktopApiOptions: { endpoint: "api" },
    globalState: { state: true },
    getSshConnectTimeoutSeconds: () => 12,
  };
  return { ...factory, state, baseOptions };
}

{
  const harness = createHarness();
  equal(harness.hostKindForConfig({ kind: "remote-control" }), "remote-control");
  equal(harness.hostKindForConfig({ kind: "wsl" }), "wsl");
  equal(harness.hostKindForConfig({ kind: "ssh" }), "ssh");
}

{
  const harness = createHarness();
  const timeout = () => 42;
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    transportKind: "remote-control",
    hostConfig: {
      kind: "remote-control",
      id: "ssh-ws",
      sshWebsocket: { command: "ssh", port: 1234 },
    },
    getSshConnectTimeoutSeconds: timeout,
  });
  equal(transport.kind, "ssh-websocket", "SSH websocket configuration has highest precedence");
  equal(transport.options, { command: "ssh", port: 1234, getConnectTimeoutSeconds: timeout });
  equal(harness.state.info, [{
    message: "[ssh-websocket-v0] selected app-server transport",
    fields: { safe: { hostId: "ssh-ws" } },
  }]);
}

{
  const harness = createHarness();
  const appServerClient = { client: true };
  const deviceKeyClient = { device: true };
  const authorize = () => {};
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    transportKind: "remote-control",
    hostConfig: { kind: "remote-control", id: "remote" },
    desktopAuthAppServerClient: appServerClient,
    remoteControlDeviceKeyClient: deviceKeyClient,
    onEnrollmentAuthorizationRequired: authorize,
  });
  equal(transport.kind, "remote-control");
  equal(transport.options, {
    hostConfig: { kind: "remote-control", id: "remote" },
    appServerClient,
    deviceKeyClient,
    desktopApiOptions: { endpoint: "api" },
    globalState: { state: true },
    onEnrollmentAuthorizationRequired: authorize,
  });
}

{
  const harness = createHarness();
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    hostConfig: { kind: "ssh", id: "stdio", remoteStdio: true },
  });
  equal(transport.kind, "remote-stdio");
  equal(transport.options, {
    hostConfig: { kind: "ssh", id: "stdio", remoteStdio: true },
    repoRoot: "/repo",
    resourcesPath: "/resources",
    defaultOriginator: "desktop",
  });
}

{
  const harness = createHarness();
  const hostConfig = {
    kind: "ssh",
    id: "remote",
    websocketUrl: "ws://remote/app-server",
    proxy: "127.0.0.1:1080",
  };
  const transport = harness.createAppServerTransport({ ...harness.baseOptions, hostConfig });
  equal(transport.kind, "websocket");
  equal(transport.options.hostConfig, hostConfig);
  equal(transport.options.websocketUrl, "ws://remote/app-server");
  equal(transport.options.socksProxyUrl, "socks5://127.0.0.1:1080?target=ws://remote/app-server");
  equal(transport.options.ca, undefined);
  equal(transport.options.getWebsocketHandshake, undefined);
  equal(harness.state.caCalls, []);
}

{
  const harness = createHarness();
  const tokenCalls = [];
  const desktopAuthAppServerClient = {
    async getAuthToken(options) {
      tokenCalls.push(options);
      return { value: "secret", accountId: "account", userId: "user" };
    },
  };
  const hostConfig = { kind: "cloud", id: "cloud-durable", websocketUrl: "wss://cloud/ws" };
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    hostConfig,
    desktopAuthAppServerClient,
  });
  equal(transport.kind, "authenticated");
  const websocket = transport.args[0];
  const tokenClient = transport.args[1];
  equal(websocket.kind, "websocket");
  equal(websocket.options.ca, ["default-ca", "system-ca"]);
  equal(harness.state.caCalls, ["default", "system"]);
  equal(websocket.options.socksProxyUrl, undefined);
  equal(await websocket.options.getWebsocketHandshake(), {
    authenticatedPrincipal: { accountId: "account", userId: "user" },
    headers: { "ChatGPT-Account-Id": "account" },
    protocols: ["authorization", "secret"],
  });
  equal(tokenClient.kind, "token-client");
  equal(tokenClient.args[1], { endpoint: "api" });
  equal(await tokenClient.args[0](), { value: "secret", accountId: "account", userId: "user" });
  equal(tokenCalls, [{ refreshToken: false }, { refreshToken: false }]);
}

{
  const harness = createHarness();
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    hostConfig: { kind: "cloud", id: "cloud-no-account", websocketUrl: "wss://cloud/ws" },
    desktopAuthAppServerClient: {
      getAuthToken: async () => ({ value: "secret", accountId: null, userId: "user" }),
    },
  });
  const handshake = await transport.args[0].options.getWebsocketHandshake();
  equal(handshake.headers, undefined);
}

{
  const harness = createHarness();
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    hostConfig: { kind: "cloud", id: "cloud-missing-token", websocketUrl: "wss://cloud/ws" },
    desktopAuthAppServerClient: { getAuthToken: async () => null },
  });
  await assert.rejects(
    transport.args[0].options.getWebsocketHandshake(),
    /Sign in to ChatGPT to start a durable thread/,
  );
  assertions += 1;
}

{
  const harness = createHarness();
  const failure = Error("certificate store unavailable");
  harness.state.caError = failure;
  const transport = harness.createAppServerTransport({
    ...harness.baseOptions,
    hostConfig: { kind: "cloud", id: "cloud-public", websocketUrl: "wss://cloud/ws" },
  });
  equal(transport.kind, "websocket");
  equal(transport.options.ca, undefined);
  equal(harness.state.caCalls, ["default"]);
  equal(harness.state.warnings, [{
    message: "Failed to load CA certificates for cloud WebSocket",
    fields: { safe: {}, sensitive: { error: failure } },
  }]);
}

{
  const harness = createHarness();
  const options = { ...harness.baseOptions, extra: "preserved" };
  const transport = harness.createAppServerTransport(options);
  equal(transport.kind, "local-stdio");
  equal(transport.options.hostConfig, options.hostConfig);
  equal(transport.options.repoRoot, "/repo");
  equal(transport.options.resourcesPath, "/resources");
  equal(transport.options.defaultOriginator, "desktop");
  equal(await transport.options.getConfigOverrides(), ["one", "two"]);
  equal(harness.state.overrideCalls, [options]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createAppServerTransportFactory({"), true);
equal(main.includes("function trt("), false);
equal(main.includes("function K5("), false);
equal(windowContext.match(/d = K5\(\{/g)?.length, 2);
equal(windowContext.includes("attachSource(M5(e.hostId, trt(e), n))"), true);

console.log(`${assertions} main app-server transport factory assertions passed`);
