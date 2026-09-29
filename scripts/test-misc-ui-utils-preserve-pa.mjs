import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHUNKS, PRESERVED_ASSETS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.resolve(
  root,
  "../chatgpt-desktop-src/app/webview/assets",
);

const syntaxEntries = [
  ["go-syntax-definition", "go-9a5eb757db6b.js", "go-9204c07b28c2.js"],
  ["cpp-syntax-definition", "cpp-115418ba4245.js", "cpp-73c01217e4f2.js"],
  ["csv-syntax-definition", "csv-b6e2b8c81267.js", "csv-ce71efbe80f9.js"],
  ["glsl-syntax-definition", "glsl-a0fe947a2b45.js", "glsl-984664825cc1.js"],
  ["haml-syntax-definition", "haml-d470fdfe9f4c.js", "haml-3bbab7efb1b9.js"],
  ["haxe-syntax-definition", "haxe-5f4404ed24c9.js", "haxe-4b8170017548.js"],
  ["hlsl-syntax-definition", "hlsl-246e1a652ff1.js", "hlsl-a292573f74ca.js"],
  ["cmake-syntax-definition", "cmake-1858d5f79e7c.js", "cmake-41f37fc34f77.js"],
  ["csharp-syntax-definition", "csharp-8c303cc1438c.js", "csharp-3b3778d82232.js"],
  ["gdscript-syntax-definition", "gdscript-f14b099b0cfd.js", "gdscript-a2165fb2e1cc.js"],
  ["gdshader-syntax-definition", "gdshader-df74c669b2ed.js", "gdshader-19d346c8700a.js"],
];

for (const [semanticName, fileName, dependency] of syntaxEntries) {
  assert.equal(CHUNKS[semanticName], fileName);
  assert.equal(PRESERVED_ASSETS.get(semanticName), "vendor:syntax-definition-entry");
  const source = fs.readFileSync(path.join(releaseAssets, fileName), "utf8");
  assert.ok(source.includes('from "./' + dependency + '"'));
  assert.match(source, /export \{ [A-Za-z_$][\w$]* as default \};/);
  assert.equal((source.match(/from "/g) ?? []).length, 1);
}

const hammerName = "hammer-vendor-runtime-variant-2";
const hammerFile = "hammer-edb1316c3532.js";
assert.equal(CHUNKS[hammerName], hammerFile);
assert.equal(PRESERVED_ASSETS.get(hammerName), "vendor:hammer-entry");
const hammerSource = fs.readFileSync(path.join(releaseAssets, hammerFile), "utf8");
assert.match(hammerSource, /from "\.\/hammer-af276e28ba3d\.js"/);
assert.match(hammerSource, /export default [A-Za-z_$][\w$]*\(\);/);
assert.equal((hammerSource.match(/from "/g) ?? []).length, 1);

console.log("misc-ui-utils preserve PA validated: 12 vendor entry wrappers");
