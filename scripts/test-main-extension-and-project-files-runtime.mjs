import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { transform } from "esbuild";

const loadTs = async (relativePath) => {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
  return import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
};
const extensionRuntime = await loadTs("../src/main/main-app/browser-sidebar/extension-recent-use.ts");
const projectRuntime = await loadTs("../src/main/main-app/projects/chatgpt-project-files.ts");
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const flush = () => new Promise((resolve) => setImmediate(resolve));

const stateValues = { "electron-browser-extension-recently-used": { profile: ["old", "stored"] } };
const stateUpdates = [];
const globalState = {
  get: (key) => stateValues[key],
  update(key, updater) { stateValues[key] = updater(stateValues[key]); stateUpdates.push([key, stateValues[key]]); },
};
const registryFor = extensionRuntime.createExtensionRecentUseRegistryFactory();
const recent = registryFor(globalState);
equal(registryFor(globalState), recent, "one registry is shared per global state owner");
equal(registryFor({ get() {}, update() {} }) === recent, false);

let toolbarState = { ready: false, pinnedExtensionIds: [], storedPinnedExtensionIds: [] };
const extensionSession = { storagePath: "profile", extensions: { getExtensionToolbarState: () => toolbarState } };
equal(recent.getRecentlyUsed(extensionSession, toolbarState), ["old", "stored"]);
toolbarState = { ready: true, pinnedExtensionIds: ["new", "old"], storedPinnedExtensionIds: ["stored"] };
equal(recent.getRecentlyUsed(extensionSession, toolbarState), ["new", "old", "stored"]);
equal(stateUpdates.at(-1)[1].profile, ["new", "old", "stored"]);
let notifications = 0;
const unsubscribe = recent.subscribe(extensionSession, () => { notifications += 1; });
recent.recordUse(extensionSession, "old");
equal(stateValues["electron-browser-extension-recently-used"].profile, ["old", "new", "stored"]);
equal(notifications, 1);
recent.recordUse(extensionSession, "not-pinned");
equal(notifications, 1, "unpinned extension use is ignored");
toolbarState = { ready: true, pinnedExtensionIds: ["third"], storedPinnedExtensionIds: ["old"] };
recent.refreshPins(extensionSession);
equal(stateValues["electron-browser-extension-recently-used"].profile, ["third", "old"]);
equal(notifications, 2);
unsubscribe();
toolbarState = { ready: true, pinnedExtensionIds: ["fourth"], storedPinnedExtensionIds: [] };
recent.refreshPins(extensionSession);
equal(notifications, 2, "unsubscribe removes the profile listener");
const transientSession = { storagePath: null, extensions: { getExtensionToolbarState: () => ({ ready: true, pinnedExtensionIds: ["x"], storedPinnedExtensionIds: [] }) } };
equal(recent.getRecentlyUsed(transientSession, transientSession.extensions.getExtensionToolbarState()), ["x"]);

equal(projectRuntime.projectFilesWithSafeNames([
  { fileId: "1", name: "AGENTS.md" },
  { fileId: "2", name: "report?.txt" },
  { fileId: "3", name: "REPORT_.txt" },
  { fileId: "4", name: "CON" },
  { fileId: "5", name: "..." },
]).map(({ name }) => name), [
  "AGENTS (project file).md",
  "report_.txt",
  "REPORT_ (2).txt",
  "_CON",
  "file",
]);

