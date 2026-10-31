import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/language-server/session-runtime.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createLanguageServerSessionRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

class ResponseError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
class CancellationTokenSource {
  static instances = [];
  constructor() {
    this.token = { owner: this };
    this.cancelled = false;
    this.disposed = false;
    CancellationTokenSource.instances.push(this);
  }
  cancel() { this.cancelled = true; }
  dispose() { this.disposed = true; }
}
const request = (method) => ({ method, type: method });
const notification = (type) => ({ type });
let nextConnection;
const protocol = {
  ApplyWorkspaceEditRequest: request("workspace/applyEdit"),
  CancellationTokenSource,
  ConfigurationRequest: request("workspace/configuration"),
  DefinitionRequest: request("textDocument/definition"),
  DidChangeConfigurationNotification: notification("workspace/didChangeConfiguration"),
  DidChangeTextDocumentNotification: notification("textDocument/didChange"),
  DidCloseTextDocumentNotification: notification("textDocument/didClose"),
  DidOpenTextDocumentNotification: notification("textDocument/didOpen"),
  HoverRequest: request("textDocument/hover"),
  ImplementationRequest: request("textDocument/implementation"),
  InitializeRequest: request("initialize"),
  InitializedNotification: notification("initialized"),
  LSPErrorCodes: { ContentModified: -32801 },
  ReferencesRequest: request("textDocument/references"),
  RegistrationRequest: request("client/registerCapability"),
  ResponseError,
  TypeDefinitionRequest: request("textDocument/typeDefinition"),
  UnregistrationRequest: request("client/unregisterCapability"),
  WorkDoneProgressCreateRequest: request("window/workDoneProgress/create"),
  WorkspaceFoldersRequest: request("workspace/workspaceFolders"),
  createProtocolConnection() { return nextConnection; },
};

class RpcHandlerBase {}
const providerClasses = Object.fromEntries(
  [
    "JavaLanguageServerProvider",
    "KotlinLanguageServerProvider",
    "PyrightLanguageServerProvider",
    "RustAnalyzerProvider",
    "SourceKitLanguageServerProvider",
    "TypeScriptLanguageServerProvider",
  ].map((name) => [name, class {
    constructor(dataRoot) {
      this.dataRoot = dataRoot;
      this.id = name;
      this.languageIds = [name];
    }
  }]),
);
const loggerTags = [];
const baseDependencies = {
  LanguageServerManager: class {},
  RpcHandlerBase,
  createLogger(tag) {
    loggerTags.push(tag);
    return () => ({ debug() {}, info() {}, warning() {} });
  },
  filePathToUri: (value) => `file://${value}`,
  messageTransport: {
    StreamMessageReader: class { constructor(value) { this.value = value; } },
    StreamMessageWriter: class { constructor(value) { this.value = value; } },
  },
  normalizeHover: (value, position) => ({ value, position }),
  path,
  protocol,
  providerClasses,
  randomUUID: () => "session-id",
  resolveCapabilities: (value) => ({ projected: value }),
  resolveLocations: (value) => [{ projected: value }],
  stream: {
    Readable: { from: (value) => value },
    Writable: { fromWeb: (value) => value },
  },
};
const runtime = createLanguageServerSessionRuntime(baseDependencies);

const requestCalls = [];
let retryAttempt = 0;
const retryConnection = {
  async sendRequest(method, params, token) {
    requestCalls.push({ method, params, token });
    retryAttempt += 1;
    if (retryAttempt === 1)
      throw new ResponseError(protocol.LSPErrorCodes.ContentModified, "changed");
    return { ok: true };
  },
};
equal(
  await runtime.requestWithTimeout(retryConnection, protocol.HoverRequest.method, { line: 1 }),
  { ok: true },
  "content-modified requests retry once",
);
equal(requestCalls.length, 2, "retryable request is issued exactly twice");
equal(CancellationTokenSource.instances.slice(-2).every(({ disposed }) => disposed), true, "request cancellation owners are disposed");

let nonRetryCalls = 0;
await assert.rejects(
  runtime.requestWithTimeout({
    async sendRequest() {
      nonRetryCalls += 1;
      throw new ResponseError(protocol.LSPErrorCodes.ContentModified, "changed");
    },
  }, "custom/request", {}),
  /changed/,
);
assertions += 1;
equal(nonRetryCalls, 1, "non-idempotent requests are not retried");

