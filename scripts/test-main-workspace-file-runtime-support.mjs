import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWorkspaceFileRuntimeSupport } from "../src/main/main-app/workspace/file-runtime-support.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

const root = await mkdtemp(path.join(os.tmpdir(), "workspace-file-support-"));
const fallbackRoot = path.join(root, "workspace");
await mkdir(path.join(fallbackRoot, "nested"), { recursive: true });
const classifySamples = [];
const remoteStats = [];
const support = createWorkspaceFileRuntimeSupport({
  fsPromises: fs.promises,
  path,
  randomUUID: () => "uuid",
  createHash: crypto.createHash,
  async classifySample(buffer) {
    classifySamples.push(buffer);
    return buffer.includes(0) ? "binary" : "text";
  },
  async statPath(filePath, executionHost, options) {
    remoteStats.push([filePath, executionHost, options]);
    if (filePath === "missing") {
      const error = new Error("missing");
      error.code = "ENOENT";
      throw error;
    }
    if (filePath === "denied") {
      const error = new Error("denied");
      error.code = "EACCES";
      throw error;
    }
    return { mtimeMs: 1, ctimeMs: 2, size: 3 };
  },
  isRemoteHostConfig: (hostConfig) => hostConfig.kind === "remote",
  convertPathForDesktopHost: (filePath, useWslPaths) =>
    useWslPaths ? `converted/${filePath}` : String(filePath),
  getUseWslPaths: (hostConfig) => hostConfig.useWslPaths === true,
  getPrimaryWorkspaceRoot: (roots) => Array.isArray(roots) ? roots[0] ?? null : null,
  getSelectedProject: (state) => state.selectedProject,
  getLocalProjects: (state) => ({ roots: state.localRoots ?? [] }),
  existsSync: fs.existsSync,
});

const existing = path.join(root, "existing.txt");
await writeFile(existing, "old", { mode: 0o640 });
await support.atomicDownloadWrite(existing, () => Buffer.from("new"));
equal(await readFile(existing, "utf8"), "new");
equal((await stat(existing)).mode & 0o777, 0o640);

const created = path.join(root, "created.txt");
await support.atomicDownloadWrite(created, async () => Buffer.from("created"));
equal(await readFile(created, "utf8"), "created");
equal((await stat(created)).mode & 0o600, 0o600);

const failed = path.join(root, "failed.txt");
await assert.rejects(
  () => support.atomicDownloadWrite(failed, () => { throw new Error("load failed"); }),
  /load failed/,
);
assertions += 1;
equal(fs.existsSync(failed), false);
equal((await readdir(root)).some((name) => name.endsWith(".chatgptdownload")), false);

const textBuffer = Buffer.from("hello");
equal(await support.classifyBuffer(textBuffer), { text: "hello" });
const binaryBuffer = Buffer.from([1, 0, 2]);
equal(await support.classifyBuffer(binaryBuffer), { blob: binaryBuffer.toString("base64") });
await support.classifyBuffer(Buffer.alloc(5_000, 1));
equal(classifySamples.at(-1).byteLength, 4_096);
equal(support.normalizeBase64(Buffer.from("value")), Buffer.from("value").toString("base64"));
equal(support.normalizeBase64("already"), "already");
equal(support.decodeBase64(Buffer.from("raw")), Buffer.from("raw"));
equal(support.decodeBase64(Buffer.from("decoded").toString("base64")), Buffer.from("decoded"));

const executionHost = { id: "host" };
equal(await support.statIfExists("missing", executionHost), null);
equal(await support.statIfExists("found", executionHost), { mtimeMs: 1, ctimeMs: 2, size: 3 });
await assert.rejects(() => support.statIfExists("denied", executionHost), /denied/);
assertions += 1;
equal(remoteStats[0], ["missing", executionHost, { bypassCache: true }]);
equal(support.createEtag(null), "missing");
equal(
  support.createEtag({ mtimeMs: 1, ctimeMs: 2, size: 3 }),
  `stat:${crypto.createHash("sha256").update("1:2:3").digest("base64url")}`,
);

equal(support.normalizeWorkspacePath("/absolute/file", fallbackRoot), "/absolute/file");
equal(support.normalizeWorkspacePath("", fallbackRoot), fallbackRoot);
equal(
  support.normalizeWorkspacePath("nested", fallbackRoot),
  path.join(fallbackRoot, "nested"),
);
equal(
  support.normalizeWorkspacePath("workspace/missing.txt", fallbackRoot),
  path.join(fallbackRoot, "missing.txt"),
);
equal(
  support.normalizeWorkspacePath("other/missing.txt", fallbackRoot),
  path.join(fallbackRoot, "other", "missing.txt"),
);
equal(support.normalizeWorkspacePath("relative", null), "relative");
equal(
  support.normalizeWorkspacePath("C:/repo/file", null, path.win32),
  "C:\\repo\\file",
);

const localState = {
  selectedProject: { rootPaths: [fallbackRoot] },
  localRoots: [path.join(root, "fallback")],
};
equal(
  support.resolveLocalWorkspacePath(
    "workspace/file.txt",
    { hostConfig: { kind: "local" } },
    localState,
  ),
  path.join(fallbackRoot, "file.txt"),
);
equal(
  support.resolveLocalWorkspacePath(
    "file.txt",
    { hostConfig: { kind: "local", useWslPaths: true } },
    { selectedProject: null, localRoots: [fallbackRoot] },
  ),
  path.join(fallbackRoot, "converted", "file.txt"),
);
equal(
  await support.resolveWorkspacePath(
    "/remote/file",
    { hostConfig: { kind: "remote" }, platformPath: async () => path.posix },
    localState,
  ),
  "/remote/file",
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const workspaceFiles = fs.readFileSync(
  new URL("../src/main/main-app/workspace/files.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createWorkspaceFileRuntimeSupport({"), true);
equal(main.includes("async function sQ("), false);
equal(main.includes("function pQ("), false);
equal(main.includes("function mQ("), false);
equal(workspaceFiles.includes("resolveWorkspacePath("), true);
equal(workspaceFiles.includes("atomicDownloadWrite("), true);
equal(workspaceFiles.includes("createEtag("), true);

await rm(root, { recursive: true, force: true });
console.log(`${assertions} main workspace-file runtime-support assertions passed`);
