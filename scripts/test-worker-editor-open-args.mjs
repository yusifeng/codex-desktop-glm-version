import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";
const source = await fs.readFile("src/main/worker/editor-open-args.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { isRemoteHost, buildEditorOpenArgs, buildRemoteUri, buildRemoteEditorArgs, buildRemoteOpenArgs } = module.exports;

assert.equal(isRemoteHost({ kind: "ssh" }), true);
assert.equal(isRemoteHost({ kind: "wsl" }), true);
assert.equal(isRemoteHost({ kind: "remote-control" }), true);
assert.equal(isRemoteHost({ kind: "local" }), false);
assert.deepEqual(buildEditorOpenArgs("/tmp/a.txt", null), ["--goto", "/tmp/a.txt"]);
assert.deepEqual(buildEditorOpenArgs("a.txt", { line: 3, column: 7 }), ["--goto", "a.txt:3:7"]);
assert.equal(buildRemoteUri("ssh-remote+dev", "workspace/a b"), "vscode-remote://ssh-remote+dev/workspace/a%20b");
assert.deepEqual(
  buildRemoteEditorArgs({ remoteAuthority: "ssh-remote+dev", remoteWorkspaceRoot: "/repo", path: "/repo/a.ts", location: { line: 2, column: 4 } }),
  ["--folder-uri", "vscode-remote://ssh-remote+dev/repo", "--remote", "ssh-remote+dev", "--goto", "/repo/a.ts:2:4"],
);
assert.deepEqual(
  buildRemoteOpenArgs({ hostConfig: { name: "dev" }, remoteAuthority: "ssh-remote+dev", remoteWorkspaceRoot: "repo", remotePath: "a.ts" }),
  ["--folder-uri", "vscode-remote://ssh-remote+dev/repo", "--file-uri", "vscode-remote://ssh-remote+dev/a.ts"],
);
console.log("editor open args tests passed (9 assertions)");
