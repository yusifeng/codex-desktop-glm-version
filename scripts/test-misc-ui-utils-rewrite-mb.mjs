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
  [
    "useStableCallback-43628b79218b.js",
    "use-stable-callback-render-ref",
    ["n", "t"],
  ],
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
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
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

{
  const mb2AssetRoot = path.resolve(
    root,
    "../chatgpt-desktop-src/app/webview/assets",
  );
  const mb2Modules = [
    [
      "impl-70e51521c772.js",
      "model-picker-power-slider-impl",
      ["rolldown-runtime", "app-shared"],
    ],
    [
      "toggle-b02ae5564000.js",
      "chatgpt-thinking-toggle",
      ["rolldown-runtime", "app-shared", "app-initial", "app-primary"],
    ],
    [
      "triangle-visual-language-46f026eb70c8.js",
      "triangle-visual-language",
      ["rolldown-runtime", "app-shared"],
    ],
  ];
  const mb2Aliases = new Map([
    ["rolldown-runtime-2d059c5e81f4", "rolldown-runtime"],
    ["app-shared-7b9edc1bfb7f", "app-shared"],
    ["app-initial-51da50e6c6e3", "app-initial"],
    ["app-primary-d66705000d76", "app-primary"],
  ]);
  const mb2Dependencies = (source, recovered) =>
    recovered
      ? [...source.matchAll(/(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g)].map(
          (match) => match[1],
        )
      : [...source.matchAll(/import[\s\S]*?;/g)]
          .map(
            (statement) => statement[0].match(/["']\.\/([^"']+)\.js["']/)?.[1],
          )
          .filter((dependency) => dependency != null)
          .map((dependency) => mb2Aliases.get(dependency) ?? dependency);
  const mb2Exports = (source) =>
    [...source.matchAll(/export\s*\{([\s\S]*?)\};/g)]
      .flatMap((match) => match[1].split(","))
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => entry.match(/\bas\s+([A-Za-z_$][\w$]*)$/)?.[1] ?? entry)
      .sort();

  let mb2SourceAssertions = 0;
  for (const [asset, directory, expectedDependencies] of mb2Modules) {
    const original = fs.readFileSync(path.join(mb2AssetRoot, asset), "utf8");
    const recovered = fs.readFileSync(
      path.join(root, "src/renderer", directory, "index.ts"),
      "utf8",
    );
    assert.deepEqual(mb2Dependencies(original, false), expectedDependencies);
    assert.deepEqual(mb2Dependencies(recovered, true), expectedDependencies);
    assert.deepEqual(mb2Exports(recovered), mb2Exports(original));
    assert.equal(
      (original.match(/import\(/g) ?? []).length,
      (recovered.match(/import\(/g) ?? []).length,
    );
    assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
    assert.ok(recovered.includes("Release chunk: " + asset));
    assert.ok(recovered.length > 1_000);
    mb2SourceAssertions += 7;
  }

  const mb2SharedMock = `
const element=(type,props,key)=>({type,props,key});
export const I3=()=>({jsx:element,jsxs:element});
export const e6=()=>({useRef:value=>({current:value}),useState:value=>{let current=value;return [current,next=>{current=typeof next==='function'?next(current):next}]}});
export const m4=(...values)=>values.filter(Boolean).join(' ');
export const LX=signal=>({signal});export const ZI={};
export const Y2='FormattedMessage';export const Uv='ThinkingIcon';export const Yh='Button';export const o_='Tooltip';
`;
  const mb2Mocks = {
    "@rchunk/rolldown-runtime": "export {};",
    "@rchunk/app-shared": mb2SharedMock,
    "@rchunk/app-initial":
      "export const xpn=(...args)=>globalThis.__mb2Analytics.push(args);export const ypn=()=>globalThis.__mb2Init.push('initial');",
    "@rchunk/app-primary":
      "export const Ga='event';export const Ja=()=>globalThis.__mb2Init.push('primary');export const Ka={CHATGPT_MODEL_PICKER_SURFACE_TOGGLE:'toggle'};export const qa={CHATGPT_MODEL_PICKER_UI_EVENT_TYPE_AUTO_SWITCH_TO_THINKING_TOGGLE_CLICKED:'clicked'};",
  };
  async function mb2Bundle(directory) {
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
          name: "mb2-mocks",
          setup(build) {
            build.onResolve(
              { filter: /^@rchunk\// },
              ({ path: modulePath }) => ({
                path: modulePath,
                namespace: "mb2-mock",
              }),
            );
            build.onLoad(
              { filter: /.*/, namespace: "mb2-mock" },
              ({ path: modulePath }) => ({
                contents: mb2Mocks[modulePath] ?? "export {};",
                loader: "js",
              }),
            );
          },
        },
      ],
    });
    return import(
      "data:text/javascript;base64," +
        Buffer.from(result.outputFiles[0].text).toString("base64") +
        "#" +
        directory
    );
  }

  globalThis.__mb2Init = [];
  globalThis.__mb2Analytics = [];
  let mb2RuntimeAssertions = 0;
  const triangle = await mb2Bundle("triangle-visual-language");
  triangle.p();
  assert.deepEqual(triangle.f("ArrowLeft"), { x: -6, y: 0 });
  assert.deepEqual(triangle.f("Enter"), null);
  assert.deepEqual(triangle.d({ x: 100, y: 100 }, { x: 100, y: 200 }), {
    x: 100,
    y: 62,
  });
  const polygon = triangle.u({
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 3 },
    ],
  });
  assert.equal(polygon.props.points, "0,0 2,3");
  mb2RuntimeAssertions += 4;

  const toggle = await mb2Bundle("chatgpt-thinking-toggle");
  assert.deepEqual(globalThis.__mb2Init, ["primary", "initial"]);
  const updates = [];
  const toggleTree = toggle.ChatGptThinkingToggle({
    selectedSystemHints: [],
    onSystemHintsChange: (hints) => updates.push(hints),
  });
  toggleTree.props.children.props.onClick();
  assert.deepEqual(updates, [["reason"]]);
  assert.equal(globalThis.__mb2Analytics.length, 1);
  const selectedTree = toggle.ChatGptThinkingToggle({
    selectedSystemHints: ["browse", "reason"],
    onSystemHintsChange: (hints) => updates.push(hints),
  });
  selectedTree.props.children.props.onClick();
  assert.deepEqual(updates.at(-1), ["browse"]);
  mb2RuntimeAssertions += 4;

  const slider = await mb2Bundle("model-picker-power-slider-impl");
  const options = [
    { id: "a", label: "A" },
    { id: "b", label: "B", isLocked: true },
    { id: "c", label: "C", isMax: true },
    {
      id: "manual",
      label: "Manual",
      requiresExplicitSelection: true,
    },
  ];
  const selected = [];
  const committed = [];
  let draggedToMax = 0;
  const sliderTree = slider.ModelPickerPowerSliderImpl({
    active: true,
    fastModeEnabled: false,
    onCommitOption: (option) => committed.push(option.id),
    onDragToMax: () => {
      draggedToMax += 1;
    },
    onSelectOption: (option) => selected.push(option.id),
    options,
    selectedOptionId: "a",
  });
  const track = sliderTree.props.children[0];
  track.props.onKeyDown({
    key: "ArrowRight",
    preventDefault() {},
    stopPropagation() {},
  });
  assert.deepEqual(selected, ["c"]);
  assert.deepEqual(committed, ["c"]);
  assert.equal(draggedToMax, 1);
  assert.throws(
    () =>
      slider.ModelPickerPowerSliderImpl({
        active: true,
        fastModeEnabled: false,
        onDragToMax() {},
        onSelectOption() {},
        options: [
          { id: "x", label: "X", requiresExplicitSelection: true },
          { id: "y", label: "Y" },
        ],
        selectedOptionId: "x",
      }),
    /Explicit-selection options/,
  );
  mb2RuntimeAssertions += 4;

  console.log(
    "MB remaining rewrite: " +
      (mb2SourceAssertions + mb2RuntimeAssertions) +
      " assertions (" +
      mb2SourceAssertions +
      " source, " +
      mb2RuntimeAssertions +
      " runtime)",
  );
}
