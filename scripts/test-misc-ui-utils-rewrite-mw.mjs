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
    "type-d71c312af838.js",
    "learning-model-cylinder-volume",
    ["a", "i", "n", "o", "r", "t"],
  ],
  [
    "type-dc693d0c1945.js",
    "learning-model-triangle-area",
    ["a", "i", "n", "o", "r", "t"],
  ],
  [
    "circular-solid-geometry-3f972b28e3c0.js",
    "circular-solid-geometry",
    ["n", "t"],
  ],
  ["lowlight-7c9b2445f652.js", "lowlight", ["createParser"]],
  ["trusted-contact-hero-7b0737a0d525.js", "trusted-contact-hero", ["n", "t"]],
  [
    "type-3a1bd5a62fd7.js",
    "learning-model-cone-surface-area",
    ["a", "i", "n", "o", "r", "t"],
  ],
  [
    "restoration-4033c505a6bf.js",
    "background-agent-restoration",
    ["restoreBackgroundAgentTabRoute"],
  ],
  [
    "type-27a1646b6027.js",
    "learning-model-cone-volume",
    ["a", "i", "n", "o", "r", "t"],
  ],
  ["shape-fill-8f10786c12a1.js", "shape-fill", ["n", "r", "t"]],
  [
    "sizeCapture-X5ZJPWSS-e07f13f62d02.js",
    "size-capture-runtime-lazy",
    ["captureNodeSizes"],
  ],
];

const geometryModels = new Map([
  [
    "learning-model-cylinder-volume",
    {
      specification: {
        type: "CYLINDER_VOLUME",
        version: 2,
        thumbnailAssetKey: "cylinder-volume-v1",
        canonicalFormula: "V = \\pi r^2 h",
        canonicalFormulaAliases: [
          "V = \\pi h r^2",
          "\\pi r^2 h = V",
          "\\pi h r^2 = V",
          "h = \\frac{V}{\\pi r^2}",
          "r^2 = \\frac{V}{\\pi h}",
        ],
        parameters: {
          radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
          height: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
        },
      },
      controls: {
        a: {
          label: "r",
          min: 0.5,
          max: 10,
          step: 0.1,
          defaultValue: 3,
          thumbnailDefaultValue: 10,
        },
        i: {
          label: "h",
          min: 1,
          max: 20,
          step: 0.5,
          defaultValue: 8,
          thumbnailDefaultValue: 20,
        },
      },
      templateExport: "r",
      properties: { radius: "a", height: "i" },
    },
  ],
  [
    "learning-model-triangle-area",
    {
      specification: {
        type: "TRIANGLE_AREA",
        version: 2,
        thumbnailAssetKey: "triangle-area-v1",
        canonicalFormula: "A = \\frac{1}{2}bh",
        canonicalFormulaAliases: [
          "A = \\frac{1}{2} b h",
          "a=bh/2",
          "1/2bh=a",
          "bh/2=a",
          "1/2bh",
          "b = \\frac{2A}{h}",
          "h = \\frac{2A}{b}",
        ],
        parameters: {
          base: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
          height: { kind: "number", defaultValue: 6, min: 0.01, max: 10000 },
        },
      },
      controls: {
        r: {
          label: "b",
          min: 2,
          max: 20,
          step: 0.5,
          defaultValue: 8,
          thumbnailDefaultValue: 20,
        },
        i: {
          label: "h",
          min: 2,
          max: 16,
          step: 0.5,
          defaultValue: 6,
          thumbnailDefaultValue: 16,
        },
      },
      templateExport: "a",
      properties: { base: "r", height: "i" },
    },
  ],
  [
    "learning-model-cone-surface-area",
    {
      specification: {
        type: "CONE_SURFACE_AREA",
        version: 2,
        thumbnailAssetKey: "cone-surface-area-v1",
        canonicalFormula: "A = \\pi r(r + l)",
        canonicalFormulaAliases: [
          "A = \\pi r (r + l)",
          "A = \\pi r^2 + \\pi r l",
          "A = \\pi r l + \\pi r^2",
          "\\pi r (r + l) = A",
          "\\pi r^2 + \\pi r l = A",
          "\\pi r l + \\pi r^2 = A",
        ],
        parameters: {
          radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
          slantHeight: {
            kind: "number",
            defaultValue: 6,
            min: 0.01,
            max: 10000,
          },
        },
      },
      controls: {
        i: {
          label: "r",
          min: 0.5,
          max: 10,
          step: 0.1,
          defaultValue: 3,
          thumbnailDefaultValue: 10,
        },
        a: {
          label: "l",
          min: 1,
          max: 15,
          step: 0.5,
          defaultValue: 6,
          thumbnailDefaultValue: 15,
        },
      },
      templateExport: "r",
      properties: { radius: "i", slantHeight: "a" },
    },
  ],
  [
    "learning-model-cone-volume",
    {
      specification: {
        type: "CONE_VOLUME",
        version: 2,
        thumbnailAssetKey: "cone-volume-v1",
        canonicalFormula: "V = \\frac{1}{3}\\pi r^2 h",
        canonicalFormulaAliases: [
          "V = \\frac{1}{3} \\pi r^2 h",
          "V = \\frac{1}{3} \\pi h r^2",
          "V = \\pi r^2 h / 3",
          "V = \\pi h r^2 / 3",
          "\\frac{1}{3} \\pi r^2 h = V",
          "\\frac{1}{3} \\pi h r^2 = V",
          "\\pi r^2 h / 3 = V",
          "\\pi h r^2 / 3 = V",
        ],
        parameters: {
          radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
          height: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
        },
      },
      controls: {
        a: {
          label: "r",
          min: 0.5,
          max: 10,
          step: 0.1,
          defaultValue: 3,
          thumbnailDefaultValue: 10,
        },
        i: {
          label: "h",
          min: 1,
          max: 20,
          step: 0.5,
          defaultValue: 8,
          thumbnailDefaultValue: 20,
        },
      },
      templateExport: "r",
      properties: { radius: "a", height: "i" },
    },
  ],
]);

