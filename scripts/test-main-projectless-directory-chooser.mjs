import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProjectlessDirectoryChooserClass } from "../src/main/main-app/workspace/projectless-directory-chooser.ts";

const root = await mkdtemp(path.join(os.tmpdir(), "projectless-picker-test-"));
const validDirectory = path.join(root, "valid");
const filePath = path.join(root, "file.txt");
const symlinkPath = path.join(root, "link");
await mkdir(validDirectory);
await writeFile(filePath, "file");
await symlink(validDirectory, symlinkPath);
let dialogResult = { canceled: false, filePaths: [validDirectory] };
let owner = null;
const dialogCalls = [];
const validations = [];
const accessCalls = [];
const Chooser = createProjectlessDirectoryChooserClass({
  RpcHandlerBase: class {},
  BrowserWindow: { fromWebContents: () => owner },
  dialog: { showOpenDialog: async (...args) => { dialogCalls.push(args); return dialogResult; } },
  settings: { projectlessWorkspaceRoot: { key: "projectless-root" } },
  getHomeDirectory: () => "/home/user",
  path,
  getDefaultWorkspaceRoot: (options) => { assert.equal(options.configuredWorkspaceRoot, "/configured"); return "/default"; },
  validateProjectlessDirectory: (...args) => validations.push(args),
  getUseWslPaths: () => true,
  hostConfig: { kind: "local" },
  lstat: fs.promises.lstat,
  access: async (directory, mode) => accessCalls.push([directory, mode]),
  accessModes: { R_OK: 4, W_OK: 2, X_OK: 1 },
});
const chooser = new Chooser({ id: "web-contents" }, { getEffective: () => "/configured" });

assert.equal(await chooser.chooseDirectory(), validDirectory);
assert.equal(dialogCalls[0].length, 1);
assert.deepEqual(dialogCalls[0][0], {
  defaultPath: "/default",
  properties: ["openDirectory", "createDirectory"],
  title: "Choose Projectless Task Folder",
});
assert.deepEqual(validations, [[validDirectory, true]]);
assert.deepEqual(accessCalls, [[validDirectory, 4], [validDirectory, 2], [validDirectory, 1]]);

owner = { id: "window" };
await chooser.chooseDirectory();
assert.equal(dialogCalls[1][0], owner);
assert.equal(dialogCalls[1].length, 2);

dialogResult = { canceled: true, filePaths: [validDirectory] };
assert.equal(await chooser.chooseDirectory(), null);
dialogResult = { canceled: false, filePaths: [] };
assert.equal(await chooser.chooseDirectory(), null);

dialogResult = { canceled: false, filePaths: ["relative"] };
await assert.rejects(() => chooser.chooseDirectory(), /absolute local path/);
dialogResult = { canceled: false, filePaths: [filePath] };
await assert.rejects(() => chooser.chooseDirectory(), /real directory/);
dialogResult = { canceled: false, filePaths: [symlinkPath] };
await assert.rejects(() => chooser.chooseDirectory(), /real directory/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /V6e = createProjectlessDirectoryChooserClass\(\{/);
assert.doesNotMatch(main, /V6e = class/);
assert.equal(fs.existsSync(new URL("../src/main/main-app/misc/project-sync.ts", import.meta.url)), false);

console.log("projectless directory chooser assertions: 18");
