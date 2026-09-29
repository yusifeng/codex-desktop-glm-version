import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CHUNKS, PRESERVED_ASSETS } from "./renderer-chunk-manifest.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseAssets = path.resolve(root, "../chatgpt-desktop-src/app/webview/assets");
const auditEntries = ["a", "b", "c"].flatMap((suffix) => {
  const parsed = JSON.parse(
    fs.readFileSync(
      path.join(root, "docs", `misc-ui-utils-audit-${suffix}.json`),
      "utf8",
    ),
  );
  return Array.isArray(parsed) ? parsed : parsed.entries;
});
const auditByFile = new Map(auditEntries.map((entry) => [entry.file, entry]));

const entries = [
  ["input-selector-generated-surface", "input-selector-d6854a7f5fbb.js", "generated:svg-component-geometry"],
  ["invitations", "invitations-44091c7ba43a.js", "generated:svg-component-geometry"],
  ["jordy-a7ktmsqa-asset", "jordy-A7ktmsqa-b7d8d80d8089.js", "data:image-asset"],
  ["jordy-image-asset", "jordy-da7a9572aca8.js", "data:image-asset"],
  ["kakao-asset", "kakao-f616aba8a943.js", "data:image-asset"],
  ["rehype-katex-runtime-lib", "lib-94a0a161a542.js", "vendor:rehype-katex-runtime"],
  ["lobster-dark-theme", "lobster-dark-3c7e0b666bb2.js", "data:syntax-theme"],
  ["lua-textmate-grammar", "lua-2129c39c5c75.js", "data:syntax-definition"],
  ["matrix-dark-theme", "matrix-dark-fa9710869ce4.js", "data:syntax-theme"],
  ["analytics-middleware", "middleware-8ddcb7d6b81f.js", "vendor:analytics-middleware"],
  ["mllike-textmate-grammar", "mllike-18ec050dd84d.js", "data:syntax-definition"],
  ["monotone-color-scale-variant", "monotone-7fd3405b5c97.js", "vendor:color-scale"],
  ["national-museum-cyjiaf6d-asset", "national-museum-CYJiaf6d-e4734899d6c1.js", "data:image-asset"],
  ["national-museum-image-asset", "national-museum-f400e6fb39f2.js", "data:image-asset"],
  ["oscurange-theme", "oscurange-8a344130cdcd.js", "data:syntax-theme"],
  ["perl-textmate-grammar", "perl-f304e93a1a94.js", "data:syntax-definition"],
  ["permissions-mode-dropdown-generated", "permissions-mode-dropdown-c2d1ab2cace3.js", "generated:compiled-ui-surface"],
  ["phone-number-input", "phone-number-input-6ac1e964b07b.js", "vendor:phone-number-input"],
  ["pin-image-asset", "pin-6ee0779a4956.js", "data:image-asset"],
  ["pin-bwr8bhop-asset", "pin-BwR8bHoP-d2ab983d5646.js", "data:image-asset"],
];

for (const [semanticName, fileName, reason] of entries) {
  assert.equal(CHUNKS[semanticName], fileName);
  assert.equal(PRESERVED_ASSETS.get(semanticName), reason);
  assert.equal(auditByFile.get(fileName)?.action, "preserve");
  const source = fs.readFileSync(path.join(releaseAssets, fileName), "utf8");
  assert.match(source, /\bexport\b/);
  assert.doesNotMatch(source, /import\s*\(/);
}

console.log(
  "misc-ui-utils preserve PF validated: 20 generated, data, and vendor assets",
);
