// Materialize the exact conversation-route module graph as reviewable source.
// This is a recovery tool, not part of the application build: the build consumes
// the checked-in output and never falls back to .reference release assets.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import { collectConversationRouteClosure } from "./renderer-route-recovery.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDirectory = path.join(ROOT, ".reference/app-original/webview/assets");
const sourceDirectory = path.join(ROOT, "src/renderer-recovered/conversation-route");
const recovered = await collectConversationRouteClosure(releaseDirectory);

await fs.mkdir(sourceDirectory, { recursive: true });
const expected = new Set([...recovered, "manifest.json", "README.md"]);
for (const entry of await fs.readdir(sourceDirectory)) {
  if (!expected.has(entry)) await fs.rm(path.join(sourceDirectory, entry), { recursive: true });
}

for (const name of [...recovered].sort()) {
  const releaseCode = await fs.readFile(path.join(releaseDirectory, name), "utf8");
  const withoutMissingMap = releaseCode.replace(/\n?\/\/# sourceMappingURL=.*?\.map\s*$/, "\n");
  const formatted = await prettier.format(withoutMissingMap, { parser: "babel", printWidth: 120 });
  await fs.writeFile(path.join(sourceDirectory, name), formatted);
}

await fs.writeFile(
  path.join(sourceDirectory, "manifest.json"),
  `${JSON.stringify({ format: 1, moduleCount: recovered.size, modules: [...recovered].sort() }, null, 2)}\n`,
);
await fs.writeFile(
  path.join(sourceDirectory, "README.md"),
  `# Recovered conversation route\n\nThis directory is the checked-in, formatted source recovery of the release conversation-route module graph. The renderer build consumes these files directly; it does not read \`.reference\` or copy release assets at build time. Semantic rewrites remain under \`src/renderer/\` and can replace these exact-recovery modules one graph segment at a time.\n`,
);

console.log(`recovered ${recovered.size} conversation-route modules into ${path.relative(ROOT, sourceDirectory)}`);
