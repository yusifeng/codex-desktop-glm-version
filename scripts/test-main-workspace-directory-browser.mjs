import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createWorkspaceDirectoryBrowser } from "../src/main/main-app/workspace/directory-browser.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };
const entry = (name, { directory = false, symlink = false } = {}) => ({
  name,
  isDirectory: () => directory,
  isSymbolicLink: () => symlink,
});

const statDirectories = new Set(["/workspace", "/workspace/src", "/workspace/src/safe-link", "/workspace/src/escape"]);
const fileSystem = {
  async stat(target) { return { isDirectory: () => statDirectories.has(target) }; },
  async readdir(target, options) {
    equal([target, options], ["/workspace/src", { withFileTypes: true }]);
    return [
      entry("b.txt"),
      entry("alpha", { directory: true }),
      entry(".hidden", { directory: true }),
      entry("safe-link", { symlink: true }),
      entry("escape", { symlink: true }),
    ];
  },
};
const realpaths = new Map([
  ["/workspace", "/workspace"],
  ["/workspace/src", "/workspace/src"],
  ["/workspace/src/safe-link", "/workspace/actual-directory"],
  ["/workspace/src/escape", "/outside"],
]);
const listWorkspaceDirectory = createWorkspaceDirectoryBrowser({
  fileSystem,
  isRemoteHostConfig: (hostConfig) => hostConfig.remote === true,
  localPath: path.posix,
  realpath: async (target) => realpaths.get(target) ?? target,
});
const client = { hostConfig: { remote: false } };
equal(await listWorkspaceDirectory({
  appServerClient: client,
  directoryPath: " ./src/ ",
  directoriesOnly: false,
  includeHidden: false,
  workspaceRoot: "/workspace",
}), {
  directoryPath: "src",
  entries: [
    { isSymlink: false, name: "alpha", path: "src/alpha", type: "directory" },
    { isSymlink: true, name: "safe-link", path: "src/safe-link", type: "directory" },
    { isSymlink: false, name: "b.txt", path: "src/b.txt", type: "file" },
  ],
  parentPath: "",
});

await rejects(listWorkspaceDirectory({
  appServerClient: client,
  directoryPath: "../outside",
  directoriesOnly: false,
  includeHidden: false,
  workspaceRoot: "/workspace",
}), /must stay within workspaceRoot/);
await rejects(listWorkspaceDirectory({
  appServerClient: client,
  directoryPath: "",
  directoriesOnly: false,
  includeHidden: false,
  workspaceRoot: " ",
}), /workspaceRoot is required/);

let remoteRealpathCalls = 0;
const remoteBrowser = createWorkspaceDirectoryBrowser({
  fileSystem: {
    stat: async () => ({ isDirectory: () => true }),
    readdir: async () => [entry("remote-link", { symlink: true }), entry("folder", { directory: true })],
  },
  isRemoteHostConfig: (hostConfig) => hostConfig.remote === true,
  localPath: path.win32,
  realpath: async (target) => { remoteRealpathCalls += 1; return target; },
});
equal(await remoteBrowser({
  appServerClient: { hostConfig: { remote: true }, platformPath: async () => path.posix },
  directoryPath: ".",
  directoriesOnly: true,
  includeHidden: true,
  workspaceRoot: "/remote",
}), {
  directoryPath: "",
  entries: [{ isSymlink: false, name: "folder", path: "folder", type: "directory" }],
  parentPath: null,
});
equal(remoteRealpathCalls, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("createWorkspaceDirectoryBrowser({"), true);
equal(main.includes("await listWorkspaceDirectory({"), true);
for (const oldName of ["OBe", "kBe", "ABe", "jBe", "UH", "MBe", "WH"]) {
  equal(new RegExp(`(?:function|await) ${oldName}\\b`).test(main), false);
}

console.log(`${assertions} main workspace directory browser assertions passed`);
