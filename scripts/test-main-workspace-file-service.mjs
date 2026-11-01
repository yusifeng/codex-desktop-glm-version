import assert from "node:assert/strict";
import fs from "node:fs";
import { constants as fsConstants } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import * as esbuild from "esbuild";

const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.resolve(import.meta.dirname, "../src/main/main-app/workspace/files.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createWorkspaceFileServiceClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

const root = await mkdtemp(path.join(os.tmpdir(), "workspace-files-test-"));
const downloads = path.join(root, "downloads");
await mkdir(downloads);
const source = path.join(root, "source.txt");
await writeFile(source, "hello");
let savePath = path.join(root, "saved.bin");
const shown = [];
const host = { hostConfig: { kind: "local" }, readFile };
const registry = { get: () => host, getMaybe: () => host };

const statIfExists = async (filePath) => {
  try { return await stat(filePath); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
};
const etag = (value) => value == null ? "missing" : `stat:${value.mtimeMs}:${value.ctimeMs}:${value.size}`;
const atomicWrite = async (filePath, load) => {
  const value = await load();
  if (value instanceof Readable) {
    const chunks = [];
    for await (const chunk of value) chunks.push(chunk);
    await writeFile(filePath, Buffer.concat(chunks));
  } else await writeFile(filePath, value);
};

const WorkspaceFileService = createWorkspaceFileServiceClass({
  runtime: {
    Uf: class {},
    Es: () => false,
    Di: {
      mkdir: (filePath, options) => mkdir(filePath, options),
      stat: (filePath) => stat(filePath),
      readFileSampleBytes: async (filePath, _host, count) =>
        (await readFile(filePath)).subarray(0, count),
      readFile: (filePath) => readFile(filePath, "utf8"),
      readFileBase64: async (filePath) => (await readFile(filePath)).toString("base64"),
      writeFileBuffer: (filePath, bytes) => writeFile(filePath, bytes),
      copyFile: (from, to, _host, options) => copyFile(from, to, options?.exclusive ? fsConstants.COPYFILE_EXCL : 0),
    },
  },
  path,
  os,
  crypto: {},
  fsPromises: { mkdtemp, writeFile, rm },
  electron: {
    app: {
      getPath: () => downloads,
      getFileIcon: async () => ({ isEmpty: () => false, toDataURL: () => "data:image/png;base64,icon" }),
    },
    dialog: { showSaveDialog: async () => ({ canceled: false, filePath: savePath }) },
    nativeImage: { createThumbnailFromPath: async () => assert.fail("unexpected thumbnail") },
  },
  stream: { Readable },
  sanitizeFileName: (name) => path.basename(name),
  isFileTooLarge: (size) => size > 10,
  maxFileBytes: 10,
  showItemInFolder: (filePath) => shown.push(filePath),
  resolveWorkspacePath: async (filePath) => filePath,
  resolveLocalWorkspacePath: (filePath) => filePath,
  atomicDownloadWrite: atomicWrite,
  classifyBuffer: async (buffer) => buffer.includes(0) ? { blob: buffer.toString("base64") } : { text: buffer.toString("utf8") },
  normalizeBase64: (value) => typeof value === "string" ? value : value.toString("base64"),
  decodeBase64: (value) => typeof value === "string" ? Buffer.from(value, "base64") : value,
  statIfExists,
  createEtag: etag,
  thumbnailMaxBytes: 40 * 1024 * 1024,
  thumbnailMaxDimension: 512,
  thumbnailConcurrency: 16,
  operationTimeoutMs: 5_000,
});

const service = new WorkspaceFileService(registry, {});
const directory = path.join(root, "nested");
await service.createDirectory({ hostId: "local", path: directory });
assert.equal((await stat(directory)).isDirectory(), true);
assert.deepEqual(await service.getMetadata({ hostId: "local", path: directory }), { kind: "directory" });
assert.deepEqual(await service.getMetadata({ hostId: "local", path: source }), { kind: "file" });

const text = await service.read({ hostId: "local", path: source, representation: "auto", maxBytes: 20 });
assert.equal(text.text, "hello");
assert.match(text.etag, /^stat:/);
const blob = await service.read({ hostId: "local", path: source, representation: "blob" });
assert.equal(blob.blob, Buffer.from("hello").toString("base64"));
await assert.rejects(
  () => service.read({ hostId: "local", path: source, representation: "text", maxBytes: 2 }),
  /size limit/,
);

const conflict = await service.write({ bytes: new Uint8Array([1]), hostId: "local", ifMatch: "wrong", path: source });
assert.equal(conflict.outcome, "conflict");
const saved = await service.write({ bytes: new TextEncoder().encode("world"), hostId: "local", path: source });
assert.equal(saved.outcome, "saved");
assert.equal(await readFile(source, "utf8"), "world");
assert.deepEqual(await service.write({ bytes: new Uint8Array(11), hostId: "local", path: source }), { maxBytes: 10, outcome: "too-large" });

const temporary = await service.createTemporaryFile({ bytes: new TextEncoder().encode("tmp"), fileName: "../preview.txt" });
assert.equal(path.basename(temporary.path), "preview.txt");
assert.equal(await readFile(temporary.path, "utf8"), "tmp");
await service.releaseTemporaryFile({ path: temporary.path });
await assert.rejects(() => stat(temporary.path), /ENOENT/);

await service.saveCopy({ bytes: new Uint8Array([7, 8]), fileName: "save.bin" });
assert.deepEqual([...await readFile(savePath)], [7, 8]);
assert.equal(shown.at(-1), savePath);
await service.downloadCopy({ fileName: "copy.txt", hostId: "local", path: source });
assert.equal(await readFile(path.join(downloads, "copy.txt"), "utf8"), "world");
await service.downloadCopy({ fileName: "copy.txt", hostId: "local", path: source });
assert.equal(await readFile(path.join(downloads, "copy (1).txt"), "utf8"), "world");
assert.equal(await service.getDownloadsFolderIcon(), "data:image/png;base64,icon");

const disposable = await service.createTemporaryFile({ bytes: new Uint8Array([1]), fileName: "dispose.bin" });
service.dispose();
await new Promise((resolve) => setTimeout(resolve, 20));
await assert.rejects(() => stat(disposable.path), /ENOENT/);
await assert.rejects(() => service.createTemporaryFile({ bytes: new Uint8Array([1]), fileName: "late" }), /disposed/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /p\$e = createWorkspaceFileServiceClass\(\{/);
assert.doesNotMatch(main, /p\$e = class/);

await rm(root, { recursive: true, force: true });
console.log("workspace file service assertions: 26");
