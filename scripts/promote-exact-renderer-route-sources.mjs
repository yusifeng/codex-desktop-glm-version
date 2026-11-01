// Materialize release-faithful route modules in their semantic source owners.
//
// This is a source-recovery step, not a runtime fallback. The generated files
// are checked in, the renderer build consumes them without reading .reference,
// and only import specifiers are rewritten so cross-chunk ESM remains external.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXACT_ROUTE_SOURCE_OWNERS } from "./renderer-route-recovery.mjs";
import { formatExactRouteSource } from "./renderer-exact-route-source.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDirectory = path.join(ROOT, ".reference/app-original/webview/assets");
const rendererDirectory = path.join(ROOT, "src/renderer");

for (const [semanticName, output] of EXACT_ROUTE_SOURCE_OWNERS) {
  const releaseCode = await fs.readFile(path.join(releaseDirectory, output), "utf8");
  const source = await formatExactRouteSource(releaseCode, output);
  await fs.mkdir(path.join(rendererDirectory, semanticName), { recursive: true });
  await fs.writeFile(path.join(rendererDirectory, semanticName, "exact.js"), source);
}

console.log(`promoted ${EXACT_ROUTE_SOURCE_OWNERS.size} exact renderer route sources`);
