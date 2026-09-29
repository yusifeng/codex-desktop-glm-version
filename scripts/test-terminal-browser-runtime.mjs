import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const React = {
  useCallback(callback) { return callback; },
  useEffect() {},
  useRef(value) { return { current: value }; },
  useState(value) { const initial = typeof value === "function" ? value() : value; return [initial, () => {}]; },
};
globalThis.__terminalBrowserTest = {
  gates: { enabled: true, loading: false },
  hostAvailability: { enabled: true, isLoading: false },
  invalidations: [],
  inits: [],
  toast: null,
};

const scope = {
  queryClient: { async invalidateQueries({ queryKey }) { globalThis.__terminalBrowserTest.invalidations.push(queryKey); } },
  get(signal, parameter) {
    if (signal === "toast") return { danger(message, options) { globalThis.__terminalBrowserTest.toast = { message, options }; } };
    if (signal === "artifacts") return [{ projectId: "project-1", url: "https://example.test" }];
    if (signal === "project") return { data: { access_policy: { access_mode: "owner" } } };
    return parameter;
  },
};

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "export const $3=()=>globalThis.__terminalBrowserTest.inits.push('lazy');",
    "export const I3=()=>globalThis.__terminalBrowserJsx;",
    "export const e6=()=>globalThis.__terminalBrowserReact;",
    "export const IK=(a,b)=>a===b; export const RI=()=>{}; export const VI=x=>x.replaceAll('\\\\','/'); export const WK=(...v)=>v.filter(Boolean).join('/').replaceAll('//','/');",
    "export const kC=props=>({type:'terminal-icon',props}); export const lw=()=>{};",
    "export const lY=value=>'normalized:'+value; export const wL=()=>{};",
    "export const G2=value=>value; export const K2=()=>{}; export const Y2=props=>({type:'message',props}); export const h4=()=>{}; export const m4=(...v)=>v.filter(Boolean).join(' ');",
    "export const FX=()=>{}; export const LX=()=>globalThis.__terminalBrowserScope; export const QI=()=>{}; export const SL=()=>{}; export const ZI='app-scope'; export const lk=()=>{}; export const pk='toast'; export const xL=props=>({type:'query-provider',props});",
  ].join("\n"),
  "app-initial": [
    "export const Xd=props=>({type:'conversation-thumbnail',props}); export const Zd=()=>{};",
    "export const _an=()=>{}; export const aan='project';",
    "export const C6t=()=>{}; export const ifn=()=>{}; export const ofn=()=>globalThis.__terminalBrowserTest.gates.enabled; export const sfn=()=>globalThis.__terminalBrowserTest.gates.loading; export const w6t=()=>globalThis.__terminalBrowserTest.hostAvailability;",
  ].join("\n"),
  "terminal-panel-bootstrap": "export const t=()=>{};",
  "terminal-thumbnail": "export const n=()=>{}; export const t=props=>({type:'terminal-thumbnail',props});",
  "mark-session-create": "export const dt={kind:'signal'}; export const ft=()=>globalThis.__terminalBrowserTest.inits.push('voice'); export const n=()=>globalThis.__terminalBrowserTest.inits.push('session'); export const r=(...args)=>args; export const t=(...args)=>args;",
  "appgen-access": "export const c=policy=>policy.access_mode==='owner'; export const r=policy=>policy; export const s=()=>{}; export const t=project=>project!=null;",
  "appgen-browser-site-core": "export const n=()=>{}; export const t=(sites,url)=>sites.find(site=>site.url===url)??null;",
  "local-conversation-artifacts-signals": "export const r=()=>{}; export const t='artifacts';",
  "browser-browsing-data-dialog": "export const n=()=>{}; export const t=props=>({type:'clear-dialog',props});",
};
globalThis.__terminalBrowserJsx = jsx;
globalThis.__terminalBrowserReact = React;
globalThis.__terminalBrowserScope = scope;

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{ name: "terminal-browser-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    } }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}

const terminalPanel = await load("terminal-panel-bootstrap");
assert.deepEqual(Object.keys(terminalPanel), ["t"]);
assert.equal(terminalPanel.t(), undefined);

const terminal = await load("terminal-thumbnail");
assert.deepEqual(Object.keys(terminal), ["n", "t"]);
const terminalView = terminal.t({ title: "~/project", cwd: "/home/me/project", homeDirectory: "/home/me", outputTail: [{ text: "done" }] });
assert.equal(terminalView.type, "conversation-thumbnail");
assert.equal(terminalView.props.subtitle, null);
assert.equal(terminalView.props.sections[0].content.props.children[0].props.children, "done");

const background = await load("background-terminal-thumbnail");
assert.deepEqual(Object.keys(background), ["BackgroundTerminalThumbnail"]);
const backgroundView = background.BackgroundTerminalThumbnail({ title: "Worker", readState: () => ({ readOutput: () => [{ text: "tail" }] }) });
assert.equal(backgroundView.type, "terminal-thumbnail");
assert.equal(backgroundView.props.outputTail[0].text, "tail");

const ascii = await load("ascii-engine");
assert.deepEqual(Object.keys(ascii), ["i", "n", "r", "t"]);
const asciiState = ascii.n({ initialColumns: 24, initialMode: "composite", initialRows: 12 });
assert.equal(asciiState.mode, "composite");
assert.equal(asciiState.columns, 24);
assert.equal(asciiState.rows, 12);
assert.equal(asciiState.asciiChars, "@%#*+=-:. ");

const voice = await load("browser-voice-availability");
assert.deepEqual(Object.keys(voice), ["canShowVoiceModeAction$", "clearSessionCreate", "markSessionCreate"]);
assert.equal(voice.canShowVoiceModeAction$.kind, "signal");
assert.deepEqual(voice.markSessionCreate("scope", "browser"), ["scope", "browser"]);

const siteActions = await load("browser-site-actions-state");
assert.deepEqual(Object.keys(siteActions), ["getBrowserSiteActionsState"]);
const siteState = siteActions.getBrowserSiteActionsState(scope, { conversationId: "conv" }, "https://example.test", "local");
assert.equal(siteState.projectId, "project-1");
assert.equal(siteState.canManage, true);
assert.equal(siteState.isOwnerOnly, true);
assert.equal(siteActions.getBrowserSiteActionsState({ get: () => [] }, { conversationId: "none" }, "https://missing.test", "local"), null);

const extension = await load("browser-extension-status-description");
assert.deepEqual(Object.keys(extension), ["n", "t"]);
assert.equal(extension.t({ status: { isInstalled: false, isLoading: true } }).props.defaultMessage, "Use the browser extension for additional control");
const installed = extension.t({ status: { isInstalled: true, isLoading: false } });
assert.match(installed.props.children[0].props.className, /success/);
assert.equal(installed.props.children[1].props.children.props.defaultMessage, "Browser extension installed");

const settings = await load("browser-settings-visibility");
assert.deepEqual(Object.keys(settings), ["i", "n", "r", "t"]);
const visibility = settings.n({ hostId: "local" });
assert.deepEqual(visibility.history, { enabled: true, isLoading: false });
assert.deepEqual(visibility.extensions, { enabled: true, isLoading: false });
globalThis.__terminalBrowserTest.gates.loading = true;
assert.equal(settings.n({ hostId: "local" }).extensions.isLoading, true);
const dialog = settings.r({ browsingHistory: ["entry"], onClose() {} });
assert.equal(dialog.type, "query-provider");
assert.equal(dialog.props.children.type, "clear-dialog");
await dialog.props.children.props.onCleared(["downloads"]);
assert.deepEqual(globalThis.__terminalBrowserTest.invalidations, [["browser-browsing-history"], ["browser-download-history"]]);
dialog.props.children.props.onError("Failed");
assert.equal(globalThis.__terminalBrowserTest.toast.message, "Failed");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " terminal/browser runtime assertions passed");
