import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__reviewPreferencesContract = {
  hookIndex: 0,
  hooks: [],
  preferenceRuntimeInitializations: 0,
  preferences: [],
};
state.React = {
  useId: () => "review-1",
  useState(initial) {
    const index = state.hookIndex++;
    if (!(index in state.hooks)) state.hooks[index] = typeof initial === "function" ? initial() : initial;
    return [state.hooks[index], (next) => { state.hooks[index] = typeof next === "function" ? next(state.hooks[index]) : next; }];
  },
};
state.jsx = {
  jsx(type, props, key) { return { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return { type, props: props ?? {}, key }; },
};

globalThis.HTMLElement = class HTMLElement {
  constructor(attributes = {}) { this.attributes = attributes; }
  getAttribute(name) { return this.attributes[name] ?? null; }
};

const mocks = {
  "rolldown-runtime": "export const n=callback=>callback;",
  "app-shared": `
    const state=globalThis.__reviewPreferencesContract;
    export const I3=()=>state.jsx;
    export const VI=value=>String(value).replace(/\\\\/g,"/").replace(/\\/+/g,"/");
    export const e6=()=>state.React;
  `,
  "app-initial": `
    const state=globalThis.__reviewPreferencesContract;
    export const dun=(key,initial)=>{const signal={key,initial};state.preferences.push(signal);return signal};
    export const rgn=()=>{state.preferenceRuntimeInitializations+=1};
  `,
  "app-primary": "export {};",
  "diff-comment-card": "export {};",
  "pull-request-readonly-comment": "export {};",
  "review-row": "export {};",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/review-preferences-model/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "review-preferences-contract-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

assert.deepEqual(Object.keys(module).sort(), ["_", "a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "y"]);
assert.equal(module.v([{}, new HTMLElement({ "data-line": "42" })]), 42);
assert.equal(module.v([new HTMLElement({ "data-column-number": "17" })]), 17);
assert.equal(module.v([new HTMLElement({ "data-line": "invalid" })]), null);

const userMetadata = { kind: "comment", source: "user", comment: { position: { path: "src/a.ts", line: 7 } } };
const annotations = [
  { side: "additions", lineNumber: 7, metadata: userMetadata },
  { side: "deletions", lineNumber: 3, metadata: userMetadata },
];
assert.deepEqual(module.g(annotations), [{ lineNumber: 7, metadata: userMetadata }]);
assert.deepEqual(module.h(annotations[1]), { side: "additions", lineNumber: 3, metadata: userMetadata });
module._();
assert.equal(module.m("deletions", 9), "deletions:9");

assert.deepEqual(module.c(), { set: "complete", colored: true });
assert.deepEqual(module.c("standard"), { set: "standard", colored: true });
assert.deepEqual(module.c({ remap: { folder: "custom" } }), { remap: { folder: "custom" }, set: "none", colored: true });
assert.equal(module.d("complete"), true);
assert.equal(module.d("standard"), false);
module.u();
assert.equal(module.l("complete").includes("file-tree-builtin-typescript"), true);
assert.equal(module.l("minimal").includes("file-tree-builtin-typescript"), false);
assert.deepEqual(
  [module.l("minimal").length, module.l("standard").length, module.l("complete").length],
  [1881, 17279, 37919],
);

let resolver = module.a();
assert.deepEqual(resolver.resolveIcon("file-tree-icon-file", "src/app.ts"), { name: "file-tree-builtin-typescript", remappedFrom: "file-tree-icon-file", token: "typescript" });
assert.deepEqual(resolver.resolveIcon("file-tree-icon-file", "Dockerfile"), { name: "file-tree-builtin-docker", remappedFrom: "file-tree-icon-file", token: "docker" });
resolver = module.a({ byFileName: { "special.xyz": "star" }, byFileExtension: { xyz: { name: "diamond", width: 20 } }, byFileNameContains: { generated: "robot" }, remap: { folder: "folder-custom" } });
assert.deepEqual(resolver.resolveIcon("file-tree-icon-file", "special.xyz"), { name: "star", remappedFrom: "file-tree-icon-file" });
assert.deepEqual(resolver.resolveIcon("file-tree-icon-file", "generated.ts"), { name: "robot", remappedFrom: "file-tree-icon-file" });
assert.deepEqual(resolver.resolveIcon("file-tree-icon-file", "other.xyz"), { name: "diamond", width: 20, remappedFrom: "file-tree-icon-file" });
assert.deepEqual(resolver.resolveIcon("folder"), { name: "folder-custom", remappedFrom: "folder" });

module.t(); module.t();
assert.equal(state.preferenceRuntimeInitializations, 1);
assert.deepEqual(state.preferences, [
  { key: "review-filter-generated-files", initial: false },
  { key: "load-full-files", initial: true },
  { key: "skip-revert-confirmation", initial: false },
]);
assert.equal(module.n.key, "review-filter-generated-files");
assert.equal(module.r.key, "load-full-files");
assert.equal(module.i.key, "skip-revert-confirmation");

function renderModel(options) { state.hookIndex = 0; return module.p(options); }
const baseOptions = {
  diffPath: "src/a.ts",
  enableComments: true,
  comments: [{ body: "user", position: { path: "src/a.ts", line: 7, side: "right" } }],
  readonlyComments: [{ body: "readonly", reviewThreadId: "thread-1", position: { path: "src/a.ts", line: 8, side: "left" } }],
  modelComments: [{ body: "model", position: { path: "src/other.ts", line: 2, side: "right" } }],
};
let model = renderModel(baseOptions);
assert.equal(model.annotations.length, 2);
assert.deepEqual(model.annotations.map((entry) => [entry.side, entry.lineNumber]), [["additions", 7], ["deletions", 8]]);
assert.deepEqual([...model.annotationKeys], ["additions:7"]);
assert.equal(model.renderCommentAnnotation(model.annotations[0]).props.children, "user");
model.addDraftComment({ side: "additions", lineNumber: 11, localDiffHunk: "@@" });
model = renderModel({ ...baseOptions, comments: [] });
assert.equal(model.annotations.some((entry) => entry.metadata.kind === "draft-comment" && entry.lineNumber === 11), true);
assert.equal(model.annotationKeys.has("additions:11"), true);

const source = fs.readFileSync(path.join(ROOT, "src/renderer/review-preferences-model/index.ts"), "utf8");
assert.equal(source.includes("renderReviewDiffLine as a"), false);
assert.equal(source.includes("initializeReviewMutations as i"), false);
assert.equal(/\bany\b|@ts-nocheck|@ts-expect-error/u.test(source), false);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./gu)].length;
console.log(`${assertionCount} review preferences model contract assertions passed`);
