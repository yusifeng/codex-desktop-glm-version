import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.resolve(
  root,
  "../chatgpt-desktop-src/app/webview/assets",
);
const modules = [
  [
    "type-fa418230ee38.js",
    "learning-model-resistors-in-parallel-equivalent",
    ["rolldown-runtime"],
  ],
  [
    "type-25a004ce6551.js",
    "learning-model-cross-product-geometry",
    ["rolldown-runtime"],
  ],
  ["type-80e98d19d04d.js", "learning-model-coulombs-law", ["rolldown-runtime"]],
  [
    "native-code-execution-sandbox-fa3ec5081637.js",
    "native-code-execution-sandbox",
    [
      "rolldown-runtime",
      "app-shared",
      "app-initial",
      "code-execution-sandbox-connection",
    ],
  ],
  [
    "type-36e7bc0980f2.js",
    "learning-model-potential-energy",
    ["rolldown-runtime"],
  ],
  [
    "type-72e940cb9aa1.js",
    "learning-model-meta-analysis-forest-weights",
    ["rolldown-runtime"],
  ],
  [
    "sizeCapture-X5ZJPWSS-35cad884972a.js",
    "size-capture-runtime-direct",
    ["mermaid-function-name-runtime"],
  ],
  ["type-61dd1475bb3a.js", "learning-model-ohms-law", ["rolldown-runtime"]],
  [
    "vad-audio-frame-processor-b6bea101f49a.js",
    "vad-audio-frame-processor",
    [],
  ],
  [
    "type-4bab13b66760.js",
    "learning-model-pv-nrt-equation",
    ["rolldown-runtime"],
  ],
];
const sourceAliases = new Map([
  ["rolldown-runtime-2d059c5e81f4", "rolldown-runtime"],
  ["app-shared-7b9edc1bfb7f", "app-shared"],
  ["app-initial-51da50e6c6e3", "app-initial"],
  [
    "connect-code-execution-sandbox-b02ae1d03047",
    "code-execution-sandbox-connection",
  ],
  ["chunk-Y2CYZVJY-ec17b93e265e", "mermaid-function-name-runtime"],
]);
const sourceDependencies = (source) =>
  [...source.matchAll(/from "\.\/([^\"]+)\.js"/g)].map(
    (match) => sourceAliases.get(match[1]) ?? match[1],
  );
const recoveredDependencies = (source) =>
  [...source.matchAll(/(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g)].map(
    (match) => match[1],
  );

let sourceAssertions = 0;
for (const [asset, directory, dependencies] of modules) {
  const original = fs.readFileSync(path.join(assetRoot, asset), "utf8");
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    sourceDependencies(original),
    dependencies,
    directory + " source dependencies",
  );
  assert.deepEqual(
    recoveredDependencies(recovered),
    dependencies,
    directory + " recovered dependencies",
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error/.test(recovered), false);
  assert.ok(recovered.includes("Release chunk: " + asset));
  sourceAssertions += 5;
}

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
        name: "runtime-mock",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath,
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => {
              if (modulePath === "@rchunk/app-shared")
                return {
                  contents:
                    "export const KH=(id)=>'partition:'+id;export const YH=()=>globalThis.__mvInitializers.push('sandbox-urls');",
                  loader: "js",
                };
              if (modulePath === "@rchunk/app-initial")
                return {
                  contents:
                    "export const Mnt=(input)=>globalThis.__mvCreateBootstrap(input);export const Pnt=()=>globalThis.__mvInitializers.push('app-sandbox');export const jon=(origin)=>'hash-'+origin;",
                  loader: "js",
                };
              if (modulePath === "@rchunk/code-execution-sandbox-connection")
                return {
                  contents:
                    "export const n=()=>globalThis.__mvInitializers.push('sandbox-connection');export const t=(input)=>globalThis.__mvConnect(input);",
                  loader: "js",
                };
              if (modulePath === "@rchunk/mermaid-function-name-runtime")
                return {
                  contents:
                    "export const n=(value,name)=>Object.defineProperty(value,'name',{value:name,configurable:true});",
                  loader: "js",
                };
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}

globalThis.__mvInitializers = [];
globalThis.__mvCreateBootstrap = () => {
  throw new Error("bootstrap mock missing");
};
globalThis.__mvConnect = () => {
  throw new Error("connect mock missing");
};
globalThis.__mvFrames = [];
let registeredProcessor;
globalThis.sampleRate = 1_000;
globalThis.AudioWorkletProcessor = class {
  constructor() {
    this.port = {
      postMessage: (message, transfer) =>
        globalThis.__mvFrames.push({ message, transfer }),
    };
  }
};
globalThis.registerProcessor = (name, processor) => {
  registeredProcessor = { name, processor };
};

