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

function importsOf(code) {
  const set = new Set();
  // 静态 import ... from "./x.js" / 动态 import("./x.js") / import.meta 之外的形式
  for (const m of code.matchAll(/from\s*["'](\.\/[^"']+)["']/g)) set.add(m[1]);
  for (const m of code.matchAll(/import\(\s*["'](\.\/[^"']+)["']\s*\)/g)) set.add(m[1]);
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
  const importsMissing = diffSets(importsA, importsB);
  const importsExtra = diffSets(importsB, importsA);
  if (importsMissing.length) problems.push(`缺少 import: ${importsMissing.join(", ")}`);
  if (importsExtra.length) problems.push(`多余 import: ${importsExtra.join(", ")}`);
  const exportsA = exportsOfOriginal(originalCode);
  const exportsB = exportsOfRebuilt(rebuiltCode);
  const exportsMissing = diffSets(exportsA, exportsB);
  const exportsExtra = diffSets(exportsB, exportsA);
  if (exportsMissing.length) problems.push(`缺少 export: ${exportsMissing.join(", ")}`);
  if (exportsExtra.length) problems.push(`多余 export: ${exportsExtra.join(", ")}`);
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
