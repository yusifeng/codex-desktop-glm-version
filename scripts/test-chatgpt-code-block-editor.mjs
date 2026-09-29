import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "src/renderer/chatgpt-code-block-editor/index.ts");
const source = fs.readFileSync(entry, "utf8");
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const ok = (value) => { assertions++; assert.ok(value); };

deepEqual([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"]+)"/g)].map((match) => match[1]), [
  "rolldown-runtime", "app-shared", "codemirror-view-runtime", "codemirror-commands-runtime", "text-editor-merge-runtime", "chatgpt-code-block-highlighting",
]);
const dynamicFiles = [...source.matchAll(/import\("\.\.\/\.\.\/webview\/assets\/([^"]+)"\)/g)].map((match) => match[1]);
equal(dynamicFiles.length, 35);
equal(dynamicFiles.filter((file) => file === "clike-ce9cd077a325.js").length, 6);
equal(dynamicFiles.filter((file) => file === "dist-4d0af915d2c7.js").length, 2);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);

const runtime = { effects: [], initializers: [], jsx: null, loads: new Map(), states: [], stateIndex: 0 };
const jsx = { jsx: (type, props) => ({ type, props: props ?? {} }), jsxs: (type, props) => ({ type, props: props ?? {} }) };
const React = {
  useEffect(effect) { runtime.effects.push(effect); effect(); },
  useRef(value) { return { current: value }; },
  useState(initial) { const index = runtime.stateIndex++; const value = runtime.states[index] ?? (typeof initial === "function" ? initial() : initial); runtime.states[index] = value; return [value, (next) => { runtime.states[index] = typeof next === "function" ? next(runtime.states[index]) : next; }]; },
};
runtime.jsx = jsx;
globalThis.__codeEditorTest = runtime;
const marker = (name) => `export const ${name}=()=>globalThis.__codeEditorTest.initializers.push("${name}");`;
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [marker("$3"), marker("K2"), marker("h4"), "export const I3=()=>globalThis.__codeEditorTest.jsx;export const e6=()=>globalThis.__codeEditorReact;export const m4=(...parts)=>parts.filter(Boolean).join(' ');export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});"].join("\n"),
  "codemirror-view-runtime": "export {};", "codemirror-commands-runtime": "export {};", "text-editor-merge-runtime": "export {};",
  "chatgpt-code-block-highlighting": `${marker("r")} export const n=['extension'];`,
};
globalThis.__codeEditorReact = React;
function assetModule(file) {
  runtime.loads.set(file, (runtime.loads.get(file) ?? 0) + 1);
  const names = ["shell","swift","css","html","javascript","json","python","sql","go","yaml","java","rust","cpp","php","xml","vue","ruby","haskell","kotlin","csharp","vb","c","objectiveC","r","lua","dart","scala","perl","commonLisp","clojure","oCaml","powerShell","verilog","dockerFile"];
  return names.map((name) => `export const ${name}=(options)=>({name:"${name}",options,file:"${file}"});`).join("\n");
}
const build = await esbuild.build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onResolve({ filter: /webview\/assets\/.+\.js$/ }, ({ path: importPath }) => ({ path: path.basename(importPath), namespace: "asset" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ contents: mocks[name] ?? "export {};", loader: "js" }));
  build.onLoad({ filter: /.*/, namespace: "asset" }, ({ path: name }) => ({ contents: assetModule(name), loader: "js" }));
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(build.outputFiles[0].text).toString("base64"));
deepEqual(Object.keys(module).sort(), ["a", "i", "n", "o", "r", "t"]);
module.n(); module.n();
deepEqual(runtime.initializers, ["$3", "K2", "h4", "r"]);
equal(module.a("python"), true); equal(module.a("unknown"), false); equal(module.i("python"), null);
const first = module.r("python"); const second = module.r("python"); equal(first, second);
const support = await first; equal(support.name, "python"); equal(module.i("python"), support); equal(await module.r("unknown"), null);
runtime.stateIndex = 0; runtime.states = []; const changes = []; const editorStateRef = { current: null }; const handleRef = { current: null };
const view = module.t({ code: "print(1)", editorStateRef, language: "python", onBlur() {}, onChange: (value) => changes.push(value), placeholder: "Code", ref: handleRef, wrapLines: true });
equal(view.type, "textarea"); equal(view.props.value, "print(1)"); equal(view.props["aria-label"], "Edit code"); equal(view.props["data-code-language"], "python"); ok(view.props.className.includes("whitespace-pre-wrap"));
view.props.onChange({ target: { value: "print(2)" } }); deepEqual(changes, ["print(2)"]); equal(editorStateRef.current.code, "print(1)"); ok(handleRef.current);
console.log(`chatgpt-code-block-editor tests passed (${assertions} assertions)`);
