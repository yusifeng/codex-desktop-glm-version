// 审计主进程源码中实际从 @chunk/shared 消费、但尚未接入语义模块的导出别名。
// 只解析来自 @chunk/shared 的 import，避免把其它模块的 `as` 误计入缺口。
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(await fs.readFile(path.join(ROOT, "docs/shared-export-map.json"), "utf8"));
const dts = await fs.readFile(path.join(ROOT, "src/main/types/chunk-modules.d.ts"), "utf8");
const semantic = new Set();
for (const m of dts.matchAll(/export\s*\{\s*([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)\s*\}\s*from\s*["']\.\.\/\.\.\/shared\/[^"']+["']/g))
  semantic.add(m[2]);

const consumed = new Map();
const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith(".ts") && entry.name !== "src-DldfpmrL.ts") files.push(full);
  }
}
await walk(path.join(ROOT, "src/main"));
for (const file of files) {
  const src = await fs.readFile(file, "utf8");
  for (const stmt of src.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*["']@chunk\/shared["']/g)) {
    for (const item of stmt[1].split(",")) {
      const match = item.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+[A-Za-z_$][\w$]*)?$/);
      if (!match) continue;
      const exported = match[1];
      const hit = consumed.get(exported) ?? { count: 0, files: new Set() };
      hit.count++;
      hit.files.add(path.relative(ROOT, file));
      consumed.set(exported, hit);
    }
  }
}

const todo = [...consumed.keys()].filter((name) => !semantic.has(name));
const byZone = new Map();
for (const name of todo) {
  const zone = map[name]?.zone ?? "unlocated";
  const bucket = byZone.get(zone) ?? [];
  bucket.push(name);
  byZone.set(zone, bucket);
}
for (const [zone, names] of [...byZone].sort((a, b) => b[1].length - a[1].length))
  console.log(`${zone}: ${names.length} -> ${names.sort().join(", ")}`);
console.log(`TOTAL: ${todo.length}`);
if (process.argv.includes("--json"))
  console.log(JSON.stringify(todo.map((name) => ({ name, ...map[name], count: consumed.get(name).count, files: [...consumed.get(name).files] }))));
