import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const streamOf = (text) => new ReadableStream({
  start(controller) { controller.enqueue(new TextEncoder().encode(text)); controller.close(); },
});
async function compile(relativePath, plugins = []) {
  const build = await esbuild.build({
    entryPoints: [path.join(root, relativePath)], bundle: true, format: "esm", platform: "node", target: "node22",
    write: false, logLevel: "silent", plugins,
  });
  return import(`data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString("base64")}`);
}

const loggerMock = {
  name: "logger-mock",
  setup(build) {
    build.onResolve({ filter: /^@chunk\/logger$/ }, () => ({ path: "logger", namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
      loader: "js", contents: "const logger={debug(){},info(){},warning(){},error(){},trace(){}};export const memoizedTaggedLogger=()=>()=>logger;export const createTaggedLogger=()=>logger;",
    }));
  },
};
const rpcTargetMock = {
  name: "rpc-target-mock",
  setup(build) {
    build.onResolve({ filter: /^@chunk\/shared$/ }, () => ({ path: "shared", namespace: "mock-rpc" }));
    build.onLoad({ filter: /.*/, namespace: "mock-rpc" }, () => ({ loader: "js", contents: "export class Uf {}" }));
  },
};
const wsMock = {
  name: "ws-mock",
  setup(build) {
    build.onResolve({ filter: /^ws$/ }, () => ({ path: "ws", namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ loader: "js", contents: "module.exports=class WebSocket { static OPEN=1 }" }));
  },
};
const socksMock = {
  name: "socks-mock",
  setup(build) {
    build.onResolve({ filter: /^socks-proxy-agent$/ }, () => ({ path: "socks-proxy-agent", namespace: "mock-socks" }));
    build.onLoad({ filter: /.*/, namespace: "mock-socks" }, () => ({ loader: "js", contents: "export class SocksProxyAgent {}" }));
  },
};

const [misc, mcp, wsl, files, environments, applications, github, fsmonitor, structured, automation, processExec, ambient, tail, membership, coordination] = await Promise.all([
  compile("src/main/shared/misc-runtime.ts"),
  compile("src/main/shared/mcp-2-runtime.ts", [wsMock, socksMock]),
  compile("src/main/shared/wsl-paths.ts", [loggerMock]),
  compile("src/main/main-app/files/desktop-file-services.ts"),
  compile("src/main/shared/local-environments.ts"),
  compile("src/main/main-app/open-target/application-list.ts"),
  compile("src/main/main-app/github/request-client.ts", [loggerMock, rpcTargetMock]),
  compile("src/main/main-app/startup/git-fsmonitor.ts"),
  compile("src/main/shared/structured-generation.ts", [loggerMock]),
  compile("src/main/shared/automation-registry.ts"),
  compile("src/main/shared/process-exec.ts"),
  compile("src/main/shared/ambient-suggestions-store.ts"),
  compile("src/main/shared/tail-runtime.ts"),
  compile("src/main/shared/thread-project-membership.ts", [rpcTargetMock]),
  compile("src/main/shared/client-coordination-service.ts", [rpcTargetMock]),
]);

assert.equal(misc.shellJoin(["plain", "two words", "a'b", ""]), `plain 'two words' 'a'"'"'b' ''`);
assert.equal(wsl.normalizeDesktopWorktreePath("/C:\\Users\\DAVID\\Repo"), "/mnt/c/users/david/repo");
assert.equal(wsl.normalizeDesktopWorktreePath("//SERVER/Share/Repo"), "//server/share/repo");