const loaded = new Map();
let runtimeAssertions = 0;
for (const [_asset, directory] of modules) {
  const module = await bundle(directory);
  loaded.set(directory, module);
  if (directory === "native-code-execution-sandbox")
    assert.deepEqual(Object.keys(module), [
      "connectNativeCodeExecutionSandbox",
    ]);
  else if (directory === "size-capture-runtime-direct")
    assert.deepEqual(Object.keys(module), ["captureNodeSizes"]);
  else if (directory === "vad-audio-frame-processor")
    assert.deepEqual(Object.keys(module), []);
  else assert.deepEqual(Object.keys(module).sort(), ["n", "t"]);
  runtimeAssertions += 1;
}

const sandbox = loaded.get("native-code-execution-sandbox");
assert.deepEqual(globalThis.__mvInitializers, [
  "sandbox-connection",
  "sandbox-urls",
  "app-sandbox",
]);
const closed = [];
let bootstrapInput;
globalThis.__mvCreateBootstrap = async (input) => {
  bootstrapInput = input;
  return {
    ports: {
      prepareEnvironment: { close: () => closed.push("prepare") },
      runUserCode: { close: () => closed.push("run") },
      screenshot: { close: () => closed.push("screenshot") },
    },
    replyPort: { close: () => closed.push("reply") },
  };
};
const webviewAttributes = [];
const webview = {
  setAttribute: (name, value) => webviewAttributes.push([name, value]),
};
assert.equal(
  await sandbox.connectNativeCodeExecutionSandbox({
    webview,
    sourceUrl: "https://sandbox.test/run?x=1",
    host: "host-a",
  }),
  null,
);
assert.deepEqual(webviewAttributes, [
  ["partition", "partition:code-execution-hash-https://sandbox.test"],
]);
assert.equal(
  bootstrapInput.sourceUrl,
  "https://sandbox.test/run?x=1&app=skybridge&unsafeSkipTargetOriginCheck=true",
);
assert.deepEqual(closed, ["prepare", "run", "screenshot", "reply"]);
const requiredPorts = {
  prepareEnvironment: { close() {} },
  runUserCode: { close() {} },
  screenshot: { close() {} },
  stop: { close() {} },
};
const replyPort = { close() {} };
globalThis.__mvCreateBootstrap = async () => ({
  ports: requiredPorts,
  replyPort,
  token: "bootstrap",
});
let connectedInput;
globalThis.__mvConnect = (input) => {
  connectedInput = input;
  return "connected";
};
const abortController = new AbortController();
assert.equal(
  await sandbox.connectNativeCodeExecutionSandbox({
    webview,
    sourceUrl: "https://sandbox.test/",
    host: "host-b",
    signal: abortController.signal,
  }),
  "connected",
);
assert.equal(connectedInput.host, "host-b");
assert.equal(connectedInput.signal, abortController.signal);
assert.equal(connectedInput.token, "bootstrap");
runtimeAssertions += 9;

const sizeCapture = loaded.get("size-capture-runtime-direct");
delete globalThis.mermaidCapturedSizes;
delete globalThis.mermaidLastCapturedSizes;
const OriginalDate = Date;
globalThis.Date = class extends OriginalDate {
  constructor(...arguments_) {
    super(
      ...(arguments_.length === 0 ? ["2026-09-30T08:00:00.000Z"] : arguments_),
    );
  }
};
sizeCapture.captureNodeSizes(
  { node: () => ({ id: "child", ownerSVGElement: { id: "diagram-svg" } }) },
  {
    nodes: [
      { id: "group", width: 99, height: 99, isGroup: true },
      { id: "node-a", width: 12, height: 8 },
      { id: "node-b" },
    ],
  },
);
globalThis.Date = OriginalDate;
assert.deepEqual(globalThis.mermaidCapturedSizes, [
  {
    svgId: "diagram-svg",
    sizes: {
      metadata: {
        captureVersion: 1,
        capturedAt: "2026-09-30T08:00:00.000Z",
        capturedFrom: "browser-dev",
      },
      nodes: [
        { id: "node-a", width: 12, height: 8 },
        { id: "node-b", width: 0, height: 0 },
      ],
    },
  },
]);
assert.equal(
  globalThis.mermaidLastCapturedSizes,
  globalThis.mermaidCapturedSizes[0],
);
sizeCapture.captureNodeSizes(
  { node: () => ({ id: "unused" }) },
  { nodes: [{ id: "only-group", isGroup: true }] },
);
assert.equal(globalThis.mermaidCapturedSizes.length, 1);
assert.equal(sizeCapture.captureNodeSizes.name, "captureNodeSizes");
runtimeAssertions += 4;

