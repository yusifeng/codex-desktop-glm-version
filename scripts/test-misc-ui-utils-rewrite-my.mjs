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
    "hover-card-data-95a14e835743.js",
    "pull-request-review-hover-card-data",
    ["rolldown-runtime", "app-shared", "app-initial"],
  ],
  [
    "hydration-8c45073f777c.js",
    "chatgpt-ads-hydration",
    ["rolldown-runtime", "app-shared", "app-initial", "ads-placement-policy"],
  ],
  [
    "interactive-sampling-1ac392c5c15b.js",
    "interactive-sampling",
    ["rolldown-runtime", "app-shared", "build-graph-data"],
  ],
  [
    "loading-cba17c98d28e.js",
    "file-preview-loading",
    [
      "rolldown-runtime",
      "app-shared",
      "app-initial",
      "editor-header",
      "header-content-fade",
      "editor-header-controls",
      "loading-controls",
    ],
  ],
  [
    "lowlight-62906d2993ab.js",
    "lowlight-runtime",
    ["rolldown-runtime", "app-initial", "lowlight-core"],
  ],
  [
    "notice-2197fe51f059.js",
    "voice-reasoning-notice",
    [
      "rolldown-runtime",
      "app-shared",
      "app-initial",
      "task-announcement-state",
    ],
  ],
  [
    "placement-policy-c8f98920d800.js",
    "ads-placement-policy",
    ["rolldown-runtime", "app-shared", "app-initial", "command-menu-holdout"],
  ],
  [
    "realtime-buffered-audio-worklet-773c5f6cc0c3.js",
    "realtime-buffered-audio-worklet",
    [],
  ],
  [
    "resource-updates-bridge-2f9138580a72.js",
    "resource-updates-bridge",
    ["rolldown-runtime", "app-shared", "app-initial"],
  ],
  [
    "schema-filter-d9fe65a26d7e.js",
    "plan-event-schema-filter",
    ["rolldown-runtime", "app-shared", "is-plan-event-enabled"],
  ],
];
const sourceAliases = new Map([
  ["rolldown-runtime-2d059c5e81f4", "rolldown-runtime"],
  ["app-shared-7b9edc1bfb7f", "app-shared"],
  ["app-initial-51da50e6c6e3", "app-initial"],
  ["placement-policy-c8f98920d800", "ads-placement-policy"],
  ["build-graph-data-ee6e0d8e135a", "build-graph-data"],
  ["core-e0ac85b4f9b8", "lowlight-core"],
  ["state-1f9742e6c1d9", "task-announcement-state"],
  ["holdout-9b0bc5fb2d23", "command-menu-holdout"],
  ["is-plan-event-enabled-edb7e7f2c465", "is-plan-event-enabled"],
  ["editor-header-c92933e59212", "editor-header"],
  ["header-content-fade-9fcd899f41c6", "header-content-fade"],
  ["editor-header-controls-c672034e8ec1", "editor-header-controls"],
  ["loading-controls-b167fbacd28d", "loading-controls"],
]);
const originalDependencies = (source) =>
  [...source.matchAll(/import[\s\S]*?;/g)]
    .map((statement) => statement[0].match(/["']\.\/([^"']+)\.js["']/)?.[1])
    .filter((dependency) => dependency != null)
    .map((dependency) => sourceAliases.get(dependency) ?? dependency);
const recoveredDependencies = (source) =>
  [...source.matchAll(/(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g)].map(
    (match) => match[1],
  );
const exportedNames = (source) =>
  [...source.matchAll(/export\s*\{([\s\S]*?)\};/g)]
    .flatMap((match) => match[1].split(","))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.match(/\bas\s+([A-Za-z_$][\w$]*)$/)?.[1] ?? entry)
    .sort();

