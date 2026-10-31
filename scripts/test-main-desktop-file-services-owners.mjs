import assert from "node:assert/strict";
import childProcess from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import streamPromises from "node:stream/promises";
import util from "node:util";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
async function importTypeScript(relativePath) {
  const bundle = await build({
    entryPoints: [path.join(root, relativePath)],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
}

const fileModule = await importTypeScript("src/main/main-app/files/desktop-file-services.ts");
const audioModule = await importTypeScript("src/main/main-app/dictation/audio.ts");
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const rejects = async (operation, pattern) => {
  await assert.rejects(operation, pattern);
  assertions += 1;
};

class RpcHandlerBase {}
const schema = {
  Of: () => ({ trim() { return this; }, min() { return this; } }),
  wf: () => ({
    safeParse(value) {
      return value != null && typeof value.hostId === "string" && value.hostId.length > 0 &&
        typeof value.path === "string" && value.path.length > 0
        ? { success: true, data: value }
        : { success: false };
    },
  }),
};

const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "desktop-file-services-test-"));
const allowedRoot = path.join(tempRoot, "allowed");
const outsideRoot = path.join(tempRoot, "outside");
await fs.promises.mkdir(allowedRoot);
await fs.promises.mkdir(outsideRoot);
const sourcePath = path.join(allowedRoot, "report.txt");
const outsidePath = path.join(outsideRoot, "private.txt");
await fs.promises.writeFile(sourcePath, "library-data");
await fs.promises.writeFile(outsidePath, "private-data");

const dragCalls = [];
const thumbnailCalls = [];
const electron = {
  app: {
    getAppPath: () => "/application",
    getFileIcon: async (filePath) => ({ iconFor: filePath }),
  },
  nativeImage: {
    createThumbnailFromPath: async (filePath, size) => {
      thumbnailCalls.push([filePath, size]);
      return { isEmpty: () => false, toDataURL: () => "data:image/png;base64,fallback" };
    },
  },
};
const failingExecFile = (_command, _args, _options, callback) => callback(new Error("disabled"));
const runtime = fileModule.createDesktopFileServicesRuntime({
  RpcHandlerBase,
  defaultHostId: "local",
  schema,
  electron,
  crypto,
  path,
  os: { tmpdir: () => tempRoot },
  fs,
  fsPromises: fs.promises,
  streamPromises,
  util,
  childProcess: { execFile: failingExecFile },
  countFolderFiles: (folderPath, host) => ({ folderPath, host }),
  isRemoteHostConfig: (hostConfig) => hostConfig?.type === "remote",
  resolveLocalWorkspacePath: (requestedPath) => requestedPath,
  resolveElectronResourcesPath: () => "/resources",
  loadNativeFileDragAddon: (options) => ({
    startFileDrag(filePath) {
      dragCalls.push([options, filePath]);
      return true;
    },
  }),
  normalizeEnvironment: (environment) => environment,
  pathContains: (candidate, parent) => candidate === parent || candidate.startsWith(`${parent}${path.sep}`),
});

const registry = new runtime.AppServerClientRegistry();
const localHost = { hostConfig: { type: "local" }, name: "local-client" };
registry.add("local", localHost);
equal(registry.get(), localHost, "registry resolves its default host");
equal(registry.getMaybe("missing"), undefined, "registry exposes missing hosts without throwing");
assert.throws(() => registry.get("missing"), /host ID missing not found/);
assertions += 1;
registry.add("remote", { hostConfig: { type: "remote" } });
registry.remove("remote");
equal(registry.getMaybe("remote"), undefined, "registry removes host clients");

const attachments = new runtime.FileAttachmentsService(registry);
equal(
  attachments.countFolderFiles({ folderPath: "/workspace", hostId: "local" }),
  { folderPath: "/workspace", host: localHost },
  "attachment service delegates folder counting to the selected host",
);
equal(
  await attachments.persistImageFileToTemp({ bytes: Buffer.from("gif"), mimeType: "text/plain" }),
  null,
  "attachment service rejects unsupported image MIME types",
);
const persistedImage = await attachments.persistImageFileToTemp({
  bytes: Buffer.from("png-data"),
  mimeType: "image/png",
});
equal(path.extname(persistedImage), ".png", "attachment service selects the canonical extension");
equal(await fs.promises.readFile(persistedImage, "utf8"), "png-data", "attachment bytes are persisted");
equal((await fs.promises.stat(persistedImage)).mode & 0o777, 0o600, "attachment temp files are private");

