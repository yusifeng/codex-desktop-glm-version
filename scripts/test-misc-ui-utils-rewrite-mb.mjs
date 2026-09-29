import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "src/webview/assets");
const modules = [
  [
    "railroad-abnf-AHOZXSZD-bc0d6db82b89.js",
    "railroad-abnf-ahozxszd",
    ["createRailroadAbnfServices"],
  ],
  [
    "railroad-ebnf-EBAXGLYW-9fbab3318627.js",
    "railroad-ebnf-ebaxglyw",
    ["createRailroadEbnfServices"],
  ],
  ["useStableCallback-43628b79218b.js", "use-stable-callback-render-ref", ["n", "t"]],
  ["type-3d72495926ec.js", "learning-model-ionic-vs-covalent", ["n", "t"]],
  ["type-3bc326afff31.js", "learning-model-myopia", ["n", "t"]],
  ["type-98cbaaa40c49.js", "learning-model-place-value", ["n", "t"]],
  ["type-28180140955e.js", "learning-model-hyperopia", ["n", "t"]],
  ["type-d56e7431251b.js", "learning-model-similar-triangles", ["n", "t"]],
  ["type-4a4927d40e3e.js", "learning-model-fixed-ratio-scaling", ["n", "t"]],
  ["type-42a870b7bbdb.js", "learning-model-eye-accommodation", ["n", "t"]],
];

const dependencyNames = (source, pattern) =>
  [...source.matchAll(pattern)].map((match) =>
    match[1].replace(/-[a-f0-9]{12}$/u, ""),
  );

let sourceAssertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(
    path.join(assetRoot, asset.replace(/\.js$/u, ".ts")),
    "utf8",
  );
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    dependencyNames(original, /from "\.\/([^"]+)\.js"/gu),
    dependencyNames(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
    `${directory} static dependencies`,
  );
  assert.equal(
    (original.match(/import\(/gu) ?? []).length,
    (recovered.match(/import\(/gu) ?? []).length,
    `${directory} dynamic dependencies`,
  );
  assert.equal(
    /\bany\b|@ts-expect-error/u.test(recovered),
    false,
    `${directory} type escapes`,
  );
  assert.ok(
    recovered.includes("Release chunk:"),
    `${directory} source provenance`,
  );
  sourceAssertions += 4;
}

const specifications = new Map([
  [
    "learning-model-ionic-vs-covalent",
    {
      type: "IONIC_VS_COVALENT",
      version: 1,
      parameters: {
        bondType: {
          kind: "enum",
          defaultValue: "ionic",
          allowedValues: ["ionic", "covalent"],
        },
      },
    },
  ],
  [
    "learning-model-myopia",
    {
      type: "MYOPIA",
      version: 1,
      thumbnailAssetKey: "myopia-v1",
      parameters: {
        objectDistanceMeters: {
          kind: "number",
          defaultValue: 6,
          min: 0.25,
          max: 6,
        },
      },
    },
  ],
  [
    "learning-model-place-value",
    {
      type: "PLACE_VALUE",
      version: 1,
      thumbnailAssetKey: "place-value-v1",
      parameters: {
        number: { kind: "integer", defaultValue: 2654, min: 0, max: 9999 },
      },
    },
  ],
  [
    "learning-model-hyperopia",
    {
      type: "HYPEROPIA",
      version: 1,
      thumbnailAssetKey: "hyperopia-v2",
      parameters: {
        objectDistanceMeters: {
          kind: "number",
          defaultValue: 0.5,
          min: 0.25,
          max: 6,
        },
      },
    },
  ],
  [
    "learning-model-similar-triangles",
    {
      type: "SIMILAR_TRIANGLES",
      version: 1,
      thumbnailAssetKey: "similar-triangles-v1",
      parameters: {
        scale: { kind: "number", defaultValue: 1.4, min: 0.5, max: 2 },
      },
    },
  ],
  [
    "learning-model-fixed-ratio-scaling",
    {
      type: "FIXED_RATIO_SCALING",
      version: 2,
      thumbnailAssetKey: "fixed-ratio-scaling-v1",
      parameters: {
        scaleFactor: { kind: "number", defaultValue: 1.5, min: 0.5, max: 2 },
      },
    },
  ],
  [
    "learning-model-eye-accommodation",
    {
      type: "EYE_ACCOMMODATION",
      version: 1,
      thumbnailAssetKey: "eye-accommodation-v1",
      parameters: {
        objectDistanceMeters: {
          kind: "number",
          defaultValue: 1,
          min: 0.25,
          max: 6,
        },
      },
    },
  ],
]);

function mockSource(name) {
  if (name === "chunk-KEIR6QF5")
    return 'export const w=()=>globalThis.__mbCalls.push("shared");';
  if (name === "chunk-5HE753X5")
    return 'export const n=value=>({grammar:"abnf",value});export const r=()=>globalThis.__mbCalls.push("abnf");';
  if (name === "chunk-U6XO7XAA")
    return 'export const n=value=>({grammar:"ebnf",value});export const r=()=>globalThis.__mbCalls.push("ebnf");';
  if (name === "app-shared")
    return "const s=globalThis.__mbHook;export const e6=()=>({useRef:value=>s.reference??={current:value},useCallback:callback=>{s.useCallbackCalls+=1;return s.callback??=callback},useMemo:factory=>s.memo??=factory()});";
  return "export {};";
}

async function bundle(directory) {
  globalThis.__mbCalls = [];
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
          build.onResolve(
            { filter: /^@rchunk\// },
            ({ path: modulePath }) => ({
              path: modulePath.slice(8),
              namespace: "mock",
            }),
          );
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: name }) => ({ contents: mockSource(name), loader: "js" }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

globalThis.__mbHook = {
  reference: null,
  callback: null,
  memo: null,
  useCallbackCalls: 0,
};
const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory, expectedExports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, { module, calls: [...globalThis.__mbCalls] });
  assert.deepEqual(
    Object.keys(module).sort(),
    [...expectedExports].sort(),
    `${directory} exports`,
  );
  runtimeAssertions += 1;
}

for (const [directory, expected] of specifications) {
  const module = loaded.get(directory).module;
  module.t();
  const first = module.n;
  assert.deepEqual(first, expected, `${directory} specification`);
  module.t();
  assert.equal(module.n, first, `${directory} idempotent initialization`);
  runtimeAssertions += 2;
}

const abnf = loaded.get("railroad-abnf-ahozxszd");
assert.deepEqual(abnf.calls, ["abnf", "shared"]);
assert.deepEqual(abnf.module.createRailroadAbnfServices(7), {
  grammar: "abnf",
  value: 7,
});
const ebnf = loaded.get("railroad-ebnf-ebaxglyw");
assert.deepEqual(ebnf.calls, ["ebnf", "shared"]);
assert.deepEqual(ebnf.module.createRailroadEbnfServices(8), {
  grammar: "ebnf",
  value: 8,
});
runtimeAssertions += 4;

const stable = loaded.get("use-stable-callback-render-ref").module;
stable.t();
const firstCallback = stable.n((value) => `first:${value}`);
assert.equal(firstCallback(1), "first:1");
const secondCallback = stable.n((value) => `second:${value}`);
assert.equal(secondCallback, firstCallback);
assert.equal(secondCallback(2), "second:2");
assert.equal(globalThis.__mbHook.useCallbackCalls, 2);
runtimeAssertions += 4;

console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
