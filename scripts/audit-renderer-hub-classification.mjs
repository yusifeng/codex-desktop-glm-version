#!/usr/bin/env node
// 机器可复核的 renderer 聚合 hub 分类门禁。
//
// 聚合 chunk 的 export 表不是“已还原源码”的证据：只有 renderer 语义源码
// 实际命名消费的别名才算 consumed，副作用导入算 side-effect-only，其余必须
// 显式落在 unconsumed（待迁移）集合中。--strict 用于发布前阻止漏登记。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = path.join(ROOT, "src/renderer");
const HUBS = {
  "app-shared": "app-shared-7b9edc1bfb7f.ts",
  "app-initial": "app-initial-51da50e6c6e3.ts",
  "app-primary": "app-primary-d66705000d76.ts",
};

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "types" ? [] : walk(file);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [file] : [];
  });
}

function readExports(hub) {
  const source = fs.readFileSync(path.join(ROOT, "src/webview/assets", HUBS[hub]), "utf8");
  const start = Math.max(source.lastIndexOf("export{"), source.lastIndexOf("export {"));
  const aliases = new Set();
  for (const match of source.slice(start).matchAll(/\b([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)\b/g)) {
    // The right-hand token is the public ESM export alias consumed by renderer.
    aliases.add(match[2]);
  }
  return aliases;
}

function readConsumption(hub) {
  const named = new Set();
  const namespaceMembers = new Set();
  let sideEffectImports = 0;
  for (const file of walk(RENDERER)) {
    const source = fs.readFileSync(file, "utf8");
    const importPattern = new RegExp(`import\\s+([^;]*?)\\s+from\\s+["']@rchunk/${hub}["']|import\\s+["']@rchunk/${hub}["']`, "g");
    for (const match of source.matchAll(importPattern)) {
      const clause = match[1]?.trim();
      if (!clause) { sideEffectImports++; continue; }
      const namespace = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
      if (namespace) {
        const re = new RegExp(`\\b${namespace[1]}\\.([A-Za-z_$][\\w$]*)\\b`, "g");
        for (const member of source.matchAll(re)) namespaceMembers.add(member[1]);
      }
      const braces = clause.match(/\{([\s\S]*)\}/);
      if (braces) {
        for (const binding of braces[1].split(",")) {
          const alias = binding.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, "");
          if (/^[A-Za-z_$][\\w$]*$/.test(alias)) named.add(alias);
        }
      }
    }
  }
  return { named, namespaceMembers, sideEffectImports };
}

export function classifyHub(hub) {
  if (!(hub in HUBS)) throw new Error(`unknown renderer hub: ${hub}`);
  const exports = readExports(hub);
  const consumption = readConsumption(hub);
  const consumed = new Set([...consumption.named, ...consumption.namespaceMembers].filter((name) => exports.has(name)));
  const unconsumed = [...exports].filter((name) => !consumed.has(name)).sort();
  return { hub, exportCount: exports.size, consumedCount: consumed.size, sideEffectImports: consumption.sideEffectImports, unconsumed };
}

const strict = process.argv.includes("--strict");
const hubs = Object.keys(HUBS).map(classifyHub);
for (const result of hubs) {
  console.log(`${result.hub}: ${result.consumedCount}/${result.exportCount} consumed; ${result.sideEffectImports} side-effect imports; ${result.unconsumed.length} unconsumed`);
  if (result.unconsumed.length > 0 && process.argv.includes("--list")) console.log(`  ${result.unconsumed.join(", ")}`);
}
if (strict && hubs.some((result) => result.unconsumed.length > 0)) process.exit(1);
