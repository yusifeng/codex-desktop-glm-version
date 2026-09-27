#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS } from "./renderer-chunk-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const groups = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/renderer-app-chunks.json"), "utf8"));
const trackedFiles = new Set(Object.values(CHUNKS));
const appFiles = new Set(Object.values(groups).flat());
const trackedAppFiles = [...appFiles].filter((file) => trackedFiles.has(file));
const pendingAppFiles = [...appFiles].filter((file) => !trackedFiles.has(file));
const priorityGroups = ["composer", "sidebar", "dialogs-menus", "git-github-worktree", "conversation-thread", "home-onboarding", "terminal", "browser", "settings", "pages-routes"];

console.log(`${trackedAppFiles.length}/${appFiles.size} classified app-code chunks tracked; ${pendingAppFiles.length} pending`);
for (const group of priorityGroups) {
  const files = [...new Set(groups[group] ?? [])];
  const tracked = files.filter((file) => trackedFiles.has(file)).length;
  console.log(`- ${group}: ${tracked}/${files.length} tracked, ${files.length - tracked} pending`);
}
