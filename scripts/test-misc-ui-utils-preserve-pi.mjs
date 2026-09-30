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
const illustrations = [
  ["aime-illustration", "Aime-91ab7b051a2f.js"],
  ["appy-illustration", "Appy-2dead6be5548.js"],
  ["bloop-illustration", "Bloop-56209ce096cd.js"],
  ["brief-illustration", "Brief-630d4f63891e.js"],
  ["chip-illustration", "Chip-83dbc51e0b2d.js"],
  ["clank-illustration", "Clank-b77db511676e.js"],
  ["clippy-illustration", "Clippy-f5e78a7bbf83.js"],
  ["collab-illustration", "Collab-ff6011978bce.js"],
  ["dailee-illustration", "Dailee-8a251b73d777.js"],
  ["digit-illustration", "Digit-b4a775a3ccc5.js"],
  ["dot-illustration", "Dot-df6e0d4e452f.js"],
  ["fuego-illustration", "Fuego-5b01dac6efab.js"],
  ["kit-illustration", "Kit-100debb1035f.js"],
  ["madam-luminary-illustration", "MadamLuminary-ba2d4ffb6b96.js"],
  ["mailman-illustration", "Mailman-4f0b44049f71.js"],
  ["paige-illustration", "Paige-ca36e15bdf52.js"],
  ["pocket-illustration", "Pocket-af4c4ccb300e.js"],
  ["scout-illustration", "Scout-9888dce8b84d.js"],
  ["scribble-illustration", "Scribble-affdf5c25f92.js"],
  ["starry-illustration", "Starry-976e236d423e.js"],
  ["stax-illustration", "Stax-ab6daf072499.js"],
  ["tome-illustration", "Tome-87064b654669.js"],
  ["whirr-illustration", "Whirr-2f001aeee1e0.js"],
  ["yo-illustration", "Yo-fa8e77dc63ac.js"],
  ["zapp-illustration", "Zapp-ec77929753b5.js"],
];
const entries = [
  ...illustrations.map(([name, file]) => [name, file, "generated:vector-illustration"]),
  ["image-caption-filled-icon", "ImageCaptionFilled-6ffa86d29a11.js", "generated:vector-icon"],
  ["news-paper-icon", "NewsPaper-4739abdcdbac.js", "generated:vector-icon"],
  ["stuff-fill-icon", "StuffFill-c2cd481c378e.js", "generated:vector-icon"],
  ["ajs-destination-vendor-runtime", "ajs-destination-9284d38cb533.js", "vendor:analytics-destination"],
  ["app-prefetch-impl-vendor-runtime", "app-prefetch-impl-b09df14f7d97.js", "vendor:app-prefetch-runtime"],
];
for (const [name, file, reason] of entries) {
  assert.equal(CHUNKS[name], file);
  assert.equal(PRESERVED_ASSETS.get(name), reason);
  assert.equal(auditByFile.get(file)?.action, "preserve");
  assert.match(fs.readFileSync(path.join(releaseAssets, file), "utf8"), /\bexport\b/);
}
console.log("misc-ui-utils preserve PI validated: 30 generated and vendor assets");
