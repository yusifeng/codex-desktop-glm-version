import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rendererRoot = path.join(root, "src/renderer");
const localePath = path.join(root, "src/webview/assets/zh-CN-6b83584f4688.ts");

function sourceFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) sourceFiles(file, files);
    else if (/\.(?:js|jsx|ts|tsx)$/.test(entry.name)) files.push(file);
  }
  return files;
}

const hostMessageIds = new Set();
for (const file of sourceFiles(rendererRoot)) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/id:\s*[`"']([^`"']+\.host)[`"']/g)) {
    hostMessageIds.add(match[1]);
  }
}

const localeSource = fs.readFileSync(localePath, "utf8");
const missing = [...hostMessageIds]
  .filter((messageId) => !localeSource.includes(JSON.stringify(messageId)))
  .sort();

if (missing.length > 0) {
  console.error(`zh-CN is missing ${missing.length} renderer host message IDs:\n${missing.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`zh-CN host localization verified: ${hostMessageIds.size} renderer message IDs covered`);
}
