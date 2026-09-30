import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHUNKS, PRESERVED_ASSETS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.resolve(root, "../chatgpt-desktop-src/app/webview/assets");
const entries = [
  ["browser-comment-popup-portal", "comment-popup-portal-f8916f9c2211.js", "generated:cross-window-popup-runtime"],
  ["data-controls-settings", "data-controls-77428d3ea6b7.js", "generated:compiled-settings-surface"],
  ["delinquent-subscription-upgrade-dialog", "delinquent-upgrade-e92376d1fe9d.js", "generated:compiled-billing-surface"],
  ["browser-skills-directory-page", "directory-a7494315f12b.js", "generated:compiled-directory-surface"],
  ["codex-first-run-page", "first-run-8b4767446d20.js", "generated:compiled-onboarding-surface"],
  ["hosted-immersive-map", "hosted-map-64aff905504e.js", "generated:compiled-map-surface"],
  ["segment-analytics-sdk-vendor", "pkg-24dfada4ece0.js", "vendor:segment-analytics-sdk"],
  ["product-details-open-stub", "open-details-ea11bcecbc49.js", "generated:dormant-noop-facade"],
];
for (const [name, file, reason] of entries) {
  assert.equal(CHUNKS[name], file);
  assert.equal(PRESERVED_ASSETS.get(name), reason);
  assert.ok(fs.readFileSync(path.join(releaseAssets, file), "utf8").length > 0);
}
console.log("misc-ui-utils preserve PK validated: 8 consumer-audited assets");
