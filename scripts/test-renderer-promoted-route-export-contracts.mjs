import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { PROMOTED_ROUTE_DEPENDENCIES } from "./renderer-route-recovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function exportedNames(baseDirectory, file) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, baseDirectory, file)],
    bundle: false,
    format: "esm",
    logLevel: "silent",
    metafile: true,
    write: false,
  });
  return Object.values(result.metafile.outputs)[0].exports.sort();
}

let assertions = 0;
for (const file of PROMOTED_ROUTE_DEPENDENCIES) {
  const original = await exportedNames(".reference/app-original/webview/assets", file);
  const promoted = await exportedNames("app/webview/assets", file);
  assert.deepEqual(promoted, original, `${file} preserves its published ESM export contract`);
  assertions += 1;
}

console.log(`${assertions} promoted renderer route export-contract assertions passed`);
