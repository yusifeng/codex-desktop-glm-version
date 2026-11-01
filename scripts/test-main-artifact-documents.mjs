import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import * as esbuild from "esbuild";
import { z } from "zod";

const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.resolve(import.meta.dirname, "../src/main/main-app/artifacts/artifact-documents.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createArtifactDocumentsClass } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

const fileBytes = new Map([["/workspace/file.pptx", Buffer.from("public-file")]]);
const fsCalls = [];
const fakeFs = {
  realpath: async (path) => path,
  stat: async (path) => ({
    isFile: () => path !== "/workspace",
    isDirectory: () => path === "/workspace",
    mode: 0o100644,
  }),
  unlink: async (path) => fsCalls.push(["unlink", path]),
  open: async () => { throw new Error("not needed"); },
  rename: async () => {},
};
const runtime = {
  Uf: class {},
  Of: () => z.string(),
  wf: (shape) => z.object(shape),
  ff: (value) => z.instanceof(value),
  df: (values) => z.enum(values),
  Cf: () => z.number(),
};
const storeCalls = [];
const record = {
  documentId: "document",
  checkpointStateVersion: 1,
  materializedStateVersion: 1,
  stateVersion: 2,
  publicFileHash: "hash",
};
const store = {
  find: async (request) => { storeCalls.push(["find", request]); return { status: "ok", value: record }; },
  adopt: async (request) => { storeCalls.push(["adopt", request]); return { status: "ok", value: record }; },
  read: async (request) => { storeCalls.push(["read", request]); return { status: "ok", value: record }; },
  append: async (request) => {
    storeCalls.push(["append", request]);
    return {
      status: "ok",
      value: {
        applied: true,
        stateVersion: 3,
        record: { ...record, stateVersion: 3, materializedStateVersion: 2 },
        committedUpdate: { updateId: request.updateId },
      },
    };
  },
  getPendingMaterialization: async () => ({ status: "ok", value: null }),
  refreshCleanSession: async (request) => ({ status: "ok", value: request }),
  beginMaterialization: async () => { throw new Error("too-large should short-circuit"); },
  finishMaterialization: async () => { throw new Error("not needed"); },
};
const ArtifactDocuments = createArtifactDocumentsClass({
  runtime,
  path: { isAbsolute: (path) => path.startsWith("/"), join: (...parts) => parts.join("/"), dirname: (path) => path.slice(0, path.lastIndexOf("/")) },
  fs: fakeFs,
  isPathInside: (file, root) => file.startsWith(`${root}/`),
  isFileTooLarge: (size) => size > 10,
  maxFileBytes: 10,
  pipeline: async (source, hash) => { hash.update(fileBytes.get(source)); },
  createReadStream: (path) => path,
  createHash,
  randomUUID: () => "uuid",
  platform: "linux",
  structuredCloneFn: structuredClone,
});
const documents = new ArtifactDocuments({ store, getAllowedWorkspaceRoots: async () => ["/workspace"] });
const base = { publicFilePath: "/workspace/file.pptx", workspaceRoot: "/workspace" };
const expectedHash = createHash("sha256").update(fileBytes.get(base.publicFilePath)).digest("hex");

const found = await documents.find(base);
assert.equal(found.status, "ok");
assert.equal(storeCalls[0][0], "find");
assert.equal(storeCalls[0][1].publicFilePath, base.publicFilePath);
assert.equal(storeCalls[0][1].publicFileHash, expectedHash);

await assert.rejects(
  () => documents.adopt({ ...base, publicFileHash: "0".repeat(64), checkpoint: new Uint8Array(), documentId: "document", kind: "presentation" }),
  /hash does not match/,
);
const adopted = await documents.adopt({ ...base, publicFileHash: expectedHash, checkpoint: new Uint8Array([1]), documentId: "document", kind: "presentation" });
assert.equal(adopted.status, "ok");
assert.equal(storeCalls.at(-1)[0], "adopt");
assert.equal(storeCalls.at(-1)[1].kind, "presentation");

const read = await documents.read({ ...base, documentId: "document" });
assert.equal(read.value.documentId, "document");
assert.equal(storeCalls.at(-1)[0], "read");

const listenerValues = [];
let listenerDisposed = 0;
let broken;
const listener = (value) => { listenerValues.push(value); return { [Symbol.dispose]: () => {} }; };
listener.onRpcBroken = (callback) => { broken = callback; };
listener[Symbol.dispose] = () => { listenerDisposed += 1; };
const subscribed = await documents.subscribe({ ...base, documentId: "document" }, { dup: () => listener });
assert.equal(subscribed.status, "ok");
assert.equal(typeof subscribed.value.subscription.unsubscribe, "function");

const appended = await documents.append({
  ...base,
  documentId: "document",
  baseStateVersion: 2,
  bytes: new Uint8Array([2]),
  originId: "origin",
  source: "user",
  updateId: "update",
});
assert.deepEqual(appended, { status: "ok", value: { applied: true, stateVersion: 3 } });
assert.equal(listenerValues.length, 1);
assert.equal(listenerValues[0].documentId, "document");
assert.equal(listenerValues[0].stateVersion, 3);
broken();
assert.equal(listenerDisposed, 1);
subscribed.value.subscription.unsubscribe();
assert.equal(listenerDisposed, 1);

const tooLarge = await documents.materialize({
  ...base,
  documentId: "document",
  expectedStateVersion: 3,
  materializationId: "materialization",
  publicFileBytes: new Uint8Array(11),
});
assert.deepEqual(tooLarge, { status: "ok", value: { maxBytes: 10, outcome: "too-large" } });

const exact = await documents.bindToExactFile({ publicFilePath: base.publicFilePath });
assert.equal((await exact.find(base)).status, "ok");
await assert.rejects(
  () => exact.find({ publicFilePath: "/workspace/other.pptx", workspaceRoot: "/workspace" }),
  /exact-file binding/,
);
await assert.rejects(
  () => documents.find({ publicFilePath: "relative", workspaceRoot: "/workspace" }),
  /Expected an absolute local path/,
);
await assert.rejects(
  () => documents.find({ publicFilePath: "/outside/file", workspaceRoot: "/outside" }),
  /not authorized/,
);
assert.deepEqual(fsCalls, []);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /Z5e = createArtifactDocumentsClass\(\{/);
assert.doesNotMatch(main, /Z5e = class/);
assert.doesNotMatch(main, /function \$5e\(/);
assert.doesNotMatch(main, /function b4\(/);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
assert.match(windowContext, /this\.artifactDocuments = new Z5e\(\{/);

console.log("artifact documents assertions: 31");
