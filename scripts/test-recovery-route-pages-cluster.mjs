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

const epic = await load("epic-launch-page");
globalThis.__auth = { accountId: "workspace-1", authMethod: "chatgpt", userId: "user-1" };
const epicReady = epic.EpicLaunchPage();
assert.equal(epicReady.type, "a");
assert.equal(epicReady.props.href, "/epic/chart");
globalThis.__auth = { accountId: "workspace-2", authMethod: "chatgpt", userId: "user-1" };
assert.match(epic.EpicLaunchPage().props.children, /workspace-1/);
globalThis.__auth = { isLoading: true };
assert.equal(epic.EpicLaunchPage().props.role, "status");
globalThis.__auth = { accountId: "workspace-1", authMethod: "api", userId: "user-1" };
assert.equal(epic.EpicLaunchPage().props["data-action"], "request-chatgpt-login");

const authError = await load("browser-auth-error-page");
globalThis.__location = { ...globalThis.__location, search: "?error=session_expired" };
const errorPage = authError.BrowserAuthErrorPage();
assert.equal(errorPage.props["data-error"], "session_expired");
assert.equal(errorPage.props.children[0].props.children, "Oops!");
errorPage.props.children[2].props.onClick();
assert.equal(globalThis.__navigations.at(-1).path, "/auth/login");
globalThis.__location = { ...globalThis.__location, search: "?error=violence_auth_freeze" };
assert.match(authError.BrowserAuthErrorPage().props.children[0].props.children, /paused/);
globalThis.__location = { ...globalThis.__location, search: "?error=not-real" };
assert.equal(authError.BrowserAuthErrorPage().props["data-error"], "default");

const demo = await load("demo-tools-setup-page");
globalThis.__stateOverrides = [{ downloadUrl: "https://example.com/app", installStatus: "installed" }, null];
const demoPage = demo.DemoToolsSetupPage();
assert.equal(demoPage.props.children[0].props.children, "Set up a demo install");
assert.equal(demoPage.props.children[3].props.children.length, 4);
assert.equal(demoPage.props.children[3].props.children[0].props.children.props.disabled, false);
assert.equal(demoPage.props.children[3].props.children[3].props.children, "Ready to launch");
assert.equal(demoPage.props.children[2], null);

const callbackReleaseAssertions = assertReleaseOwner("app-connect-oauth-callback-page");

console.log(`recovery route pages cluster complete with ${callbackReleaseAssertions} OAuth callback release assertions`);
