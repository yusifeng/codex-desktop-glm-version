import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, IMPORT_ALIASES } from "./renderer-chunk-manifest.mjs";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const reverseChunks = new Map(
  Object.entries(CHUNKS).map(([owner, output]) => [output, owner]),
);
for (const [owner, output] of Object.entries(IMPORT_ALIASES)) {
  if (!reverseChunks.has(output)) reverseChunks.set(output, owner);
}

export function normalizeRelease(source) {
  return source
    .replace(/(["'`])\.\/([^"'`/]+\.js)\1/g, (match, quote, output) =>
      reverseChunks.has(output)
        ? `${quote}@rchunk/${reverseChunks.get(output)}${quote}`
        : `${quote}@exact-chunk/${output}${quote}`,
    )
    .replace(/[ \t]+$/gm, "");
}

function stripStaticOwnerImports(source) {
  // Release-owner assertions protect the recovered implementation body. Import
  // boundaries are allowed to move from an aggregate release chunk to a
  // reviewed semantic TypeScript owner, so compare those independently via the
  // renderer hub gate/typecheck instead of freezing the original import list.
  return source
    .replace(/^import\s+\{[\s\S]*?\}\s+from\s+["'][^"'\n]+["'];?\n?/gm, "")
    .replace(
      /^import\s+\*\s+as\s+[A-Za-z_$][\w$]*\s+from\s+["'][^"'\n]+["'];?\n?/gm,
      "",
    )
    .replace(
      /^import\s+[A-Za-z_$][\w$]*(?:\s*,\s*\{[\s\S]*?\})?\s+from\s+["'][^"'\n]+["'];?\n?/gm,
      "",
    )
    .replace(/^import\s+["'][^"'\n]+["'];?\n?/gm, "");
}

export function assertReleaseOwner(owner, patterns = []) {
  const output = CHUNKS[owner];
  assert.equal(
    typeof output,
    "string",
    `${owner} has a renderer chunk mapping`,
  );
  const current = normalizeRelease(
    fs.readFileSync(path.join(ROOT, "src/renderer", owner, "index.ts"), "utf8"),
  ).replace(/[ \t]+$/gm, "");
  const release = normalizeRelease(
    fs.readFileSync(
      path.join(ROOT, "src/webview/assets", output.replace(/\.js$/, ".ts")),
      "utf8",
    ),
  );
  assert.equal(
    stripStaticOwnerImports(current).trimEnd(),
    stripStaticOwnerImports(release).trimEnd(),
    `${owner} is release-faithful apart from owner imports`,
  );
  for (const pattern of patterns)
    assert.match(current, pattern, `${owner} contains ${pattern}`);
  return 1 + patterns.length;
}
