import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-git-file-content-"));
const output = path.join(tempDir, "git-file-content.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/git-file-content.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { readGitFileContent } = createRequire(import.meta.url)(output);
const pathApi = { isAbsolute: path.isAbsolute, join: path.join, relative: path.relative, sep: path.sep };
const calls = [];
const dependencies = {
  getWorktreeRepository: async () => ({ root: "/repo" }),
  platformPath: async () => pathApi,
  runGit: async (repo, args, host, options) => {
    calls.push({ repo, args, host, options });
    return { code: 0, stdoutBuffer: Buffer.from("hello") };
  },
  detectMimeType: async bytes => bytes[0] === 104 ? "text/plain" : null,
};
assert.deepEqual(await readGitFileContent({ cwd: "/repo", path: "src/a.txt", ref: "head" }, "local", undefined, dependencies), { contentsBase64: Buffer.from("hello").toString("base64"), mimeType: "text/plain" });
assert.deepEqual(calls[0].args, ["show", "HEAD:src/a.txt"]);
assert.deepEqual(await readGitFileContent({ cwd: "/repo", path: "../secret" }, "local", undefined, dependencies), { contentsBase64: null });
assert.equal(calls.length, 1);
const empty = { ...dependencies, runGit: async () => ({ code: 0, stdoutBuffer: Buffer.alloc(0) }) };
assert.deepEqual(await readGitFileContent({ cwd: "/repo", path: "empty" }, "local", undefined, empty), { contentsBase64: null });
console.log("4 worker Git file content assertions passed");
