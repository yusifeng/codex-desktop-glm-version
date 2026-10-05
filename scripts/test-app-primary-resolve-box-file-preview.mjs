import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const result = await esbuild.build({
  entryPoints: ["src/renderer/app-primary/runtime/resolve-box-file-preview.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { resolveBoxFilePreview } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

equal(
  resolveBoxFilePreview({ id: "external-box:file:123", name: "notes.boxnote", provider: "box" }, true),
  {
    previewUrl: "https://app.box.com/embed/file/123?showParentPath=false&hideNavigationControls=true",
    sourceUrl: "https://app.box.com/file/123",
  },
  "Box Notes use the restricted preview controls",
);
equal(
  resolveBoxFilePreview({ id: "external-box:account:acct_1:file:456", name: "report.pdf", mimeType: "application/pdf; charset=binary", provider: "box" }, true),
  {
    previewUrl: "https://app.box.com/embed/file/456?showParentPath=false&uxLite=true",
    sourceUrl: "https://app.box.com/file/456",
  },
  "regular Box files preserve the compact preview URL",
);
equal(resolveBoxFilePreview({ id: "external-box:file:0", name: "bad", provider: "box" }, true), null, "invalid file ids are rejected");
equal(resolveBoxFilePreview({ id: "external-box:file:123", name: "notes", provider: "dropbox" }, true), null, "non-Box providers are rejected");
equal(resolveBoxFilePreview({ id: "external-box:file:123", name: "notes", provider: "box" }, false), null, "disabled preview resolution is inert");

console.log(`app-primary Box file preview: ${assertions} assertions passed`);
