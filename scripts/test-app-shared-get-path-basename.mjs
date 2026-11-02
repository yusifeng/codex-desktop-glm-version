import assert from "node:assert/strict";
import fs from "node:fs";
import esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const sourcePath = new URL("../src/renderer/app-shared/runtime/get-path-basename.ts", import.meta.url).pathname;
for (const consumer of ["local-conversation-artifacts-signals", "local-conversation-summary-panel-sources-model", "text-file-thumbnail"]) {
  const source = fs.readFileSync(new URL(`../src/renderer/${consumer}/index.ts`, import.meta.url), "utf8");
  assert.match(source, /app-shared\/runtime\/get-path-basename/);
  assert.doesNotMatch(source, /\bII as getPathBasename\b/);
}
assertReleaseOwner("restore-image-preview-tab");
assertReleaseOwner("terminal-tab");
assertReleaseOwner("select-workspace-page");
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { getPathBasename } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(getPathBasename("/workspace/project/"), "project");
assert.equal(getPathBasename("file.txt"), "file.txt");
assert.equal(getPathBasename("////"), "");
assert.equal(getPathBasename("C:\\workspace\\project\\file.txt"), "file.txt");
assert.equal(getPathBasename("\\\\?\\C:\\workspace\\project\\"), "project");
assert.equal(getPathBasename("\\\\?\\UNC\\server\\share\\folder\\"), "folder");
console.log("app-shared path basename projection: 18 assertions passed");
