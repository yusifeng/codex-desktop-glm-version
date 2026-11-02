import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__jsx = jsx;
globalThis.__auth = null;
globalThis.__location = { hash: "", key: "route", pathname: "/", search: "", state: null };
globalThis.__navigations = [];
globalThis.__stateOverrides = [];
globalThis.__desktopApi = {};
globalThis.window = {
  addEventListener() {}, removeEventListener() {},
  __oaiEpicNativeLaunch: { get: () => "chart", workspace: () => "workspace-1", destination: () => "/epic/chart" },
};
globalThis.__React = {
  useContext: () => globalThis.__auth,
  useEffect: (effect) => effect(),
  useState(initialValue) {
    const value = globalThis.__stateOverrides.length ? globalThis.__stateOverrides.shift() : typeof initialValue === "function" ? initialValue() : initialValue;
    return [value, () => {}];
  },
  useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
};

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => {
        if (modulePath === "app-shared") return { loader: "js", contents: "export const I3=()=>globalThis.__jsx;export const e6=()=>globalThis.__React;" };
        if (modulePath === "app-initial") return { loader: "js", contents: "export const B6t={};export const i_n=()=>globalThis.__location;export const o_n=()=>((path,options)=>globalThis.__navigations.push({path,options}));export const pnt=globalThis.__desktopApi;" };
        return { loader: "js", contents: "export default {};" };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const epicReleaseAssertions = assertReleaseOwner("epic-launch-page");

const authErrorReleaseAssertions = assertReleaseOwner("browser-auth-error-page");

const demoReleaseAssertions = assertReleaseOwner("demo-tools-setup-page");

const callbackReleaseAssertions = assertReleaseOwner("app-connect-oauth-callback-page");

console.log(`recovery route pages cluster complete with ${epicReleaseAssertions + authErrorReleaseAssertions + demoReleaseAssertions + callbackReleaseAssertions} release assertions`);