const deps = (source, pattern) =>
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
    deps(original, /from "\.\/([^"]+)\.js"/gu),
    deps(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu),
  );
  assert.equal(
    (original.match(/import\(/gu) ?? []).length,
    (recovered.match(/import\(/gu) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/u.test(recovered), false);
  assert.ok(recovered.includes(`Release chunk: ${asset}`));
  sourceAssertions += 4;
}

const appSharedMock = `
const sentinel = Symbol.for("react.memo_cache_sentinel");
export const KZ = { inline: (start, end, properties) => ({ start, end, properties }) };
export function YZ() { globalThis.__mwLowlightInit = (globalThis.__mwLowlightInit ?? 0) + 1; }
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
export function I3() { return jsx; }
export function $3() {
  return { c(size) {
    globalThis.__mwMemoCache ??= Array.from({ length: size }, () => sentinel);
    return globalThis.__mwMemoCache;
  } };
}
export function C_() { globalThis.__mwSharedComponentInit = (globalThis.__mwSharedComponentInit ?? 0) + 1; }
export function p() { globalThis.__mwAssetInit = (globalThis.__mwAssetInit ?? 0) + 1; }
export const m = { name: "trusted-contact" };
export function S_(props) { return { type: "Icon", props }; }
`;
const mocks = new Map([
  ["@rchunk/rolldown-runtime", "export {};"],
  ["@rchunk/app-shared", appSharedMock],
  [
    "@rchunk/parental-controls-invitation-background",
    `export const n = "invitation-background.png"; export function t() { globalThis.__mwBackgroundInit = (globalThis.__mwBackgroundInit ?? 0) + 1; }`,
  ],
  [
    "@rchunk/app-initial",
    `
export const GZt = Symbol.for("mw.history-loaded");
export const wQt = Symbol.for("mw.host-by-conversation");
export function HZt() { globalThis.__mwConversationInit = (globalThis.__mwConversationInit ?? 0) + 1; }
export function Wgn() { globalThis.__mwHydrationInit = (globalThis.__mwHydrationInit ?? 0) + 1; }
export function Ugn(scope, hostId) { return globalThis.__mwGetConversationManager(scope, hostId); }
`,
  ],
  [
    "@rchunk/open-target",
    `
export function n(...args) { return globalThis.__mwFindOpenTarget(...args); }
export function r() { globalThis.__mwOpenTargetInit = (globalThis.__mwOpenTargetInit ?? 0) + 1; }
export function t(...args) { return globalThis.__mwGetOpenTarget(...args); }
`,
  ],
  [
    "@rchunk/verify-descendant",
    `
export function n(...args) { return globalThis.__mwVerifyDescendant(...args); }
export function t() { globalThis.__mwVerifyInit = (globalThis.__mwVerifyInit ?? 0) + 1; }
`,
  ],
  [
    "@rchunk/chunk-Y2CYZVJY",
    `
export function r() { globalThis.__mwNamingInit = (globalThis.__mwNamingInit ?? 0) + 1; }
export function n(value, name) { (globalThis.__mwNamedFunctions ??= []).push([value, name]); }
`,
  ],
]);

async function bundle(directory) {
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
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: name }) => ({
            path: name,
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: name }) => ({
              contents: mocks.get(name) ?? "export {};",
              loader: "js",
            }),
          );
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
for (const [_asset, directory, exports] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  assert.deepEqual(Object.keys(module).sort(), [...exports].sort());
  runtimeAssertions += 1;
}

