import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHUNKS, PRESERVED_ASSETS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.resolve(root, "../chatgpt-desktop-src/app/webview/assets");
const auditEntries = ["a", "b", "c"].flatMap((suffix) => {
  const parsed = JSON.parse(
    fs.readFileSync(path.join(root, "docs", "misc-ui-utils-audit-" + suffix + ".json"), "utf8"),
  );
  return Array.isArray(parsed) ? parsed : parsed.entries;
});
const auditByFile = new Map(auditEntries.map((entry) => [entry.file, entry]));

const iconEntries = [
  ["share-icon-cbwc0sfw-asset", "share-icon-CbWc0sFW-7906276a0810.js"],
  ["bookmark-filled-icon", "BookmarkFilled-8398e992a776.js"],
  ["share-icon", "share-icon-cd41e1d8e1f4.js"],
  ["lightbulb-filled-icon", "LightbulbFilled-e8d4e10695cd.js"],
  ["table2x2-fill-icon", "Table2x2Fill-70adc4ff4dd5.js"],
  ["chat-bubble-fill-icon", "ChatBubbleFill-9487b08ae922.js"],
  ["folder-fill-icon", "FolderFill-87acbca8375f.js"],
  ["task-b1gdu-ll-asset", "task-B1GDU_ll-27e9aa8ce080.js"],
  ["flask-fill-icon", "FlaskFill-9c4717b08ec4.js"],
  ["heart-fill-icon", "HeartFill-b521f607871f.js"],
  ["map-fill-icon", "MapFill-b27bf0a7df30.js"],
  ["trash-wft7htfk-asset", "trash-wft7htfk-a80db900856e.js"],
  ["task", "task-b01feccffcb3.js"],
  ["credit-card-fill-icon", "CreditCardFill-4f2f80f9b833.js"],
  ["map-pin-alt-fill-icon", "MapPinAltFill-c5f1a8a6b0f0.js"],
  ["image-square-fill-icon", "ImageSquareFill-64da94532a2d.js"],
  ["trash", "trash-9d3c16e94b66.js"],
  ["lightning-bolt-fill-icon", "LightningBoltFill-a1014595e9d8.js"],
  ["clipboard-fill-icon", "ClipboardFill-e1d06fdde8ed.js"],
];

for (const [semanticName, fileName] of iconEntries) {
  assert.equal(CHUNKS[semanticName], fileName);
  assert.equal(PRESERVED_ASSETS.get(semanticName), "generated:icon-entry");
  const audit = auditByFile.get(fileName);
  assert.equal(audit?.action, "preserve");
  assert.equal(audit?.classification, "generated-icon-or-data");
  const source = fs.readFileSync(path.join(releaseAssets, fileName), "utf8");
  assert.match(source, /export (?:default|\{ [A-Za-z_$][\w$]* as default \})/);
  assert.doesNotMatch(source, /import\s*\(/);
}

const workletName = "dictation-audio-worklet-vendor-runtime";
const workletFile = "dictation-audio-worklet-be694bf1dbf5.js";
assert.equal(CHUNKS[workletName], workletFile);
assert.equal(PRESERVED_ASSETS.get(workletName), "vendor:audio-worklet");
assert.equal(auditByFile.get(workletFile)?.action, "preserve");
const workletSource = fs.readFileSync(path.join(releaseAssets, workletFile), "utf8");
assert.match(workletSource, /registerProcessor\(/);
assert.doesNotMatch(workletSource, /\bexport\b/);
assert.doesNotMatch(workletSource, /\bimport\b/);

console.log("misc-ui-utils preserve PC validated: 19 icon entries and 1 audio worklet");
