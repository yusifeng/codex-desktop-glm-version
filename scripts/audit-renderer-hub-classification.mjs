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
const LINE_CLASSIFICATIONS_PATH = path.join(ROOT, "docs/renderer-hub-line-classification.json");

function readLineClassifications() {
  const entries = JSON.parse(fs.readFileSync(LINE_CLASSIFICATIONS_PATH, "utf8"));
  if (!Array.isArray(entries)) throw new Error("renderer hub line classifications must be an array");
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") throw new Error("invalid hub line classification entry");
    if (!(entry.hub in HUBS) || typeof entry.alias !== "string") throw new Error("classification must identify hub and alias");
    if (!Number.isInteger(entry.startLine) || !Number.isInteger(entry.endLine) || entry.startLine < 1 || entry.endLine < entry.startLine) {
      throw new Error(`invalid line range for ${entry.hub}:${entry.alias}`);
    }
    if (typeof entry.classification !== "string" || typeof entry.module !== "string") {
      throw new Error(`classification ${entry.hub}:${entry.alias} needs category and module`);
    }
    const modulePath = path.join(ROOT, entry.module);
    if (!fs.existsSync(modulePath)) throw new Error(`missing semantic module for ${entry.hub}:${entry.alias}: ${entry.module}`);
    const hubLines = fs.readFileSync(path.join(ROOT, "src/webview/assets", HUBS[entry.hub]), "utf8").split("\n");
    const sourceWindow = hubLines.slice(entry.startLine - 1, entry.endLine).join("\n");
    if (entry.sourceSymbol && !new RegExp(`\\bfunction\\s+${entry.sourceSymbol}\\b`).test(sourceWindow)) {
      throw new Error(`source symbol ${entry.sourceSymbol} is outside ${entry.hub}:${entry.startLine}-${entry.endLine}`);
    }
  }
  return entries;
}

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
        // A large portion of the renderer uses a namespace import as a typed
        // binding table (`const { alias: semanticName } = chunk`).  Those
        // aliases are real consumers just like `chunk.alias`; include the
        // left-hand export name while retaining the existing namespace scan.
        const destructuring = new RegExp(`(?:const|let|var)\\s*\\{([\\s\\S]*?)\\}\\s*=\\s*${namespace[1]}\\b`, "g");
        for (const binding of source.matchAll(destructuring)) {
          for (const item of binding[1].split(",")) {
            const exportName = item.trim().split(/\s*:\s*/)[0].replace(/^type\s+/, "");
            if (/^[A-Za-z_$][\\w$]*$/.test(exportName)) namespaceMembers.add(exportName);
          }
        }
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
  const reviewed = readLineClassifications().filter((entry) => entry.hub === hub);
  for (const entry of reviewed) {
    if (!exports.has(entry.alias)) throw new Error(`line classification references missing export ${hub}:${entry.alias}`);
  }
  return { hub, exportCount: exports.size, consumedCount: consumed.size, sideEffectImports: consumption.sideEffectImports, unconsumed, reviewedCount: reviewed.length };
}

const strict = process.argv.includes("--strict");
const hubs = Object.keys(HUBS).map(classifyHub);
for (const result of hubs) {
  console.log(`${result.hub}: ${result.consumedCount}/${result.exportCount} consumed; ${result.sideEffectImports} side-effect imports; ${result.unconsumed.length} unconsumed`);
  if (result.unconsumed.length > 0 && process.argv.includes("--list")) console.log(`  ${result.unconsumed.join(", ")}`);
}
if (strict && hubs.some((result) => result.unconsumed.length > 0)) process.exit(1);
