// 图标资产生成器：从 app-shared 原始 chunk 提取全部图标预设定义，
// 生成 src/renderer/app-shared/ui/icons/<name>.ts + manifest.json。
//
// 用法：node scripts/generate-icons.mjs [--src <原版 app-shared.js>]
//   --src 默认指向 ../chatgpt-desktop-src（未修改的 asar 解包目录）。
//
// 提取模式：var <v>;\nfunction <f>() {\n  return (<f> = t(() => {\n    X(), <v> = Y({...});
// Y({ 的对象字面量用反引号感知的平衡括号解析（body 是 SVG 字符串）。
// 生成文件勿手改——重跑本脚本覆盖。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const srcIndex = args.indexOf("--src");
const SRC = path.resolve(
  ROOT,
  srcIndex !== -1 ? args[srcIndex + 1] : "../chatgpt-desktop-src/app/webview/assets/app-shared-7b9edc1bfb7f.js",
);
const OUT_DIR = path.join(ROOT, "src/renderer/app-shared/ui/icons");

const text = fs.readFileSync(SRC, "utf8");
const head = /var (\w+);\nfunction (\w+)\(\) \{\n  return \(\2 = t\(\(\) => \{\n    X\(\), \1 = Y\(\{/g;
const matches = [...text.matchAll(head)];

function extractObject(source, openBraceIndex) {
  let depth = 0;
  let i = openBraceIndex;
  let inBacktick = false;
  while (i < source.length) {
    const c = source[i];
    if (inBacktick) {
      if (c === "`" && source[i - 1] !== "\\") inBacktick = false;
    } else if (c === "`") {
      inBacktick = true;
    } else if (c === "{") {
      depth += 1;
    } else if (c === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openBraceIndex, i + 1);
    }
    i += 1;
  }
  throw new Error("unbalanced icon definition");
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = {};
for (const m of matches) {
  const openBrace = m.index + m[0].length - 1;
  const definition = extractObject(text, openBrace);
  const nameMatch = /name: `([^`]+)`/.exec(definition);
  if (nameMatch == null) continue;
  const iconName = nameMatch[1];
  const fileName = iconName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "icon";
  const varName = "icon_" + iconName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const module = `// 图标资产：${iconName}
//（原 app-shared 内部压缩名 ${m[1]}，懒初始化器 ${m[2]}；
// 由 scripts/generate-icons.mjs 从原 chunk 提取生成，勿手改）。

import { createIconPreset } from "./icon-preset";

export const ${varName} = createIconPreset(${definition});
`;
  fs.writeFileSync(path.join(OUT_DIR, fileName + ".ts"), module);
  manifest[iconName] = { file: `ui/icons/${fileName}.ts`, var: m[1], init: m[2], export: varName };
}
fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`generated ${Object.keys(manifest).length} icon modules from ${SRC}`);
