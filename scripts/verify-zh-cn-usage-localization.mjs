import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ownerPath = path.join(root, "src/renderer/usage-settings-page/index.ts");
const localePath = path.join(root, "src/webview/assets/zh-CN-6b83584f4688.ts");
const owner = fs.readFileSync(ownerPath, "utf8");
const locale = fs.readFileSync(localePath, "utf8");

const messageIds = new Set(
  [...owner.matchAll(/\bid:\s*`(settings\.usage\.[^`$]+)`/g)].map((match) => match[1]),
);
const localeIds = new Set(
  [...locale.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]),
);
const missing = [...messageIds].filter((id) => !localeIds.has(id)).sort();

if (missing.length > 0) {
  console.error(`Missing zh-CN translations for ${missing.length} usage settings messages:`);
  for (const id of missing) console.error(`- ${id}`);
  process.exit(1);
}

console.log(`${messageIds.size} usage settings message IDs covered by zh-CN`);
