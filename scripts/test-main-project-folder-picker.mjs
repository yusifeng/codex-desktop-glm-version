import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createProjectFolderPickerClass } from "../src/main/main-app/workspace/project-folder-picker.ts";

const calls = [];
const ownerWindow = { id: 7 };
let dialogResult = { canceled: false, filePaths: ["/source/one", "/source/two"] };
let hiddenOutput = { stdout: "YES\n", code: 0 };
const electron = {
  BrowserWindow: { fromWebContents: () => ownerWindow },
  dialog: {
    async showOpenDialog(...args) {
      calls.push(["dialog", ...args]);
      return dialogResult;
    },
  },
};
const windowManager = {
  sendMessageToWebContents: (...args) => calls.push(["remote", ...args]),
  sendInlineMessageForView: (...args) => calls.push(["inline", ...args]),
};
let existingProjects = {};
let createdProject = { id: "project-1" };
const projectsManager = {
  getLocalProjects: () => existingProjects,
  createOrSelectLocalProjects: async (roots) => {
    calls.push(["create", roots]);
    return [createdProject];
  },
  renameLocal: async (value) => calls.push(["rename", value]),
};
const dependencies = {
  clearTimeout: (value) => calls.push(["clear-timeout", value]),
  createLogger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }),
  electron,
  formatProjectRoot: (root) => ({ root, host: "local" }),
  normalizeProjectSource: async (source) => source.replace("/source", "/normalized"),
  normalizeWorkspaceRoots: (roots) => roots.length === 0 ? null : roots[0],
  now: () => 1234,
  platform: "darwin",
  resolvePath: path.resolve,
  runCommand: () => ({ wait: async () => hiddenOutput }),
  setTimeout: (callback, delay) => {
    assert.equal(delay, 100);
    calls.push(["set-timeout", callback]);
    return "timeout-1";
  },
  stat: async (source) => ({ isDirectory: () => !source.endsWith("two") }),
};
const Picker = createProjectFolderPickerClass(dependencies);
const picker = new Picker({ id: "local", display_name: "Local" }, windowManager, projectsManager);

assert.equal(await picker.shouldShowHiddenFiles(), true);
assert.equal(calls.some(([kind, value]) => kind === "clear-timeout" && value === "timeout-1"), true);

await picker.createOrSelectProject("origin", "/source/one", "Renamed");
assert.deepEqual(calls.find(([kind]) => kind === "rename")[1], {
  projectId: "project-1",
  name: "Renamed",
});
const added = calls.find(([, , message]) => message?.type === "workspace-root-option-added")[2];
assert.equal(added.projectId, "project-1");
assert.deepEqual(added.root, { root: "/normalized/one", host: "local" });
const navigation = calls.find(([, , message]) => message?.type === "navigate-to-route")[2];
assert.equal(navigation.state.focusComposerNonce, 1234);

existingProjects = { "project-1": createdProject };
await picker.createOrSelectProject("origin", "/source/one", "Ignored");
const addedMessages = calls.filter(([, , message]) => message?.type === "workspace-root-option-added");
assert.equal(addedMessages.at(-1)[2].projectId, null);
assert.equal(addedMessages.at(-1)[2].selectedProjectId, "project-1");
assert.equal(calls.filter(([kind]) => kind === "rename").length, 1);

await picker.pickProjectSources("origin", true);
const dialogCall = calls.find(([kind]) => kind === "dialog");
assert.equal(dialogCall[1], ownerWindow);
assert.deepEqual(dialogCall[2].properties, [
  "openDirectory",
  "createDirectory",
  "multiSelections",
  "showHiddenFiles",
]);
const pickedMessages = calls.filter(([, , message]) => message?.type === "workspace-root-option-picked");
assert.equal(pickedMessages.length, 1);
assert.equal(pickedMessages[0][2].root.root, "/normalized/one");

dialogResult = { canceled: true, filePaths: [] };
assert.deepEqual(await picker.pickLocalDirectories("origin"), []);
hiddenOutput = { stdout: "false", code: 0 };
assert.equal(await picker.shouldShowHiddenFiles(), false);

const remotePicker = new Picker(
  { id: "remote-1", display_name: "Remote" },
  windowManager,
  projectsManager,
);
await remotePicker.createOrSelectProject("remote-origin");
await remotePicker.pickProjectSources("remote-origin", false);
const remoteMessages = calls.filter(([kind]) => kind === "remote");
assert.equal(remoteMessages.at(-2)[2].mode, "add");
assert.equal(remoteMessages.at(-2)[2].setActive, true);
assert.equal(remoteMessages.at(-1)[2].mode, "pick");
await assert.rejects(() => remotePicker.pickLocalDirectories("origin"), /only supported for local hosts/);

const LinuxPicker = createProjectFolderPickerClass({ ...dependencies, platform: "linux" });
const linuxPicker = new LinuxPicker({ id: "local" }, windowManager, projectsManager);
assert.equal(await linuxPicker.shouldShowHiddenFiles(), false);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /iQe = createProjectFolderPickerClass\(\{/);
assert.doesNotMatch(main, /iQe = class/);

console.log("project folder picker assertions: 25");
