import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

const ownerSource = fs.readFileSync(
  new URL("../src/main/main-app/account/account-inputs-owner.ts", import.meta.url),
  "utf8",
);
const ownerModule = await transform(ownerSource, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const { createAccountInputsOwnerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(ownerModule.code).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

class RpcHandlerBase {}
class DisposableBag {
  values = [];
  add(value) { this.values.push(value); }
  dispose() {
    for (const value of this.values.splice(0)) {
      if (typeof value === "function") value();
      else value?.dispose?.();
      value?.[Symbol.dispose]?.();
    }
  }
}
class UnsubscribeHandle {
  constructor(cleanup) { this.cleanup = cleanup; }
  unsubscribe() {
    const cleanup = this.cleanup;
    this.cleanup = null;
    cleanup?.();
  }
  [Symbol.dispose]() { this.unsubscribe(); }
}

const queryClients = [];
class QueryClient {
  states = new Map();
  cancelCalls = [];
  invalidateCalls = [];
  fetchCalls = [];
  clearCount = 0;
  constructor(options) {
    this.options = options;
    queryClients.push(this);
  }
  key(queryKey) { return JSON.stringify(queryKey); }
  async cancelQueries({ queryKey }) { this.cancelCalls.push(queryKey); }
  async invalidateQueries({ queryKey }) {
    this.invalidateCalls.push(queryKey);
    for (const [key, state] of this.states) {
      if (key.startsWith(JSON.stringify(queryKey).slice(0, -1))) state.isInvalidated = true;
    }
  }
  async fetchQuery(options) {
    const key = this.key(options.queryKey);
    const existing = this.states.get(key);
    if (existing && !existing.isInvalidated) return existing.data;
    this.fetchCalls.push(options);
    const data = await options.queryFn({ signal: new AbortController().signal });
    this.states.set(key, { data, isInvalidated: false });
    return data;
  }
  getQueryState(queryKey) { return this.states.get(this.key(queryKey)); }
  clear() { this.clearCount += 1; this.states.clear(); }
}

const stringSchema = {
  parse(value) {
    if (typeof value !== "string") throw new Error("Expected string");
    return value;
  },
  safeParse(value) {
    return typeof value === "string" ? { success: true, data: value } : { success: false };
  },
};
const passthroughSchema = { parse: (value) => value, safeParse: (value) => ({ success: true, data: value }) };
const sourceOptions = ["account-info", "accounts-check", "workspace-settings"];
const sourceSchema = {
  options: sourceOptions,
  parse(value) {
    if (!sourceOptions.includes(value)) throw new Error("Unknown account input source");
    return value;
  },
  safeParse(value) {
    return sourceOptions.includes(value) ? { success: true, data: value } : { success: false };
  },
};
class AuthenticatedDesktopFetchError extends Error {
  constructor(message, status, errorCode) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

let registrySubscriber;
let connectionCleanupCount = 0;
const connectionHandlers = {};
const connection = {
  registerInternalAuthenticatedPrincipalChangeHandler(callback) {
    connectionHandlers.principal = callback;
    return () => { connectionCleanupCount += 1; };
  },
  registerInternalNotificationHandler(callback) {
    connectionHandlers.notification = callback;
    return () => { connectionCleanupCount += 1; };
  },
  registerInternalConnectionStateHandler(callback) {
    connectionHandlers.state = callback;
    return () => { connectionCleanupCount += 1; };
  },
};
let activeConnection = connection;
const registry = {
  subscribe(callback) {
    registrySubscriber = callback;
    return () => { registrySubscriber = null; };
  },
  getMaybeConnection() { return activeConnection; },
};
let identityContext = {
  executionHostKey: "execution-1",
  identity: { kind: "chatgpt", accountId: "account-1", userId: "user-1" },
};
const fetchCalls = [];
let fetchFailure = null;
const notifications = [];
let brokenCallback;
let streamDisposed = 0;
let callDisposed = 0;
function subscription(event) {
  notifications.push(event);
  const call = Promise.resolve();
  call[Symbol.dispose] = () => { callDisposed += 1; };
  return call;
}
subscription.dup = () => subscription;
subscription.onRpcBroken = (callback) => { brokenCallback = callback; };
subscription[Symbol.dispose] = () => { streamDisposed += 1; };

const AccountInputsOwner = createAccountInputsOwnerClass({
  RpcHandlerBase,
  DisposableBag,
  QueryClient,
  UnsubscribeHandle,
  stringSchema,
  requestProfileSchema: passthroughSchema,
  publishChatGptProfileSchema: passthroughSchema,
  accountsCheckSchema: passthroughSchema,
  workspaceSettingsSchema: passthroughSchema,
  sourceSchema,
  localHostId: "local",
  raceWithAbortSignal: async (promise) => promise,
  readAccountInfo: async () => ({ accountId: "account-1" }),
  identitiesEqual: (left, right) =>
    left.kind === right.kind && left.accountId === right.accountId && left.userId === right.userId,
  AuthenticatedDesktopFetchError,
});

const owner = new AccountInputsOwner(
  registry,
  connection,
  async () => identityContext,
  async (path, options) => {
    fetchCalls.push([path, options.requestProfile]);
    if (fetchFailure) throw fetchFailure;
    return { path, profile: options.requestProfile };
  },
);
equal(owner instanceof RpcHandlerBase, true);
equal(queryClients.length, 1);
equal(queryClients[0].options.defaultOptions.queries, {
  retry: false,
  gcTime: 60_000,
  structuralSharing: false,
});

equal(await owner.readAccountInfo(), { status: "ready", data: { accountId: "account-1" } });
equal(queryClients[0].fetchCalls.length, 1);
equal(await owner.readAccountInfo(), { status: "ready", data: { accountId: "account-1" } });
equal(queryClients[0].fetchCalls.length, 1);
equal(await owner.readAccountInfo(true), { status: "ready", data: { accountId: "account-1" } });
equal(queryClients[0].invalidateCalls.length, 1);
equal(queryClients[0].fetchCalls.length, 2);

equal(await owner.readAccounts("en-US"), {
  status: "ready",
  data: { path: "/wham/accounts/check", profile: { kind: "codex", language: "en-US" } },
});
equal(fetchCalls.at(-1), ["/wham/accounts/check", { kind: "codex", language: "en-US" }]);
equal(await owner.readWorkspaceSettings({ accountId: "a/b", profile: { kind: "chatgpt-native" } }), {
  status: "ready",
  data: {
    path: "/accounts/a%2Fb/settings",
    profile: { kind: "chatgpt-native" },
  },
});

identityContext = { executionHostKey: "execution-1", identity: { kind: "api-key" } };
equal(await owner.readAccounts("en-US", true), {
  status: "unavailable",
  reason: "unsupported-auth",
});
identityContext = {
  executionHostKey: "execution-1",
  identity: { kind: "chatgpt", accountId: "account-1", userId: "user-1" },
};
fetchFailure = new AuthenticatedDesktopFetchError("denied", 403, "workspace_denied");
equal(await owner.readWorkspaceSettings({ accountId: "account-2", profile: {} }, true), {
  status: "error",
  message: "denied",
  httpStatus: 403,
  errorCode: "workspace_denied",
});
fetchFailure = null;

equal(await owner.publishChatGptRequestProfile({
  accountId: "account-1",
  userId: "user-1",
  profile: { kind: "chatgpt-native" },
}), true);
equal(owner.getChatGptReadInputs(identityContext.identity)?.connection, connection);
equal(owner.getChatGptReadInputs(identityContext.identity)?.profile, { kind: "chatgpt-native" });
equal(owner.getChatGptReadInputs({ ...identityContext.identity, userId: "other" }), null);
equal(await owner.publishChatGptRequestProfile({
  accountId: "other",
  userId: "user-1",
  profile: {},
}), false);

const handle = await owner.subscribe(subscription);
await owner.invalidateWorkspaceSettings("account-1");
await Promise.resolve();
equal(queryClients[0].cancelCalls.at(-1), ["workspace-settings", "account-1"]);
equal(notifications.at(-1), {
  type: "query",
  source: "workspace-settings",
  accountId: "account-1",
});
equal(callDisposed, 1);
owner.invalidateQueryCache(["accounts", "settings", "account-2"]);
await new Promise((resolve) => setImmediate(resolve));
equal(queryClients[0].cancelCalls.at(-1), ["workspace-settings", "account-2"]);
owner.invalidateQueryCache(["accounts"]);
await new Promise((resolve) => setImmediate(resolve));
equal(queryClients[0].cancelCalls.some((key) => key[0] === "accounts-check"), true);

registrySubscriber({ hostId: "remote", type: "added", connection });
equal(queryClients[0].clearCount, 0);
registrySubscriber({ hostId: "local", type: "added", connection });
await Promise.resolve();
equal(queryClients[0].clearCount, 1);
equal(typeof connectionHandlers.principal, "function");
equal(typeof connectionHandlers.notification, "function");
equal(typeof connectionHandlers.state, "function");
equal(owner.getChatGptReadInputs(identityContext.identity), null);
equal(notifications.at(-1), { type: "identity" });
connectionHandlers.notification({ method: "unrelated" });
equal(queryClients[0].clearCount, 1);
connectionHandlers.notification({ method: "account/updated" });
equal(queryClients[0].clearCount, 2);

brokenCallback();
equal(streamDisposed, 1);
handle.unsubscribe();
equal(streamDisposed, 1);
activeConnection = null;
equal(await owner.readAccountInfo(), { status: "unavailable", reason: "connection" });
activeConnection = connection;
owner.dispose();
equal(connectionCleanupCount, 3);
equal(queryClients[0].clearCount, 3);
equal(await owner.readAccountInfo(), { status: "unavailable", reason: "retired" });
await assert.rejects(() => owner.subscribe(subscription), /Account input owner disposed/);
assertions += 1;

const statsigSource = fs.readFileSync(
  new URL("../src/main/main-app/account/statsig-adapter.ts", import.meta.url),
  "utf8",
);
const statsigModule = await transform(statsigSource, {
  loader: "ts",
  format: "esm",
  target: "es2022",
});
const statsigAst = acorn.parse(statsigModule.code, {
  ecmaVersion: "latest",
  sourceType: "module",
});
const stableNode = statsigAst.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "StableIdStore",
);
const summariesNode = statsigAst.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "ThreadTurnSummariesStore",
);
equal(Boolean(stableNode), true);
equal(Boolean(summariesNode), true);
const stableIdSchema = {
  parse(value) {
    if (typeof value !== "string" || value.length < 1 || value.length > 256)
      throw new Error("invalid stable id");
    return value;
  },
  safeParse(value) {
    return typeof value === "string" && value.length >= 1 && value.length <= 256
      ? { success: true, data: value }
      : { success: false };
  },
};
const StableIdStore = Function(
  "EventEmitterBase",
  "stableIdSchema",
  `${statsigModule.code.slice(stableNode.start, stableNode.end)}; return StableIdStore;`,
)(RpcHandlerBase, stableIdSchema);
let storedStableId = null;
let stableReads = 0;
const stableWrites = [];
const stableStore = new StableIdStore({
  async read() { stableReads += 1; return storedStableId; },
  async write(value) { stableWrites.push(value); storedStableId = value; },
});
equal(await stableStore.getStableId(), null);
equal(await Promise.all([
  stableStore.importLegacyStableId("legacy-one"),
  stableStore.importLegacyStableId("legacy-two"),
]), ["legacy-one", "legacy-one"]);
equal(stableWrites, ["legacy-one"]);
equal(await stableStore.getStableId(), "legacy-one");
await assert.rejects(() => stableStore.importLegacyStableId(""), /invalid stable id/);
assertions += 1;
equal(stableReads, 3);

const ThreadTurnSummariesStore = Function(
  `${statsigModule.code.slice(summariesNode.start, summariesNode.end)}; return ThreadTurnSummariesStore;`,
)();
const sqlCalls = [];
const summariesStore = new ThreadTurnSummariesStore({
  prepare(sql) {
    return {
      all(...args) {
        sqlCalls.push(["all", sql, args]);
        return [{
          thread_id: "thread-1",
          summary: "summary",
          compact_summary: "compact",
          compact_summary_turn_key: "turn-1",
          revision: 4,
        }];
      },
      run(...args) {
        sqlCalls.push(["run", sql, args]);
        return { changes: 1 };
      },
    };
  },
});
equal(summariesStore.readMany("principal", "host", []), []);
equal(summariesStore.readMany("principal", "host", ["thread-1"]), [{
  threadId: "thread-1",
  summary: "summary",
  compactSummary: "compact",
  compactSummaryTurnKey: "turn-1",
  revision: 4,
}]);
equal(summariesStore.set("principal", "host", "thread-1", "next", 5, null, null), true);
equal(sqlCalls.at(-1)[2].slice(0, 7), ["principal", "host", "thread-1", "next", null, null, 5]);
assert.throws(
  () => summariesStore.set("principal", "host", "thread-1", "", 5, null, null),
  /between 1 and 280/,
);
assert.throws(
  () => summariesStore.set("principal", "host", "thread-1", "ok", 5, "compact", null),
  /completed turn key/,
);
assert.throws(
  () => summariesStore.set("principal", "host", "thread-1", "ok", -1, null, null),
  /non-negative safe integers/,
);
assertions += 3;
summariesStore.delete("principal", "host", "thread-1");
equal(sqlCalls.at(-1)[2], ["principal", "host", "thread-1"]);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/account/account-inputs-owner.js")'), true);
equal(main.includes("AccountInputsOwner = createAccountInputsOwnerClass({"), true);
equal(main.includes("eEe = class extends"), false);
equal(main.includes("CTe = class extends"), false);
equal(main.includes("DTe = class"), false);
equal(main.includes("IOe = class extends"), false);
equal(main.includes("zOe = class extends"), false);
equal(windowContext.includes("new AccountInputsOwner("), true);
equal(windowContext.includes("new StableIdStore("), true);
equal(windowContext.includes("new ThreadTurnSummariesStore(e)"), true);
equal(windowContext.includes("new PrimaryWindowActionsBridge("), true);
equal(windowContext.includes("new ComposerItemsBridge("), true);
equal(windowContext.includes("new AvatarOverlayScrollHostService(e)"), true);
equal(windowContext.includes("new UpdateCapabilityService("), true);

console.log(`${assertions} main account inputs owner assertions passed`);