const rendererDrags = [];
const fileDrag = new runtime.FileDragService(registry, {}, {
  startDrag: (payload) => rendererDrags.push(payload),
});
await fileDrag.prepareDrag({ hostId: "local", path: sourcePath });
equal(fileDrag.pendingFilePath, null, "drag preparation clears its pending marker");
equal(fileDrag.preparedFileDrag.filePath, sourcePath, "drag preparation stores the validated file");
equal(fileDrag.startDrag({ hostId: "local", path: sourcePath }), true, "prepared renderer drag starts");
equal(rendererDrags.length, 1, "renderer receives one file drag");
equal(rendererDrags[0].file, sourcePath, "renderer drag retains the local file path");
equal(fileDrag.startDrag({ hostId: "local", path: outsidePath }), false, "unprepared drag is rejected");
registry.add("remote", { hostConfig: { type: "remote" } });
equal(fileDrag.startDrag({ hostId: "remote", path: sourcePath }), false, "remote drag paths are rejected");
equal(fileDrag.startDrag({ hostId: "", path: sourcePath }), false, "invalid drag payloads are rejected");
const nativeDrag = new runtime.FileDragService(registry, {}, {});
equal(
  nativeDrag.startDrag({ hostId: "local", path: sourcePath }),
  process.platform === "darwin",
  "native fallback is restricted to macOS",
);
equal(dragCalls.length, process.platform === "darwin" ? 1 : 0, "native addon use matches the platform gate");

const backend = {
  convertPathForDesktopHost: (value) => value,
  getAllowedLibraryDirectories: async () => [allowedRoot],
  listOutputFiles: () => ["one", "two"],
};
const library = new runtime.LibraryFilesService(backend);
equal(library.listOutputFiles(), ["one", "two"], "library listing delegates to its backend");
const { previewPath } = await library.prepareFilePreview({ sourcePath });
equal(await fs.promises.readFile(previewPath, "utf8"), "library-data", "preview copies allowed contents");
equal(library.fileAccess.previewPaths.has(previewPath), true, "preview ownership is recorded");
await library.releaseFilePreview({ previewPath });
equal(fs.existsSync(previewPath), false, "released previews are deleted");
equal(library.fileAccess.previewPaths.has(previewPath), false, "released previews leave the owner set");
await rejects(() => library.prepareFilePreview({ sourcePath: outsidePath }), /Library file is unavailable/);
const thumbnail = await library.getThumbnailDataUrl({ size: "compact", sourcePath });
equal(thumbnail, { dataUrl: "data:image/png;base64,fallback" }, "thumbnail falls back to Electron");
equal(thumbnailCalls.length, 1, "Electron receives one thumbnail request");
equal(thumbnailCalls[0][1], { height: 96, width: 96 }, "compact thumbnail dimensions are preserved");
equal(library.thumbnailGenerator.queue instanceof Promise, true, "thumbnail operations remain serialized");

