import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";
const ROOT = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/artifact-tab-content-shell/index.ts"), "utf8");
assert.deepEqual([...source.matchAll(/@rchunk\/([^";]+)/g)].map((match) => match[1]), ["app-shared", "artifact-layout", "pane-layout", "rolldown-runtime", "artifact-tab-content-electron-entry"]);
assert.ok(!/\bany\b/.test(source));
assert.ok(source.includes("export { ArtifactTabContentShell }"));
const state = globalThis.__artifactShellTest = { initializers: [], pane: null };
const jsx = { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const React = { Suspense: "Suspense", lazy: (load) => { state.load = load; return "LazyArtifact"; } };
const mocks = {
  "app-shared": "export const $3=()=>globalThis.__artifactShellTest.initializers.push('shared');export const H3=()=>globalThis.__artifactShellTest.initializers.push('preload');export const I3=()=>globalThis.__artifactShellTest.jsx;export const K2=()=>globalThis.__artifactShellTest.initializers.push('ui');export const V3=load=>load();export const Y2='FormattedMessage';export const e6=()=>globalThis.__artifactShellTest.React;",
  "artifact-layout": "export const n=()=>globalThis.__artifactShellTest.initializers.push('layout');export const t='ArtifactLayout';",
  "pane-layout": "export const n=(slots,parts)=>{globalThis.__artifactShellTest.pane=[slots,parts];return 'pane'};export const t=()=>globalThis.__artifactShellTest.initializers.push('pane-layout');",
  "rolldown-runtime": "export {};",
  "artifact-tab-content-electron-entry": "export const ArtifactTabContent='ArtifactTabContent';",
};
Object.assign(state, { jsx, React });
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/artifact-tab-content-shell/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] });
const output = path.join("/tmp", "artifact-shell-" + process.pid + ".mjs"); fs.writeFileSync(output, result.outputFiles[0].text); const loaded = await import(pathToFileURL(output).href); fs.unlinkSync(output);
assert.deepEqual(Object.keys(loaded), ["ArtifactTabContentShell"]);
assert.deepEqual(state.initializers, ["shared", "ui", "layout", "pane-layout", "preload"]);
const view = loaded.ArtifactTabContentShell({ id: "artifact", renderSlots: "slots" });
assert.equal(view.type, "Suspense");
assert.equal(view.props.children.type, "LazyArtifact");
assert.equal(view.props.children.props.id, "artifact");
assert.equal(view.props.fallback.type, "ArtifactLayout");
assert.equal(view.props.children.props.renderLayout("parts"), "pane");
assert.deepEqual(state.pane, ["slots", "parts"]);
assert.deepEqual(await state.load(), { default: "ArtifactTabContent" });
console.log(11 + " artifact tab shell assertions passed");
