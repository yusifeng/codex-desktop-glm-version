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
  ["thumb-down-filled-icon", "ThumbDownFilled-878011a97ee4.js"],
  ["thumb-up-filled-icon", "ThumbUpFilled-657b027f9b41.js"],
  ["pencil-fill-icon", "PencilFill-b0c7a54578fe.js"],
  ["warning-fill-icon", "WarningFill-70afa944d48f.js"],
  ["heart-message-fill-icon", "HeartMessageFill-396488d89422.js"],
  ["study-fill-icon", "StudyFill-e7763d107837.js"],
  ["star-filled-icon", "StarFilled-5bb66bb8ebda.js"],
  ["briefcase-fill-icon", "BriefcaseFill-374b76a063c2.js"],
  ["cart-fill-icon", "CartFill-5155ee01a7b8.js"],
  ["fire-icon-definition", "fire-DsrXeFJ2-7e72a4308d84.js"],
  ["loud-speaker-u3esqshd-asset", "loud-speaker-U3ESQshD-272109e38b5b.js"],
  ["bin-icon", "bin-e5229a0d7a84.js"],
  ["notebook-byy4juol-asset", "notebook-ByY4JUol-290e573f9def.js"],
  ["bin-icon-definition", "bin-BmIDzUhB-ad9359ef136a.js"],
  ["business-plan-fill-icon", "BusinessPlanFill-b23a31420c7d.js"],
  ["calendar-fill-icon", "CalendarFill-971b555310d4.js"],
  ["notebook", "notebook-225a2f6a47b0.js"],
  ["space", "space-785a695b5536.js"],
  ["bell-fill-icon", "BellFill-11165dd535e7.js"],
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

const factoryName = "create-lucide-icon-br-ifp4-gw-vendor-runtime";
const factoryFile = "createLucideIcon-BrIFp4GW-30982a428a75.js";
assert.equal(CHUNKS[factoryName], factoryFile);
assert.equal(PRESERVED_ASSETS.get(factoryName), "vendor:lucide-icon-factory");
assert.equal(auditByFile.get(factoryFile)?.action, "preserve");
const factorySource = fs.readFileSync(path.join(releaseAssets, factoryFile), "utf8");
assert.match(factorySource, /export \{ [A-Za-z_$][\w$]* as n, [A-Za-z_$][\w$]* as t \};/);
assert.doesNotMatch(factorySource, /import\s*\(/);

console.log("misc-ui-utils preserve PD validated: 19 icon entries and 1 Lucide factory");
