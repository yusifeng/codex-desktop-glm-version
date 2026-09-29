import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(ROOT, "src/renderer/source-annotation-host-registry/index.ts");
const editorPath = path.join(ROOT, "src/renderer/mermaid-code-editor/index.ts");
const registrySource = fs.readFileSync(registryPath, "utf8");
const editorSource = fs.readFileSync(editorPath, "utf8");
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }

async function bundle(entryPoint, mocks, name) {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name,
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}

deepEqual([...registrySource.matchAll(/from "@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime"]);
equal(/\bany\b/.test(registrySource), false);
equal(/import \* as/.test(registrySource), false);
const registry = await bundle(registryPath, {
  "rolldown-runtime": "export const n=factory=>{let ready=false,value;return()=>{if(!ready){value=factory();ready=true;}return value;};};",
}, "source-annotation-host-registry-mocks");
deepEqual(Object.keys(registry), ["a", "i", "n", "r", "t"]);
registry.n();
registry.n();
equal(registry.r("tab-1", "conversation-1"), false);
equal(registry.t("tab-1", "conversation-1"), false);
let notifications = 0;
const unsubscribe = registry.a("tab-1", "conversation-1", () => { notifications++; });
const firstHost = () => true;
const unregisterFirst = registry.i("tab-1", "conversation-1", firstHost);
equal(notifications, 1);
equal(registry.r("tab-1", "conversation-1"), true);
equal(registry.t("tab-1", "conversation-1"), true);
const secondHost = () => false;
const unregisterSecond = registry.i("tab-1", "conversation-1", secondHost);
equal(notifications, 2);
equal(registry.t("tab-1", "conversation-1"), false);
unregisterFirst();
equal(registry.r("tab-1", "conversation-1"), true);
equal(notifications, 2);
unregisterSecond();
equal(registry.r("tab-1", "conversation-1"), false);
equal(notifications, 3);
unsubscribe();
const unregisterThird = registry.i("tab-1", "conversation-1", firstHost);
equal(notifications, 3);
equal(registry.r("conversation-1", "tab-1"), false);
unregisterThird();
const registryAssertions = assertions;

const calls = {
  cssOptions: [],
  editorConstructors: [],
  effects: [],
  initializers: [],
  language: null,
  languageLoader: null,
  themeSettings: [],
};
let hookIndex = 0;
const hookState = [];
const React = {
  useEffect(effect) { calls.effects.push(effect); },
  useMemo(factory) { return factory(); },
  useRef(initialValue) {
    const index = hookIndex++;
    if (!(index in hookState)) hookState[index] = { current: initialValue };
    return hookState[index];
  },
};
const jsx = {
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__editorDocs = { calls, React, jsx };

const editorMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__editorDocs;",
    "export const $3=()=>r.calls.initializers.push('compiler-runtime');",
    "export const Cz={darkCodeThemeId:'dark-theme-setting',lightCodeThemeId:'light-theme-setting'};",
    "export const H3=()=>r.calls.initializers.push('lazy-components');",
    "export const I3=()=>r.jsx;",
    "export const K2=()=>r.calls.initializers.push('editor-surface');",
    "export const __=callback=>callback;",
    "export const dg=()=>r.calls.initializers.push('grammar-registry');",
    "export const e6=()=>r.React;",
    "export const fg=()=>true;",
    "export const g_=()=>r.calls.initializers.push('grammar-runtime');",
    "export const n4=()=>({formatMessage:message=>message.defaultMessage});",
    "export const wL=()=>r.calls.initializers.push('editor-shared');",
  ].join(""),
  "app-initial": [
    "const r=globalThis.__editorDocs;",
    "export const Kcn=id=>{r.calls.themeSettings.push(id);return 'configured-theme';};",
    "export const L_n=()=>r.calls.initializers.push('editor-settings');",
    "export const Vcn=()=>r.calls.initializers.push('theme-runtime');",
    "export const Y_n=(language,loader)=>{r.calls.language=language;r.calls.languageLoader=loader;};",
    "export const r_t=(theme,scheme)=>({name:theme+'-'+scheme});",
    "export const wk=()=>r.calls.initializers.push('theme-preference');",
  ].join(""),
  "codex-diff-css": [
    "const x=globalThis.__editorDocs;",
    "export const m=()=>x.calls.initializers.push('diff-css');",
    "export const n=options=>{x.calls.cssOptions.push(options);return 'generated-css';};",
    "export const p=props=>({type:'diff-provider',props});",
    "export const r=()=>x.calls.initializers.push('diff-provider');",
  ].join(""),
  "register-pierre-themes": "const r=globalThis.__editorDocs;export const t=()=>r.calls.initializers.push('pierre-themes');",
  "pierre-file-editor": "const r=globalThis.__editorDocs;export const n=()=>r.calls.initializers.push('file-editor');export const t=props=>({type:'file-editor',props});",
  "pierre-editor-runtime": "const r=globalThis.__editorDocs;export const n=()=>r.calls.initializers.push('editor-runtime');export class t{constructor(element,options,state){r.calls.editorConstructors.push([element,options,state]);}}",
  "mermaid-grammar": "export default [{name:'old',scopeName:'old.scope',aliases:['old'],patterns:[{include:'#old'}],extra:'preserved'}];",
  "mermaid-grammar-base": "export const n=()=>{};",
};

