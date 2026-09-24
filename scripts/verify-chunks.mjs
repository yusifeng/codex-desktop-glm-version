// 等价性验证：对比「已重写 chunk 的构建产物」与「官方原始产物」。
//
// 对 chunk-manifest.mjs 中 REWRITTEN 的每个 chunk 检查两项：
//   1. require 依赖集合一致（对 rolldown 打包运行时的差异做豁免——重写后的
//      chunk 由 esbuild 打包，不再依赖 rolldown runtime）；
//   2. 导出符号面一致（重写 chunk 同时导出语义名与原版单字母名）。
//
// 这是结构级等价；语义等价靠重写时的逐行对照 + 运行冒烟测试。
//
//   node scripts/verify-chunks.mjs [--original <dir>]
//     --original 指向未修改的 asar 解包目录，默认 .reference/app-original
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, REWRITTEN } from "./chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const originalArgIndex = args.indexOf("--original");
const ORIGINAL_DIR = path.resolve(
  ROOT,
  originalArgIndex !== -1 ? args[originalArgIndex + 1] : ".reference/app-original",
);

function requiresOf(code) {
  const set = new Set();
  for (const m of code.matchAll(/require\("([^"]+)"\)|require\(`([^`]+)`\)/g))
    set.add(m[1] ?? m[2]);
  // 重写后的 chunk 用 esbuild 打包，不再 require rolldown 打包运行时。
  for (const r of [...set]) if (/^\.\/rolldown-runtime-/.test(r)) set.delete(r);
  return set;
}

function exportsOfOriginal(code) {
  const names = new Set();
  for (const m of code.matchAll(/exports\.([A-Za-z0-9_]+)\s*=/g)) names.add(m[1]);
  // 原始产物是压缩后的单行代码，逗号后没有空格。
  for (const m of code.matchAll(/Object\.defineProperty\(exports,\s*"([A-Za-z0-9_]+)"/g))
    names.add(m[1]);
  return names;
}

function exportsOfRebuilt(code) {
  const names = new Set();
  for (const m of code.matchAll(/__export\(\w+, \{([\s\S]*?)\n\}\)/g))
    for (const k of m[1].matchAll(/^\s*([A-Za-z0-9_$]+):/gm)) names.add(k[1]);
  return names;
}

function diffSets(a, b) {
  return [...a].filter((x) => !b.has(x));
}

let failures = 0;
for (const name of REWRITTEN) {
  const output = CHUNKS[name];
  const originalCode = await fs
    .readFile(path.join(ORIGINAL_DIR, ".vite/build", output), "utf8")
    .catch(() => null);
  if (originalCode == null) {
    console.error(`${output}: 原始产物缺失（--original 指向的目录不对？）`);
    failures++;
    continue;
  }
  const rebuiltCode = await fs.readFile(path.join(ROOT, "app/.vite/build", output), "utf8");

  const problems = [];
  const missingRequires = diffSets(requiresOf(originalCode), requiresOf(rebuiltCode));
  const extraRequires = diffSets(requiresOf(rebuiltCode), requiresOf(originalCode));
  if (missingRequires.length) problems.push(`缺失 require: ${missingRequires.join(", ")}`);
  if (extraRequires.length) problems.push(`多出 require: ${extraRequires.join(", ")}`);

  const originalExports = exportsOfOriginal(originalCode);
  const rebuiltExports = exportsOfRebuilt(rebuiltCode);
  const missingExports = [...originalExports].filter((x) => !rebuiltExports.has(x));
  if (missingExports.length) problems.push(`缺失导出: ${missingExports.join(", ")}`);

  if (problems.length) {
    failures++;
    console.error(`${output}: FAIL`);
    for (const p of problems) console.error(`  - ${p}`);
  } else {
    const extra = [...rebuiltExports].filter((x) => !originalExports.has(x));
    console.log(
      `${output}: OK  (requires ${requiresOf(originalCode).size}, exports ${originalExports.size}` +
        (extra.length ? `；额外语义导出: ${extra.join(", ")}` : "") +
        ")",
    );
  }
}

if (failures) {
  console.error(`\n${failures} 个 chunk 验证失败`);
  process.exit(1);
}
console.log(`\n全部 ${REWRITTEN.size} 个已重写 chunk 与原始产物结构等价`);
