import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const schemaStub = `
const schema = () => ({
  default() { return this; }, loose() { return this; }, nullable() { return this; },
  nullish() { return this; }, optional() { return this; },
  safeParse(value) { return { success: true, data: value }; },
});
export const wf = () => schema(); export const Of = () => schema();
export const Cf = () => schema(); export const hf = () => schema();
export const Mf = () => schema(); export const xf = () => schema();
export const Es = (host) => host?.id !== "local";
export const zi = () => false; export const Vi = (path) => path;
export const ji = (path) => path; export const Mi = () => null;
export const $u = (id) => id; export const uu = "cowork-marketplace";
export const ta = () => ({}); export const Lt = async (paths) => Object.fromEntries(paths.map((path) => [path, path]));
export const Ko = () => false; export const ca = (value) => value ?? {};
export const iu = { THREAD_PROJECT_ASSIGNMENTS: "assignments", THREAD_PROJECTLESS_OUTPUT_DIRECTORIES: "outputs", PROJECTLESS_THREAD_IDS: "projectless", LOCAL_PROJECTS: "projects", PROJECT_ORDER: "order" };
export const Di = { readFile: async () => "" };
`;
const loggerStub = `export const createTaggedLogger = () => ({ debug() {}, info() {}, warning() {}, error() {} });`;
const historyStub = `
export const COWORK_PROVIDER_ID = "claude-cowork";
export const importHistoryStats = async () => ({ importedSessionCount: 0, latestImportedAtMs: null });
export const mapSpaceConfig = (value) => value;
export const readImportHistory = async () => ({ connectorCandidates: [] });
`;
const mcpStub = `export const registerPluginMarketplace = async () => {};`;
const transcriptsStub = `
export const queueCoworkDetection = async () => ({ detection: { items: [], unsupportedProjects: [] } });
export const runCoworkImport = async () => ({ importedSessionProjectRoots: [], importedSessionThreadIds: [], projectRoots: [] });
export const itemCwds = (items) => items.map((item) => item.cwd).filter(Boolean);
`;