for (const [directory, definition] of geometryModels) {
  const module = loaded.get(directory);
  module.t();
  const specification = module.n;
  assert.deepEqual(specification, definition.specification);
  module.t();
  assert.equal(module.n, specification);
  module.o();
  const template = module[definition.templateExport];
  const expectedProperties = {};
  for (const [name, exportName] of Object.entries(definition.properties)) {
    assert.deepEqual(module[exportName], definition.controls[exportName]);
    expectedProperties[name] = definition.controls[exportName];
    assert.equal(template.properties[name], module[exportName]);
    runtimeAssertions += 2;
  }
  assert.deepEqual(template, { properties: expectedProperties });
  module.o();
  assert.equal(module[definition.templateExport], template);
  runtimeAssertions += 4;
}

const circular = loaded.get("circular-solid-geometry");
circular.n();
assert.deepEqual(
  circular.t({
    height: 8,
    radius: 2,
    preferredHeightPx: 100,
    preferredRadiusPx: 25,
    maxHeightPx: 200,
    maxRadiusPx: 100,
  }),
  { heightPx: 100, radiusPx: 25 },
);
assert.deepEqual(
  circular.t({
    height: 100,
    radius: 1,
    preferredHeightPx: 140,
    preferredRadiusPx: 20,
    maxHeightPx: 70,
    maxRadiusPx: 100,
  }),
  { heightPx: 70, radiusPx: 10 },
);
runtimeAssertions += 2;

const lowlight = loaded.get("lowlight");
assert.equal(globalThis.__mwLowlightInit, 1);
let languageCall;
const parser = lowlight.createParser({
  highlight(language, content) {
    languageCall = [language, content];
    return {
      children: [
        { type: "text", value: "x" },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["hljs-keyword", "bold"], title: "token" },
          children: [
            { type: "text", value: "ab" },
            {
              type: "element",
              tagName: "em",
              children: [{ type: "text", value: "c" }],
            },
          ],
        },
        { type: "comment" },
        {
          type: "element",
          tagName: "mark",
          properties: { className: "single" },
          children: [{ type: "text", value: "z" }],
        },
      ],
    };
  },
  highlightAuto(content) {
    return {
      children: [
        {
          type: "element",
          tagName: "code",
          children: [{ type: "text", value: content }],
        },
      ],
    };
  },
});
assert.deepEqual(parser({ content: "xabcz", language: "js", pos: 5 }), [
  {
    start: 7,
    end: 10,
    properties: {
      class: "hljs-keyword bold",
      title: "token",
      nodeName: "span",
    },
  },
  { start: 10, end: 11, properties: { class: "single", nodeName: "mark" } },
]);
assert.deepEqual(languageCall, ["js", "xabcz"]);
assert.deepEqual(parser({ content: "xy", pos: 0 }), [
  { start: 1, end: 3, properties: { class: undefined, nodeName: "code" } },
]);
runtimeAssertions += 4;

const trustedHero = loaded.get("trusted-contact-hero");
trustedHero.n();
const firstHero = trustedHero.t();
const secondHero = trustedHero.t();
assert.equal(firstHero, secondHero);
assert.equal(firstHero.type, "div");
assert.equal(
  firstHero.props.children[0].props.src,
  "invitation-background.png",
);
assert.deepEqual(firstHero.props.children[1].props.children.props.asset, {
  name: "trusted-contact",
});
assert.deepEqual(
  [
    globalThis.__mwAssetInit,
    globalThis.__mwBackgroundInit,
    globalThis.__mwSharedComponentInit,
  ],
  [1, 1, 1],
);
runtimeAssertions += 5;

const restoration = loaded.get("background-agent-restoration");
assert.deepEqual(
  [
    globalThis.__mwHydrationInit,
    globalThis.__mwConversationInit,
    globalThis.__mwVerifyInit,
    globalThis.__mwOpenTargetInit,
  ],
  [1, 1, 1, 1],
);
const hostSignal = Symbol.for("mw.host-by-conversation");
const historySignal = Symbol.for("mw.history-loaded");
const scope = {
  value: { routeKind: "local-thread", conversationId: "parent" },
  get(signal, key) {
    if (signal === hostSignal) return "host-1";
    if (signal === historySignal) return this.historyLoaded ?? false;
    throw new Error(`unexpected signal for ${key}`);
  },
};
let verifyInput;
globalThis.__mwVerifyDescendant = (_scope, input) => {
  verifyInput = input;
  return true;
};
let hydrated = false;
globalThis.__mwFindOpenTarget = () =>
  hydrated ? { conversationId: "child", displayName: "Child" } : null;