const notifications = [];
const stopReasons = [];
let killed = 0;
let disposedConnections = 0;
let resolveProcess;
const processWait = new Promise((resolve) => { resolveProcess = resolve; });
const sessionConnection = {
  dispose() { disposedConnections += 1; },
  async sendNotification(type, params) { notifications.push({ type, params }); },
  async sendRequest(method, params) { return { method, params }; },
};
const processHandle = {
  kill() { killed += 1; },
  wait() { return processWait; },
};
const session = new runtime.LanguageServerSession(
  sessionConnection,
  processHandle,
  path.posix,
  { hover: true, locationKinds: ["definition"] },
  (reason) => stopReasons.push(reason),
);
const documentA = { contents: "one", languageId: "typescript", path: "/repo/a.ts" };
await session.syncDocument(documentA);
equal(notifications.at(-1), {
  type: "textDocument/didOpen",
  params: { textDocument: { languageId: "typescript", text: "one", uri: "file:///repo/a.ts", version: 1 } },
}, "first document synchronization opens version one");
const unchangedCount = notifications.length;
await session.syncDocument(documentA);
equal(notifications.length, unchangedCount, "unchanged document contents are not resent");
await session.syncDocument({ ...documentA, contents: "two" });
equal(notifications.at(-1), {
  type: "textDocument/didChange",
  params: { contentChanges: [{ text: "two" }], textDocument: { uri: "file:///repo/a.ts", version: 2 } },
}, "changed contents increment the document version");
await session.syncDocument({ contents: "other", languageId: "typescript", path: "/repo/b.ts" });
equal(notifications.slice(-2).map(({ type }) => type), ["textDocument/didClose", "textDocument/didOpen"], "switching documents closes before opening");
equal(session.fileUri("/repo/c.ts"), "file:///repo/c.ts", "session projects file paths to URIs");
equal(session.getLocations("location"), [{ projected: "location" }], "session projects protocol locations");
session.dispose();
equal(killed, 1, "explicit disposal kills the owned process");
equal(disposedConnections, 1, "explicit disposal closes the protocol connection");
equal(stopReasons, [{ reason: "disposed" }], "explicit disposal reports its reason once");
session.dispose();
equal(killed, 1, "session disposal is idempotent");
resolveProcess({ code: 0, signal: null });
await Promise.resolve();
equal(stopReasons.length, 1, "late process exit cannot dispose a stopped session twice");

function createConnection({ initializeError } = {}) {
  const handlers = new Map();
  const sent = [];
  let disposed = 0;
  let listened = 0;
  return {
    handlers,
    sent,
    get disposed() { return disposed; },
    get listened() { return listened; },
    dispose() { disposed += 1; },
    listen() { listened += 1; },
    onRequest(type, handler) { handlers.set(type, handler); },
    async sendNotification(type, params) { sent.push({ kind: "notification", type, params }); },
    async sendRequest(method, params) {
      sent.push({ kind: "request", method, params });
      if (initializeError != null) throw initializeError;
      return { capabilities: { hoverProvider: true } };
    },
  };
}
function emptyStream() {
  return new ReadableStream({ start(controller) { controller.close(); } });
}
const spawnCalls = [];
let startProcessResolve;
const startProcessWait = new Promise((resolve) => { startProcessResolve = resolve; });
const startProcess = {
  stderr: emptyStream(),
  stdin: {},
  stdout: {},
  killed: 0,
  kill() { this.killed += 1; },
  wait() { return startProcessWait; },
};
const startHost = {
  async spawn(options) { spawnCalls.push(options); return startProcess; },
};
const provider = {
  id: "typescript",
  workspaceConfiguration: { typescript: { enabled: true } },
  async findCommand(context) {
    equal(context.sessionId, "session-id", "provider receives an isolated session identity");
    return ["server", "--stdio"];
  },
  async findSessionOptions() {
    return {
      env: { SAFE: "1" },
      initializationOptions: { feature: true },
      languageServerWorkspaceRoot: "/server-workspace",
    };
  },
};
nextConnection = createConnection();
const startResult = await runtime.startLanguageServerSession(
  { host: startHost },
  provider,
  "/repo",
  path.posix,
  "repo",
  () => "/runtime",
  () => {},
);
equal(startResult.status, "started", "successful initialization returns a live session");
equal(spawnCalls[0], {
  args: ["server", "--stdio"],
  cwd: "/server-workspace",
  env: { SAFE: "1" },
  killProcessTree: true,
  outputBytesCap: null,
}, "language-server process keeps command, cwd, environment, and tree ownership");
equal(nextConnection.listened, 1, "protocol connection starts listening before initialize");
equal(nextConnection.handlers.get("workspace/workspaceFolders")(), [{ name: "repo", uri: "file:///server-workspace" }], "workspace-folder request is served");
equal(nextConnection.handlers.get("workspace/configuration")({ items: [{ section: "typescript" }, {}] }), [{ enabled: true }, null], "configuration requests are section-scoped");
equal(nextConnection.handlers.get("workspace/applyEdit")(), {
  applied: false,
  failureReason: "The Codex file viewer is read-only",
}, "server workspace edits remain read-only");
const initializeRequest = nextConnection.sent.find(({ kind }) => kind === "request");
equal(initializeRequest.params.initializationOptions, {
  feature: true,
  settings: { typescript: { enabled: true } },
}, "provider settings merge into initialization options");
equal(initializeRequest.params.capabilities.general.positionEncodings, ["utf-16"], "client advertises the preserved position encoding");
equal(nextConnection.sent.slice(-2).map(({ type }) => type), ["initialized", "workspace/didChangeConfiguration"], "initialization notifications preserve order");
equal(startResult.session.capabilities, { projected: { hoverProvider: true } }, "server capabilities are normalized");
startResult.session.dispose();
startProcessResolve({ code: 0, signal: null });