deepEqual([...editorSource.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), [
  "rolldown-runtime",
  "app-shared",
  "app-initial",
  "codex-diff-css",
  "register-pierre-themes",
  "pierre-file-editor",
  "pierre-editor-runtime",
]);
deepEqual([...editorSource.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), ["mermaid-grammar"]);
equal(/\bany\b/.test(editorSource), false);
equal(/import \* as/.test(editorSource), false);
const editor = await bundle(editorPath, editorMocks, "mermaid-code-editor-mocks");
deepEqual(Object.keys(editor), ["MermaidCodeEditor"]);
deepEqual(calls.initializers, [
  "compiler-runtime",
  "editor-settings",
  "editor-runtime",
  "diff-css",
  "file-editor",
  "editor-shared",
  "editor-surface",
  "diff-provider",
  "pierre-themes",
  "theme-runtime",
  "theme-preference",
  "grammar-registry",
  "grammar-runtime",
  "lazy-components",
]);
equal(calls.language, "mermaid-source");
ok(typeof calls.languageLoader === "function");
const grammar = await calls.languageLoader();
deepEqual(grammar.default, [{
  name: "mermaid-source",
  scopeName: "source.mermaid",
  aliases: [],
  injectionSelector: undefined,
  patterns: [{ include: "#mermaid" }],
  extra: "preserved",
}]);

const changed = [];
let blurred = 0;
hookIndex = 0;
calls.effects.length = 0;
const view = editor.MermaidCodeEditor({
  editStateKey: "diagram-1",
  initialCode: "graph TD; A-->B",
  onBlur() { blurred++; },
  onChange(value) { changed.push(value); },
});
equal(view.type, "div");
equal(view.props.className, "h-full overflow-auto pe-4");
view.props.onBlur();
equal(blurred, 1);
const provider = view.props.children;
equal(provider.type, "diff-provider");
const fileEditor = provider.props.children;
equal(fileEditor.type, "file-editor");
equal(fileEditor.props.edit, true);
equal(fileEditor.props.disableWorkerPool, true);
equal(fileEditor.props.editStateKey, "diagram-1");
deepEqual(fileEditor.props.file, {
  name: "Edit code",
  contents: "graph TD; A-->B",
  lang: "mermaid-source",
  cacheKey: "mermaid-source",
});
equal(fileEditor.props.options.theme, "configured-theme-dark");
equal(fileEditor.props.options.themeType, "dark");
equal(fileEditor.props.options.unsafeCSS, "generated-css");
deepEqual(calls.themeSettings, ["dark-theme-setting"]);
deepEqual(calls.cssOptions, [{
  includeDiffHeader: false,
  includeSimpleLineSeparators: false,
  rootSelector: "[data-file]",
  surface: "var(--color-surface)",
}]);
equal(fileEditor.props.editorOptions.languageCommentConfig["mermaid-source"].lineComment, "%%");
fileEditor.props.editorOptions.onChange({ file: { contents: "graph LR; X-->Y" } });
deepEqual(changed, ["graph LR; X-->Y"]);
const focusCalls = [];
fileEditor.props.editorOptions.onAttach({ focus(options) { focusCalls.push(options); } });
deepEqual(focusCalls, [{ preventScroll: true }]);
const editorInstance = provider.props.createEditor("element", "options", "state");
ok(editorInstance != null);
deepEqual(calls.editorConstructors, [["element", "options", "state"]]);
equal(calls.effects.length, 1);
const cleanup = calls.effects[0]();
cleanup();
equal(blurred, 2);

console.log(
  "editor-docs tests passed (registry " + registryAssertions
    + ", editor " + (assertions - registryAssertions)
    + ", total " + assertions + " assertions)",
);
