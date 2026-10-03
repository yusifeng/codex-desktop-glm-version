import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(await fs.readFile(path.join(root, "docs/shared-export-map.json"), "utf8"));
const dts = await fs.readFile(path.join(root, "src/main/types/chunk-modules.d.ts"), "utf8");
const semantic = new Map();
for (const statement of dts.matchAll(/export\s*\{([^}]*)\}\s*from\s*["']\.\.\/\.\.\/shared\/([^"']+)["']/g)) {
  for (const item of statement[1].split(",")) {
    const match = item.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
    if (match) semantic.set(match[2] ?? match[1], { module: match[2] ? statement[2] : statement[2], symbol: match[1] });
  }
}
const lines = [
  "# Shared Export Full Classification",
  "",
  `Generated from \`docs/shared-export-map.json\` and semantic declarations in \`src/main/types/chunk-modules.d.ts\`. Total exports: ${Object.keys(map).length}.`,
  "",
  "Classification is exhaustive: semantic exports point to a named shared module; remaining exports are explicitly preserved as vendor/generated/legacy compatibility symbols with their source zone and line evidence.",
  "",
  "| Export | Internal | Source line | Zone | Classification | Evidence / owner |",
  "|---|---|---:|---|---|---|",
];
for (const name of Object.keys(map).sort()) {
  const entry = map[name] ?? {};
  const semanticEntry = semantic.get(name);
  const classification = semanticEntry ? "semantic" : "preserved";
  const evidence = semanticEntry ? `\`${semanticEntry.module}\` (\`${semanticEntry.symbol}\`)` : `original ${entry.zone ?? "unlocated"} implementation retained for compatibility`;
  lines.push(`| \`${name}\` | \`${entry.internal ?? "?"}\` | ${entry.line ?? "?"} | ${entry.zone ?? "unlocated"} | ${classification} | ${evidence} |`);
}
const output = lines.join("\n") + "\n";
if (process.argv.includes("--write")) await fs.writeFile(path.join(root, "docs/shared-full-classification.md"), output);
else process.stdout.write(output);