const oldForceCli = process.env.CODEX_APP_SERVER_FORCE_CLI;
const oldWsUrl = process.env.CODEX_APP_SERVER_WS_URL;
try {
  delete process.env.CODEX_APP_SERVER_FORCE_CLI;
  delete process.env.CODEX_APP_SERVER_WS_URL;
  assert.equal(mcp.resolveAppServerWebsocketUrl({ websocket_url: "ws://config" }), "ws://config");
  assert.equal(new mcp.WebsocketTransport({ websocketUrl: "ws://config" }).supportsReconnect(), true);
  process.env.CODEX_APP_SERVER_WS_URL = "ws://environment";
  assert.equal(mcp.resolveAppServerWebsocketUrl({ websocket_url: "ws://config" }), "ws://environment");
  process.env.CODEX_APP_SERVER_FORCE_CLI = "1";
  assert.equal(mcp.resolveAppServerWebsocketUrl({ websocket_url: "ws://config" }), null);
} finally {
  oldForceCli == null ? delete process.env.CODEX_APP_SERVER_FORCE_CLI : process.env.CODEX_APP_SERVER_FORCE_CLI = oldForceCli;
  oldWsUrl == null ? delete process.env.CODEX_APP_SERVER_WS_URL : process.env.CODEX_APP_SERVER_WS_URL = oldWsUrl;
}

const fileEntry = (name) => ({ name, isFile: () => true, isDirectory: () => false });
const directoryEntry = (name) => ({ name, isFile: () => false, isDirectory: () => true });
const folderHost = {
  platformPath: async () => path.posix,
  readDirectory: async (directory) => directory === "/root"
    ? [fileEntry("one"), directoryEntry("child"), directoryEntry("link")]
    : [fileEntry("two"), fileEntry("three")],
  stat: async (target) => ({ isSymbolicLink: () => target.endsWith("/link") }),
};
assert.equal(await files.countFolderFiles("/root", folderHost), 3);

const validRoot = `version = 1\nname = " Root "\n[setup]\nscript = " echo root "\n`;
const validChild = `name = " Child "\n[setup]\nscript = " echo child "\n[[actions]]\nname = " Test "\ncommand = " npm test "\nicon = "test"\n[[actions]]\nname = ""\ncommand = "ignored"\n`;
const contents = new Map([
  ["/repo/.codex/environments/environment.toml", validRoot],
  ["/repo/sub/.codex/environments/custom.toml", validChild],
]);
const directories = new Set(["/repo/.git", "/repo/.codex/environments", "/repo/sub/.codex/environments"]);
const host = {
  id: "local",
  hostConfig: { kind: "local" },
  platformPath: async () => path.posix,
  readDirectory: async (directory) => [...contents.keys()].filter((file) => path.posix.dirname(file) === directory).map((file) => ({ name: path.posix.basename(file) })),
  readFile: async (file) => {
    if (!contents.has(file)) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    return contents.get(file);
  },
  stat: async (target) => {
    if (!directories.has(target)) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    return { isDirectory: () => true, isFile: () => false };
  },
  createDirectory: async (directory) => { directories.add(directory); },
  writeFile: async (file, raw) => { contents.set(file, raw); },
};
const listed = await environments.listLocalEnvironments("/repo/sub", host);
assert.equal(listed.length, 2);
assert.equal(listed[0].configPath, "/repo/.codex/environments/environment.toml");
assert.equal(listed[0].environment.name, "Root");
assert.equal(listed[1].environment.actions.length, 1);
assert.deepEqual(listed[1].environment.actions[0], { name: "Test", command: "npm test", icon: "test" });
assert.equal((await environments.readLocalEnvironment("/missing.toml", host)).type, "error");

const revision = `sha256:${await import("node:crypto").then(({ createHash }) => createHash("sha256").update(validChild).digest("hex"))}`;
assert.deepEqual(await environments.saveLocalEnvironment(host, {
  configPath: "/repo/sub/.codex/environments/custom.toml", expectedRevision: "sha256:stale", raw: "replacement",
}), { type: "conflict" });
assert.deepEqual(await environments.saveLocalEnvironment(host, {
  configPath: "/repo/sub/.codex/environments/custom.toml", expectedRevision: revision, raw: "replacement",
}), { type: "success" });
assert.equal(contents.get("/repo/sub/.codex/environments/custom.toml"), "replacement");

