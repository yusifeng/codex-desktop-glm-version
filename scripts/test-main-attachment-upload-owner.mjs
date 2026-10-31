import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/attachments/upload.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
Function("module", "exports", transpiled.code)(module, module.exports);
const owner = module.exports;
const uuid = "12345678-1234-4123-8123-123456789abc";
const calls = [];
const files = new Map([
  ["/local/one.txt", "b25l"],
  ["/local/two.txt", "dHdv"],
]);
const host = {
  createId: () => uuid,
  getCodexHome: async () => "/codex",
  getBasename: (value) => value.split(/[\\/]/).at(-1),
  joinPath: (...parts) => parts.join("/").replaceAll("//", "/"),
  joinHostPath: (...parts) => parts.join("/").replaceAll("//", "/"),
  encodeText: (text) => Buffer.from(text).toString("base64"),
  decodeText: (text) => Buffer.from(text, "base64").toString(),
  encodeBytes: (bytes) => Buffer.from(bytes).toString("base64"),
  getTextExcerpt: (text) => text.slice(0, 10),
  getMaxDirectTransferBytes: () => 10,
  readLocalFileSize: async (path) => files.get(path)?.length ?? null,
  readLocalFile: async (path) => files.get(path) ?? null,
  uploadLocalFile: async (...args) => calls.push(["sftp", ...args]),
};
const requestClient = {
  async sendRequest(method, params) {
    calls.push([method, params]);
    if (method === "fs/readFile") { const error = new Error("ENOENT"); error.code = "ENOENT"; throw error; }
    return {};
  },
};
const uploader = new owner.FileAttachmentUploader({ hostId: "host-1", isLocalHost: false, host, requestClient });
const uploaded = await uploader.uploadLocalFiles({
  attachments: [
    { label: "report.txt", fsPath: "/local/one.txt" },
    { label: "report.txt", fsPath: "/local/two.txt" },
  ],
  allowSftpUpload: false,
});
equal(uploaded.map((item) => item.path), [
  `/codex/attachments/${uuid}/report.txt`,
  `/codex/attachments/${uuid}/report-2.txt`,
]);
equal(calls.filter(([method]) => method === "fs/writeFile").length, 2);

host.readLocalFileSize = async () => 11;
await assert.rejects(
  uploader.uploadLocalFiles({ attachments: [{ label: "large.bin", fsPath: "/local/large.bin" }], allowSftpUpload: false }),
  (error) => error instanceof owner.FileAttachmentTooLargeError && error.maximumSizeBytes === 10,
);
assertions += 1;
await uploader.uploadLocalFiles({ attachments: [{ label: "large.bin", fsPath: "/local/large.bin" }], allowSftpUpload: true });
equal(calls.some(([method]) => method === "sftp"), true);

const directories = new owner.ThreadGoalAttachmentDirectories({ host, requestClient });
const directory = await directories.createDirectory();
const written = await directories.write({ directoryPath: directory.path, filename: "../note.txt", contentsBase64: "bm90ZQ==" });
equal(written.label, "note.txt");
await directories.remove(directory.path);
await assert.rejects(directories.write({ directoryPath: directory.path, filename: "again.txt", contentsBase64: "" }), /Unknown thread goal attachment directory/);
assertions += 1;

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const marker of ["var q_e = class", "Q_e = class extends Error", "$_e = class", "ive = class", "function ty(", "function eve(", "function tve(", "function nve("])
  equal(main.includes(marker), false);
const manager = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(manager.includes('import { $_e as FileAttachmentUploader, ive as ThreadGoalAttachmentDirectories } from "../attachments/upload"'), true);
equal(manager.includes("this.pastedTextAttachments = new FileAttachmentUploader({"), true);
equal(manager.includes("this.threadGoalAttachments = new ThreadGoalAttachmentDirectories("), true);

console.log(`${assertions} main attachment upload owner assertions passed`);
