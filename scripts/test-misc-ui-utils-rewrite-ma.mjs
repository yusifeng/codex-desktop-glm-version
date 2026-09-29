import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.resolve(root, "../chatgpt-desktop-src/app/webview/assets");
const models = [
  ["noop-4d1a48b9db0c.js", "noop", ["n", "t"]],
  ["is-plan-event-enabled-edb7e7f2c465.js", "is-plan-event-enabled", ["n", "t"]],
  ["null-throws-c7a886463bcb.js", "null-throws", ["n", "t"]],
  ["info-DKCQHKI2-6cd828785a90.js", "info-dkcqhki2", ["createInfoServices"]],
  ["radar-I7S5WNFK-d8a8341910a0.js", "radar-i7s5wnfk", ["createRadarServices"]],
  ["packet-7NZHBO7P-d3ff92a34860.js", "packet-7nzhbo7p", ["createPacketServices"]],
  ["treemap-6X3UGDF4-3ad64d68581e.js", "treemap-6x3ugdf4", ["createTreemapServices"]],
  ["railroad-3IZDKUUU-120ea05f1fcb.js", "railroad-3izdkuuu", ["createRailroadServices"]],
  ["treeView-QDETBFTQ-b788caf185e0.js", "treeview-qdetbftq", ["createTreeViewServices"]],
  ["railroad-peg-LSFZ7HO6-a2fd40f087ca.js", "railroad-peg-lsfz7ho6", ["createRailroadPegServices"]],
];
const dependencyNames = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) => match[1].replace(/-[a-f0-9]{12}$/, ""));
let sourceAssertions = 0;
for (const [asset, directory] of models) {
  const original = fs.readFileSync(path.join(assetRoot, asset), "utf8");
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    dependencyNames(original, /from "\.\/([^"]+)\.js"/g),
    dependencyNames(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g),
    `${directory} static dependencies`,
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
    `${directory} dynamic dependencies`,
  );
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false, `${directory} type escapes`);
  assert.ok(recovered.includes("Release chunk:"), `${directory} source provenance`);
  sourceAssertions += 4;
}

const services = new Map([
  ["chunk-BIQX33UG", ["info", "createInfoServices"]],
  ["chunk-QBLGF6JB", ["radar", "createRadarServices"]],
  ["chunk-EMLP6XTP", ["packet", "createPacketServices"]],
  ["chunk-R7FJI6CG", ["treemap", "createTreemapServices"]],
  ["chunk-5TONJI2A", ["railroad", "createRailroadServices"]],
  ["chunk-CQNSW5MT", ["treeview", "createTreeViewServices"]],
  ["chunk-JG7HCLWE", ["railroad-peg", "createRailroadPegServices"]],
]);
const mockSource = (name) => {
  if (name === "chunk-KEIR6QF5")
    return `export const w=()=>globalThis.__maCalls.push("shared");`;
  const service = services.get(name);
  if (service) {
    const [kind] = service;
    return `export const n=value=>({kind:${JSON.stringify(kind)},value});export const r=()=>globalThis.__maCalls.push(${JSON.stringify(kind)});`;
  }
  return "export {};";
};
async function bundle(directory) {
  globalThis.__maCalls = [];
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "rchunk-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({
            contents: mockSource(name),
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of models) {
  const module = await bundle(directory);
  loaded.set(directory, { module, calls: [...globalThis.__maCalls] });
  assert.deepEqual(Object.keys(module).sort(), [...expectedExports].sort(), `${directory} exports`);
  runtimeAssertions += 1;
}

const noop = loaded.get("noop").module;
assert.equal(noop.n("ignored"), undefined);
assert.equal(noop.t(), undefined);
runtimeAssertions += 2;

const plan = loaded.get("is-plan-event-enabled").module;
assert.equal(plan.n(undefined, undefined), true);
assert.equal(plan.n({ __default: { enabled: false } }, undefined), false);
assert.equal(plan.n({ __default: { enabled: false } }, { enabled: true }), true);
assert.equal(plan.n({ __default: { enabled: true } }, { enabled: false }), false);
runtimeAssertions += 4;

const nullThrows = loaded.get("null-throws").module;
const token = { id: 7 };
assert.equal(nullThrows.n(token), token);
assert.throws(() => nullThrows.n(null), /Unexpected null or undefined value/);
assert.throws(() => nullThrows.n(undefined), /Unexpected null or undefined value/);
runtimeAssertions += 3;

for (const [chunk, [kind, exportName]] of services) {
  const directory = [...models].find(([_asset, candidate, exports]) => exports[0] === exportName)?.[1];
  assert.ok(directory, `${chunk} directory lookup`);
  const loadedService = loaded.get(directory);
  assert.deepEqual(loadedService.calls, [kind, "shared"], `${kind} initialization order`);
  assert.deepEqual(loadedService.module[exportName](42), { kind, value: 42 });
  runtimeAssertions += 2;
}

console.log(`${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`);
