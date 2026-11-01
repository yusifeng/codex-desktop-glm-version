import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const rejects = async (operation, pattern) => {
  await assert.rejects(operation, pattern);
  assertions += 1;
};

const remoteCalls = [];
let statResult = null;
let useWslPaths = false;
let distroFromUnc = null;
const shared = {
  Di: {
    mkdir: async (...args) => remoteCalls.push(["mkdir", ...args]),
    stat: async (...args) => {
      remoteCalls.push(["stat", ...args]);
      if (statResult instanceof Error) throw statResult;
      return statResult;
    },
  },
  zi: () => useWslPaths,
  Vi: (value) => value.startsWith("/") ? value : `/mnt/c/${value.replace(/^C:\\\\?/i, "").replaceAll("\\\\", "/")}`,
  Hi: () => distroFromUnc,
  Mi: () => "Ubuntu",
  xl: (value) => value.startsWith("wsl://network"),
  Es: (hostConfig) => hostConfig?.kind === "remote",
};
const source = fs.readFileSync(
  new URL("../src/main/main-app/misc/projectless-workspace.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "@chunk/shared") return shared;
    throw new Error(`unexpected require ${specifier}`);
  },
  loaded,
  loaded.exports,
);
const workspace = loaded.exports;

equal(
  workspace.projectlessWorkspaceInstructions({
    cwd: "/chat",
    projectlessOutputDirectory: "/chat/outputs",
    projectlessWorkspaceBrowserRoot: "/workspace",
  }).includes("Use /chat/outputs only for user-facing deliverables that should appear as outputs."),
  true,
);
equal(
  workspace.projectlessWorkspaceInstructions({
    cwd: "/chat",
    projectlessOutputDirectory: null,
    projectlessWorkspaceBrowserRoot: null,
  }).includes("write scratch files, drafts, generated assets, and other outputs under /chat."),
  true,
);
equal(
  workspace.defaultWorkspaceRoot({
    configuredWorkspaceRoot: "/configured",
    homeDirectory: "/home/user",
    path: path.posix,
  }),
  "/configured",
);
equal(
  workspace.defaultWorkspaceRoot({
    configuredWorkspaceRoot: null,
    homeDirectory: "/home/user",
    path: path.posix,
  }),
  "/home/user/Documents/Codex",
);

function createMemoryFileSystem({ existing = [], failSplit = false } = {}) {
  const directories = new Set(existing);
  const calls = [];
  return {
    calls,
    directories,
    async createDirectory({ path: directory, recursive }) {
      calls.push(["mkdir", directory, recursive]);
      if (!recursive && directories.has(directory)) throw Object.assign(new Error("exists"), { code: "EEXIST" });
      if (failSplit && /\/(?:outputs|work)$/.test(directory)) throw new Error("split failed");
      directories.add(directory);
    },
    async getMetadata(directory) {
      calls.push(["stat", directory]);
      if (!directories.has(directory)) throw Object.assign(new Error("missing"), { code: "ENOENT" });
      return { isDirectory: true, isSymlink: false };
    },
  };
}

const today = new Date();
const dateDirectory = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const root = "/home/user/Documents/Codex";
const firstCandidate = `${root}/${dateDirectory}/six-word-project-title-for-a`;
const fileSystem = createMemoryFileSystem({ existing: [firstCandidate] });
const created = await workspace.createProjectlessThreadDirectory({
  configuredWorkspaceRoot: null,
  createSplitDirectories: true,
  directoryName: null,
  fileSystem,
  homeDirectory: "/home/user",
  path: path.posix,
  prompt: "Six word project title for a seventh word",
});
equal(created, {
  cwd: `${firstCandidate}-2`,
  outputDirectory: `${firstCandidate}-2/outputs`,
  workspaceRoot: root,
});
equal(fileSystem.directories.has(`${firstCandidate}-2/work`), true);
equal(fileSystem.calls.some((call) => call[0] === "stat" && call[1] === firstCandidate), true);

