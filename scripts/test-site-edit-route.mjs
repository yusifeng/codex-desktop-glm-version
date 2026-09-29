import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  apiConversation: { gizmo_id: "gizmo-1", is_archived: false, is_read_only: false },
  auth: { accountId: "account-1", userId: "user-1", isLoading: false },
  effectiveLocation: "cloud",
  homeMode: "chat",
  loading: false,
  navigations: [],
  opened: [],
  params: { projectId: "project-1" },
  queryOptions: null,
  resumed: [],
  route: {
    key: "route-1",
    pathname: "/sites/project-1/edit",
    search: "",
    state: {
      from: "sites",
      siteEditLiveUrl: "https://site.example",
      siteEditContext: {
        accountId: "account-1",
        userId: "user-1",
        projectId: "project-1",
        projectTitle: "Example Site",
        latestEditContext: { chatgpt_conversation_id: "chat-1", codex_thread_id: "thread-1" },
      },
    },
  },
  workModeEnabled: true,
};
const scope = {
  get(signal) {
    if (signal === "intl") {
      return { formatMessage(_descriptor, values) { return values.siteMention + " make these changes…"; } };
    }
    return null;
  },
};
globalThis.__siteEditRoute = { scope, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const state=globalThis.__siteEditRoute.state;",
    "export const $3=()=>{};",
    "export const ZI='app-scope';",
    "export const LX=()=>globalThis.__siteEditRoute.scope;",
    "export const HX=signal=>signal==='work-enabled'?state.workModeEnabled:signal==='loading'?state.loading:state.homeMode;",
    "export const BX=()=>({effectiveLocation:state.effectiveLocation});",
    "export const _L=options=>{state.queryOptions=options;return {status:'pending'};};",
    "export const FZ=async()=>{throw new Error('disabled query');};",
    "export const lY=value=>'normalized-'+value;",
    "export const WB=value=>'/local/'+value;",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__siteEditRoute.state;",
    "export const Bet='home-mode';export const Icn='work-enabled';export const Rcn='loading';export const FC='effective-location';export const mpn='intl';",
    "export const N6t=()=>state.auth;export const l_n=()=>state.params;export const i_n=()=>state.route;",
    "export const HWt=({projectId,title})=>'@site['+title+']('+projectId+')';",
    "export const rJt={safeGet:async()=>state.apiConversation};",
    "export const gln=(id,{gizmoId})=>'/chat/'+id+(gizmoId?'/'+gizmoId:'');",
    "export const EOt=async()=>({hostId:'local',manager:{readThread:async()=>({thread:{cwd:'/repo'}})},thread:{cwd:'/repo'}});",
    "export const Ugn=()=>({loadRecentConversationIds:async ids=>ids,resumeConversation:async input=>{state.resumed.push(input);return {status:'ready'};}});",
    "export const Vsn=()=>({kind:'resume'});",
    "export const _pn=(_scope,path,options)=>{state.navigations.push({kind:'route',path,options});return true;};",
    "export const m2=(_scope,options)=>{state.navigations.push({kind:'home',options});};",
    "export const kft=options=>{state.opened.push(options);};",
  ].join("\n"),
  "app-primary": "export const df='local';",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/site-edit-route/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "site-edit-route-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice(8),
        namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({
        contents: mocks[module] ?? "export {};",
        loader: "js",
      }));
    },
  }],
});
const route = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(route), ["SiteEditRoute"]);
assert.equal(route.SiteEditRoute(), null);
assert.equal(state.queryOptions.enabled, true);
assert.equal(state.queryOptions.queryKey[0], "site-edit");
await state.queryOptions.queryFn({ signal: new AbortController().signal });
assert.equal(state.navigations[0].kind, "route");
assert.match(state.navigations[0].path, /^\/chat\/chat-1\/gizmo-1\?/);
assert.match(state.navigations[0].path, /promptSource=codex-app/);
assert.equal(state.navigations[0].options.state.from, "sites");
assert.deepEqual(state.opened[0], { href: "https://site.example", initiator: "sites_library", openTarget: "in-app-browser" });

state.navigations = [];
state.opened = [];
state.apiConversation = { is_archived: true, is_read_only: false };
route.SiteEditRoute();
await state.queryOptions.queryFn({ signal: new AbortController().signal });
assert.equal(state.navigations[0].kind, "home");
assert.equal(state.navigations[0].options.codexAppMode, "chat");
assert.equal(state.opened.length, 1);

state.navigations = [];
state.opened = [];
state.homeMode = "codex";
state.effectiveLocation = "local";
route.SiteEditRoute();
await state.queryOptions.queryFn({ signal: new AbortController().signal });
assert.equal(state.resumed.at(-1).conversationId, "normalized-thread-1");
assert.equal(state.resumed.at(-1).workspaceRoots[0], "/repo");
assert.match(state.navigations[0].path, /^\/local\/normalized-thread-1\?hostId=local$/);

state.auth = { accountId: null, userId: null, isLoading: true };
route.SiteEditRoute();
assert.equal(state.queryOptions.enabled, false);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " site edit route assertions passed");
