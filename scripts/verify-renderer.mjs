// 渲染进程等价性验证：对比「已重写 renderer chunk 的构建产物」与「官方原始产物」。
//
// 对 renderer-chunk-manifest.mjs 中 REWRITTEN 的每个 chunk 检查两项：
//   1. import 依赖集合一致（重写后的 chunk 由 esbuild 打包 ESM，不再依赖
//      rolldown runtime 的 __vite__mapDeps 辅助，对其做豁免）；
//   2. 导出符号面一致（ESM `export { ... }` 语句提取）。
//
//   node scripts/verify-renderer.mjs [--original <dir>]
//     --original 指向未修改的 asar 解包目录，默认 ../chatgpt-desktop-src
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, REWRITTEN } from "./renderer-chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const originalArgIndex = args.indexOf("--original");
const ORIGINAL_DIR = path.resolve(
  ROOT,
  originalArgIndex !== -1 ? args[originalArgIndex + 1] : "../chatgpt-desktop-src",
);

const browserExternal = "./__vite-browser-external-1a803c367e3b.js";
const appPrimary = "./app-primary-d66705000d76.js";
const appShared = "./app-shared-7b9edc1bfb7f.js";
const appInitial = "./app-initial-51da50e6c6e3.js";

function importChanges({ missing = [], extra = [] } = {}) {
  return { missing: new Set(missing), extra: new Set(extra) };
}

// Intentional dependency-graph changes introduced by semantic source owners.
// Keep this list exact: the verifier also fails when a registered delta stops
// being observed, so stale exceptions cannot silently accumulate.
const EXPECTED_IMPORT_CHANGES = new Map([
  ["appshots-settings-69ae88c8d2f5.js", importChanges({ missing: [appPrimary] })],
  ["queries-75df5b2ce147.js", importChanges({ missing: [appShared] })],
  ["stripe-client-5cc289885357.js", importChanges({ missing: [appShared] })],
  ["local-conversation-webmcp-tools-model-933537f85a0f.js", importChanges({ missing: [appInitial] })],
  ["worktree-onboarding-banner-controller-7e8d2c149cf5.js", importChanges({ missing: [appPrimary] })],
  [
    "realtime-voice-home-announcement-1020c8788781.js",
    importChanges({ missing: [appPrimary], extra: [appInitial] }),
  ],
  ["banner-ee99d8ffab06.js", importChanges({ missing: [appPrimary] })],
  ["banner-content-6fd3d18d582a.js", importChanges({ missing: [appPrimary] })],
  [
    "PopcornChartHoverTooltip-2ec4b0b51b3e.js",
    importChanges({ missing: ["./artifact-source-bootstrap-583ed8de587e.js"] }),
  ],
  ["native-code-execution-sandbox-fa3ec5081637.js", importChanges({ missing: [appShared] })],
  ...[
    "git-settings-537e4135cecb.js",
    "chronicle-settings-page-e92cf619a884.js",
    "onboarding-page-905dd8894724.js",
    "remote-conversation-page-9acc03bfbb05.js",
    "worktrees-settings-page-f7e1c38f9bb4.js",
    "codex-micro-slot-signals-3e4c87c6de7b.js",
    "worktree-setup-auto-fix-4dc0f12b7219.js",
    "pull-request-fix-workflow-1561e22a0cbc.js",
    "git-action-new-branch-field-a2e24da5e504.js",
    "git-branch-switcher-96861524e333.js",
    "local-conversation-side-chat-48c6730ec06a.js",
    "local-conversation-git-actions-f71520dad4b4.js",
    "thread-handoff-modal-ccac59d04293.js",
    "automation-dialog-e8ab58185edc.js",
    "gitlab-merge-request-form-dialog-d0ba270c6b55.js",
    "pull-request-fix-automation-f8042d3c1af3.js",
    "use-codex-worktrees-cc7a1f84e042.js",
    "sidebar-onboarding-checklist-task-config-2c7fbbcf69d8.js",
    "chronicle-permissions-dialog-cad125ff4c30.js",
    "cloud-automation-detail-panel-3063b9153870.js",
    "panel-3f0c2778c5e0.js",
    "home-ambient-suggestions-content-a1c4fe488b63.js",
    "home-task-suggestions-e29a02e9b466.js",
    "computer-history-suggestions-55e8abf166e7.js",
    "pull-request-detail-query-bec089c5268f.js",
    "review-slash-command-submenu-registration-8268b8759915.js",
    "registered-259e95b201a1.js",
    "automations-page-fb28e6fc19f3.js",
    "permissions-mode-dropdown-c2d1ab2cace3.js",
  ].map((file) => [file, importChanges({ extra: [browserExternal] })]),
]);

const EXPECTED_EXPORT_CHANGES = new Map([
  ["__vite-browser-external-1a803c367e3b.js", { missing: new Set(), extra: new Set(["z"]) }],
]);