const initializationFailure = new Error("initialize failed");
nextConnection = createConnection({ initializeError: initializationFailure });
const expiredProcess = {
  stderr: emptyStream(), stdin: {}, stdout: {}, killed: 0,
  kill() { this.killed += 1; },
  async wait() { return { code: 7, signal: null }; },
};
const classificationCalls = [];
const classified = await runtime.startLanguageServerSession(
  { host: { async spawn() { return expiredProcess; } } },
  {
    async findCommand() { return ["kotlin-lsp"]; },
    async classifyProcessExit(context, command, exit) {
      classificationCalls.push({ context, command, exit });
      return { status: "expired-build", localRuntimeId: "kotlin" };
    },
  },
  "/repo",
  path.posix,
  "repo",
  () => "/runtime",
  () => {},
);
equal(classified, { status: "expired-build", localRuntimeId: "kotlin" }, "failed initialization delegates exit classification");
equal(nextConnection.disposed, 1, "failed initialization disposes its protocol connection");
equal(expiredProcess.killed, 0, "already-exited classified processes are not killed again");
equal(classificationCalls[0].exit, { code: 7, signal: null }, "provider receives the actual process exit");

let managerInstance;
class StubLanguageServerManager {
  constructor(providers, options) {
    this.providers = providers;
    this.options = options;
    this.disposed = 0;
    managerInstance = this;
  }
  async capabilities(value) { return { operation: "capabilities", value }; }
  async locations(value) { return [{ operation: "locations", value }]; }
  async hover(value) { return { operation: "hover", value }; }
  dispose() { this.disposed += 1; }
}
const rpcRuntime = createLanguageServerSessionRuntime({
  ...baseDependencies,
  LanguageServerManager: StubLanguageServerManager,
});
const expiredIds = [];
const updateIds = [];
const executionHost = { id: "host" };
const rpc = new rpcRuntime.LanguageServerRpcHandler(
  (hostId) => {
    if (hostId === "missing") throw new Error("missing");
    return executionHost;
  },
  "/data/language-servers",
  { getRoot: () => "/runtime", markExpired: (id) => expiredIds.push(id) },
  (id) => updateIds.push(id),
);
equal(managerInstance.providers.map(({ id }) => id), [
  "TypeScriptLanguageServerProvider",
  "PyrightLanguageServerProvider",
  "JavaLanguageServerProvider",
  "KotlinLanguageServerProvider",
  "RustAnalyzerProvider",
  "SourceKitLanguageServerProvider",
], "RPC owner constructs the six providers in runtime priority order");
equal(managerInstance.providers[2].dataRoot, path.join("/data/language-servers", "java"), "Java data root uses platform path joining");
equal(managerInstance.providers[3].dataRoot, path.join("/data/language-servers", "kotlin"), "Kotlin data root uses platform path joining");
equal(loggerTags.at(-1), "language-server-manager", "RPC owner injects the global logger factory without shadowing");
managerInstance.options.markLocalRuntimeExpired("rust");
managerInstance.options.onLocalRuntimeExpired("rust");
equal(expiredIds, ["rust"], "runtime expiry reaches the runtime manager");
equal(updateIds, ["rust"], "runtime expiry triggers the updater callback");
equal(await rpc.capabilities({ hostId: "local", languageId: "typescript" }), {
  operation: "capabilities",
  value: { languageId: "typescript", host: executionHost },
}, "capabilities RPC injects the resolved host");
equal(await rpc.locations({ hostId: "missing" }), [], "missing-host locations return the stable empty shape");
equal(await rpc.hover({ hostId: "missing" }), null, "missing-host hover returns the stable null shape");
rpc.dispose();
equal(managerInstance.disposed, 1, "RPC disposal owns manager disposal");

ok(assertions >= 40, "session owner has broad lifecycle coverage");
console.log(`${assertions} main language-server session owner assertions passed`);
