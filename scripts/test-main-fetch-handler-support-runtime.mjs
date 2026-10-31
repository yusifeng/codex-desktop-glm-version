import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createSftpTransfers } from "../src/main/main-app/fetch-handler/sftp.ts";
import {
  applySparseStateWrite,
  createFetchHandlerStateRuntime,
} from "../src/main/main-app/fetch-handler/state-writes.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };

const children = [];
const spawnCalls = [];
const transfers = createSftpTransfers({
  isSshHostConfig: (config) => config?.kind === "ssh",
  resolveExecutable: (name) => name === "sftp" ? "/bin/sftp" : null,
  spawn: (...args) => {
    spawnCalls.push(args);
    const child = new EventEmitter();
    child.stdin = { end: (value) => { child.input = value; } };
    child.stderr = new EventEmitter();
    children.push(child);
    return child;
  },
});
const upload = transfers.sftpUpload({
  sourcePath: "local \\\"source",
  targetPath: "/remote/target",
  hostConfig: { kind: "ssh", terminal_command: ["ssh", "-p", "2200", "host"] },
});
equal(spawnCalls[0], [
  "/bin/sftp",
  ["-b", "-", "-o", "BatchMode=yes", "-P", "2200", "host"],
  { stdio: ["pipe", "pipe", "pipe"] },
]);
equal(children[0].input, "put \"local \\\\\\\"source\" \"/remote/target\"\n");
children[0].emit("close", 0);
await upload;

await rejects(
  transfers.sftpDownload({ sourcePath: "bad\npath", targetPath: "target", hostConfig: { kind: "ssh", terminal_command: ["ssh"] } }),
  /cannot contain newlines/,
);
await rejects(
  transfers.sftpUpload({ sourcePath: "a", targetPath: "b", hostConfig: { kind: "local", terminal_command: [] } }),
  /require an SSH host/,
);
await rejects(
  transfers.sftpUpload({ sourcePath: "a", targetPath: "b", hostConfig: { kind: "ssh", terminal_command: ["plink"] } }),
  /missing an ssh terminal command/,
);
const download = transfers.sftpDownload({
  sourcePath: "remote",
  targetPath: "local",
  hostConfig: { kind: "ssh", terminal_command: ["ssh"] },
});
children[1].stderr.emit("data", Buffer.from("permission denied"));
children[1].emit("close", 1);
await rejects(download, /SFTP download failed: permission denied/);

const validationCalls = [];
const existing = new Set(["/app/assets/skills"]);
const runtime = createFetchHandlerStateRuntime({
  existsSync: (path) => existing.has(path),
  getAppPath: () => "/app",
  isPackaged: () => false,
  join: (...parts) => parts.join("/").replace("/../", "/parent/"),
  keymapAcceleratorForCommand: (input) => { validationCalls.push(input); return "Cmd+K"; },
  platform: "darwin",
  resourcesPath: "/resources",
  validateGlobalDictationHotkey: (value) => value === "bad-dictation" ? "bad dictation" : null,
  validateHotkey: (value) => value === "bad-window" ? "bad window" : null,
});
equal(runtime.bundledSkillsRoot(), "/app/assets/skills");
equal(runtime.avatarOverlayAcceleratorFromKeymap({ bindings: 1 }), "Cmd+K");
equal(validationCalls, [{ commandId: "openAvatarOverlay", keymapState: { bindings: 1 }, isMacOS: true }]);
runtime.validateGlobalHotkeySetting("unrelated", { type: "append", accelerator: "bad-window" });
await rejects(Promise.resolve().then(() => runtime.validateGlobalHotkeySetting("hotkeyWindow", { type: "append", accelerator: "x" })), /support one keybinding/);
await rejects(Promise.resolve().then(() => runtime.validateGlobalHotkeySetting("hotkeyWindow", { type: "set", accelerator: "bad-window" })), /bad window/);
await rejects(Promise.resolve().then(() => runtime.validateGlobalHotkeySetting("globalDictationHold", { type: "replace", accelerator: "bad-dictation" })), /bad dictation/);

const state = { first: 1, second: 2, keep: 3 };
equal(applySparseStateWrite(state, {
  entries: { first: null, missing: { updateOnly: true, value: 4 }, keep: { updateOnly: true, value: 5 }, last: { value: 6 } },
  maxEntries: 2,
}), { keep: 5, last: 6 });
equal(applySparseStateWrite([], { entries: { fresh: { value: true } } }), { fresh: true });
equal(applySparseStateWrite({ invalid: undefined }, { entries: { fresh: { value: true } } }), { fresh: true });
equal(applySparseStateWrite({ old: "large", newest: "ok" }, { entries: {}, maxBytes: 17 }), { newest: "ok" });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const text of [
  "createSftpTransfers({",
  "sftpDownload({",
  "sftpUpload({",
  "createFetchHandlerStateRuntime({",
  "applySparseStateWrite(",
]) equal(main.includes(text), true);
for (const text of [
  "async function RBe(",
  "async function zBe(",
  "async function QH(",
  "function VBe(",
  "function HBe(",
  "function WBe(",
]) equal(main.includes(text), false);

console.log(`${assertions} main fetch-handler support runtime assertions passed`);