class RpcHandlerBase {}
let callbackDisposals = 0;
const usingScopeHelper = () => {
  const resources = [];
  let error;
  let failed = false;
  return {
    u(value) { resources.push(value); return value; },
    set e(value) { failed = true; error = value; },
    d() {
      for (const resource of resources.reverse()) resource?.[Symbol.dispose]?.();
      if (failed) throw error;
    },
  };
};
const ProjectFilesService = projectRuntime.createChatGptProjectFilesServiceClass({ RpcHandlerBase, usingScopeHelper });
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "codex-project-files-test-"));
try {
  const contents = new Map([
    ["good", "first content"],
    ["good-v2", "second content"],
    ["serialized-one", "one"],
    ["serialized-two", "two"],
  ]);
  let downloadCalls = 0;
  let releaseFirstDownload;
  const firstDownloadGate = new Promise((resolve) => { releaseFirstDownload = resolve; });
  const downloadFile = async (request) => {
    downloadCalls += 1;
    if (request.id === "serialized-one") await firstDownloadGate;
    return new Response(contents.get(request.id)).body;
  };
  const service = new ProjectFilesService(temporaryRoot, downloadFile);
  const requestCalls = [];
  const createRequestCallback = () => {
    const callback = async (fileId) => {
      requestCalls.push(fileId);
      if (fileId === "missing") throw { status: 404 };
      return { id: fileId };
    };
    callback[Symbol.dispose] = () => { callbackDisposals += 1; };
    return callback;
  };

  const firstResult = await service.sync({
    projectId: "project-1",
    projectName: "Project One",
    instructions: "  Follow the project rules.  ",
    files: [{ fileId: "good", name: "source.txt" }, { fileId: "missing", name: "missing.txt" }],
    getFileDownloadRequest: createRequestCallback(),
  });
  const projectRoot = path.join(temporaryRoot, ".chatgpt-projects", "project-1");
  equal(firstResult, { failedFiles: [{ fileOrdinal: 2, stage: "download-link", status: 404 }], rootPath: projectRoot });
  equal(await readFile(path.join(projectRoot, "sources", "source.txt"), "utf8"), "first content");
  equal((await readFile(path.join(projectRoot, "AGENTS.md"), "utf8")).includes("1 project source could not be synced"), true);
  equal((await stat(path.join(projectRoot, "sources", "source.txt"))).mode & 0o777, 0o444);
  const metadataPath = path.join(temporaryRoot, ".chatgpt-projects", ".metadata", "project-1.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  equal(metadata, {
    files: [{ fileId: "good", name: "source.txt", sha256: createHash("sha256").update("first content").digest("hex") }],
    version: 1,
  });
  equal(callbackDisposals, 1);

  await writeFile(path.join(projectRoot, "user-note.txt"), "preserve me");
  const callsBeforeCachedSync = requestCalls.length;
  const cachedResult = await service.sync({
    projectId: "project-1",
    projectName: "Project One",
    instructions: "",
    files: [{ fileId: "good", name: "renamed.txt" }],
    getFileDownloadRequest: createRequestCallback(),
  });
  equal(cachedResult.failedFiles, []);
  equal(requestCalls.length, callsBeforeCachedSync, "valid cached content avoids a new download link");
  equal(await readFile(path.join(projectRoot, "sources", "renamed.txt"), "utf8"), "first content");
  equal(await readFile(path.join(projectRoot, "user-note.txt"), "utf8"), "preserve me");
  equal((await readFile(path.join(projectRoot, "AGENTS.md"), "utf8")).includes("This project has no custom instructions."), true);

  await chmod(path.join(projectRoot, "sources", "renamed.txt"), 0o644);
  await writeFile(path.join(projectRoot, "sources", "renamed.txt"), "corrupted");
  contents.set("good", "re-downloaded");
  const callsBeforeCorruptSync = requestCalls.length;
  await service.sync({
    projectId: "project-1",
    projectName: "Project One",
    instructions: "",
    files: [{ fileId: "good", name: "source.txt" }],
    getFileDownloadRequest: createRequestCallback(),
  });
  equal(requestCalls.length, callsBeforeCorruptSync + 1, "hash mismatch forces a redownload");
  equal(await readFile(path.join(projectRoot, "sources", "source.txt"), "utf8"), "re-downloaded");

  const firstSerialCallback = createRequestCallback();
  const secondSerialCallback = createRequestCallback();
  const firstSerial = service.sync({ projectId: "serial", projectName: "Serial", instructions: "", files: [{ fileId: "serialized-one", name: "one.txt" }], getFileDownloadRequest: firstSerialCallback });
  await flush();
  const secondSerial = service.sync({ projectId: "serial", projectName: "Serial", instructions: "", files: [{ fileId: "serialized-two", name: "two.txt" }], getFileDownloadRequest: secondSerialCallback });
  await flush();
  equal(requestCalls.includes("serialized-two"), false, "same-root sync waits for its predecessor");
  releaseFirstDownload();
  await firstSerial;
  await secondSerial;
  equal(await readFile(path.join(temporaryRoot, ".chatgpt-projects", "serial", "sources", "two.txt"), "utf8"), "two");

  const invalidCallback = createRequestCallback();
  await assert.rejects(() => service.sync({ projectId: "../escape", files: [], getFileDownloadRequest: invalidCallback }), /Invalid ChatGPT project ID/); assertions += 1;
  equal(callbackDisposals, 6, "every sync releases its remote callback, including validation failure");
  equal(downloadCalls, 4);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(main.includes("createExtensionRecentUseRegistryFactory()"), true);
equal(main.includes("createChatGptProjectFilesServiceClass({"), true);
for (const symbol of ["ZD", "oAe", "sAe", "QD", "fAe", "pAe", "mAe", "hAe", "gAe", "_Ae", "vAe", "yAe", "bAe", "xAe", "SAe", "CAe", "wAe", "TAe"]) equal(new RegExp(`\\b${symbol}\\b`).test(main), false, `${symbol} must be removed`);
equal(windowContext.includes("extensionRecentUseRegistryFor(this.options.globalState)"), true);
equal(windowContext.includes("new ChatGptProjectFilesService("), true);

console.log(`${assertions} main extension and project files runtime assertions passed`);
