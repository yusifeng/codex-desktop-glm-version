import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return { type, props: props ?? {}, key }; },
};
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function render(value) {
  return value != null && typeof value === "object" && typeof value.type === "function"
    ? render(value.type(value.props ?? {}))
    : value;
}
function walk(value, output = []) {
  value = render(value);
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function text(value) {
  value = render(value);
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join(" " );
  return text(value.props?.children);
}
function find(value, predicate) { return walk(value).find(predicate); }
function createHooks() {
  const values = []; const effects = []; let index = 0;
  return {
    React: {
      useEffect(effect) { effects.push(effect); },
      useRef(value) { const current = index++; if (!(current in values)) values[current] = { current: value }; return values[current]; },
      useState(initial) { const current = index++; if (!(current in values)) values[current] = typeof initial === "function" ? initial() : initial; return [values[current], (next) => { values[current] = typeof next === "function" ? next(values[current]) : next; }]; },
    },
    reset() { index = 0; effects.length = 0; },
    runEffects() { return effects.splice(0).map((effect) => effect()); },
  };
}
async function settle() { for (let index = 0; index < 12; index += 1) await Promise.resolve(); }
async function buildModule(directory, mocks, globalName, state) {
  globalThis[globalName] = state;
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "mock-renderer-chunks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ loader: "js", contents: mocks[name] ?? "export {};" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}
function assertSource(directory, dependencies, dynamic = []) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  const staticDependencies = [...new Set([...source.matchAll(/from \"@rchunk\/([^\"]+)\"/g)].map((match) => match[1]))];
  const dynamicDependencies = [...new Set([...source.matchAll(/import\(\"@rchunk\/([^\"]+)\"\)/g)].map((match) => match[1]))];
  assert.deepEqual(staticDependencies, dependencies); assertions += 1;
  assert.deepEqual(dynamicDependencies, dynamic); assertions += 1;
  check(!source.includes(":" + " any") && !source.includes(" as" + " any"), `${directory} does not introduce any`);
  check(!/\b(?:runtimeChunk|appSharedChunk|appInitialChunk|appPrimaryChunk|widgetQueriesChunk|conversationChunk|appgenAccessChunk|disabledTooltipChunk|startConversationChunk|automationsStateChunk|titleVisibilityChunk|accessMessagesChunk|shareDialogChunk|thumbnailChunk|fixedSurfaceChunk|secretRowChunk|rowChunk|changeMessagesChunk|configurationFieldsChunk|gridChunk|agentMenuChunk|suggestionsChunk|emptyStateChunk|surfaceChunk|cardChunk|detailPageChunk|detailStateChunk|detailQueryChunk|readErrorChunk)\.[A-Za-z_$]/.test(source), `${directory} does not consume namespace members directly`);
}

// Account detail
{
  const state = { accountId: "acct-1", invalidated: [], queryError: false };
  const hooks = createHooks();
  const init = "export const $3=()=>{},FX=()=>{},K2=()=>{};";
  const module = await buildModule("personal-finance-account-detail", {
    "rolldown-runtime": "export {};",
    "app-shared": `${init} export const I3=()=>globalThis.__account.jsx,e6=()=>globalThis.__account.React,Qh="Spinner",Y2="Message",Yh="Button",LX=()=>({queryClient:{invalidateQueries:async input=>globalThis.__account.state.invalidated.push(input)}}); export const BX=(query,param)=>query==="widget"?globalThis.__account.state.queryError?{isError:true,refetch(){globalThis.__account.state.retried=true}}:{data:{appId:"ledger",request:{}},isError:false,refetch(){}}:{data:false,isError:false,refetch(){}};`,
    "app-initial": `export const FH=()=>({handleRequest:async request=>request}),Izt={},M6t=()=>{},N6t=()=>({accountId:globalThis.__account.state.accountId}),PH="WidgetHost",Qgn=()=>{},gln=value=>value.id??null,itn=()=>{},jzt="ledger-id",lq="sensitivity",o_n=()=>()=>{},oqt=()=>{},rqt=()=>"conv-1",ugn="ledger-host";`,
    "chatgpt-ecosystem-widget-queries": `export const n=()=>{},t="widget";`,
    conversation: `export const n=()=>{},t=async input=>input.onConversationStarted({id:"conv-2"});`,
  }, "__account", { state, React: hooks.React, jsx });
  assert.deepEqual(Object.keys(module), ["PersonalFinanceAccountDetail"]); assertions += 1;
  let view = render(module.PersonalFinanceAccountDetail({ accountId: "acct-1", accountSelection: "cash", onClose() {} }));
  check(view.type === "WidgetHost" && view.props.result.request.viewParams.route === "account_detail", "account detail renders the lazy host boundary");
  state.accountId = "acct-2"; view = module.PersonalFinanceAccountDetail({ accountId: "acct-1", accountSelection: "cash", onClose() {} });
  check(find(view, (node) => node.type === "Message")?.props.defaultMessage === "This account is no longer selected", "account detail rejects stale account selection");
  assertSource("personal-finance-account-detail", ["rolldown-runtime", "app-shared", "app-initial", "chatgpt-ecosystem-widget-queries", "conversation"]);
}

// Sites page
{
  const state = { requests: [], items: [{ id: "site-1", title: "Team dashboard", slug: "team-dashboard", description: "Metrics", current_user_role: "owner", access_policy: { access_mode: "custom" } }], starts: [] };
  const hooks = createHooks();
  const module = await buildModule("appgen-page", {
    "rolldown-runtime": "export {};",
    "app-shared": `export const $3=()=>{},FX=()=>{},K2=()=>{},I3=()=>globalThis.__sites.jsx,e6=()=>globalThis.__sites.React,Qh="Spinner",Y2="Message",Yh="Button",n4=()=>({formatMessage:m=>m.defaultMessage});`,
    "app-initial": `export const Qgn=()=>{},fdn=()=>{},lnn=()=>{},o_n=()=>path=>globalThis.__sites.state.navigated=path,_dn={safeGet:async path=>{globalThis.__sites.state.requests.push(path);return {items:globalThis.__sites.state.items}}};`,
    "app-primary": "export {};",
    "appgen-access": `export const r=()=>({accessMode:"custom",groupCount:0,userCount:0}),s=()=>{};`,
    "appgen-disabled-tooltip": `export const n=()=>{},t="DisabledTooltip";`,
    "start-appgen-conversation": `export const n=(scope,launcher,request)=>globalThis.__sites.state.starts.push(request),t=()=>{};`,
    "appgen-automations-state": `export const r=()=>{};`,
    "use-searchable-page-title-visibility": `export const n=()=>({scrollContainerRef(){},showTitleInToolbar:true,titleRef(){}}),t=()=>{};`,
    "appgen-access-state-messages": `export const n=()=>{},t="AccessState";`,
    "open-appgen-share-dialog": `export const n=()=>{},t=()=>{};`,
    "sites-default-thumbnail": `export const n=()=>{},t="Thumbnail";`,
  }, "__sites", { state, React: hooks.React, jsx });
  hooks.reset(); let view = module.AppgenPage(); hooks.runEffects(); await settle(); hooks.reset(); view = module.AppgenPage();
  check(text(view).includes("Team dashboard"), "sites page loads owned sites");
  find(view, (node) => node.type === "Button" && text(node) === "Create").props.onClick();
  check(state.starts.at(-1).type === "create", "sites page starts site creation");
  find(view, (node) => node.type === "button" && text(node) === "Team dashboard").props.onClick();
  check(state.starts.at(-1).type === "edit" && state.starts.at(-1).projectId === "site-1", "sites page starts site editing");
  assertSource("appgen-page", ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "appgen-access", "appgen-disabled-tooltip", "start-appgen-conversation", "appgen-automations-state", "use-searchable-page-title-visibility", "appgen-access-state-messages", "open-appgen-share-dialog", "sites-default-thumbnail"]);
}

// Environment review entry
{
  const hooks = createHooks();
  const state = { revision: "rev-1", cleared: 0, accepted: [] };
  const module = await buildModule("environment-setup-review-entry", {
    "rolldown-runtime": "export {};",
    "app-shared": `export const $3=()=>{},K2=()=>{},I3=()=>globalThis.__environment.jsx,e6=()=>globalThis.__environment.React,Y2="Message",ZI={},LX=()=>({get:()=>globalThis.__environment.state.revision,set:(signal,value)=>globalThis.__environment.state.accepted.push(value)});export const BX=(query,param)=>query==="draft"?{data:{draft:{id:"draft-1",revision:"rev-1"}},refetch:async()=>({isError:false})}:query==="sections"?{data:["network","name"],refetch:async()=>({})}:query==="pending"?{data:["network"],refetch:async()=>({})}:query==="save"?{isPending:false,refetch:async()=>({})}:{data:{section:param.section},refetch:async()=>({})};`,
    "app-initial": `export const Gm="sections",Hm="pending",Qm="accepted",Vm="revision",Xm=()=>{globalThis.__environment.state.cleared+=1},Ypt="draft",Zpt="save",dmt="section-draft",emt="section-error",ifn=()=>{};`,
    "app-primary": "export {};", "above-composer-fixed-content-surface": `export const n=()=>{},t="FixedSurface";`, "secret-row": "export {};", "environment-variable-row": "export {};", "change-messages": "export {};", "configuration-fields": "export {};",
  }, "__environment", { state, React: hooks.React, jsx });
  hooks.reset(); let view = module.EnvironmentSetupReviewEntry({ conversationId: "conv-1" });
  check(find(view, (node) => node.type === "Message")?.props.defaultMessage === "Needs attention (1)", "environment entry shows pending count");
  await find(view, (node) => node.type === "button").props.onClick(); hooks.reset(); view = module.EnvironmentSetupReviewEntry({ conversationId: "conv-1" });
  check(find(view, (node) => node.props?.role === "dialog") != null && state.cleared === 1, "environment entry refreshes and opens review");
  assertSource("environment-setup-review-entry", ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "above-composer-fixed-content-surface", "secret-row", "environment-variable-row", "change-messages", "configuration-fields"]);
}

// Workspace agents index
{
  const hooks = createHooks();
  const state = { requests: [], navigated: [] };
  const module = await buildModule("workspace-agents-page", {
    "rolldown-runtime": "export {};",
    "app-shared": `export const $3=()=>{},K2=()=>{},I3=()=>globalThis.__agents.jsx,e6=()=>globalThis.__agents.React,Y2="Message",Yh="Button",n4=()=>({formatMessage:m=>m.defaultMessage}),HX=signal=>signal==="account"?"acct-1":true;`,
    "app-initial": `export const Bw="build",mun="account",Qgn=()=>{},stn=()=>{},utn=()=>{},o_n=()=> (path,options)=>globalThis.__agents.state.navigated.push({path,options}),rJt={safeGet:async path=>{globalThis.__agents.state.requests.push(path);return {items:[{id:"agent-1",name:"Finance helper",tagline:"Weekly reports",latest_published_version_id:"v1"}]}}};`,
    "app-primary": "export {};", "skills-page-grid": `export const n="GridContent",r=()=>{},t="Grid";`, "agent-menu": `export const n=()=>{},t="AgentMenu";`,
  }, "__agents", { state, React: hooks.React, jsx });
  hooks.reset(); let view = module.WorkspaceAgentsPage(); hooks.runEffects(); await settle(); hooks.reset(); view = module.WorkspaceAgentsPage();
  check(text(view).includes("Finance helper") && text(view).includes("Weekly reports"), "agents index loads cards");
  find(view, (node) => node.type === "Button" && text(node) === "Create").props.onClick();
  check(state.navigated.at(-1).path === "/agents/new/edit", "agents index opens the native editor");
  assertSource("workspace-agents-page", ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "skills-page-grid", "agent-menu"]);
}

assertions += assertReleaseOwner("workspace-agent-landing");

// The two Valdi assets must stay byte-for-byte release artifacts.
for (const [file, markers] of [
  ["accounts-valdi-2c11bfad7ebf.ts", ["globalThis.__valdiPreloadedStrings", "CompilerIntrinsics", "LocaleResolver", "experiment-service"]],
  ["transactions-25a7e8fb0b81.ts", ["globalThis.__valdiPreloadedStrings", "CompilerIntrinsics", "experiment-service", "getValdiRuntime"]],
]) {
  const source = fs.readFileSync(path.join(ROOT, "src/webview/assets", file), "utf8");
  for (const marker of markers) check(source.includes(marker), `${file} retains generated Valdi marker ${marker}`);
}

console.log(`${assertions} Valdi pages/accounts assertions passed`);
