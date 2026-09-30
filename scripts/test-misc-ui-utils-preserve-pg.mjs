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
  ["ads-placement-generated-surface", "placement-15206b2c8ead.js", "generated:compiled-ui-surface"],
  ["powershell-textmate-grammar", "powershell-242ce14e5ebb.js", "data:syntax-definition"],
  ["motion-proxy-runtime", "proxy-898332770620.js", "vendor:motion-proxy"],
  ["r-textmate-grammar", "r-e2816acf1612.js", "data:syntax-definition"],
  ["raycast-dark-theme", "raycast-dark-d8918c2e5e09.js", "data:syntax-theme"],
  ["raycast-light-theme", "raycast-light-b4a56c15bc92.js", "data:syntax-theme"],
  ["react-redux-runtime", "react-redux-14f5167095ae.js", "vendor:react-redux"],
  ["generated-registry-runtime", "registry-a50f1d1438fa.js", "generated:registry-data"],
  ["reminder-image-asset", "reminder-9829ac9965d5.js", "data:image-asset"],
  ["reminder-cij3xhi-asset", "reminder-Cij-3xHI-0aae7c31d5b9.js", "data:image-asset"],
  ["rough-esm-runtime-a", "rough.esm-3e53fd338f7d.js", "vendor:roughjs"],
  ["rough-esm-runtime-b", "rough.esm-dc8b11ccd8a8.js", "vendor:roughjs"],
  ["routing-middleware-runtime", "routing-middleware-7ff0d0c09cc6.js", "vendor:routing-middleware"],
  ["ruby-textmate-grammar", "ruby-4b369efc8a8f.js", "data:syntax-definition"],
  ["shell-textmate-grammar", "shell-d2f5d33d6a1d.js", "data:syntax-definition"],
  ["shortcut-bpzog55-asset", "shortcut-BPZOg55_-58cd8503c5d3.js", "data:image-asset"],
  ["shortcut-image-asset", "shortcut-fbabb0d66a01.js", "data:image-asset"],
  ["silero-vad", "silero-vad-52ec2f0850d3.js", "vendor:voice-activity-detection"],
  ["soccer-ball-image-asset", "soccer-ball-6c1d6824d40b.js", "data:image-asset"],
  ["soccer-ball-dqqctqwp-asset", "soccer-ball-DQQcTqwp-752da15540f3.js", "data:image-asset"],
];
for (const [name, file, reason] of entries) {
  assert.equal(CHUNKS[name], file);
  assert.equal(PRESERVED_ASSETS.get(name), reason);
  const audit = auditByFile.get(file);
  assert.equal(audit?.action, "preserve");
  const source = fs.readFileSync(path.join(releaseAssets, file), "utf8");
  assert.match(source, /\bexport\b/);
  assert.ok(source.length > 0);
}
console.log("misc-ui-utils preserve PG validated: 20 generated, data, and vendor assets");
