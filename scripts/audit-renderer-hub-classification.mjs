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
    const escapedSourceSymbol = typeof entry.sourceSymbol === "string" ? entry.sourceSymbol.replaceAll("$", "\\$") : null;
    const sourceSymbolPattern = escapedSourceSymbol && new RegExp(`(?:(?:function|var|let|const)\\s+)?${escapedSourceSymbol}\\s*(?==|\\()`);
    if (sourceSymbolPattern && !sourceSymbolPattern.test(sourceWindow) && !sourceSymbolPattern.test(hubLines.join("\\n"))) {
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
  // `$` is a valid first character for generated ESM aliases; `\b` cannot
  // start a word at `$`, so use an identifier-aware left boundary instead.
  for (const match of source.slice(start).matchAll(/(?<![A-Za-z0-9_$])([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)(?![A-Za-z0-9_$])/g)) {
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

        // Renderer boundaries often narrow a namespace import through an
        // explicit object type cast before destructuring or member access:
        // `chunk as unknown as { Ab?: (value: T) => U }`.  The type keys are
        // real public export consumers even when the runtime binding is later
        // passed around under a local name (so no `chunk.Ab` expression is
        // present for the textual scan above).  Parse only top-level keys of
        // each cast object, avoiding nested function/object type members.
        const castMarker = new RegExp(`\\b${namespace[1]}\\s+as\\s+unknown\\s+as\\s*\\{`, "g");
        for (const marker of source.matchAll(castMarker)) {
          let depth = 1;
          let quote = null;
          let escaped = false;
          let end = marker.index + marker[0].length;
          for (; end < source.length && depth > 0; end++) {
            const character = source[end];
            if (quote) {
              if (escaped) escaped = false;
              else if (character === "\\") escaped = true;
              else if (character === quote) quote = null;
              continue;
            }
            if (character === "\"" || character === "'" || character === "`") {
              quote = character;
            } else if (character === "{") {
              depth++;
            } else if (character === "}") {
              depth--;
            }
          }
          const objectType = source.slice(marker.index + marker[0].length, end - 1);
          let objectDepth = 0;
          let objectQuote = null;
          let objectEscaped = false;
          for (let index = 0; index < objectType.length; index++) {
            const character = objectType[index];
            if (objectQuote) {
              if (objectEscaped) objectEscaped = false;
              else if (character === "\\") objectEscaped = true;
              else if (character === objectQuote) objectQuote = null;
              continue;
            }
            if (character === "\"" || character === "'" || character === "`") {
              objectQuote = character;
              continue;
            }
            if (character === "{" || character === "(" || character === "[") objectDepth++;
            else if (character === "}" || character === ")" || character === "]") objectDepth--;
            if (objectDepth !== 0) continue;
            const property = objectType.slice(index).match(/^([A-Za-z_$][\w$]*)\s*\??\s*(?=:|\()/);
            if (property) {
              namespaceMembers.add(property[1]);
              index += property[0].length - 1;
            }
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
