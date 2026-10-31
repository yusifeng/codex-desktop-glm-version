import assert from "node:assert/strict";
import fs from "node:fs";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/cloud/environment-fs.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const declaration = (name) => ast.body.find((node) =>
  (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id?.name === name,
);
const slice = (name) => {
  const node = declaration(name);
  assert.ok(node, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(node.start, node.end);
};

const objectSchema = () => ({ parse: (value) => value });
const stringSchema = () => ({ nullish() { return this; } });
const readRemoteFile = Function(
  "objectSchema",
  "stringSchema",
  `${slice("readRemoteFile")}; return readRemoteFile;`,
)(objectSchema, stringSchema);
equal(
  await readRemoteFile(async () => ({ dataBase64: Buffer.from("hello").toString("base64") }), {
    environmentId: "durable",
    path: "/workspace/a.txt",
  }),
  Buffer.from("hello"),
);

const requireExecutor = Function(`${slice("requireExecutor")}; return requireExecutor;`)();
equal(requireExecutor("durable"), "durable");
assert.throws(() => requireExecutor(""), /No executor is attached/);
assertions += 1;

class EventEmitterBase {}
const metadataSchema = { parse: (value) => value };
const sampled = [];
const CloudEnvironmentFsService = Function(
  "EventEmitterBase",
  "posix",
  "fileURLToPath",
  "metadataSchema",
  "objectSchema",
  "stringSchema",
  "booleanSchema",
  "arraySchema",
  "readRemoteFile",
  "requireExecutor",
  "sniffContentKind",
  `${slice("CloudEnvironmentFsService")}; return CloudEnvironmentFsService;`,
)(
  EventEmitterBase,
  posix,
  fileURLToPath,
  metadataSchema,
  objectSchema,
  stringSchema,
  () => ({}),
  () => ({}),
  readRemoteFile,
  requireExecutor,
  async (data) => { sampled.push(data.toString("utf8")); return "text"; },
);

const requests = [];
let metadata = { isDirectory: true, isFile: false, isSymlink: false, createdAtMs: 0, modifiedAtMs: 10 };
let info = { cwd: "file:///workspace/cloud" };
let listing = { entries: [] };
let fileContents = Buffer.from("hello");
const service = new CloudEnvironmentFsService(async (method, params) => {
  requests.push([method, params]);
  if (method === "fs/getMetadata") return metadata;
  if (method === "environment/info") return info;
  if (method === "fs/readDirectory") return listing;
  if (method === "fs/readFile") return { dataBase64: fileContents.toString("base64") };
  throw new Error(`unexpected ${method}`);
});

equal(await service.getRoot({ environmentId: "durable", cwd: "/workspace/direct" }), "/workspace/direct");
equal(await service.getRoot({ environmentId: "durable", cwd: "relative" }), "/workspace/cloud");

metadata = { isDirectory: false, isFile: true, isSymlink: false, createdAtMs: 0, modifiedAtMs: 20 };
equal(await service.getMetadata({
  environmentId: "durable",
  path: "/workspace/a.txt",
  contentSampleByteLimit: 3,
}), {
  contentKind: "text",
  createdAtMs: null,
  isFile: true,
  mtimeMs: 20,
  sizeBytes: 5,
});
equal(sampled, ["hel"]);
equal((await service.getMetadata({
  environmentId: "durable",
  path: "/workspace/a.txt",
  contentSampleByteLimit: 3,
  contentSampleMaxFileBytes: 4,
})).contentKind, undefined);

metadata = { isDirectory: true, isFile: false, isSymlink: false, createdAtMs: 1, modifiedAtMs: 2 };
listing = { entries: [
  { fileName: "z.txt", isDirectory: false, isFile: true },
  { fileName: ".hidden", isDirectory: false, isFile: true },
  { fileName: "beta", isDirectory: true, isFile: false },
  { fileName: "alpha", isDirectory: true, isFile: false },
] };
equal(await service.readDirectory({
  environmentId: "durable",
  workspaceRoot: "/workspace",
  directoryPath: "src",
}), {
  workspaceRoot: "/workspace",
  directoryPath: "src",
  parentPath: "",
  entries: [
    { name: "alpha", path: "src/alpha", type: "directory" },
    { name: "beta", path: "src/beta", type: "directory" },
    { name: "z.txt", path: "src/z.txt", type: "file" },
  ],
});
await rejects(service.readDirectory({
  environmentId: "durable",
  workspaceRoot: "/workspace",
  directoryPath: "../outside",
}), /stay within workspaceRoot/);
metadata = { ...metadata, isSymlink: true };
await rejects(service.readDirectory({
  environmentId: "durable",
  workspaceRoot: "/workspace",
  directoryPath: "linked",
}), /not a symlink/);
equal(requests.some(([method]) => method === "environment/info"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(
  main.includes('const { CloudEnvironmentFsService: Wze, readRemoteFile: rH, requireExecutor: iH } = require("./main-app/cloud/environment-fs.js");'),
  true,
);
equal(main.includes("Wze = class"), false);
equal(main.includes("async function rH("), false);
equal(main.includes("function iH("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
const fetchHandler = fs.readFileSync(new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url), "utf8");
equal(windowContext.includes("hostedThreadFiles: new Wze("), true);
equal(fetchHandler.includes("s = await rH("), true);
equal(fetchHandler.includes("{ environmentId: iH(e), path: r }"), true);

console.log(`${assertions} main cloud environment fs owner assertions passed`);
