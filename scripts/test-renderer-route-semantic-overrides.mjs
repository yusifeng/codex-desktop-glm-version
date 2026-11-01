import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { CHUNKS, IMPORT_ALIASES, REWRITTEN } from "./renderer-chunk-manifest.mjs";
import {
  collectConversationRouteClosure,
  SEMANTIC_ROUTE_OVERRIDES,
} from "./renderer-route-recovery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const semanticByOutput = new Map([...REWRITTEN].map((name) => [CHUNKS[name], name]));
const compatibilityDirectory = path.join(root, "src/renderer-recovered/conversation-route");
const releaseDirectory = path.join(root, ".reference/app-original/webview/assets");
const closure = await collectConversationRouteClosure(compatibilityDirectory);

assert.ok(SEMANTIC_ROUTE_OVERRIDES.size >= 30, "semantic promotion is a substantial route batch");

function exportNames(code) {
  return [...code.matchAll(/export\s*\{([\s\S]*?)\};/g)]
    .flatMap((match) => match[1].split(","))
    .map((entry) => entry.trim().match(/(?:\bas\s+)?([\w$]+)$/)?.[1])
    .filter(Boolean)
    .sort();
}

let checked = 0;
for (const output of [...SEMANTIC_ROUTE_OVERRIDES].sort()) {
  const semanticName = semanticByOutput.get(output);
  assert.ok(semanticName, `${output} maps to a rewritten semantic module`);
  assert.equal(closure.has(output), false, `${output} is no longer compatibility-owned`);

  const entry = path.join(root, "src/renderer", semanticName, "index.ts");
  const source = await fs.readFile(entry, "utf8");
  assert.doesNotMatch(
    source,
    /return\s+\{\s*kind:[\s\S]{0,200}?props:/,
    `${semanticName} is not a structural view-model placeholder`,
  );

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "esnext",
    logLevel: "silent",
    plugins: [{
      name: "semantic-route-contract-imports",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, (args) => {
          const name = args.path.slice("@rchunk/".length);
          const target = CHUNKS[name] ?? IMPORT_ALIASES[name];
          assert.ok(target, `${semanticName} has a known chunk dependency ${name}`);
          return { path: `./${target}`, external: true };
        });
      },
    }],
  });
  const compiled = result.outputFiles[0].text;
  const release = await fs.readFile(path.join(releaseDirectory, output), "utf8");
  assert.deepEqual(
    exportNames(compiled),
    exportNames(release),
    `${semanticName} preserves the release export surface`,
  );
  checked += 1;
}

console.log(`${checked * 4 + 1} semantic route override assertions passed (${checked} modules)`);
