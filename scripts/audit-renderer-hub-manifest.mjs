#!/usr/bin/env node
// Exhaustive renderer-hub export manifest gate.  Every export is emitted with
// an evidence-backed category; unknown exports remain `unreviewed` and strict
// mode fails instead of silently treating them as preserved.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HUBS = { "app-shared": "app-shared-7b9edc1bfb7f.ts", "app-initial": "app-initial-51da50e6c6e3.ts", "app-primary": "app-primary-d66705000d76.ts" };
const classifications = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/renderer-hub-line-classification.json"), "utf8"));
const rendererFiles = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else if (/\.tsx?$/.test(entry.name)) rendererFiles.push(file); } }
walk(path.join(ROOT, "src/renderer"));
function exportsFor(hub) { const source = fs.readFileSync(path.join(ROOT, "src/webview/assets", HUBS[hub]), "utf8"); const start = Math.max(source.lastIndexOf("export{"), source.lastIndexOf("export {")); return [...source.slice(start).matchAll(/(?<![A-Za-z0-9_$])[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)(?![A-Za-z0-9_$])/g)].map((m) => m[1]); }
function consumedFor(hub) { const named = new Set(); const members = new Set(); const re = new RegExp(`import\\s+([^;]*?)\\s+from\\s+["']@rchunk/${hub}["']`, "g"); for (const file of rendererFiles) { const src = fs.readFileSync(file, "utf8"); for (const m of src.matchAll(re)) { const clause = m[1]; const ns = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/); if (ns) for (const x of src.matchAll(new RegExp(`\\b${ns[1]}\\.([A-Za-z_$][\\w$]*)\\b`, "g"))) members.add(x[1]); const braces = clause.match(/\{([\s\S]*)\}/); if (braces) for (const item of braces[1].split(",")) { const a = item.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, ""); if (/^[A-Za-z_$][\w$]*$/.test(a)) named.add(a); } } } return new Set([...named, ...members]); }
const manifest = []; const summary = {};
for (const hub of Object.keys(HUBS)) { const consumed = consumedFor(hub); const reviewed = new Map(classifications.filter((e) => e.hub === hub).map((e) => [e.alias, e])); for (const alias of exportsFor(hub)) { const evidence = reviewed.get(alias); const category = consumed.has(alias) ? "consumed" : evidence?.classification === "semantic-business-logic" ? "semantic" : evidence ? "preserved-coupled" : "unreviewed"; manifest.push({ hub, alias, category, sourceLine: evidence ? [evidence.startLine, evidence.endLine] : null, module: evidence?.module ?? null }); summary[`${hub}:${category}`] = (summary[`${hub}:${category}`] ?? 0) + 1; } }
for (const [key, count] of Object.entries(summary).sort()) console.log(`${key}: ${count}`);
const unreviewed = manifest.filter((e) => e.category === "unreviewed"); console.log(`TOTAL: ${manifest.length}; UNREVIEWED: ${unreviewed.length}`);
if (process.argv.includes("--json")) console.log(JSON.stringify(manifest));
if (process.argv.includes("--strict") && unreviewed.length) process.exit(1);