const bundled = await build({
  entryPoints: [new URL("../src/main/main-app/import/external-agent-import.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  plugins: [{
    name: "external-agent-import-test-stubs",
    setup(api) {
      api.onResolve({ filter: /^@chunk\/(shared|logger)$/ }, ({ path }) => ({ path, namespace: "stub" }));
      api.onResolve({ filter: /^\.\/cowork-(history|discovery|mcp-plugins|transcripts)$/ }, ({ path }) => ({ path, namespace: "stub" }));
      api.onResolve({ filter: /^\.\.\/misc\/projectless-workspace$/ }, ({ path }) => ({ path, namespace: "stub" }));
      api.onLoad({ filter: /shared$/, namespace: "stub" }, () => ({ contents: schemaStub, loader: "js" }));
      api.onLoad({ filter: /logger$/, namespace: "stub" }, () => ({ contents: loggerStub, loader: "js" }));
      api.onLoad({ filter: /cowork-history$/, namespace: "stub" }, () => ({ contents: historyStub, loader: "js" }));
      api.onLoad({ filter: /cowork-discovery$/, namespace: "stub" }, () => ({ contents: "", loader: "js" }));
      api.onLoad({ filter: /cowork-mcp-plugins$/, namespace: "stub" }, () => ({ contents: mcpStub, loader: "js" }));
      api.onLoad({ filter: /cowork-transcripts$/, namespace: "stub" }, () => ({ contents: transcriptsStub, loader: "js" }));
      api.onLoad({ filter: /projectless-workspace$/, namespace: "stub" }, () => ({ contents: "export const createProjectlessThreadPathsViaAppServer = async () => null;", loader: "js" }));
    },
  }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);

equal(runtime.desktopMigrationOptions({
  desktopPaths: { getPath: (name) => name === "home" ? "/Users/test" : "/Users/test/Documents" },
  homeDir: "/Users/test",
  platform: "darwin",
}), {
  documentsDir: "/Users/test/Documents",
  homeDir: "/Users/test",
  userDataDir: "/Users/test/Library/Application Support/Claude",
});
equal(runtime.desktopMigrationOptions({
  desktopPaths: { getPath: (name) => name === "home" ? "C:\\Users\\test" : "C:\\Users\\test\\Documents" },
  env: { APPDATA: "C:\\Roaming", LOCALAPPDATA: "C:\\Local" },
  homeDir: "C:\\Users\\test",
  platform: "win32",
}), {
  documentsDir: "C:\\Users\\test\\Documents",
  fallbackUserDataDirs: ["C:\\Roaming\\Claude"],
  homeDir: "C:\\Users\\test",
  userDataDir: "C:\\Local\\Packages\\Claude_pzs8sxrjxfjjc\\LocalCache\\Roaming\\Claude",
});

let notificationHandler;
let createdPaths = 0;
const recordedThreads = [];
const finalized = [];
const connection = {
  registerInternalNotificationHandler(handler) { notificationHandler = handler; return () => {}; },
  async sendAppServerRequest(method, params) {
    equal(method, "externalAgentConfig/import");
    equal(params.migrationSource, "cursor");
    equal(params.migrationItems[0].details.sessions[0].cwd, "/workspace/generated");
    notificationHandler({ method: "externalAgentConfig/import/completed", params: {
      importId: "import-1",
      itemTypeResults: [{ itemType: "SESSIONS", failures: [], successes: [{ itemType: "SESSIONS", cwd: "/workspace/generated", source: "projects/empty-window/agent-transcripts/session-key", target: "thread-1" }] }],
    } });
    return { importId: "import-1" };
  },
};
const handlers = runtime.createExternalAgentImportHandlers({
  createProjectlessThreadPaths: async ({ title }) => {
    equal(title, "Imported chat");
    createdPaths += 1;
    return { cwd: "/workspace/generated", outputDirectory: "/output/generated", workspaceRoot: "/workspace" };
  },
  getAppServerConnection: () => connection,
  getRequestAppServerClient: () => ({ hostConfig: { id: "local" } }),
  getStatus: async () => ({ importedSessionCount: 1, latestImportedAtMs: 1 }),
  recordProjectlessThread: async (thread) => recordedThreads.push(thread),
  finalizeImportedProjects: async (summary, projectId) => { finalized.push([summary, projectId]); return ["project-1"]; },
});
const result = await handlers["external-agent-import-import"]({
  hostId: "local",
  items: [{ providerId: "cursor", itemType: "SESSIONS", cwd: null, description: "chat", details: { sessions: [{ cwd: "", path: "projects/empty-window/agent-transcripts/session-key", title: "Imported chat", workspaceKind: "projectless" }] } }],
  projectId: null,
});
equal(createdPaths, 1, "service-level projectless path callback is used by default");
equal(recordedThreads, [{ cwd: "/workspace/generated", outputDirectory: "/output/generated", threadId: "thread-1", workspaceRoot: "/workspace" }]);
equal(result, { importedProjectIds: ["project-1"], importedSessionThreadIds: ["thread-1"], projectRoots: [] });
equal(finalized.length, 1);

const status = await handlers["external-agent-import-status"]({ hostId: "local", providers: ["cursor"] });
equal(status.importedSessionCount, 1);
await assert.rejects(
  handlers["external-agent-import-import"]({ hostId: "remote", items: [], projectId: null }),
  /only supported on the local host/,
);
assertions += 1;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const fetchHandler = fs.readFileSync(new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url), "utf8");
for (const name of ["createExternalAgentImportAdapter", "createExternalAgentImportHandlers", "finalizeImportedProjects", "readConnectorCandidates", "readImportStatus"]) {
  equal(main.includes(name), true, `${name} is wired into main`);
  equal(fetchHandler.includes(name), true, `${name} is consumed by the fetch owner`);
}
for (const oldSymbol of ["function hP(", "function XFe(", "function _Ie(", "function lIe(", "async function VIe("]) {
  equal(main.includes(oldSymbol), false, `${oldSymbol} old owner is removed`);
}

console.log(`${assertions} main external-agent import runtime assertions passed`);
