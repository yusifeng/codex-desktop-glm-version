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

const dataSpecs = [
  ["learning-model-wind-turbine-data", "type-1425ccb81454.js"],
  ["learning-model-ecological-footprint-data", "type-08e97dfb647e.js"],
  ["learning-model-gdp-value-double-counting-data", "type-18452383754a.js"],
  ["learning-model-animal-life-cycle-data", "type-11d77b78e3d4.js"],
  ["learning-model-while-loop-boolean-condition-data", "type-161aea9178de.js"],
  ["learning-model-predator-prey-cycle-data", "type-18490a17e5a9.js"],
  ["learning-model-p-series-threshold-data", "type-082fed8ad380.js"],
  ["learning-model-arithmetic-mean-data", "type-17e8e3509fa5.js"],
  ["learning-model-slope-intercept-data", "type-110ca488953a.js"],
  ["learning-model-confidence-interval-proportion-data", "type-113723ef7bdc.js"],
  ["learning-model-solenoid-internal-field-data", "type-17796e12b6d2.js"],
  ["learning-model-ipv4-subnetting-cidr-data", "type-103197d7f37d.js"],
  ["learning-model-evaporation-rate-factors-data", "type-119bdab76cbe.js"],
  ["learning-model-segment-ratio-data", "type-10f0ea8edfaf.js"],
];

for (const [semanticName, fileName] of dataSpecs) {
  assert.equal(CHUNKS[semanticName], fileName);
  assert.equal(PRESERVED_ASSETS.get(semanticName), "data:learning-model-spec");
  const audit = auditByFile.get(fileName);
  assert.equal(audit?.action, "preserve");
  assert.equal(audit?.classification, "generated-icon-or-data");
  const source = fs.readFileSync(path.join(releaseAssets, fileName), "utf8");
  assert.match(source, /from "\.\/rolldown-runtime-2d059c5e81f4\.js"/);
  assert.match(source, /export \{ [A-Za-z_$][\w$]* as n, [A-Za-z_$][\w$]* as t \};/);
  assert.doesNotMatch(source, /import\s*\(/);
}

const sparkleFile = "SparkleFill-8c8677c86cda.js";
assert.equal(CHUNKS["sparkle-fill-icon"], sparkleFile);
assert.equal(PRESERVED_ASSETS.get("sparkle-fill-icon"), "generated:icon-entry");
assert.equal(auditByFile.get(sparkleFile)?.action, "preserve");
const sparkleSource = fs.readFileSync(path.join(releaseAssets, sparkleFile), "utf8");
assert.match(sparkleSource, /app-shared-7b9edc1bfb7f\.js/);
assert.match(sparkleSource, /app-initial-51da50e6c6e3\.js/);
assert.match(sparkleSource, /export \{ [A-Za-z_$][\w$]* as default \};/);

const backgroundFile = "parental-controls-invitation-background-c88ddd8be059.js";
assert.equal(CHUNKS["parental-controls-invitation-background"], backgroundFile);
assert.equal(PRESERVED_ASSETS.get("parental-controls-invitation-background"), "data:image-asset-url");
assert.equal(auditByFile.get(backgroundFile)?.action, "preserve");
const backgroundSource = fs.readFileSync(path.join(releaseAssets, backgroundFile), "utf8");
assert.ok(backgroundSource.includes("parental-controls-invitation-background-1861c673a0ed.jpg"));
assert.match(backgroundSource, /export \{ [A-Za-z_$][\w$]* as n, [A-Za-z_$][\w$]* as t \};/);

console.log("misc-ui-utils preserve PB validated: 14 data specs and 2 visual assets");
