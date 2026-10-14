import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/language-server/language-server-manager.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { LanguageServerManager } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, reject, resolve };
}

function createHarness(createSession) {
  const logs = [];
  const expired = [];
  const notified = [];
  const manager = new LanguageServerManager(
    [
      { id: "typescript", languageIds: ["typescript", "javascript"] },
      { id: "python", languageIds: ["python"] },
    ],
    {
      createLogger: () => ({
        debug(message, context) { logs.push(["debug", message, context]); },
        info(message, context) { logs.push(["info", message, context]); },
        warning(message, context) { logs.push(["warning", message, context]); },
      }),
      createSession,
      getLocalRuntimeRoot: () => "/runtime",
      getLocationMethod: (kind) => `location/${kind}`,
      hoverMethod: "hover/request",
      markLocalRuntimeExpired: (id) => expired.push(id),
      normalizeHover: (result, position) => ({ normalized: result, position }),
      onLocalRuntimeExpired: (id) => notified.push(id),
    },
  );
  return { expired, logs, manager, notified };
}

const pathApi = {
  basename(value) { return value.split("/").filter(Boolean).at(-1) ?? ""; },
  dirname(value) { return value.slice(0, value.lastIndexOf("/")) || "/"; },
  normalize(value) { return value.replace(/\/\.\//g, "/").replace(/\/$/, ""); },
};
const host = { id: "local", async platformPath() { return pathApi; } };
const document = {
  contents: "const value = 1;",
  host,
  languageId: "typescript",
  path: "/repo/src/file.ts",
  position: { line: 1, character: 2 },
  workspaceRoot: "/repo/./",
};

let creationCount = 0;
let disposeCount = 0;
let onDispose;
const requests = [];
const session = {
  capabilities: { hover: true, locationKinds: ["definition", "references"] },
  dispose() { disposeCount += 1; },
  fileUri(value) { return `file://${value}`; },
  getLocations(value) { return [{ projected: value }]; },
  async requestForDocument(doc, method, params) {
    requests.push({ doc, method, params });
    return method === "hover/request" ? { contents: "hover" } : { uri: "result" };
  },
};
const firstStart = deferred();
const harness = createHarness((args) => {
  creationCount += 1;
  onDispose = args.onDispose;
  assert.equal(args.provider.id, "typescript");
  assert.equal(args.workspaceRoot, "/repo");
  assert.equal(args.workspaceName, "repo");
  assert.equal(args.pathApi, pathApi);
  return creationCount === 1 ? firstStart.promise : Promise.resolve({ status: "started", session });
});

const firstCapabilities = harness.manager.capabilities(document);
const duplicateCapabilities = harness.manager.capabilities(document);
await Promise.resolve();
assert.equal(creationCount, 1);
firstStart.resolve({ status: "started", session });
assert.equal(await firstCapabilities, session.capabilities);
assert.equal(await duplicateCapabilities, session.capabilities);
assert.equal(
  harness.logs.filter((entry) => entry[1] === "language_server_session_starting").length,
  1,
);
assert.equal(
  harness.logs.filter((entry) => entry[1] === "language_server_session_initialized").length,
  1,
);

assert.deepEqual(await harness.manager.hover(document), {
  normalized: { contents: "hover" },
  position: document.position,
});
assert.equal(requests.at(-1).method, "hover/request");
assert.deepEqual(requests.at(-1).params, {
  position: document.position,
  textDocument: { uri: "file:///repo/src/file.ts" },
});

assert.deepEqual(
  await harness.manager.locations({ ...document, kind: "references" }),
  [{ projected: { uri: "result" } }],
);
assert.equal(requests.at(-1).method, "location/references");
assert.deepEqual(requests.at(-1).params.context, { includeDeclaration: true });
const requestCount = requests.length;
assert.deepEqual(await harness.manager.locations({ ...document, kind: "implementation" }), []);
assert.equal(requests.length, requestCount);

onDispose({ reason: "process_exit", code: 0 });
assert.equal(await harness.manager.capabilities(document), session.capabilities);
assert.equal(creationCount, 2);
assert.equal(
  harness.logs.filter((entry) => entry[1] === "language_server_session_stopped").length,
  1,
);
harness.manager.dispose();
await Promise.resolve();
assert.equal(disposeCount, 1);

let unsupportedCreations = 0;
const unsupported = createHarness(async () => {
  unsupportedCreations += 1;
  return { status: "unavailable" };
});
assert.equal(
  await unsupported.manager.capabilities({ ...document, languageId: "unknown" }),
  null,
);
assert.equal(unsupportedCreations, 0);
assert.equal(await unsupported.manager.capabilities(document), null);
assert.equal(await unsupported.manager.capabilities(document), null);
assert.equal(unsupportedCreations, 2);
assert.equal(
  unsupported.logs.filter((entry) => entry[1] === "language_server_session_start_skipped").length,
  2,
);

let expiredStarts = 0;
const recoveredSession = { ...session, dispose() {} };
const expired = createHarness(async () => {
  expiredStarts += 1;
  return expiredStarts % 2 === 1
    ? { status: "expired-build", localRuntimeId: "runtime-1" }
    : { status: "started", session: recoveredSession };
});
assert.equal(await expired.manager.capabilities(document), recoveredSession.capabilities);
assert.deepEqual(expired.expired, ["runtime-1"]);
assert.deepEqual(expired.notified, ["runtime-1"]);
assert.equal(expiredStarts, 2);
const otherWorkspace = { ...document, workspaceRoot: "/other" };
assert.equal(await expired.manager.capabilities(otherWorkspace), recoveredSession.capabilities);
assert.deepEqual(expired.expired, ["runtime-1"]);
assert.deepEqual(expired.notified, ["runtime-1"]);
assert.equal(expiredStarts, 4);

let unmanagedStarts = 0;
const unmanaged = createHarness(async () => {
  unmanagedStarts += 1;
  return { status: "expired-build" };
});
assert.equal(await unmanaged.manager.capabilities(document), null);
assert.equal(unmanagedStarts, 1);
assert.deepEqual(unmanaged.expired, []);

let failedSessionDispose = 0;
const failingSession = {
  ...session,
  dispose() { failedSessionDispose += 1; },
  async requestForDocument() { throw new Error("request failed"); },
};
const failing = createHarness(async () => ({ status: "started", session: failingSession }));
assert.equal(await failing.manager.hover(document), null);
assert.equal(failedSessionDispose, 1);
assert.deepEqual(await failing.manager.locations({ ...document, kind: "definition" }), []);
assert.equal(failedSessionDispose, 2);
assert.equal(
  failing.logs.filter((entry) => entry[1] === "language_server_request_failed").length,
  2,
);

let unsupportedHoverRequests = 0;
const noHoverSession = {
  ...session,
  capabilities: { hover: false, locationKinds: [] },
  async requestForDocument() { unsupportedHoverRequests += 1; },
};
const noHover = createHarness(async () => ({ status: "started", session: noHoverSession }));
assert.equal(await noHover.manager.hover(document), null);
assert.equal(unsupportedHoverRequests, 0);
assert.equal(
  noHover.logs.filter((entry) => entry[1] === "language_server_hover_unsupported").length,
  1,
);

console.log("39 main language-server-manager assertions passed");
