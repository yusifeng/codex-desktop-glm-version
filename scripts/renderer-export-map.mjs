// app-shared / app-initial 导出符号定位器：
// 把压缩导出别名（如 HX、CUt）解析为内部定义名 + 行号，
// 为 renderer chunk 重写提供「符号 → 定义位置」的查找表。
//
//   node scripts/renderer-export-map.mjs [--shared|--initial] [alias ...]
//     不带 alias 时输出全部映射 JSON（stdout）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const which = args.includes("--initial") ? "initial" : "shared";
const aliases = args.filter((a) => !a.startsWith("--"));

const FILES = {
  shared: "../chatgpt-desktop-src/app/webview/assets/app-shared-7b9edc1bfb7f.js",
  initial: "../chatgpt-desktop-src/app/webview/assets/app-initial-51da50e6c6e3.js",
};
const text = fs.readFileSync(path.resolve(ROOT, FILES[which]), "utf8");

// export 表（文件尾）
const exportStart = text.lastIndexOf("export {");
const exports = {};
for (const m of text.slice(exportStart).matchAll(/([a-zA-Z0-9_$]+) as ([a-zA-Z0-9_$]+)(?=[,}])/g)) {
  exports[m[2]] = m[1];
}

// 定义定位（var/let/const/function/class 的首个匹配）。
// 跳过文件头的 __vite__mapDeps 数组块（其中是 "./xxx.js" 字符串行，
// 会污染 3 万多行之前的定位——mapDeps 数组之后才进入真正的模块体）。
const deflocs = {};
let bodyStart = 0;
const mapDepsEnd = text.indexOf("]));", text.indexOf("__vite__mapDeps"));
if (mapDepsEnd !== -1) bodyStart = mapDepsEnd + 4;
const lines = text.slice(bodyStart).split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let m = /^(?:var|let|const) ([A-Za-z0-9_$]+)\s*[=;(\[{]/.exec(line);
  if (m) { deflocs[m[1]] ??= i + 1 + Math.floor(bodyStart ? text.slice(0, bodyStart).split('\n').length - 1 : 0); continue; }
  m = /^(?:async )?function ([A-Za-z0-9_$]+)\(/.exec(line);
  if (m) { deflocs[m[1]] ??= i + 1 + Math.floor(bodyStart ? text.slice(0, bodyStart).split('\n').length - 1 : 0); continue; }
  m = /^(?:export )?class ([A-Za-z0-9_$]+)/.exec(line);
  if (m) { deflocs[m[1]] ??= i + 1 + Math.floor(bodyStart ? text.slice(0, bodyStart).split('\n').length - 1 : 0); }
}

if (aliases.length) {
  for (const alias of aliases) {
    const internal = exports[alias];
    console.log(`${which} ${alias} -> ${internal ?? "?"} (L${deflocs[internal] ?? "?"})`);
  }
} else {
  const map = {};
  for (const [alias, internal] of Object.entries(exports)) {
    map[alias] = { internal, line: deflocs[internal] ?? null };
  }
  process.stdout.write(JSON.stringify(map, null, 1));
}