assert.equal(registeredProcessor.name, "voice-vad-frame-processor");
const processor = new registeredProcessor.processor({
  processorOptions: { frameDurationMs: 4 },
});
assert.equal(processor.process([[new Float32Array([1, 2, 3])]]), true);
assert.equal(globalThis.__mvFrames.length, 0);
assert.equal(processor.process([[new Float32Array([4, 5, 6, 7, 8, 9])]]), true);
assert.deepEqual(
  globalThis.__mvFrames.map(({ message }) => ({
    type: message.type,
    sampleRate: message.payload.sampleRate,
    samples: [...message.payload.samples],
  })),
  [
    { type: "frame", sampleRate: 1_000, samples: [1, 2, 3, 4] },
    { type: "frame", sampleRate: 1_000, samples: [5, 6, 7, 8] },
  ],
);
assert.equal(processor.process([[]]), true);
runtimeAssertions += 5;

const expectedSpecifications = new Map([
  [
    "learning-model-resistors-in-parallel-equivalent",
    {
      type: "RESISTORS_IN_PARALLEL_EQUIVALENT",
      version: 1,
      thumbnailAssetKey: "resistors-in-parallel-equivalent-v1",
      canonicalFormula:
        "\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}",
      canonicalFormulaAliases: [
        "\\frac{1}{R_T} = \\frac{1}{R_1} + \\frac{1}{R_2}",
        "\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}",
      ],
      parameters: {
        r1: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 },
        r2: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 },
        r3: { kind: "number", defaultValue: 8, min: 0.1, max: 100_000 },
        voltage: { kind: "number", defaultValue: 12, min: 0, max: 1_000 },
      },
    },
  ],
  [
    "learning-model-cross-product-geometry",
    {
      type: "CROSS_PRODUCT_GEOMETRY",
      version: 1,
      thumbnailAssetKey: "cross-product-geometry-v1",
      canonicalFormula: "|a\\times b|=|a||b|\\sin(\\theta)",
      canonicalFormulaAliases: [
        "\\|\\vec a\\times\\vec b\\|=\\|\\vec a\\|\\|\\vec b\\|\\sin(\\theta)",
        "\\vec a\\times\\vec b",
        "\\vec b\\times\\vec a=-(\\vec a\\times\\vec b)",
        "\\|\\vec a\\times\\vec b\\|=\\text{parallelogram area}",
      ],
      parameters: {
        magnitudeA: { kind: "number", defaultValue: 3, min: 0.5, max: 6 },
        magnitudeB: { kind: "number", defaultValue: 2.5, min: 0.5, max: 6 },
        angleDeg: { kind: "number", defaultValue: 60, min: 5, max: 175 },
        order: {
          kind: "enum",
          defaultValue: "axb",
          allowedValues: ["axb", "bxa"],
        },
      },
    },
  ],
  [
    "learning-model-coulombs-law",
    {
      type: "COULOMBS_LAW",
      version: 1,
      thumbnailAssetKey: "coulombs-law-v2",
      canonicalFormula: "F = k\\frac{q_1q_2}{r^2}",
      canonicalFormulaAliases: [
        "F = k \\frac{q_1 q_2}{r^2}",
        "F = k_e \\frac{q_1 q_2}{r^2}",
        "F = \\frac{k q_1 q_2}{r^2}",
        "E = k\\frac{q}{r^2}",
        "F = k q_1 q_2 / r^2",
        "k q_1 q_2 / r^2 = F",
        "r = \\sqrt{\\frac{k q_1 q_2}{F}}",
        "q_1 = \\frac{F r^2}{k q_2}",
        "q_2 = \\frac{F r^2}{k q_1}",
        "k = \\frac{F r^2}{q_1 q_2}",
      ],
      parameters: {
        q1: { kind: "number", defaultValue: 3, min: -10_000, max: 10_000 },
        q2: { kind: "number", defaultValue: -3, min: -10_000, max: 10_000 },
        distance: { kind: "number", defaultValue: 4, min: 0.01, max: 10_000 },
      },
    },
  ],
  [
    "learning-model-potential-energy",
    {
      type: "POTENTIAL_ENERGY",
      version: 2,
      thumbnailAssetKey: "potential-energy-v1",
      canonicalFormula: "PE = mgh",
      canonicalFormulaAliases: [
        "EP = mgh",
        "E_p = mgh",
        "U = mgh",
        "\\Delta U = mgh",
        "\\Delta PE = mgh",
        "mgh = PE",
        "U = m \\cdot g \\cdot h",
        "U = m \\times g \\times h",
        "E_p = m \\cdot g \\cdot h",
        "E_p = m \\times g \\times h",
        "m = \\frac{U}{gh}",
        "g = \\frac{U}{mh}",
        "h = \\frac{U}{mg}",
        "m = \\frac{E_p}{gh}",
        "g = \\frac{E_p}{mh}",
        "h = \\frac{E_p}{mg}",
      ],
      parameters: {
        mass: { kind: "number", defaultValue: 3.4, min: 0.01, max: 10_000 },
        height: { kind: "number", defaultValue: 9, min: 0, max: 10_000 },
      },
    },
  ],
  [
    "learning-model-meta-analysis-forest-weights",
    {
      type: "META_ANALYSIS_FOREST_WEIGHTS",
      version: 1,
      thumbnailAssetKey: "meta-analysis-forest-weights-v1",
      parameters: {
        effect1: { kind: "number", defaultValue: -0.35, min: -0.8, max: 0.8 },
        effect2: { kind: "number", defaultValue: -0.08, min: -0.8, max: 0.8 },
        effect3: { kind: "number", defaultValue: 0.18, min: -0.8, max: 0.8 },
        effect4: { kind: "number", defaultValue: 0.42, min: -0.8, max: 0.8 },
        effect5: { kind: "number", defaultValue: 0.1, min: -0.8, max: 0.8 },
        weight1: { kind: "number", defaultValue: 5, min: 2, max: 24 },
        weight2: { kind: "number", defaultValue: 12, min: 2, max: 24 },
        weight3: { kind: "number", defaultValue: 8, min: 2, max: 24 },
        weight4: { kind: "number", defaultValue: 18, min: 2, max: 24 },
        weight5: { kind: "number", defaultValue: 10, min: 2, max: 24 },
      },
    },
  ],
  [
    "learning-model-ohms-law",
    {
      type: "OHMS_LAW",
      version: 1,
      thumbnailAssetKey: "ohms-law-v1",
      canonicalFormula: "I = \\frac{V}{R}",
      canonicalFormulaAliases: [
        "V = IR",
        "V = I \\cdot R",
        "V = I \\times R",
        "\\Delta V = IR",
        "u = ri",
        "v=ri",
        "ir=v",
        "ri=v",
        "i=\\Delta V/R",
        "i=(1/r)v",
        "i=v(1/r)",
        "i=1/r(v)",
        "r=v/i",
        "r=\\Delta V/i",
        "ri=u",
        "i=u/r",
        "i=(1/r)u",
        "i=u(1/r)",
        "i=1/r(u)",
        "r=u/i",
        "i=(v-v)/r",
        "(v-v)/r=i",
        "r=(v-v)/i",
        "(v-v)/i=r",
      ],
      parameters: {
        voltage: { kind: "number", defaultValue: 12, min: 0, max: 1_000 },
        resistance: { kind: "number", defaultValue: 6, min: 0.1, max: 100_000 },
      },
    },
  ],
  [
    "learning-model-pv-nrt-equation",
    {
      type: "PV_NRT_EQUATION",
      version: 2,
      thumbnailAssetKey: "pvnrt-v1",
      canonicalFormula: "PV = nRT",
      canonicalFormulaAliases: [
        "P V = n R T",
        "P = nRT / V",
        "P = \\frac{nRT}{V}",
        "V = nRT / P",
        "V = \\frac{nRT}{P}",
        "n = PV / RT",
        "n = \\frac{PV}{RT}",
        "T = PV / nR",
        "T = \\frac{PV}{nR}",
        "R = PV / nT",
        "R = \\frac{PV}{nT}",
      ],
      parameters: {
        P: { kind: "number", defaultValue: 1, min: 0.01, max: 100 },
        V: { kind: "number", defaultValue: 24, min: 0.01, max: 10_000 },
        n: { kind: "number", defaultValue: 1, min: 0.01, max: 1_000 },
        T: { kind: "number", defaultValue: 298, min: 1, max: 5_000 },
        solveFor: {
          kind: "enum",
          defaultValue: "P",
          allowedValues: ["P", "V", "n", "T"],
        },
      },
    },
  ],
]);

for (const [directory, expected] of expectedSpecifications) {
  const module = loaded.get(directory);
  assert.equal(module.n, undefined, directory + " before initialization");
  module.t();
  assert.deepEqual(module.n, expected);
  const identity = module.n;
  module.t();
  assert.equal(module.n, identity, directory + " idempotent initialization");
  runtimeAssertions += 3;
}

for (const key of [
  "__mvInitializers",
  "__mvCreateBootstrap",
  "__mvConnect",
  "__mvFrames",
  "sampleRate",
  "AudioWorkletProcessor",
  "registerProcessor",
  "mermaidCapturedSizes",
  "mermaidLastCapturedSizes",
])
  delete globalThis[key];
console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
