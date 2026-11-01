import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__appConnectModalContract = {
  apiCalls: [],
  effects: [],
  initialized: [],
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
  react: {
    useLayoutEffect(effect) { state.effects.push(effect); },
    useRef(value) { return { current: value }; },
    useState(initial) {
      let value = typeof initial === "function" ? initial() : initial;
      return [value, next => { value = typeof next === "function" ? next(value) : next; }];
    },
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-connect-modal/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "app-connect-modal-contract-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice(8),
        namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
        contents: moduleName === "app-shared"
          ? `export const I3=()=>globalThis.__appConnectModalContract.jsx;
             export const e6=globalThis.__appConnectModalContract.react;`
          : moduleName === "app-initial"
            ? `export const cJt=()=>globalThis.__appConnectModalContract.initialized.push("api");
               export const rJt={safePost:async(path,options)=>{globalThis.__appConnectModalContract.apiCalls.push({path,options});return globalThis.__appConnectModalContract.nextPostResult;}};`
            : "export {};",
        loader: "js",
      }));
    },
  }],
});
const modal = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

assert.deepEqual(Object.keys(modal).sort(), ["a", "c", "d", "f", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);

const GOOGLE = {
  gmail: "connector_2128aebfecb84f64a069897515042a44",
  calendar: "connector_947e0d954944416db111db556030eea6",
  contacts: "connector_c0f748249d6a42aea4b00fd375570ded",
  drive: "connector_5f3c8c41a1e54ad7a76272c89e2554fa",
};
const MICROSOFT = {
  email: "connector_4aaab2856305417b993eca9a216aaf6e",
  calendar: "connector_e6a7394682e24467ac68c60696f275a4",
  sharepoint: "connector_1e4f6a44acf14e3ca1d96672f8c945bc",
  teams: "connector_246af0940da3457da0e751171dc1ce60",
};
const enabledGates = new Set(["enable-bundled-apps-google", "enable-bundled-apps-msft"]);
const statsigClient = { checkGate: gate => enabledGates.has(gate) };

const microsoftConnector = { id: "email", status: "READY" };
assert.deepEqual(modal.a({
  availableAppIds: new Set([MICROSOFT.email]),
  companionConnectorIds: [MICROSOFT.email],
  companionConnectors: [microsoftConnector],
  companionLinks: [null],
}), [{ connector: microsoftConnector, definition: { connectorId: MICROSOFT.email, kind: "outlook-email" } }]);
assert.deepEqual(modal.a({
  availableAppIds: new Set([MICROSOFT.email]),
  companionConnectorIds: [MICROSOFT.email],
  companionConnectors: [{ status: "DISABLED_BY_ADMIN" }],
  companionLinks: [null],
}), []);
assert.deepEqual(modal.a({
  availableAppIds: new Set([MICROSOFT.email]),
  companionConnectorIds: [MICROSOFT.email],
  companionConnectors: [microsoftConnector],
  companionLinks: [{ id: "linked" }],
}), []);
assert.equal(modal.c({ connectorId: MICROSOFT.email, statsigClient }), true);
assert.equal(modal.c({ connectorId: GOOGLE.gmail, statsigClient }), false);

const customGoogle = [{ connectorId: GOOGLE.drive, kind: "google-drive", custom: true }];
assert.deepEqual(modal.d({
  availableAppIds: new Set([GOOGLE.drive]),
  companionConnectorIds: [GOOGLE.drive],
  companionConnectors: [{ id: "drive", status: "READY" }],
  companionLinks: [null],
  connectors: customGoogle,
})[0].definition, customGoogle[0]);
assert.deepEqual(modal.f({ connectorId: GOOGLE.gmail, statsigClient }).map(item => item.kind), ["gmail", "google-calendar", "google-contacts"]);
enabledGates.add("include-gdrive-in-google-bundle");
assert.deepEqual(modal.f({ connectorId: GOOGLE.gmail, statsigClient }).map(item => item.kind), ["gmail", "google-calendar", "google-contacts", "google-drive"]);
assert.deepEqual(modal.f({ connectorId: "unknown", statsigClient }), []);
assert.deepEqual(modal.m(GOOGLE.drive, customGoogle), customGoogle[0]);
assert.equal(modal.m("missing", customGoogle), undefined);
assert.deepEqual(modal.o(MICROSOFT.email), [MICROSOFT.calendar, MICROSOFT.sharepoint, MICROSOFT.teams]);
assert.deepEqual(modal.p(GOOGLE.drive, customGoogle), []);

let launched = null;
let beforeLaunch = 0;
const scope = {
  get(key) { assert.equal(key, "accountId"); return "account-1"; },
  launchConnectorPostConnect(input) { launched = input; return true; },
};
assert.equal(await modal.i({ scope, accountId: "account-2", connectorId: GOOGLE.drive }), false);
assert.equal(await modal.i({ scope, accountId: "account-1", connectorId: GOOGLE.drive, source: "plugin_install", onBeforeLaunch() { beforeLaunch += 1; } }), true);
assert.equal(beforeLaunch, 1);
assert.deepEqual(launched, { accountId: "account-1", connectorId: GOOGLE.drive, source: "plugin_install" });

const listeners = new Map();
const makeElement = values => ({
  clientHeight: 100,
  dataset: {},
  scrollHeight: 300,
  scrollTop: 0,
  addEventListener(type, listener, options) { listeners.set(type, { listener, options }); },
  removeEventListener(type) { listeners.delete(type); },
  ...values,
});
const observed = [];
globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; }
  disconnect() { observed.push("disconnect"); }
  observe(element) { observed.push(element); }
};
const externalRef = { current: null };
const overflow = modal.l({ children: "rows", scrollProps: { ref: externalRef }, fade: "overlay" });
const root = makeElement({});
const scroller = makeElement({ scrollTop: 20 });
const content = makeElement({ scrollHeight: 400 });
overflow.props.ref.current = root;
const scrollNode = overflow.props.children[0];
scrollNode.props.ref(scroller);
scrollNode.props.children.props.ref.current = content;
const cleanup = state.effects.at(-1)();
assert.equal(externalRef.current, scroller);
assert.deepEqual(root.dataset, { hasOverflow: "true", canScrollUp: "true", canScrollDown: "true" });
assert.deepEqual(listeners.get("scroll").options, { passive: true });
scroller.scrollTop = 200;
listeners.get("scroll").listener();
assert.equal(root.dataset.canScrollDown, "false");
cleanup();
assert.equal(listeners.has("scroll"), false);
assert.equal(observed.at(-1), "disconnect");