let sourceAssertions = 0;
for (const [asset, directory, dependencies] of modules) {
  const original = fs.readFileSync(path.join(assetRoot, asset), "utf8");
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    originalDependencies(original),
    dependencies,
    directory + " original dependencies",
  );
  assert.deepEqual(
    recoveredDependencies(recovered),
    dependencies,
    directory + " recovered dependencies",
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
    directory + " dynamic imports",
  );
  assert.equal(
    /\bany\b|@ts-expect-error/.test(recovered),
    false,
    directory + " unsafe escape",
  );
  assert.ok(
    recovered.includes("Release chunk: " + asset),
    directory + " provenance",
  );
  assert.ok(recovered.length > 450, directory + " substantive implementation");
  assert.deepEqual(
    exportedNames(recovered),
    exportedNames(original),
    directory + " export surface",
  );
  sourceAssertions += 7;
}

const mocks = {
  "@rchunk/rolldown-runtime": "export {};",
  "@rchunk/app-initial": "export {};",
  "@rchunk/app-shared":
    "export const p4=()=>globalThis.__myInit.push('spread');export const G2=(x)=>x;export const K2=()=>globalThis.__myInit.push('intl');export const FX=()=>{};export const QI=()=>{};export const ZI={};export const dZ=()=>{};export const rZ=(_s,f)=>f;export const sZ=(_s,f)=>f();",
  "@rchunk/build-graph-data":
    "export const a=()=>globalThis.__myInit.push('graph');export const n=(_r,x)=>x*x;export const r=()=>({knownPoleXs:[],periodicAnchorXs:[],explicitPoleXs:[]});",
  "@rchunk/is-plan-event-enabled":
    "export const n=(_schema,entry)=>entry?.enabled!==false;",
  "@rchunk/command-menu-holdout":
    "export const n=()=>globalThis.__myInit.push('holdout');export const t=()=>false;",
  "@rchunk/lowlight-core":
    "export const n=()=>globalThis.__myInit.push('lowlight');let languages=new Map();export const t={newInstance(){let options;return {getLanguage:name=>languages.get(name),configure:value=>{options=value},listLanguages:()=>[...languages.keys()],registerLanguage:(name,definition)=>languages.set(name,definition),registerAliases:()=>{},highlight(code,{language}){const emitter=new options.__emitter({classPrefix:options.classPrefix});emitter.startScope('keyword');emitter.addText(code);emitter.endScope();return {language,relevance:code.length,_emitter:emitter}}}}};",
};

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
        name: "my-runtime-mock",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath,
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => ({
              contents: mocks[modulePath] ?? "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import("data:text/javascript;base64," + encoded + "#" + directory);
}

globalThis.__myInit = [];
let registeredProcessor;
const postedMessages = [];
globalThis.sampleRate = 10;
globalThis.AudioWorkletProcessor = class {
  constructor() {
    this.port = {
      onmessage: null,
      postMessage: (message) => postedMessages.push(message),
    };
  }
};
globalThis.registerProcessor = (name, processor) => {
  registeredProcessor = { name, processor };
};

let runtimeAssertions = 0;
const audio = await bundle("realtime-buffered-audio-worklet");
assert.deepEqual(Object.keys(audio), []);
assert.equal(registeredProcessor.name, "codex-realtime-buffered-audio");
const processor = new registeredProcessor.processor();
const bufferedOutput = new Float32Array(4);
assert.equal(
  processor.process([[new Float32Array([0, 0, 1, 2])]], [[bufferedOutput]]),
  true,
);
assert.deepEqual([...bufferedOutput], [0, 0, 0, 0]);
processor.port.onmessage({ data: { type: "release" } });
const replayOutput = new Float32Array(4);
processor.process([[new Float32Array([3, 4, 5, 6])]], [[replayOutput]]);
assert.deepEqual([...replayOutput], [0, 1, 2, 3]);
processor.port.onmessage({
  data: { type: "mute", muted: true, requestId: "r1" },
});
assert.deepEqual(postedMessages.at(-1), {
  type: "mute-applied",
  muted: true,
  requestId: "r1",
});
runtimeAssertions += 7;

const sampling = await bundle("interactive-sampling");
assert.deepEqual(Object.keys(sampling).sort(), ["a", "i", "n", "r", "t"]);
sampling.i();
sampling.r();
const segments = sampling.n({
  viewport: { xDomain: [-1, 1], yDomain: [-1, 1] },
  canvasSize: { width: 200, height: 200 },
  rpn: null,
  constants: null,
  evaluateAt: (x) => x * x,
  forcedXs: [0],
});
assert.ok(segments.length >= 1);
assert.ok(segments.flat().length > 2);
assert.ok(
  segments
    .flat()
    .every((point) => Math.abs(point.y - point.x * point.x) < 1e-10),
);
assert.deepEqual(globalThis.__myInit.slice(-2), ["intl", "graph"]);
runtimeAssertions += 6;

const lowlight = await bundle("lowlight-runtime");
const highlighter = lowlight.createLowlight({ javascript: () => ({}) });
assert.equal(highlighter.registered("javascript"), true);
assert.deepEqual(highlighter.listLanguages(), ["javascript"]);
const highlighted = highlighter.highlight("javascript", "const");
assert.equal(highlighted.data.language, "javascript");
assert.equal(highlighted.data.relevance, 5);
assert.deepEqual(highlighted.children[0].properties.className, [
  "hljs-keyword",
]);
assert.throws(() => highlighter.highlight("missing", "x"), /Unknown language/);
runtimeAssertions += 6;

const schema = await bundle("plan-event-schema-filter");
const updates = [];
const facade = {
  event: { event: "opened", integrations: { Existing: true } },
  updateEvent(_field, value) {
    updates.push(value);
    return this;
  },
};
const plugin = schema.schemaFilter(
  { opened: { integrations: { Remote: false } } },
  {
    remotePlugins: [
      {
        creationName: "Remote",
        name: "remote-plugin",
        settings: { subscriptions: [{ partnerAction: "track" }] },
      },
    ],
  },
);
assert.equal(plugin.isLoaded(), true);
assert.equal(await plugin.load(), undefined);
assert.equal(plugin.track(facade), facade);
assert.deepEqual(updates[0], {
  Existing: true,
  Remote: false,
  "remote-plugin track": false,
});
runtimeAssertions += 4;

const placement = await bundle("ads-placement-policy");
placement.o();
const ordinary = { ad_data_token: "a" };
const targeted = {
  ad_data_token: "b",
  business_agent_target: { business_agent_id: "biz" },
};
const unit = {
  type: "single_advertiser_ad_unit",
  carousel_cards: [ordinary, targeted],
  ad_cards: [],
  ads: [],
};
assert.deepEqual(placement.l(unit), [ordinary, targeted]);
assert.equal(placement.u(unit, { ad_data_token: "b" }, 0), 1);
const baseInput = {
  props: {
    isImageGenerationTurn: false,
    hasAssistantMessage: true,
    hasCustomAgentMessage: false,
    isAsyncCorrection: false,
    isSuppressedConversation: false,
  },
  hasNoContentResponse: false,
  hasUnsupportedTarget: false,
  hidden: false,
  assistantCompleted: true,
  slotTimedOut: false,
  policy: { loading: false, enabled: true, optedOut: false },
};
assert.equal(
  placement.i({ ...baseInput, hasAd: true, hasResponse: true }).state,
  "render",
);
assert.equal(
  placement.i({ ...baseInput, hasAd: false, hasResponse: false }).state,
  "waiting",
);
assert.deepEqual(Object.keys(placement).sort(), [
  "a",
  "c",
  "d",
  "i",
  "l",
  "n",
  "o",
  "r",
  "s",
  "t",
  "u",
]);
runtimeAssertions += 5;

console.log(
  "misc-ui-utils rewrite MY: " +
    (sourceAssertions + runtimeAssertions) +
    " assertions (" +
    sourceAssertions +
    " source, " +
    runtimeAssertions +
    " runtime)",
);