const { fourCharCode, isBuiltInAudioRoute, getBuiltInMicrophoneName } = audioModule;
equal(fourCharCode("glob"), 1_735_159_650, "CoreAudio four-character codes retain byte order");
const selectors = {
  deviceList: fourCharCode("dev#"),
  defaultInput: fourCharCode("dIn "),
  defaultOutput: fourCharCode("dOut"),
  inputStreams: fourCharCode("stm#"),
  transport: fourCharCode("tran"),
  gone: fourCharCode("gone"),
  name: fourCharCode("lnam"),
  builtIn: fourCharCode("bltn"),
  legacyBuiltIn: fourCharCode("blue"),
};
const arrayValues = new Map([
  [`1:${selectors.deviceList}`, [20]],
  [`20:${selectors.inputStreams}`, [99]],
]);
const scalarValues = new Map([
  [`1:${selectors.defaultInput}`, 10],
  [`1:${selectors.defaultOutput}`, 11],
  [`10:${selectors.transport}`, selectors.legacyBuiltIn],
  [`11:${selectors.transport}`, selectors.legacyBuiltIn],
  [`11:${selectors.gone}`, 1],
  [`20:${selectors.transport}`, selectors.builtIn],
]);
const coreAudioBinding = {
  getStringFromPointer: () => "MacBook Microphone",
  getPropertyDataSize(objectId, address, _qualifierSize, _qualifier, dataSize) {
    const values = arrayValues.get(`${objectId}:${address.readUInt32LE(0)}`) ?? [];
    dataSize.writeUInt32LE(values.length * 4, 0);
    return 0;
  },
  getPropertyData(objectId, address, _qualifierSize, _qualifier, dataSize, output) {
    const selector = address.readUInt32LE(0);
    if (selector === selectors.name) return 0;
    const array = arrayValues.get(`${objectId}:${selector}`);
    if (array != null) {
      array.forEach((value, index) => output.writeUInt32LE(value, index * 4));
      dataSize.writeUInt32LE(array.length * 4, 0);
      return 0;
    }
    const scalar = scalarValues.get(`${objectId}:${selector}`);
    if (scalar == null) return -1;
    output.writeUInt32LE(scalar, 0);
    dataSize.writeUInt32LE(4, 0);
    return 0;
  },
};
equal(isBuiltInAudioRoute(coreAudioBinding), true, "built-in input/output route is detected");
equal(getBuiltInMicrophoneName(coreAudioBinding), "MacBook Microphone", "built-in microphone name is decoded");
scalarValues.set(`11:${selectors.gone}`, 0);
equal(isBuiltInAudioRoute(coreAudioBinding), false, "inactive output route is rejected");
scalarValues.set(`11:${selectors.gone}`, 1);

const audioWarnings = [];
let frameworkLoads = 0;
const DictationAudioService = audioModule.createDictationAudioServiceClass({
  RpcHandlerBase,
  electron: { screen: { getAllDisplays: () => [{ internal: true }] } },
  createLogger: () => ({ warning: (...args) => audioWarnings.push(args) }),
  loadObjcJs: async () => ({
    NobjcLibrary: class { constructor() { frameworkLoads += 1; } },
    fromPointer: () => ({ UTF8String: () => "MacBook Microphone" }),
    callFunction(name, _signature, ...args) {
      if (name === "AudioObjectGetPropertyData") return coreAudioBinding.getPropertyData(...args);
      if (name === "AudioObjectGetPropertyDataSize") return coreAudioBinding.getPropertyDataSize(...args);
      if (name === "CFRelease") return undefined;
      throw new Error(`unexpected CoreAudio call ${name}`);
    },
  }),
});
const audioService = new DictationAudioService();
equal(
  await audioService.getBuiltInMicrophoneName(),
  process.platform === "darwin" ? "MacBook Microphone" : null,
  "dictation audio service preserves its platform gate and full macOS path",
);
equal(frameworkLoads, process.platform === "darwin" ? 1 : 0, "CoreAudio binding is loaded lazily");
equal(audioWarnings.length, 0, "successful audio inspection does not warn");

const main = await fs.promises.readFile(
  path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"),
  "utf8",
);
for (const expected of [
  "createDesktopFileServicesRuntime({",
  "AppServerClientRegistry: a$e",
  "FileAttachmentsService: s$e",
  "FileDragService: _$e",
  "LibraryFilesService: l1e",
  "k$e = createDictationAudioServiceClass({",
]) equal(main.includes(expected), true, `main wiring retains ${expected}`);
for (const removed of [
  "a$e = class",
  "s$e = class",
  "_$e = class",
  "k$e = class",
  "r1e = class",
  "l1e = class",
  "async function N$e()",
]) equal(main.includes(removed), false, `old implementation is absent: ${removed}`);

const windowContext = await fs.promises.readFile(
  path.join(root, "src/main/main-app/window/window-context.ts"),
  "utf8",
);
for (const consumer of [
  "executionHostRegistry = new a$e()",
  "new l1e(new t1e(",
  "fileAttachments: new s$e(",
  "new _$e(this.executionHostRegistry",
  "new k$e()",
]) equal(windowContext.includes(consumer), true, `WindowContext consumes ${consumer}`);

await fs.promises.rm(tempRoot, { recursive: true, force: true });
console.log(`${assertions} main desktop file services and dictation audio assertions passed`);