function importsOf(code) {
  const set = new Set();
  // 静态 import ... from "./x.js" / 动态 import("./x.js") / import.meta 之外的形式
  for (const m of code.matchAll(/from\s*["'](\.\/[^"']+)["']/g)) set.add(m[1]);
  for (const m of code.matchAll(/import\(\s*["'`](\.\/[^"'`]+)["'`]\s*\)/g)) set.add(m[1]);
  for (const m of code.matchAll(/import\s*["'](\.\/[^"']+)["']/g)) set.add(m[1]);
  // 重写后的 chunk 用 esbuild 打包，不再引 rolldown runtime 辅助。
  for (const r of [...set]) if (/^\.\/rolldown-runtime-/.test(r)) set.delete(r);
  return set;
}

function exportNamesOf(code) {
  const names = new Set();
  // `export { local as exported, plain, ... }`：as 后面是对外名；裸名对外=本地名。
  for (const m of code.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (const part of m[1].split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const asMatch = trimmed.match(/^[A-Za-z0-9_$]+\s+as\s+([A-Za-z0-9_$]+)$/);
      const plainMatch = trimmed.match(/^([A-Za-z0-9_$]+)$/);
      const name = asMatch ? asMatch[1] : plainMatch ? plainMatch[1] : null;
      if (name && name !== "default") names.add(name);
    }
  }
  for (const m of code.matchAll(/export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  return names;
}

function exportsOfOriginal(code) {
  return exportNamesOf(code);
}

function exportsOfRebuilt(code) {
  return exportNamesOf(code);
}

function diffSets(a, b) {
  return [...a].filter((x) => !b.has(x));
}

let failures = 0;
let checked = 0;
for (const name of REWRITTEN) {
  const file = CHUNKS[name];
  const originalPath = path.join(ORIGINAL_DIR, "app/webview/assets", file);
  const rebuiltPath = path.join(ROOT, "app/webview/assets", file);
  let originalCode, rebuiltCode;
  try {
    originalCode = await fs.readFile(originalPath, "utf8");
    rebuiltCode = await fs.readFile(rebuiltPath, "utf8");
  } catch (err) {
    console.error(`FAIL ${file}: 读取失败（${err.message.split("\n")[0]}）`);
    failures++;
    continue;
  }
  checked++;
  const problems = [];
  const importsA = importsOf(originalCode);
  const importsB = importsOf(rebuiltCode);
  const expectedImportChanges = EXPECTED_IMPORT_CHANGES.get(file) ?? {
    missing: new Set(),
    extra: new Set(),
  };
  const observedImportsMissing = new Set(diffSets(importsA, importsB));
  const observedImportsExtra = new Set(diffSets(importsB, importsA));
  const importsMissing = [...observedImportsMissing].filter(
    (dependency) => !expectedImportChanges.missing.has(dependency),
  );
  const importsExtra = [...observedImportsExtra].filter(
    (dependency) => !expectedImportChanges.extra.has(dependency),
  );
  const expectedMissingNotObserved = diffSets(expectedImportChanges.missing, observedImportsMissing);
  const expectedExtraNotObserved = diffSets(expectedImportChanges.extra, observedImportsExtra);
  if (importsMissing.length) problems.push(`缺少 import: ${importsMissing.join(", ")}`);
  if (importsExtra.length) problems.push(`多余 import: ${importsExtra.join(", ")}`);
  if (expectedMissingNotObserved.length) {
    problems.push(`预期移除的 import 未发生: ${expectedMissingNotObserved.join(", ")}`);
  }
  if (expectedExtraNotObserved.length) {
    problems.push(`预期新增的 import 未发生: ${expectedExtraNotObserved.join(", ")}`);
  }
  const exportsA = exportsOfOriginal(originalCode);
  const exportsB = exportsOfRebuilt(rebuiltCode);
  const expectedExportChanges = EXPECTED_EXPORT_CHANGES.get(file) ?? {
    missing: new Set(),
    extra: new Set(),
  };
  const observedExportsMissing = new Set(diffSets(exportsA, exportsB));
  const observedExportsExtra = new Set(diffSets(exportsB, exportsA));
  const exportsMissing = [...observedExportsMissing].filter(
    (exportName) => !expectedExportChanges.missing.has(exportName),
  );
  const exportsExtra = [...observedExportsExtra].filter(
    (exportName) => !expectedExportChanges.extra.has(exportName),
  );
  const expectedExportsMissingNotObserved = diffSets(
    expectedExportChanges.missing,
    observedExportsMissing,
  );
  const expectedExportsExtraNotObserved = diffSets(expectedExportChanges.extra, observedExportsExtra);
  if (exportsMissing.length) problems.push(`缺少 export: ${exportsMissing.join(", ")}`);
  if (exportsExtra.length) problems.push(`多余 export: ${exportsExtra.join(", ")}`);
  if (expectedExportsMissingNotObserved.length) {
    problems.push(`预期移除的 export 未发生: ${expectedExportsMissingNotObserved.join(", ")}`);
  }
  if (expectedExportsExtraNotObserved.length) {
    problems.push(`预期新增的 export 未发生: ${expectedExportsExtraNotObserved.join(", ")}`);
  }
  if (problems.length) {
    failures++;
    console.error(`FAIL ${file} (${name}):`);
    for (const p of problems) console.error(`  - ${p}`);
  } else {
    console.log(`ok   ${file} (${name})`);
  }
}

console.log(`\n${checked}/${REWRITTEN.size} renderer chunks verified, ${failures} failures`);
if (failures || checked !== REWRITTEN.size) process.exit(1);