const walk = rootNode => {
  const output = [];
  const visit = value => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(rootNode);
  return output;
};
const button = (tree, label) => walk(tree).find(node => node.type === "button" && node.props.children === label);
let connected = 0;
let oauthEvent = null;
let closed = 0;
state.nextPostResult = { oauth_url: "https://example.com/oauth" };
const tree = modal.t({
  app: { id: GOOGLE.drive, name: "Drive", description: "Use [Drive](https://drive.google.com) files" },
  closeOnOAuthStarted: true,
  onConnected() { connected += 1; },
  onOAuthStarted(event) { oauthEvent = event; },
  onOpenChange(open) { if (!open) closed += 1; },
});
assert.equal(walk(tree).find(node => node.type === "p").props.children, "Use Drive files");
await button(tree, "Connect").props.onClick();
assert.equal(state.apiCalls.at(-1).options.parameters.path.connector_id, GOOGLE.drive);
assert.deepEqual(oauthEvent, {
  app: { id: GOOGLE.drive, name: "Drive" },
  isGithubConnector: false,
  redirectUrl: "https://example.com/oauth",
  requestedCompanionConnectorIds: undefined,
});
assert.equal(connected, 0);
assert.equal(closed, 1);

state.nextPostResult = { kind: "connected-directly", linkId: "link-1" };
const directTree = modal.t({
  app: { id: GOOGLE.drive, name: "Drive" },
  onConnected(linkId) { assert.equal(linkId, "link-1"); connected += 1; },
  onOpenChange() {},
  waitForConnectedHandler: true,
});
await button(directTree, "Connect").props.onClick();
assert.equal(connected, 1);

let failure = null;
const failedTree = modal.t({
  app: { id: "broken", name: "Broken" },
  closeOnFailedConnect: true,
  connectApp: async () => { throw new Error("failed"); },
  onConnectFailed(reason) { failure = reason; },
  onOpenChange(open) { if (!open) closed += 1; },
});
await button(failedTree, "Connect").props.onClick();
assert.equal(failure, "request_failed");
assert.equal(closed, 2);

modal.n();
assert.deepEqual(state.initialized, ["api"]);
console.log("38 app connect modal contract assertions passed");
