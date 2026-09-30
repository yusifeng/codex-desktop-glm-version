import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHUNKS, PRESERVED_ASSETS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.resolve(root, "../chatgpt-desktop-src/app/webview/assets");
const audits = ["a", "b", "c"].flatMap((suffix) => {
  const parsed = JSON.parse(
    fs.readFileSync(path.join(root, "docs", `misc-ui-utils-audit-${suffix}.json`), "utf8"),
  );
  return Array.isArray(parsed) ? parsed : parsed.entries;
});
const auditByFile = new Map(audits.map((entry) => [entry.file, entry]));
const entries = [
  ["south-korea-flag-cufo4zo2-asset", "south-korea-flag-CUfO4zo2-f7bc58108b90.js", "data:image-asset"],
  ["south-korea-flag-image-asset", "south-korea-flag-f24fcc414014.js", "data:image-asset"],
  ["step-runtime", "step-cc59eba019a7.js", "vendor:generated-step-runtime"],
  ["swift-textmate-grammar", "swift-8dfd81d616cd.js", "data:syntax-definition"],
  ["image-preview-tab-content-generated", "tab-content-2527923eeaf8.js", "generated:compiled-ui-surface"],
  ["temple-dark-theme", "temple-dark-9eae56d88ac5.js", "data:syntax-theme"],
  ["three-3d-renderer", "three-3d-renderer-2525bc9c3e2f.js", "generated:three-visualization"],
  ["three-core", "three.core-cb39b1271a0d.js", "vendor:threejs"],
  ["triangle-family-visualization-generated", "triangle-family-visualization-fd60f9de90c5.js", "generated:visualization-geometry"],
  ["trusted-contact-actions", "trusted-contact-actions-684784399376.js", "generated:compiled-ui-actions"],
  ["tsrx-declarations", "tsrx.declarations-93502ef017af.js", "data:textmate-grammar"],
  ["tsrx-statements-and-expressions", "tsrx.statements-and-expressions-531d58afef27.js", "data:textmate-grammar"],
  ["tsrx-tmlanguage", "tsrx.tmLanguage-8ec48b56e0ab.js", "data:textmate-grammar"],
];
for (const [name, file, reason] of entries) {
  assert.equal(CHUNKS[name], file);
  assert.equal(PRESERVED_ASSETS.get(name), reason);
  assert.equal(auditByFile.get(file)?.action, "preserve");
  assert.match(fs.readFileSync(path.join(releaseAssets, file), "utf8"), /\bexport\b/);
}
console.log("misc-ui-utils preserve PH validated: 13 generated, data, and vendor assets");
