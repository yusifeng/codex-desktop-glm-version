import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/library-cloud-file-preview/preview-content-loader.ts", import.meta.url).pathname;
const built = await esbuild.build({
  bundle: true,
  entryPoints: [sourcePath],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const module = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const pending = [];
const calls = [];
const loader = module.createLibraryPreviewContentLoader({
  readBytes(file, signal) {
    calls.push(["bytes", file.fileName, signal]);
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  },
  readText(file, signal) {
    calls.push(["text", file.fileName, signal]);
    return new Promise((resolve, reject) => pending.push({ resolve, reject }));
  },
});
const file = { downloadUrl: "https://files.test/report", fileId: "file-1", fileName: "report.md" };
assert.equal(module.libraryPreviewContentKey(file, "markdown"), "file-1:markdown:https://files.test/report");

const textStates = [];
const disposeText = loader.load(file, "markdown", (state) => textStates.push(state));
assert.equal(textStates[0].status, "loading");
assert.equal(calls[0][0], "text");
pending.shift().resolve("# Report");
await Promise.resolve();
assert.deepEqual(textStates.at(-1), { content: "# Report", key: module.libraryPreviewContentKey(file, "markdown"), status: "ready" });
disposeText();

const staleStates = [];
loader.load(file, "pdf", (state) => staleStates.push(state));
assert.equal(calls[1][0], "bytes");
const stale = pending.shift();
const nextStates = [];
loader.load({ ...file, fileId: "file-2", fileName: "next.txt" }, "text", (state) => nextStates.push(state));
assert.equal(calls[1][2].aborted, true);
stale.resolve(new Uint8Array([1]));
pending.shift().resolve("next");
await Promise.resolve();
assert.equal(staleStates.length, 1);
assert.equal(nextStates.at(-1).content, "next");

const missingStates = [];
loader.load({ fileId: "missing", fileName: "missing.txt" }, "text", (state) => missingStates.push(state));
assert.deepEqual(missingStates[0], { error: "File preview URL unavailable", key: "missing:text:", status: "error" });

const unsupportedStates = [];
loader.load(file, "unsupported", (state) => unsupportedStates.push(state));
assert.equal(unsupportedStates.length, 0);

const errorStates = [];
loader.load(file, "artifact", (state) => errorStates.push(state));
pending.shift().reject(new Error("offline"));
await Promise.resolve();
assert.equal(errorStates.at(-1).error, "offline");
loader.cancel();

console.log("15 library cloud file preview content-loader assertions passed");
