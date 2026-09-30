import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHUNKS, PRESERVED_ASSETS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.resolve(root, "../chatgpt-desktop-src/app/webview/assets");
const audits = ["a", "b", "c"].flatMap((suffix) => {
  const parsed = JSON.parse(fs.readFileSync(path.join(root, "docs", `misc-ui-utils-audit-${suffix}.json`), "utf8"));
  return Array.isArray(parsed) ? parsed : parsed.entries;
});
const auditByFile = new Map(audits.map((entry) => [entry.file, entry]));
const entries = [
  ["bell-icon-definition", "bell-BoHq-7gy-5a0d1c0ad91e.js", "generated:icon-definition"],
  ["bell-icon-definition-variant-2", "bell-DFgib1XV-a9d529970bdb.js", "generated:icon-definition"],
  ["bell-icon-variant-2", "bell-f190ed5fc2db.js", "generated:vector-icon"],
  ["calendar-icon-definition", "calendar-BM0FjOnq-2fd6280945c2.js", "generated:icon-definition"],
  ["calendar-icon", "calendar-d074c0f6f12a.js", "generated:vector-icon"],
  ["card-icon-definition", "card-CZrXqcnR-657261a0d01a.js", "generated:icon-definition"],
  ["card-icon", "card-ccdd7a82e0c2.js", "generated:vector-icon"],
  ["championship-icon-definition", "championship-cup-DVJjBfBN-159a1c5732e5.js", "generated:icon-definition"],
  ["championship-cup-icon", "championship-cup-a99b20ab1516.js", "generated:vector-icon"],
  ["chatgpt-voice-analytics-protobuf", "chatgpt_voice-cb350881bdb5.js", "generated:analytics-protobuf"],
  ["christmas-icon-definition", "christmas-CEq7vk6b-d68d93ab1ae5.js", "generated:icon-definition"],
  ["christmas-icon", "christmas-f6408fae1325.js", "generated:vector-icon"],
  ["clike-syntax-definition", "clike-ce9cd077a325.js", "data:syntax-definition"],
  ["clojure-syntax-definition", "clojure-c69d8cb25c09.js", "data:syntax-definition"],
  ["codex-dark-syntax-theme", "codex-dark-5fb95d1c65ca.js", "data:syntax-theme"],
  ["codex-light-syntax-theme", "codex-light-53d4e35e1869.js", "data:syntax-theme"],
  ["commonlisp-syntax-definition", "commonlisp-7766ebc65967.js", "data:syntax-definition"],
  ["core-vendor-runtime", "core-51383d4e7880.js", "vendor:generated-core-runtime"],
  ["core-vendor-runtime-variant-2", "core-cd4391224cfa.js", "vendor:generated-core-runtime"],
  ["cose-bilkent-jh36-orcc-vendor-runtime", "cose-bilkent-JH36ORCC-dccf435aa34f.js", "vendor:cose-bilkent"],
  ["cytoscape-esm-vendor-runtime", "cytoscape.esm-1029c72ddab6.js", "vendor:cytoscape"],
  ["cytoscape-esm-vendor-runtime-variant-2", "cytoscape.esm-9c90b5045aa0.js", "vendor:cytoscape"],
  ["dockerfile-syntax-definition", "dockerfile-52b80bf56b3a.js", "data:syntax-definition"],
  ["dotnet-vendor-runtime", "dotnet.js", "vendor:dotnet-runtime"],
  ["dotnet-native-k09zdxq5tw-vendor-runtime", "dotnet.native.k09zdxq5tw.js", "vendor:dotnet-runtime"],
  ["dotnet-runtime-8ha609180a-vendor-runtime", "dotnet.runtime.8ha609180a.js", "vendor:dotnet-runtime"],
  ["evernote-icon", "evernote-e9492a3aad7c.js", "generated:vector-icon"],
  ["garden-icon-definition", "garden-expo-C-1eaTwJ-deb2ff3190ef.js", "generated:icon-definition"],
  ["garden-expo-icon", "garden-expo-e7f355b8c6f1.js", "generated:vector-icon"],
  ["globe-icon", "globe-3e04dc794d34.js", "generated:vector-icon"],
  ["globe-icon-definition", "globe-CIKsZs85-4798bf5743a6.js", "generated:icon-definition"],
  ["hammer-vendor-runtime", "hammer-af276e28ba3d.js", "vendor:hammer"],
  ["haskell-syntax-definition", "haskell-99fa71648973.js", "data:syntax-definition"],
  ["lodash-union-runtime-initialized", "union-2f12e2dfc01f.js", "vendor:lodash-union"],
  ["lodash-union-runtime-direct", "union-5a693e552c13.js", "vendor:lodash-union"],
  ["codemirror-visual-basic-mode", "vb-22c198681731.js", "data:codemirror-language-mode"],
  ["vercel-dark-theme", "vercel-dark-fe3b20ba4c28.js", "data:syntax-theme"],
  ["vercel-light-theme", "vercel-light-91ea99803eaa.js", "data:syntax-theme"],
  ["codemirror-verilog-mode", "verilog-6d1b0f2b4c27.js", "data:codemirror-language-mode"],
  ["phone-metadata-argument-wrapper", "withMetadataArgument-d4cb51a53bdb.js", "data:libphonenumber-metadata"],
  ["pdf-processing-worker", "worker-3fe306248590.js", "generated:worker-runtime"],
  ["shiki-highlight-worker", "worker-49a232674c13.js", "generated:worker-runtime"],
  ["yjs-runtime", "yjs-ce18c78ffd5e.js", "vendor:yjs"],
  ["lodash-zip-object-runtime", "zipObject-b39425e8947b.js", "vendor:lodash-zip-object"],
];
for (const [name, file, reason] of entries) {
  assert.equal(CHUNKS[name], file);
  assert.equal(PRESERVED_ASSETS.get(name), reason);
  assert.equal(auditByFile.get(file)?.action, "preserve");
  assert.ok(fs.readFileSync(path.join(releaseAssets, file), "utf8").length > 0);
}
console.log("misc-ui-utils preserve PJ validated: 44 generated, data, and vendor assets");