const splitFailureFileSystem = createMemoryFileSystem({ failSplit: true });
const splitFallback = await workspace.createProjectlessThreadDirectory({
  configuredWorkspaceRoot: "/configured",
  createSplitDirectories: true,
  directoryName: "Explicit Name",
  fileSystem: splitFailureFileSystem,
  homeDirectory: "/home/user",
  path: path.posix,
  prompt: "ignored",
});
equal(splitFallback.outputDirectory, splitFallback.cwd);
equal(splitFallback.cwd.endsWith("/explicit-name"), true);

equal(workspace.validateProjectlessDirectory("C:\\work", false), "C:\\work");
useWslPaths = true;
equal(workspace.validateProjectlessDirectory("C:\\work", true), "/mnt/c/work");
distroFromUnc = "Debian";
assert.throws(
  () => workspace.validateProjectlessDirectory("\\\\wsl$\\Debian\\work", true),
  /active WSL distribution/,
);
assertions += 1;
distroFromUnc = null;
shared.Vi = (value) => value === "network" ? "wsl://network/share" : `wsl:${value}`;
assert.throws(() => workspace.validateProjectlessDirectory("network", true), /accessible from WSL/);
assertions += 1;
shared.Vi = (value) => value.startsWith("/") ? value : `/mnt/c/${value}`;

const platformPath = { ...path.posix, isAbsolute: path.posix.isAbsolute };
const appServerClient = { hostConfig: { kind: "local" }, platformPath: async () => platformPath };
remoteCalls.length = 0;
statResult = {
  isDirectory: () => true,
  isSymbolicLink: () => false,
};
equal(
  await workspace.resolveProjectlessWorkspaceRootViaAppServer({
    appServerClient,
    configuredWorkspaceRoot: "/configured",
    homeDirectory: "/home/user",
  }),
  "/configured",
);
equal(remoteCalls.at(-1).slice(0, 2), ["stat", "/configured"]);
equal(remoteCalls.at(-1)[3], { bypassCache: true, followSymlinks: false });

statResult = Object.assign(new Error("missing"), { code: "ENOENT" });
equal(
  await workspace.resolveProjectlessWorkspaceRootViaAppServer({
    appServerClient: { ...appServerClient, hostConfig: { kind: "remote" } },
    configuredWorkspaceRoot: null,
    homeDirectory: "/remote/home",
  }),
  "/remote/home/Documents/Codex",
);
statResult = { isDirectory: () => false, isSymbolicLink: () => false };
await rejects(
  () => workspace.resolveProjectlessWorkspaceRootViaAppServer({
    appServerClient,
    configuredWorkspaceRoot: "/configured",
    homeDirectory: "/home/user",
  }),
  /real directory/,
);
await rejects(
  () => workspace.createProjectlessThreadPathsViaAppServer({
    appServerClient: { ...appServerClient, platformPath: async () => ({ ...platformPath, isAbsolute: () => false }) },
    configuredWorkspaceRoot: "/relative",
    createSplitDirectories: false,
    homeDirectory: "/home/user",
    prompt: "test",
  }),
  /absolute on the execution host/,
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/misc/projectless-workspace.js")'), true);
equal(main.includes("ds: createProjectlessThreadPathsViaAppServer"), true);
equal(main.includes("Qie: resolveProjectlessWorkspaceRootViaAppServer"), true);
equal(main.includes("getDefaultProjectlessWorkspaceRoot: defaultWorkspaceRoot"), true);
equal(main.includes("async function Tt({"), false);
equal(main.includes("async function ds({"), false);
equal(main.includes("async function Qie({"), false);
equal(main.includes("function us("), false);
equal(main.includes("function vt("), false);

const wslPaths = fs.readFileSync(
  new URL("../src/main/shared/wsl-paths.ts", import.meta.url),
  "utf8",
);
equal(wslPaths.includes("wslDistroFromUnc as Hi"), true);
equal(wslPaths.includes("isWslUncPath as Hi"), false);

console.log(`${assertions} projectless workspace assertions passed`);
