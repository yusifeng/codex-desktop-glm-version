import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__codeRenderingTest = {
    colorScheme: "dark",
    darkTheme: "dark-setting",
    effects: [],
    initializers: [],
    lightTheme: "light-setting",
    poolUpdates: [],
    theme: "system",
    useWordDiff: true,
    jsx: {
      Fragment: Symbol("Fragment"),
      jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
      jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
    },
  };
  return globalThis.__codeRenderingTest;
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "code-rendering-foundation-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => {
              if (value === "app-shared")
                return {
                  contents: `
            const state=globalThis.__codeRenderingTest;
            const noop=()=>{};
            const React={
              createContext:(defaultValue)=>({Provider:Symbol("Provider"),value:defaultValue}),
              useContext:(context)=>context.value,
              useRef:(current)=>({current}),
              useInsertionEffect:(effect)=>effect(),
              useCallback:(callback)=>callback,
              useEffect:(effect,deps)=>{state.effects.push(deps);effect()},
            };
            export const $3=()=>state.initializers.push("compiler"),FX=()=>state.initializers.push("signals"),wL=()=>state.initializers.push("window"),h4=noop;
            export const I3=()=>state.jsx,e6=()=>React;
            export const m4=(...values)=>values.filter(Boolean).join(" ");
            export const Cz={darkCodeThemeId:"dark-id",lightCodeThemeId:"light-id"};
            export const HX=(signal)=>signal?.settingId==="dark-id"?state.darkTheme:signal?.settingId==="light-id"?state.lightTheme:state.useWordDiff;
          `,
                  loader: "js",
                };
              if (value === "app-initial")
                return {
                  contents: `
            const state=globalThis.__codeRenderingTest;
            const init=(name)=>()=>state.initializers.push(name);
            export const CW=()=>state.colorScheme,GO={wordDiff:true},Kcn=(settingId)=>({settingId}),SW=()=>state.theme;
            export const r_t=(setting,scheme)=>({name:scheme+":"+setting});
            export const VO=init("color-scheme"),Vcn=init("settings"),wk=init("theme"),xW=init("diff-preferences");
          `,
                  loader: "js",
                };
              if (value === "register-pierre-themes")
                return {
                  contents: `
            const state=globalThis.__codeRenderingTest;
            export const a=()=>({setRenderOptions:(options)=>state.poolUpdates.push(options)});
            export const i=()=>state.initializers.push("theme-registry"),t=()=>state.initializers.push("highlighter-pool");
            export const r=Symbol("HighlighterPoolProvider"),n=null;
          `,
                  loader: "js",
                };
              if (value === "rolldown-runtime")
                return {
                  contents:
                    "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};",
                  loader: "js",
                };
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`
  );
}

assertReleaseOwner("codex-diff-css");

assertReleaseOwner("ansi-block");

// shiki-highlight-provider: worker pool, selected theme, language list and live updates.
let state = resetState();
class WorkerMock {
  constructor(url, options) {
    this.url = url;
    this.options = options;
  }
}
globalThis.Worker = WorkerMock;
const shiki = await bundle("shiki-highlight-provider");
assert.ok(state.initializers.includes("theme-registry"));
assert.ok(state.initializers.includes("highlighter-pool"));
const darkProvider = shiki.ShikiHighlightProvider({ children: "code" });
assert.equal(typeof darkProvider.type, "symbol");
assert.equal(darkProvider.props.poolOptions.poolSize, 4);
assert.equal(darkProvider.props.poolOptions.totalASTLRUCacheSize, 100);
assert.deepEqual(darkProvider.props.highlighterOptions.langs, [
  "typescript",
  "javascript",
  "css",
  "html",
  "python",
]);
assert.equal(darkProvider.props.highlighterOptions.theme, "dark:dark-setting");
assert.equal(darkProvider.props.highlighterOptions.lineDiffType, "word-alt");
const worker = darkProvider.props.poolOptions.workerFactory();
assert.match(worker.url, /worker-49a232674c13\.js$/);
assert.deepEqual(worker.options, { type: "module" });
const bridge = darkProvider.props.children[0];
assert.equal(bridge.type(bridge.props), null);
assert.deepEqual(state.poolUpdates, [
  { lineDiffType: "word-alt", theme: "dark:dark-setting" },
]);
state.colorScheme = "light";
state.useWordDiff = false;
const lightProvider = shiki.ShikiHighlightProvider({ children: null });
assert.equal(
  lightProvider.props.highlighterOptions.theme,
  "light:light-setting",
);
assert.equal(lightProvider.props.highlighterOptions.lineDiffType, "none");
assertReleaseOwner("register-pierre-themes");

console.log("49 code rendering foundation cluster assertions passed");
