import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const owner = fs.readFileSync(path.join(root, "src/renderer/local-environments-settings-page/index.ts"), "utf8");
const locale = fs.readFileSync(path.join(root, "src/webview/assets/zh-CN-6b83584f4688.ts"), "utf8");
const messageIds = new Set(
  [...owner.matchAll(/\bid:\s*`([^`$]+)`/g)].map((match) => match[1]),
);
const localeIds = new Set([...locale.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]));
const missing = [...messageIds].filter((id) => !localeIds.has(id)).sort();

if (missing.length > 0) {
  console.error(`Missing zh-CN translations for ${missing.length} environment settings messages:`);
  for (const id of missing) console.error(`- ${id}`);
  process.exit(1);
}

console.log(`${messageIds.size} environment settings message IDs covered by zh-CN`);
