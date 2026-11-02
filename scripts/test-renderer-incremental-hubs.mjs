import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  CHUNKS,
  INCREMENTAL_HUBS,
  REWRITTEN,
} from "./renderer-chunk-manifest.mjs";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = path.join(ROOT, "src/renderer");
execFileSync(
  process.execPath,
  ["scripts/migrate-renderer-hub-semantic-imports.mjs", "--check"],
  { cwd: ROOT, stdio: "pipe" },
);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "types" ? [] : walk(target);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [target] : [];
  });
}

const rendererSources = walk(RENDERER).map((file) => [
  file,
  fs.readFileSync(file, "utf8"),
]);
function inspectHub(name) {
  const chunk = CHUNKS[name];
  const source = fs.readFileSync(
    path.join(ROOT, "src/webview/assets", chunk.replace(/\.js$/, ".ts")),
    "utf8",
  );
  const exportBlock = source.slice(source.lastIndexOf("export {"));
  const imports = rendererSources.flatMap(([file, rendererSource]) =>
    [
      ...rendererSource.matchAll(
        new RegExp(
          `import\\s+([^;]+?)\\s+from\\s+["']@rchunk/${name}["']|import\\s+["']@rchunk/${name}["']`,
          "g",
        ),
      ),
    ].map((match) => ({ file, clause: match[1] })),
  );
  return {
    chunk,
    exportCount: [
      ...exportBlock.matchAll(/\b[A-Za-z_$][\w$]*\s+as\s+[A-Za-z_$][\w$]*/g),
    ].length,
    imports,
    rewritten: REWRITTEN.has(name),
    strategy: INCREMENTAL_HUBS.get(name),
  };
}

const artifactSource = inspectHub("artifact-source-bootstrap");
assert.equal(artifactSource.rewritten, true);
assert.equal(artifactSource.strategy, undefined);
assert.equal(typeof artifactSource.chunk, "string");
assert.equal(artifactSource.exportCount, 79);
assert.ok(
  artifactSource.imports.length > 0 &&
    artifactSource.imports.some((item) => item.clause == null) &&
    artifactSource.imports.some((item) => item.clause != null),
);
assert.ok(
  artifactSource.imports
    .filter((item) => item.clause != null)
    .every((item) =>
      /popcorn-(document|workbook|presentation)-panel|popcorn-electron-surface-style/.test(
        item.file,
      ),
    ),
);
const textUnderline = inspectHub("text-underline-icon");
assert.equal(textUnderline.rewritten, true);
assert.equal(textUnderline.strategy, undefined);
assert.equal(typeof textUnderline.chunk, "string");
assert.equal(textUnderline.exportCount, 37);
assert.ok(
  textUnderline.imports.length > 0 &&
    textUnderline.imports.some((item) => item.clause != null),
);
assert.ok(
  textUnderline.imports
    .filter((item) => item.clause != null)
    .every((item) => /popcorn-(document|presentation)-panel/.test(item.file)),
);
const surfaceStyle = inspectHub("popcorn-electron-surface-style");
assert.equal(surfaceStyle.rewritten, true);
assert.equal(surfaceStyle.strategy, undefined);
assert.equal(typeof surfaceStyle.chunk, "string");
assert.equal(surfaceStyle.exportCount, 65);
assert.ok(
  surfaceStyle.imports.length > 0 &&
    surfaceStyle.imports.some((item) => item.clause != null),
);
assert.ok(
  surfaceStyle.imports
    .filter((item) => item.clause != null)
    .every((item) => /popcorn-(workbook|presentation)-panel/.test(item.file)),
);

const importedSetup = inspectHub("use-imported-setup-opportunity");
assert.equal(importedSetup.rewritten, true);
assert.equal(importedSetup.strategy, undefined);
assert.equal(typeof importedSetup.chunk, "string");
assert.equal(importedSetup.exportCount, 74);
assert.ok(
  importedSetup.imports.filter((item) => item.clause != null).length >= 2 &&
    importedSetup.imports
      .filter((item) => item.clause != null)
      .every((item) => !item.clause.includes("* as")),
);
assertReleaseOwner("sidebar-onboarding-checklist");
const declarationSource = fs.readFileSync(
  path.join(RENDERER, "types/rchunk-modules.d.ts"),
  "utf8",
);
const importedSetupDeclaration = declarationSource.slice(
  declarationSource.indexOf(
    'declare module "@rchunk/use-imported-setup-opportunity"',
  ),
  declarationSource.indexOf(
    'declare module "@rchunk/sidebar-onboarding-checklist"',
  ),
);
assert.doesNotMatch(importedSetupDeclaration, /\bany\b/);

const checkoutSession = inspectHub("checkout-session");
assert.equal(checkoutSession.rewritten, true);
assert.equal(checkoutSession.strategy, undefined);
assert.equal(typeof checkoutSession.chunk, "string");
assert.equal(checkoutSession.exportCount, 60);
const checkoutSessionConsumers = checkoutSession.imports.filter(
  (item) => item.clause != null,
);
assert.deepEqual(
  checkoutSessionConsumers
    .map(({ file }) => path.basename(path.dirname(file)))
    .sort(),
  [
    "checkout-confirm-latency",
    "checkout-page-core",
    "checkout-success-page",
    "create-session",
    "create-workspace-page",
    "credit-purchase-page-core",
    "purchase-page",
    "verify-page",
  ],
);
assert.ok(
  checkoutSessionConsumers.every((item) => !item.clause?.includes("* as")),
);

const billingAnalytics = inspectHub("billing-analytics");
assert.equal(billingAnalytics.rewritten, true);
assert.equal(billingAnalytics.strategy, undefined);
assert.equal(typeof billingAnalytics.chunk, "string");
assert.equal(billingAnalytics.exportCount, 2);
assert.equal(billingAnalytics.imports.length, 2);
assert.ok(
  billingAnalytics.imports.every(
    (item) =>
      /\bn\s+as\s+\w+/.test(item.clause ?? "") &&
      /\bt\s+as\s+\w+/.test(item.clause ?? ""),
  ),
);
const billingDeclaration = declarationSource.slice(
  declarationSource.indexOf('declare module "@rchunk/billing-analytics"'),
  declarationSource.indexOf('declare module "@rchunk/plugins-settings-core"'),
);
assert.doesNotMatch(billingDeclaration, /\bany\b/);

console.log("40 renderer rewritten/incremental hub assertions passed");
