import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNKS, IMPORT_ALIASES } from "./renderer-chunk-manifest.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reverseChunks = new Map(Object.entries(CHUNKS).map(([owner, output]) => [output, owner]));
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

export function assertReleaseOwner(owner, patterns = []) {
  const output = CHUNKS[owner];
  assert.equal(typeof output, "string", `${owner} has a renderer chunk mapping`);
  const current = fs
    .readFileSync(path.join(ROOT, "src/renderer", owner, "index.ts"), "utf8")
    .replace(/[ \t]+$/gm, "");
  const release = normalizeRelease(
    fs.readFileSync(path.join(ROOT, "src/webview/assets", output.replace(/\.js$/, ".ts")), "utf8"),
  );
  assert.equal(current.trimEnd(), release.trimEnd(), `${owner} is release-faithful apart from owner imports`);
  for (const pattern of patterns) assert.match(current, pattern, `${owner} contains ${pattern}`);
  return 1 + patterns.length;
}
