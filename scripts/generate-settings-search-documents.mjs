// 设置搜索索引生成器：从原 chunk 提取 20 区块 / 4,480 条消息的纯数据对象，
// 生成 src/renderer/settings-search-documents/index.ts。
//
// 用法：node scripts/generate-settings-search-documents.mjs [--src <原文件>]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const srcIndex = args.indexOf("--src");
const SRC = path.resolve(
  ROOT,
  srcIndex !== -1
    ? args[srcIndex + 1]
    : "../chatgpt-desktop-src/app/webview/assets/_virtual_settings-search-documents-d81257e4909b.js",
);
const OUT = path.join(ROOT, "src/renderer/settings-search-documents/index.ts");

const text = fs.readFileSync(SRC, "utf8");
const start = text.indexOf("t = {") + "t = {".length - 1;
let depth = 0;
let i = start;
let inBacktick = false;
while (i < text.length) {
  const c = text[i];
  if (inBacktick) {
    if (c === "`" && text[i - 1] !== "\\") inBacktick = false;
  } else if (c === "`") {
    inBacktick = true;
  } else if (c === "{") {
    depth += 1;
  } else if (c === "}") {
    depth -= 1;
    if (depth === 0) break;
  }
  i += 1;
}
const definition = text.slice(start, i + 1);
const entries = (definition.match(/defaultMessage/g) ?? []).length;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  `// settings-search-documents —— 设置搜索索引（20 区块 / ${entries} 条消息）。
//
// 原版：app/webview/assets/_virtual_settings-search-documents-d81257e4909b.js
//（559KB 纯数据：每个设置项的 defaultMessage/id/description 搜索文档）。
// 由 scripts/generate-settings-search-documents.mjs 从原 chunk 提取生成，
// 勿手改。

export interface SettingsSearchDocument {
  defaultMessage: string;
  description?: string;
  id: string;
}

export const settingsSearchDocuments: Record<string, SettingsSearchDocument[]> = ${definition};
`,
);
console.log(`generated settings-search-documents (${entries} entries) from ${SRC}`);
