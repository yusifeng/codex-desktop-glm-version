// Materialize the runtime-route module graphs as reviewable ESM source.
// This is a recovery tool, not part of the application build: the build consumes
// the checked-in source and never falls back to .reference release assets.

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
  // Preserve the two intentional spaces in the dotnet diagnostic template
  // without leaving physical trailing whitespace in the checked-in source.
  const normalized = formatted.replace(
    "This application was built with linking (tree shaking) disabled. \nPublished applications will be significantly smaller if you install wasm-tools workload. \n",
    'This application was built with linking (tree shaking) disabled.${" "}\nPublished applications will be significantly smaller if you install wasm-tools workload.${" "}\n',
  );
  await fs.writeFile(path.join(sourceDirectory, name), normalized);
}

await fs.writeFile(
  path.join(sourceDirectory, "manifest.json"),
  `${JSON.stringify({ format: 1, moduleCount: recovered.size, modules: [...recovered].sort() }, null, 2)}\n`,
);
await fs.writeFile(
  path.join(sourceDirectory, "README.md"),
  `# Recovered runtime route graphs\n\nThis directory is the checked-in, formatted, release-derived ESM compatibility source for the conversation, settings, composer, home/onboarding, and structural component graphs plus their eager runtime dependencies. The renderer build compiles every module in this graph; it does not read \`.reference\` or copy published JavaScript directly into the runtime tree. This is not semantic-decompilation completion: readable rewrites under \`src/renderer/\` replace these modules only after their cross-chunk contracts and React component behavior are complete.\n`,
);

console.log(`recovered ${recovered.size} runtime-route modules into ${path.relative(ROOT, sourceDirectory)}`);