globalThis.__mwGetOpenTarget = () => ({
  conversationId: "child",
  displayName: "Fallback",
});
let hydrationCalls = 0;
globalThis.__mwGetConversationManager = () => ({
  async ensureConversationHistoryLoaded(conversationId) {
    assert.equal(conversationId, "parent");
    hydrationCalls += 1;
    hydrated = true;
  },
});
let openInput;
const restored = await restoration.restoreBackgroundAgentTabRoute(
  {
    revealAndFocus: true,
    descriptor: { tabId: "tab-1" },
    insertPosition: "after",
    scope,
  },
  "child",
  async (_scope, input) => {
    openInput = input;
    return "tab-1";
  },
  "TabComponent",
);
assert.equal(restored, true);
assert.deepEqual(verifyInput, {
  hostId: "host-1",
  hydrateMissingAncestors: true,
  parentConversationId: "parent",
  selectedConversationId: "child",
});
assert.equal(hydrationCalls, 1);
assert.deepEqual(openInput, {
  revealAndFocus: true,
  backgroundAgent: { conversationId: "child", displayName: "Child" },
  hostId: "host-1",
  insertPosition: "after",
  tabId: "tab-1",
  TabComponent: "TabComponent",
});
scope.value.routeKind = "settings";
assert.equal(
  await restoration.restoreBackgroundAgentTabRoute(
    { revealAndFocus: false, descriptor: { tabId: "x" }, scope },
    "child",
    () => "x",
    null,
  ),
  false,
);
runtimeAssertions += 6;

const shapeFill = loaded.get("shape-fill");
shapeFill.r();
assert.equal(
  shapeFill.n({ id: "solid", pattern: "solid" }),
  "var(--icon-accent)",
);
assert.equal(
  shapeFill.n({ id: "solid", pattern: "solid", color: "red" }),
  "red",
);
assert.equal(shapeFill.n({ id: "dots", pattern: "dotted" }), "url(#dots)");
assert.equal(shapeFill.t({ id: "solid", pattern: "solid" }), null);
assert.deepEqual(
  shapeFill.t({ id: "dots", pattern: "dotted", color: "blue" }),
  {
    type: "pattern",
    props: {
      id: "dots",
      width: 6,
      height: 6,
      patternUnits: "userSpaceOnUse",
      children: { type: "circle", props: { cx: 1, cy: 1, r: 1, fill: "blue" } },
    },
  },
);
assert.deepEqual(shapeFill.t({ id: "lines", pattern: "lines" }), {
  type: "pattern",
  props: {
    id: "lines",
    width: 15,
    height: 15,
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(30)",
    children: {
      type: "line",
      props: {
        x1: "0",
        y1: "0",
        x2: "0",
        y2: 15,
        stroke: "var(--icon-accent)",
        strokeWidth: "1",
      },
    },
  },
});
runtimeAssertions += 6;

const sizeCapture = loaded.get("size-capture-runtime-lazy");
assert.equal(globalThis.__mwNamingInit, 1);
assert.deepEqual(
  globalThis.__mwNamedFunctions.map((entry) => entry[1]),
  [
    "getCaptureGlobal",
    "shouldCaptureSizes",
    "capturedFromLocation",
    "emitCapturedSizes",
    "captureNodeSizes",
  ],
);
globalThis.mermaidCaptureSizes = true;
globalThis.mermaidCapturedSizes = undefined;
globalThis.mermaidLastCapturedSizes = undefined;
sizeCapture.captureNodeSizes(
  { node: () => ({ id: "group", ownerSVGElement: { id: "diagram-7" } }) },
  {
    nodes: [
      { id: "cluster", isGroup: true, width: 50, height: 40 },
      { id: "a", width: 12, height: 9 },
      { id: "b", width: null },
    ],
  },
);
assert.equal(globalThis.mermaidCapturedSizes.length, 1);
assert.equal(globalThis.mermaidLastCapturedSizes.svgId, "diagram-7");
assert.deepEqual(globalThis.mermaidLastCapturedSizes.sizes.nodes, [
  { id: "a", width: 12, height: 9 },
  { id: "b", width: 0, height: 0 },
]);
assert.deepEqual(
  {
    captureVersion:
      globalThis.mermaidLastCapturedSizes.sizes.metadata.captureVersion,
    capturedFrom:
      globalThis.mermaidLastCapturedSizes.sizes.metadata.capturedFrom,
  },
  { captureVersion: 1, capturedFrom: "browser-dev" },
);
runtimeAssertions += 6;

console.log(
  `${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`,
);
