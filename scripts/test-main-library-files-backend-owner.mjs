import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/files/library-files-backend.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { createLibraryFilesBackendRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "library-backend-test-"));
const workspaceRoot = path.join(tempRoot, "workspace");
const outputRoot = path.join(workspaceRoot, "outputs");
const nestedRoot = path.join(outputRoot, "nested");
const configuredRoot = path.join(tempRoot, "configured-projectless");
await fs.promises.mkdir(nestedRoot, { recursive: true });
await fs.promises.mkdir(configuredRoot);
await fs.promises.writeFile(path.join(outputRoot, "b.txt"), "bbb");
await fs.promises.writeFile(path.join(nestedRoot, "a.txt"), "a");
const outsideFile = path.join(tempRoot, "outside.txt");
await fs.promises.writeFile(outsideFile, "outside");
let symlinkCreated = false;
try {
  await fs.promises.symlink(outsideFile, path.join(outputRoot, "escape.txt"));
  symlinkCreated = true;
} catch {}

const stateKeys = {
  THREAD_PROJECTLESS_OUTPUT_DIRECTORIES: "output-directories",
  THREAD_PROJECT_ASSIGNMENTS: "assignments",
  PROJECTLESS_THREAD_IDS: "projectless-ids",
  THREAD_WORKSPACE_ROOT_HINTS: "workspace-hints",
};
const warnings = [];
const runtime = createLibraryFilesBackendRuntime({
  path,
  fsPromises: fs.promises,
  homedir: () => tempRoot,
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  pathContains: (candidate, parent) => candidate === parent || candidate.startsWith(`${parent}${path.sep}`),
  convertPathForDesktopHost: (value) => value,
  convertPathForAgentEnvironment: (value) => `agent:${value}`,
  getShouldUseWslPaths: () => false,
  getCodexHome: () => path.join(tempRoot, "codex-home"),
  getDefaultProjectlessWorkspaceRoot: ({ homeDirectory }) => path.join(homeDirectory, "ChatGPT"),
  normalizeProjectAssignments: (value) => value ?? {},
  stateKeys,
  projectlessWorkspaceRootSettingKey: "projectless-root",
});

const resolved = runtime.resolveOutputDirectories({
  configuredOutputDirectories: { configured: outputRoot },
  shouldUseWslPaths: false,
  threads: [
    { id: "configured", cwd: workspaceRoot },
    { id: "default", cwd: workspaceRoot },
    { id: "outside", cwd: tempRoot },
  ],
  workspaceRoots: [workspaceRoot],
});
equal(resolved.outputDirectories.configured, outputRoot, "configured output directory wins");
equal(resolved.outputDirectories.default, outputRoot, "default output directory uses cwd/outputs");
equal(resolved.outputDirectories.outside, path.join(tempRoot, "outputs"), "all thread outputs are projected");
equal(resolved.allowedOutputDirectories, [outputRoot], "only workspace-contained outputs are allowed");

const globalValues = new Map([
  [stateKeys.THREAD_PROJECT_ASSIGNMENTS, { assigned: "project" }],
  [stateKeys.PROJECTLESS_THREAD_IDS, ["local", "remote-existing", "remote-missing", "assigned"]],
  [stateKeys.THREAD_WORKSPACE_ROOT_HINTS, {
    local: workspaceRoot,
    "remote-existing": configuredRoot,
    "remote-missing": path.join(tempRoot, "missing-root"),
  }],
  [stateKeys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES, {
    local: outputRoot,
    "remote-existing": outputRoot,
    "remote-missing": outputRoot,
  }],
]);
const globalState = { get: (key) => globalValues.get(key) };
let readThreadCalls = 0;
const scopeConnection = {
  readThread: async (threadId) => {
    readThreadCalls += 1;
    return threadId === "remote-existing" ? { id: threadId } : null;
  },
};
const settingsStore = { getEffective: () => configuredRoot };
const scope = await runtime.loadProjectlessWorkspaceScope({
  appServerConnection: scopeConnection,
  globalState,
  localThreadIds: new Set(["local", "assigned"]),
  settingsStore,
});
equal([...scope.localThreadIds].sort(), ["local", "remote-existing"], "scope admits local and confirmed threads");
equal(scope.workspaceRoots.includes(path.join(tempRoot, "ChatGPT")), true, "default projectless root is retained");
equal(scope.workspaceRoots.includes(configuredRoot), true, "absolute configured root is retained");
equal(scope.workspaceRoots.includes(workspaceRoot), true, "local workspace hint is retained");
equal(scope.workspaceRoots.includes(path.join(tempRoot, "missing-root")), false, "missing threads do not add hints");
equal(readThreadCalls, 2, "non-local candidates are checked once");
await runtime.loadProjectlessWorkspaceScope({
  appServerConnection: scopeConnection,
  globalState,
  localThreadIds: new Set(["local", "assigned"]),
  settingsStore,
});
equal(readThreadCalls, 2, "positive and negative thread lookups are cached");

