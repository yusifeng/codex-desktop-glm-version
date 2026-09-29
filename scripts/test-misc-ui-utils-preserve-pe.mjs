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

const entries = [
  ["space-dyd6aubm-asset", "space-Dyd6AUbM-80c9339344aa.js", "generated:icon-entry"],
  ["file-code-square-fill-icon", "FileCodeSquareFill-3444fa647b71.js", "generated:icon-entry"],
  ["selection-circle-icons", "unselected-circle-cbf957c104fc.js", "generated:icon-entry"],
  ["absolutely-dark-theme-tokens", "absolutely-dark-f50f351ee0a4.js", "data:syntax-theme"],
  ["absolutely-light-theme-tokens", "absolutely-light-79eaa93587de.js", "data:syntax-theme"],
  ["fire-icon", "fire-957a2a11da75.js", "generated:icon-entry"],
  ["video-filled-icon", "VideoFilled-e7035ebb2080.js", "generated:icon-entry"],
  ["task-clock-fill-icon", "TaskClockFill-4fa6d1621c9f.js", "generated:icon-entry"],
  ["checkbox-checked-filled-icon", "CheckboxCheckedFilled-934dc0e4769b.js", "generated:icon-entry"],
  ["xcode-dark-theme", "xcode-dark-70031158a53b.js", "data:syntax-theme"],
  ["xcode-light-theme", "xcode-light-ad6a361cdfec.js", "data:syntax-theme"],
  ["loud-speaker", "loud-speaker-cf46ca316049.js", "generated:icon-entry"],
  ["notion-dark-theme", "notion-dark-53bed5670fb6.js", "data:syntax-theme"],
  ["proof-light-theme", "proof-light-818ee16fd59b.js", "data:syntax-theme"],
  ["notion-light-theme", "notion-light-616fcde10962.js", "data:syntax-theme"],
  ["american-football-fill-icon", "AmericanFootballFill-d27bc16b01a4.js", "generated:icon-entry"],
  ["load-script", "load-script-d64a1e7ce422.js", "vendor:generated-runtime"],
  ["bell-icon", "bell-1a0f5d7a0fc0.js", "generated:icon-entry"],
  ["monotone", "monotone-68fb4f84bd88.js", "vendor:color-scale"],
  ["newspaper-fill-icon", "NewspaperFill-be4ab0a5118b.js", "generated:icon-entry"],
];

for (const [semanticName, fileName, reason] of entries) {
  assert.equal(CHUNKS[semanticName], fileName);
  assert.equal(PRESERVED_ASSETS.get(semanticName), reason);
  const audit = auditByFile.get(fileName);
  assert.equal(audit?.action, "preserve");
  const source = fs.readFileSync(path.join(releaseAssets, fileName), "utf8");
  assert.match(source, /\bexport\b/);
  assert.doesNotMatch(source, /import\s*\(/);
}

console.log("misc-ui-utils preserve PE validated: 20 icon, theme, and vendor assets");