const nativeApplications = [
  { appPath: "/Applications/One.app", bundleId: "one", displayName: "One" },
  { appPath: "/Applications/One.app", bundleId: "one.duplicate", displayName: "Duplicate", isDefault: true },
  { appPath: "/Applications/Two.app", bundleId: "two", displayName: "Two" },
  { appPath: "/Applications/NotAnApp", bundleId: "bad", displayName: "Bad" },
  { appPath: "/Applications/Spotify.app", bundleId: "com.spotify.installer", displayName: "Installer" },
];
assert.deepEqual(await applications.listApplicationsForFile({
  filePath: "/tmp/file.txt", limit: 2, prioritizedBundleIds: ["two"],
}, { platform: "darwin", listApplicationsForFile: async () => nativeApplications }), [
  { appPath: "/Applications/Two.app", bundleId: "two", displayName: "Two" },
  { appPath: "/Applications/One.app", bundleId: "one", displayName: "One", isDefault: true },
]);
assert.deepEqual(await applications.listApplicationsForFile({ filePath: "/tmp/file.txt" }, {
  platform: "linux", listApplicationsForFile: async () => nativeApplications,
}), []);

const requestClient = new github.GithubRequestClient(async (method, params, source) => ({ method, params, source }));
assert.equal(requestClient instanceof github.GithubRequestClient, true);
assert.deepEqual(await requestClient.request("pull-request", { number: 7 }, "test").wait(), {
  method: "pull-request", params: { number: 7 }, source: "test",
});
let aborted = false;
const pendingOperation = new github.GithubRequestClient((_method, _params, _source, signal) => new Promise((_resolve, reject) => {
  signal.addEventListener("abort", () => { aborted = true; reject(new DOMException("aborted", "AbortError")); }, { once: true });
})).request("pending", {});
pendingOperation[Symbol.dispose]();
await assert.rejects(pendingOperation.wait(), { name: "AbortError" });
assert.equal(aborted, true);

let spawnOptions;
const fsmonitorResult = await fsmonitor.stopGitFsmonitor("C:\\repo", {
  platformFamily: async () => "windows",
  spawn: async (options) => {
    spawnOptions = options;
    return { wait: async () => ({ code: 128 }), stdout: streamOf("stopped\n"), stderr: streamOf("") };
  },
});
assert.equal(fsmonitorResult.success, true);
assert.deepEqual(spawnOptions.args, [
  "git", "-c", "safe.bareRepository=explicit", "-c", "core.hooksPath=NUL", "-c", "core.fsmonitor=", "fsmonitor--daemon", "stop",
]);
assert.deepEqual(spawnOptions.allowedNonZeroExitCodes, [128]);

