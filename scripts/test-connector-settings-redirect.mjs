import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  account: { accountId: "account-1", userId: "user-1", isLoading: false },
  canonical: { pluginId: "plugin-1", displayName: "Drive" },
  connector: {
    name: "Drive",
    description: "Cloud files",
    logo_url: "light.svg",
    logo_url_dark: "dark.svg",
    distribution_channel: "first_party",
  },
  connectorId: null,
  connectorPending: false,
  initialized: 0,
  location: { key: "route-1", search: "?connector=drive" },
  markedPending: [],
  navigations: [],
  pluginFetching: false,
  pluginLoading: false,
  pluginPending: false,
  refetches: [],
};
const React = { useRef: (current) => ({ current }) };
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
globalThis.window = { location: { origin: "https://chatgpt.com" } };
globalThis.__connectorSettingsRedirect = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__connectorSettingsRedirect;",
    "export const $3=()=>{runtime.state.initialized+=1};export const FX=()=>{};export const QI=()=>{};export const ek=()=>{};export const gL=()=>{};export const wL=()=>{};",
    "export const $O={FIVE_MINUTES:300000};export const SB='remote-marketplace';export const ZI='app-scope';",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;export const LX=()=>({scope:true});",
    "export const _L=options=>{const fallback=options.kind==='connector-metadata';if(fallback)return {data:runtime.state.connector,isPending:runtime.state.connectorPending,isFetching:false,refetch:()=>runtime.state.refetches.push('connector')};return {data:runtime.state.canonical,isPending:runtime.state.pluginPending,isFetching:runtime.state.pluginFetching,refetch:()=>runtime.state.refetches.push('plugin')}};",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__connectorSettingsRedirect;",
    "export const Ir=()=>{};export const M6t=()=>{};export const Qgn=()=>{};export const Ret=()=>{};export const _6t=()=>{};export const k6t=()=>{};export const l1=()=>{};export const s6t=()=>{};",
    "export const Let=props=>({type:'loading',props});export const Ygn=props=>({type:'navigate',props});",
    "export const N6t=()=>runtime.state.account;export const v6t=(connectorId,parameters,origin)=>{const options={connectorId};for(const [key,value] of parameters)if(key!=='connector'&&key!=='add-connector-link')options[key]=value;if(typeof options.redirectAfter==='string')options.redirectAfter=new URL(options.redirectAfter,origin).pathname;return options};export const j6t=()=>({isLoading:runtime.state.pluginLoading});",
    "export const i_n=()=>runtime.state.location;export const l_n=()=>({connectorId:runtime.state.connectorId});",
    "export const o_n=()=>((...args)=>runtime.state.navigations.push(args));",
    "export const c1=input=>'/settings/plugins-settings/'+input.pluginId+'?marketplace='+input.remoteMarketplaceName;",
    "export const X3t=(connectorId,options)=>({kind:'connector-metadata',connectorId,options});",
    "export const Lr=()=>({markAppConnectOAuthPending:event=>runtime.state.markedPending.push(event)});",
  ].join("\n"),
  "app-primary":
    "export const lo=()=>{};export const co=async()=>globalThis.__connectorSettingsRedirect.state.canonical;",
  "app-connect-link-navigation":
    "export const t=()=>{};export const n=options=>options.linkNavigation===true;",
  "app-connect-modal":
    "export const n=()=>{};export const t=props=>({type:'app-connect-modal',props});",
  "app-connect-modal-by-id":
    "export const r=()=>{};export const t=props=>({type:'connector-load-state',props});",
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/connector-settings-redirect/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "connector-settings-redirect-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
assert.deepEqual(Object.keys(module), ["ConnectorSettingsRedirect"]);
assert.equal(state.initialized > 0, true);

function render(props = {}) {
  return module.ConnectorSettingsRedirect(props);
}

state.connectorId = null;
state.location = { key: "route-empty", search: "" };
let view = render();
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/settings/plugins-settings");
assert.equal(view.props.replace, true);

state.location = { key: "route-auth", search: "?connector=drive" };
state.account = { accountId: null, userId: null, isLoading: false };
view = render();
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/settings/plugins-settings");

state.account = { accountId: "account-1", userId: "user-1", isLoading: true };
view = render();
assert.equal(view.type, "loading");
assert.equal(view.props.debugName, "ConnectorSettingsRedirect");

state.account.isLoading = false;
state.canonical = { pluginId: "plugin-1", displayName: "Drive" };
view = render();
assert.equal(view.type, "navigate");
assert.equal(
  view.props.to,
  "/settings/plugins-settings/plugin-1?marketplace=remote-marketplace",
);
assert.equal(view.props.state.pluginDisplayName, "Drive");
assert.equal(view.props.state.pluginDetailDeepLinkMode, "view");
assert.equal(view.props.state.connectorSetup, undefined);

state.canonical = null;
state.connector = {
  name: "Drive",
  description: "Cloud files",
  logo_url: "light.svg",
  logo_url_dark: "dark.svg",
  distribution_channel: "first_party",
};
view = render({ startConnection: true });
assert.equal(view.type, "app-connect-modal");
assert.equal(view.props.allowBrowserFallback, false);
assert.equal(view.props.app.id, "drive");
assert.equal(view.props.app.name, "Drive");
assert.equal(view.props.appConnectOptions.connectorId, "drive");
view.props.onOAuthStarted({ oauthState: "oauth-1" });
assert.deepEqual(state.markedPending.at(-1), {
  oauthState: "oauth-1",
  appConnectOptions: view.props.appConnectOptions,
  returnTo: "/settings/plugins-settings",
});

state.location = {
  key: "route-add",
  search:
    "?connector=slack&add-connector-link=true&productSku=team&redirectAfter=%2Fsettings%2Fplugins-settings",
};
view = render();
assert.equal(view.type, "app-connect-modal");
assert.equal(view.props.app.id, "slack");
assert.equal(view.props.appConnectOptions.productSku, "team");
assert.equal(
  view.props.appConnectOptions.redirectAfter,
  "/settings/plugins-settings",
);

state.connector = null;
view = render({ startConnection: true });
assert.equal(view.type, "connector-load-state");
view.props.onRetry();
assert.equal(state.refetches.at(-1), "connector");

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " connector settings redirect assertions passed");
