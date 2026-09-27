#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, PRESERVED_ASSETS, REWRITTEN } from "./renderer-chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
for (const [name, reason] of PRESERVED_ASSETS) {
  if (!(name in CHUNKS)) errors.push(`${name}: 未登记到 CHUNKS`);
  if (REWRITTEN.has(name)) errors.push(`${name}: 同时出现在 REWRITTEN 与 PRESERVED_ASSETS`);
  if (!/^(build-runtime|data:|generated:|vendor:|worker:)/.test(reason)) errors.push(`${name}: 非法保留理由 ${reason}`);
  const source = CHUNKS[name]?.replace(/\.js$/, ".ts");
  if (source != null && !fs.existsSync(path.join(ROOT, "src/webview/assets", source))) errors.push(`${name}: 缺少原资产 ${source}`);
}
const pending = Object.keys(CHUNKS).filter(name => !REWRITTEN.has(name) && !PRESERVED_ASSETS.has(name));
if (errors.length > 0) { console.error(errors.join("\n")); process.exit(1); }
console.log(`${REWRITTEN.size} rewritten, ${PRESERVED_ASSETS.size} preserved, ${pending.length} semantic tail modules pending`);
for (const name of pending) console.log(`- ${name}`);
