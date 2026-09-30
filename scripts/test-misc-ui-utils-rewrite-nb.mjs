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
    "active-theme-font-face-loader-932b256c28db.js",
    "active-theme-font-face-loader",
    [
      "rolldown-runtime",
      "app-shared",
      "theme-font-family",
      "theme-font-face-loader",
    ],
  ],
  ["adaptive-slider-7a51d6c629a2.js", "adaptive-slider", ["rolldown-runtime"]],
  [
    "adaptive-slider-field-6d316e0b7a10.js",
    "adaptive-slider-field",
    ["rolldown-runtime", "app-shared", "adaptive-slider"],
  ],
  [
    "anatomy-feedback-schematic-88345e8df0bb.js",
    "anatomy-feedback-schematic",
    [
      "rolldown-runtime",
      "app-shared",
      "learning-block-stroke",
      "learning-block-path",
    ],
  ],
  [
    "announcement-host-46a475b49467.js",
    "announcement-host",
    ["rolldown-runtime", "app-shared", "app-initial", "workspace-discovery"],
  ],
  [
    "auto-track-c4c9b822fca3.js",
    "auto-track",
    ["rolldown-runtime", "callback-utility"],
  ],
  [
    "bar-sizing-fa3b2a70455c.js",
    "bar-sizing",
    ["rolldown-runtime", "app-shared", "app-initial"],
  ],
  ["cannon-83a86e614bd8.js", "cannon", ["rolldown-runtime"]],
  [
    "catmullRom-b244076d0269.js",
    "catmull-rom",
    ["rolldown-runtime", "math-lazy-runtime"],
  ],
  [
    "classify-475110c4b36d.js",
    "classify",
    ["rolldown-runtime", "math-block-utils"],
  ],
  [
    "comment-light-dismiss-4ad7bc38388a.js",
    "comment-light-dismiss",
    ["rolldown-runtime", "app-shared"],
  ],
];
const aliases = new Map([
  ["rolldown-runtime-2d059c5e81f4", "rolldown-runtime"],
  ["app-shared-7b9edc1bfb7f", "app-shared"],
  ["app-initial-51da50e6c6e3", "app-initial"],
  ["theme-font-family-dc698ab60879", "theme-font-family"],
  ["theme-font-face-loader-c998b13292c3", "theme-font-face-loader"],
  ["adaptive-slider-7a51d6c629a2", "adaptive-slider"],
  ["learning-block-stroke-e5db4228ffca", "learning-block-stroke"],
  ["learning-block-path-74045b6d1532", "learning-block-path"],
  ["workspace-discovery-d569efe7ed15", "workspace-discovery"],
  ["callback-d3e2038dfd64", "callback-utility"],
  ["math-de3a0e0db4e2", "math-lazy-runtime"],
  ["math-block-utils-ca3c4f5321e8", "math-block-utils"],
]);
const deps = (source, recovered) =>
  recovered
    ? [...source.matchAll(/(?:from\s*|import\s*)["']@rchunk\/([^"']+)/g)].map(
        (match) => match[1],
      )
    : [...source.matchAll(/import[\s\S]*?;/g)]
        .map((statement) => statement[0].match(/["']\.\/([^"']+)\.js["']/)?.[1])
        .filter((value) => value != null)
        .map((value) => aliases.get(value) ?? value);
const exportsOf = (source) =>
  [...source.matchAll(/export\s*\{([\s\S]*?)\};/g)]
    .flatMap((match) => match[1].split(","))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.match(/\bas\s+([A-Za-z_$][\w$]*)$/)?.[1] ?? entry)
    .sort();

let sourceAssertions = 0;
for (const [asset, directory, expected] of modules) {
  const original = fs.readFileSync(path.join(assetRoot, asset), "utf8");
  const recovered = fs.readFileSync(
    path.join(root, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  assert.deepEqual(
    deps(original, false),
    expected,
    directory + " original deps",
  );
  assert.deepEqual(
    deps(recovered, true),
    expected,
    directory + " recovered deps",
  );
  assert.deepEqual(
    exportsOf(recovered),
    exportsOf(original),
    directory + " exports",
  );
  assert.equal(
    (original.match(/import\(/g) ?? []).length,
    (recovered.match(/import\(/g) ?? []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(recovered), false);
  assert.ok(recovered.includes("Release chunk: " + asset));
  assert.ok(recovered.length > 450);
  sourceAssertions += 7;
}

const element = "const element=(type,props,key)=>({type,props,key});";
const mocks = {
  "@rchunk/rolldown-runtime": "export {};",
  "@rchunk/app-shared":
    element +
    "export const I3=()=>({jsx:element,jsxs:element});export const e6=()=>globalThis.__nbReact;export const _L=o=>globalThis.__nbQueries.push(o);export const gL=()=>{};export const BX=(signal,param)=>globalThis.__nbBX(signal,param);export const HX=signal=>globalThis.__nbHX(signal);",
  "@rchunk/app-initial":
    "export const OM=globalThis.__nbObserve;export const kM=()=>{};export const N6t=()=>globalThis.__nbAuth;",
  "@rchunk/theme-font-family": "export const t=(font,face)=>font===face;",
  "@rchunk/theme-font-face-loader":
    "export const r=fonts=>Promise.resolve(fonts);export const t=()=>{};",
  "@rchunk/learning-block-stroke":
    "export const i=()=>{};export const r='Stroke';",
  "@rchunk/learning-block-path": "export const n=()=>{};export const t='Path';",
  "@rchunk/workspace-discovery":
    "export const a='query';export const c='eligible';export const t='Announcement';",
  "@rchunk/callback-utility":
    "export const r=promise=>Promise.resolve(promise);",
  "@rchunk/math-lazy-runtime": "export const c=()=>globalThis.__nbMathInit++;",
  "@rchunk/math-block-utils":
    "export const r=()=>{};export const n=source=>[...source].flatMap((c,i)=>c==='='?[i]:[]);",
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
        name: "nb-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\/adaptive-slider$/ }, () => ({
            path: path.join(root, "src/renderer/adaptive-slider/index.ts"),
          }));
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath,
            namespace: "nb-mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "nb-mock" },
            ({ path: modulePath }) => ({
              contents: mocks[modulePath] ?? "export {};",
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

globalThis.__nbQueries = [];
globalThis.__nbMathInit = 0;
globalThis.__nbObserve = () => () => {};
globalThis.__nbAuth = { authMethod: "other" };
globalThis.__nbBX = () => false;
globalThis.__nbHX = () => ({});
globalThis.__nbReact = {
  useRef: (value) => ({ current: value }),
  useState: (value) => {
    let current = typeof value === "function" ? value() : value;
    return [
      current,
      (next) => {
        current = typeof next === "function" ? next(current) : next;
      },
    ];
  },
  useEffect: (effect) => {
    globalThis.__nbCleanup = effect();
  },
};
let runtimeAssertions = 0;

const adaptive = await bundle("adaptive-slider");
adaptive.a();
assert.equal(
  adaptive.c(12.345, { min: 0, max: 10 }, { maxFractionDigits: 2 }),
  10,
);
assert.equal(adaptive.o(1.2, 0, 0.2), true);
assert.deepEqual(
  adaptive.r(50, {
    allowed: { min: 0, max: 100 },
    base: { min: 0, max: 10, step: 1 },
  }),
  { min: 40, max: 60, step: 0.5 },
);
assert.equal(adaptive.u(1.235, 2), 1.24);
runtimeAssertions += 4;

const field = await bundle("adaptive-slider-field");
field.n();
assert.equal(field.i(undefined, { min: 0, max: 10, defaultValue: 4 }), 4);
assert.deepEqual(
  field.t(50, { baseMin: 0, baseMax: 10, step: 1 }, { min: 0, max: 100 }),
  { min: 40, max: 60, step: 0.5 },
);
runtimeAssertions += 2;

const classify = await bundle("classify");
classify.a();
assert.equal(classify.u("$\\displaystyle x+1$"), "x+1");
assert.equal(classify.c("\\boxed{x=2}"), "x=2");
assert.deepEqual(classify.s("x=1 -> y=2"), ["x=1", "y=2"]);
assert.deepEqual(classify.t("x=1=y"), [
  { lhs: "x", rhs: "1" },
  { lhs: "1", rhs: "y" },
]);
runtimeAssertions += 4;

const catmull = await bundle("catmull-rom");
catmull.n();
const commands = [];
const context = {
  moveTo: (...args) => commands.push(["M", ...args]),
  lineTo: (...args) => commands.push(["L", ...args]),
  bezierCurveTo: (...args) => commands.push(["C", ...args]),
  closePath: () => commands.push(["Z"]),
};
const curve = catmull.t(context);
curve.lineStart();
curve.point(0, 0);
curve.point(1, 1);
curve.point(2, 0);
curve.lineEnd();
assert.equal(commands[0][0], "M");
assert.ok(commands.some((command) => command[0] === "C"));
assert.equal(globalThis.__nbMathInit, 1);
runtimeAssertions += 3;

const bar = await bundle("bar-sizing");
bar.a();
assert.equal(bar.r({ dataLength: 30, defaultGapPx: 8 }), 3);
assert.equal(bar.i({ containerSize: 400, dataLength: 4, series: [{}, {}] }), 4);
assert.deepEqual(
  bar.n({
    chartType: "bar",
    layout: "vertical",
    data: Array(12),
    series: [{}, {}],
  }),
  { height: "33rem" },
);
runtimeAssertions += 3;

const anatomy = await bundle("anatomy-feedback-schematic");
anatomy.r();
assert.equal(
  anatomy.t({ children: "organs" }).props["data-anatomy-body"],
  "endocrine",
);
assert.equal(
  anatomy.n({ color: "red", path: [], target: { x: 10, y: 20 } }).props
    .children[1].props.from.y,
  12,
);
runtimeAssertions += 2;

const loader = await bundle("active-theme-font-face-loader");
assert.equal(
  loader.ActiveThemeFontFaceLoader({
    fonts: { code: "A", codeFace: "B", ui: "C" },
  }),
  null,
);
const fontQuery = loader.ActiveThemeFontFaceLoader({
  fonts: { code: "A", codeFace: "A", ui: "C" },
});
assert.equal(typeof fontQuery.type, "function");
fontQuery.type(fontQuery.props);
assert.equal(globalThis.__nbQueries.length, 1);
runtimeAssertions += 3;

const announcement = await bundle("announcement-host");
assert.equal(
  announcement.WorkspaceDiscoveryAnnouncementHost({ children: "child" }),
  "child",
);
globalThis.__nbAuth = { authMethod: "chatgpt", userId: "u", accountId: "a" };
globalThis.__nbBX = (signal) =>
  signal === "eligible" ? true : { data: { workspaces: [{}] } };
assert.equal(
  announcement.WorkspaceDiscoveryAnnouncementHost({ children: "child" }).type,
  "Announcement",
);
runtimeAssertions += 2;

const comment = await bundle("comment-light-dismiss");
comment.r();
assert.equal(
  comment.t({ isLightDismissible: false, isLightDismissArmed: false }),
  "shake",
);
assert.equal(
  comment.t({ isLightDismissible: true, isLightDismissArmed: false }),
  "dismiss",
);
const style = {
  animation: "",
  removeProperty() {
    this.animation = "";
  },
};
let frameCallback;
const feedback = comment.i(
  { current: { style } },
  {
    requestAnimationFrame(callback) {
      frameCallback = callback;
      return 7;
    },
    cancelAnimationFrame() {},
  },
);
feedback.shake();
frameCallback();
assert.equal(style.animation, "shake 900ms linear both");
feedback.stopShake();
assert.equal(style.animation, "");
runtimeAssertions += 4;

class FakeElement {
  constructor() {
    this.listeners = {};
    this.attributes = {};
  }
  addEventListener(name, handler) {
    this.listeners[name] = handler;
  }
  getAttribute(name) {
    return this.attributes[name] ?? null;
  }
  getAttributeNS() {
    return null;
  }
  getElementsByTagName() {
    return [];
  }
}
class FakeForm extends FakeElement {
  submit() {
    this.submitted = true;
  }
}
globalThis.Element = FakeElement;
globalThis.HTMLFormElement = FakeForm;
globalThis.window = { location: { href: "" } };
const auto = await bundle("auto-track");
const tracker = { settings: { timeout: 10 }, track: async () => "ok" };
const formElement = new FakeForm();
auto.form.call(tracker, formElement, "submit", {});
formElement.listeners.submit({ preventDefault() {} });
await Promise.resolve();
await Promise.resolve();
assert.equal(formElement.submitted, true);
runtimeAssertions += 1;

const canvasContext = {
  clearRect() {},
  save() {},
  restore() {},
  translate() {},
  rotate() {},
  fillText() {},
  beginPath() {},
  ellipse() {},
  fill() {},
  set fillStyle(_value) {},
  set font(_value) {},
  set textAlign(_value) {},
};
const canvas = {
  className: "",
  inert: false,
  width: 0,
  height: 0,
  offsetHeight: 100,
  setAttribute() {},
  getContext: () => canvasContext,
  getBoundingClientRect: () => ({ width: 100, height: 100 }),
  remove() {
    this.removed = true;
  },
};
globalThis.document = {
  documentElement: { dataset: { reducedMotion: "true" } },
  visibilityState: "visible",
  createElement: () => canvas,
  body: { append() {} },
};
globalThis.window = {
  devicePixelRatio: 1,
  innerWidth: 100,
  innerHeight: 100,
  matchMedia: () => ({ matches: false }),
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
  setTimeout: () => 2,
  clearTimeout() {},
  location: { href: "" },
};
const cannon = await bundle("cannon");
assert.deepEqual(cannon.fireConfettiCannon(), {
  fired: false,
  reason: "reduced-motion",
});
document.documentElement.dataset.reducedMotion = "false";
assert.deepEqual(cannon.fireConfettiCannon({ emojis: [] }), { fired: true });
assert.equal(canvas.inert, true);
runtimeAssertions += 3;

console.log(
  "misc-ui-utils rewrite NB: " +
    (sourceAssertions + runtimeAssertions) +
    " assertions (" +
    sourceAssertions +
    " source, " +
    runtimeAssertions +
    " runtime)",
);