const structuredClient = (response) => {
  let handler = () => {};
  const calls = { startThread: null, startTurn: null };
  return {
    calls,
    startThread: async (request) => { calls.startThread = request; return { thread: { id: "thread-1" } }; },
    unsubscribeThread: async () => {},
    registerInternalNotificationHandler: (next) => { handler = next; return () => { handler = () => {}; }; },
    startTurn: async (request) => {
      calls.startTurn = request;
      queueMicrotask(() => {
        handler({ method: "turn/started", params: { threadId: "thread-1", turn: { id: "turn-1" } } });
        handler({ method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", item: { type: "agentMessage", text: JSON.stringify(response) } } });
        handler({ method: "turn/completed", params: { threadId: "thread-1", turn: { id: "turn-1", status: "completed" } } });
      });
      return { turn: { id: "turn-1" } };
    },
  };
};
const titleClient = structuredClient({ title: "Title: Focus tests?", description: "  exact   phrase  search  " });
assert.deepEqual(await structured.generateThreadTitle({
  prompt: "Generate a title", cwd: "/repo", appServerClient: titleClient, model: "test-model",
}), { title: "Focus tests", description: "exact phrase search" });
assert.equal(titleClient.calls.startTurn.summary, "none");
assert.equal(titleClient.calls.startTurn.outputSchema.type, "object");
assert.equal(titleClient.calls.startThread.config["features.multi_agent"], false);
const summaryClient = structuredClient({ summary: "  Fixed   startTurn contract. ", compactSummary: " Fixed contract " });
assert.deepEqual(await structured.generateThreadSummary({
  latestMessage: "The startTurn contract is fixed", phase: "assistant", cwd: "/repo",
  appServerClient: summaryClient, includeCompactSummary: true,
}), { summary: "Fixed startTurn contract.", compactSummary: "Fixed contract" });
assert.match(summaryClient.calls.startTurn.input[0].text, /compactSummary/);

const pathEnvironment = { PATH: "/usr/bin" };
assert.equal(processExec.getPathEnvironment(pathEnvironment), "/usr/bin");
processExec.setPathEnvironment(pathEnvironment, "/opt/bin");
assert.equal(pathEnvironment.PATH, "/opt/bin");
assert.equal(automation.parseAutomationIntervalMs("FREQ=MINUTELY;INTERVAL=5"), 300_000);
assert.equal(automation.parseAutomationIntervalMs("FREQ=DAILY;INTERVAL=1"), null);
assert.equal(ambient.readAmbientSuggestions("local", "/missing/project").projectRoot, "/missing/project");
let generationEvent = null;
const unsubscribeGeneration = ambient.subscribeAmbientSuggestionGeneration((event) => { generationEvent = event; });
ambient.publishAmbientSuggestionGeneration({ status: "started" });
assert.deepEqual(generationEvent, { status: "started" });
unsubscribeGeneration();
const initializationClient = { waitUntilInitialized: async ({ timeoutMs }) => assert.equal(timeoutMs, 5_000) };
assert.ok(await tail.waitUntilIpcInitialized(initializationClient) <= 5_000);
let membershipRecords = { assignments: {}, projectlessThreadIds: [] };
const publishedMemberships = [];
const membershipStore = new membership.ThreadProjectMembershipStore({
  read: () => membershipRecords,
  write: (_previous, next) => { membershipRecords = next; },
}, (value) => publishedMemberships.push(value));
await membershipStore.setAssignment({ threadId: "thread-1", assignment: { projectKind: "local", projectId: "project-1" } });
await membershipStore.setProjectless({ threadId: "thread-1", projectless: true });
assert.equal(membershipRecords.assignments["thread-1"].projectId, "project-1");
assert.deepEqual(membershipRecords.projectlessThreadIds, ["thread-1"]);
assert.equal(publishedMemberships.length, 2);
const registeredHandlers = new Map();
const coordinationClient = {
  addRequestHandler: (method, canHandle, handle) => { registeredHandlers.set(method, { canHandle, handle }); return () => registeredHandlers.delete(method); },
};
const disposeCoordination = coordination.createThreadOwnerRegistration({
  hostId: "local", ipcClient: coordinationClient,
  canHandle: async () => true, discoverOwner: async () => true,
  requestThreadFollower: async ({ request }) => ({ method: request.method, result: { ok: true } }),
});
assert.equal(registeredHandlers.size, 15);
assert.deepEqual(await registeredHandlers.get("thread-follower-steer-turn").handle({ params: {}, hostId: "local" }), { ok: true });
disposeCoordination();
assert.equal(registeredHandlers.size, 0);

const main = await readFile(path.join(root, "src/main-recovered/main-C-Mhak1n.ts"), "utf8");
for (const alias of ["K", "q", "R", "N", "E", "H", "Qn", "mn", "$"])
  assert.doesNotMatch(main, new RegExp(`\\bn\\.${alias.replace("$", "\\$")}(?![\\w$])`));
assert.match(main, /generateTitle: sharedStructuredGeneration\.generateThreadTitle/);
assert.match(main, /generateDescription: sharedStructuredGeneration\.generateThreadDescription/);
assert.match(main, /generateSummary: sharedStructuredGeneration\.generateThreadSummary/);
const packScript = await readFile(path.join(root, "scripts/pack.sh"), "utf8");
assert.match(packScript, /socks-proxy-agent ws yaml zod/);

console.log("shared recovery batch assertions passed (57 assertions)");
