#!/usr/bin/env node
// Exhaustive renderer-hub export manifest gate.  Every export is emitted with
// an evidence-backed category; unknown exports remain `unreviewed` and strict
// mode fails instead of silently treating them as preserved.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyHub } from "./audit-renderer-hub-classification.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HUBS = { "app-shared": "app-shared-7b9edc1bfb7f.ts", "app-initial": "app-initial-51da50e6c6e3.ts", "app-primary": "app-primary-d66705000d76.ts" };
const classifications = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/renderer-hub-line-classification.json"), "utf8"));
function exportsFor(hub) { const source = fs.readFileSync(path.join(ROOT, "src/webview/assets", HUBS[hub]), "utf8"); const start = Math.max(source.lastIndexOf("export{"), source.lastIndexOf("export {")); return [...source.slice(start).matchAll(/(?<![A-Za-z0-9_$])[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)(?![A-Za-z0-9_$])/g)].map((m) => m[1]); }
const manifest = []; const summary = {};
for (const hub of Object.keys(HUBS)) { const consumed = new Set(classifyHub(hub).consumedAliases); const reviewed = new Map(classifications.filter((e) => e.hub === hub).map((e) => [e.alias, e])); for (const alias of exportsFor(hub)) { const evidence = reviewed.get(alias); const category = consumed.has(alias) ? "consumed" : evidence?.classification === "semantic-business-logic" ? "semantic" : evidence ? "preserved-coupled" : "unreviewed"; manifest.push({ hub, alias, category, sourceLine: evidence ? [evidence.startLine, evidence.endLine] : null, module: evidence?.module ?? null }); summary[`${hub}:${category}`] = (summary[`${hub}:${category}`] ?? 0) + 1; } }
for (const [key, count] of Object.entries(summary).sort()) console.log(`${key}: ${count}`);
const unreviewed = manifest.filter((e) => e.category === "unreviewed"); console.log(`TOTAL: ${manifest.length}; UNREVIEWED: ${unreviewed.length}`);
if (process.argv.includes("--json")) console.log(JSON.stringify(manifest));
if (process.argv.includes("--strict") && unreviewed.length) process.exit(1);