const pages = [
  { data: [{ id: "local", cwd: workspaceRoot }], nextCursor: "page-2" },
  { data: [{ id: "remote-existing", cwd: workspaceRoot }], nextCursor: null },
];
const listRequests = [];
const appServerConnection = {
  listThreads: async (request) => {
    listRequests.push(request);
    return pages[listRequests.length - 1];
  },
  readThread: async () => ({ id: "existing" }),
};
const backend = new runtime.LibraryFilesBackend(appServerConnection, globalState, settingsStore);
equal(backend.shouldUseWslPaths, false, "backend snapshots path mode at construction");
equal(
  backend.generatedImagesDirectory,
  path.join(tempRoot, "codex-home", "generated_images"),
  "generated image directory is derived from Codex home",
);
const threads = await backend.listLocalThreads();
equal(threads.map(({ id }) => id), ["local", "remote-existing"], "thread pagination is flattened");
equal(listRequests.length, 2, "all thread pages are requested");
equal(listRequests[0].cursor, null, "pagination starts without a cursor");
equal(listRequests[1].cursor, "page-2", "pagination advances with the returned cursor");

listRequests.length = 0;
const directories = await backend.loadProjectlessOutputDirectories();
equal(directories.allowedOutputDirectories, [outputRoot], "backend deduplicates shared allowed outputs");
equal(directories.outputDirectories.local, outputRoot, "local configured output is retained");
equal(directories.outputDirectories["remote-existing"], outputRoot, "confirmed configured output is retained");
equal(directories.workspaceRoots.includes(workspaceRoot), true, "backend carries workspace roots into scanning");
listRequests.length = 0;
const allowed = await backend.getAllowedLibraryDirectories();
equal(allowed.includes(outputRoot), true, "library allowlist includes valid output roots");
equal(allowed.includes(backend.generatedImagesDirectory), true, "library allowlist always includes generated images");

listRequests.length = 0;
const files = await backend.listOutputFiles();
equal(files.length, 2, "recursive output scan finds regular files only");
equal(files.map(({ name }) => name), ["b.txt", "a.txt"], "files are sorted by canonical path");
equal(files.every(({ path: filePath }) => filePath.startsWith("agent:")), true, "paths are projected for the agent");
equal(files.every(({ threadId }) => threadId === null), true, "shared outputs do not claim one thread");
equal(files.find(({ name }) => name === "a.txt").relativePath, path.join("nested", "a.txt"), "relative paths survive recursion");
equal(files.find(({ name }) => name === "a.txt").sizeBytes, 1, "file metadata retains byte size");
if (symlinkCreated) {
  equal(files.some(({ name }) => name === "escape.txt"), false, "symbolic-link escapes are excluded");
}
equal(warnings.length, 2, "missing hinted/default roots produce bounded warnings");
equal(
  warnings.every(([message]) => message === "Failed to inspect projectless workspace root"),
  true,
  "root inspection warnings retain their semantic category",
);

const main = await fs.promises.readFile(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
for (const expected of [
  "createLibraryFilesBackendRuntime({",
  "LibraryFilesBackend: t1e",
  "loadProjectlessWorkspaceScope: BQ",
]) equal(main.includes(expected), true, `main wiring retains ${expected}`);
for (const removed of [
  "t1e = class",
  "async function BQ(",
  "async function $$e(",
  "async function FQ(",
  "function n1e(",
]) equal(main.includes(removed), false, `old library backend implementation is absent: ${removed}`);

const windowContext = await fs.promises.readFile(
  path.join(root, "src/main/main-app/window/window-context.ts"),
  "utf8",
);
equal(windowContext.includes("let { workspaceRoots: t } = await BQ({"), true, "workspace scope consumer remains wired");
equal(windowContext.includes("new l1e(new t1e("), true, "library backend consumer remains wired");

await fs.promises.rm(tempRoot, { recursive: true, force: true });
console.log(`${assertions} main library files backend owner assertions passed`);
