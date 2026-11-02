#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { classifyHub } from "./audit-renderer-hub-classification.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = path.join(ROOT, "src/renderer");
const DECLARATIONS = path.join(RENDERER, "types/rchunk-modules.d.ts");
const consumed = new Map();
const semanticConsumers = new Map();
const directNamespaceUses = [];

function addTo(map, name, file) {
  if (!map.has(name)) map.set(name, new Set());
  map.get(name).add(path.relative(ROOT, file));
}
function add(name, file, source) {
  addTo(consumed, name, file);
  // Exact recovered owners intentionally retain release aliases under
  // @ts-nocheck. Their executable ABI is guarded by the hub export gate;
  // handwritten semantic owners must additionally have useful declarations.
  if (!/^\s*\/\/\s*@ts-nocheck\b/m.test(source)) addTo(semanticConsumers, name, file);
}
function walkFiles(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => { const target = path.join(directory, entry.name); if (entry.isDirectory()) return entry.name === "types" ? [] : walkFiles(target); return entry.isFile() && /\.tsx?$/.test(entry.name) ? [target] : []; }); }

for (const file of walkFiles(RENDERER)) {
  const source = fs.readFileSync(file, "utf8");
  const namespaces = new Set();
  for (const match of source.matchAll(/import\s+(?:type\s+)?\{([^;]*?)\}\s+from\s+["']@rchunk\/app-shared["']/g)) {
    for (const binding of match[1].split(",")) {
      const name = binding.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0]?.trim();
      if (name) add(name, file, source);
    }
  }
  for (const match of source.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+["']@rchunk\/app-shared["']/g)) namespaces.add(match[1]);
  for (const namespace of namespaces) {
    const escaped = namespace.replaceAll("$", "\\$");
    for (const match of source.matchAll(new RegExp(`(?:const|let|var)\\s*\\{([^;]*?)\\}\\s*=\\s*${escaped}\\s*;`, "g"))) {
      for (const binding of match[1].split(",")) {
        const name = binding.trim().split(/\s*:\s*/)[0]?.trim();
        if (name && !name.startsWith("...")) add(name, file, source);
      }
    }
    for (const match of source.matchAll(new RegExp(`\\b${escaped}\\.([A-Za-z_$][\\w$]*)`, "g"))) {
      const line = source.slice(0, match.index).split("\n").length;
      directNamespaceUses.push(`${path.relative(ROOT, file)}:${line} ${match[0]}`);
      add(match[1], file, source);
    }
  }
}

const declarationSource = fs.readFileSync(DECLARATIONS, "utf8");
const declarations = new Map();
let searchFrom = 0;
while (true) {
  const start = declarationSource.indexOf('declare module "@rchunk/app-shared"', searchFrom);
  if (start < 0) break;
  const open = declarationSource.indexOf("{", start); let depth = 0; let end = open;
  for (; end < declarationSource.length; end++) { if (declarationSource[end] === "{") depth++; else if (declarationSource[end] === "}" && --depth === 0) break; }
  const block = declarationSource.slice(open + 1, end);
  for (const match of block.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)\s*:[\s\S]*?;/g)) declarations.set(match[1], match[0]);
  for (const match of block.matchAll(/export\s+(?:function|class|interface|type)\s+([A-Za-z_$][\w$]*)\b[^;]*(?:;|\})/g)) declarations.set(match[1], match[0]);
  const localDeclarations = new Map([...block.matchAll(/(?:^|\n)\s*const\s+([A-Za-z_$][\w$]*)\s*:[^;]*;/g)].map(match => [match[1], match[0]]));
  for (const match of block.matchAll(/export\s*\{\s*([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)\s*\}\s*;/g)) declarations.set(match[2], localDeclarations.get(match[1]) ?? match[0]);
  searchFrom = end + 1;
  }
const hub = classifyHub("app-shared");
const missing = [...semanticConsumers.keys()].filter(name => !declarations.has(name)).sort();
const unsafe = [...semanticConsumers.keys()].filter(name => /\bany\b/.test(declarations.get(name) ?? "")).sort();
if (hub.invalidConsumedAliases.length || missing.length || unsafe.length || directNamespaceUses.length) {
  if (hub.invalidConsumedAliases.length) console.error(`缺少 app-shared 运行时导出：${hub.invalidConsumedAliases.join(", ")}`);
  if (missing.length) console.error(`缺少语义源码所需 app-shared 声明：${missing.join(", ")}`);
  if (unsafe.length) console.error(`app-shared 消费声明仍含 any：${unsafe.join(", ")}`);
  if (directNamespaceUses.length) console.error(`直接 namespace 消费：\n${directNamespaceUses.join("\n")}`);
  process.exit(1);
}
const preservedAliases = [...consumed.keys()].filter(name => !semanticConsumers.has(name)).length;
console.log(
  `${consumed.size} app-shared exports consumed: ${semanticConsumers.size} semantic aliases declared, ` +
  `${preservedAliases} exact-source aliases runtime-verified; 0 missing exports, 0 missing semantic declarations, 0 any, 0 direct namespace uses`,
);
