import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = [];
let hookIndex = 0;
const effects = [];
const state = {
  accountId: "acct-1", calls: [], content: { content_state: "empty", widgets: [] }, entitlement: { finances: true }, initialized: 0,
  links: [], navigations: [], plaidInitialized: 0, routeTab: undefined,
  chats: { data: { pages: [{ items: [] }] }, hasNextPage: false, isLoading: false, isError: false },
};
const React = {
  useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; },
  useEffect(effect) { effects.push(effect); },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
globalThis.__personalFinance = { React, jsx, state };

const staticDependencies = [
  "rolldown-runtime", "app-shared", "index-ymUnTRBB", "dist-e0bb3d63cc62", "app-initial", "app-primary", "tabs",
  "app-connect-modal", "use-chatgpt-composer-controller", "conversation", "plaid-link",
];
const dynamicDependencies = ["chatgpt-entity-side-panel-tab", "transactions", "accounts-valdi"];
const mocks = Object.fromEntries([...staticDependencies, ...dynamicDependencies].map((name) => [name, "export {};\n"]));
mocks["app-shared"] = [
  "const runtime=globalThis.__personalFinance;export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;export const ZI='scope';export const LX=()=>({name:'scope'});",
  "export const BX=(descriptor)=>{const s=runtime.state;if(descriptor==='entitlement')return {data:s.entitlement,isLoading:s.entitlementLoading};if(descriptor==='links')return {data:{links:s.links},isLoading:s.linksLoading,isFetching:false,isError:s.linksError,refetch:()=>s.calls.push('refetch-links')};if(descriptor==='content')return {data:s.content,isLoading:s.contentLoading,isFetching:false,isError:s.contentError,refetch:()=>s.calls.push('refetch-content')};return {...s.chats,fetchNextPage:()=>s.calls.push('next-page'),refetch:()=>s.calls.push('refetch-chats')}};",
].join("\n");
mocks["app-initial"] = [
  "const runtime=globalThis.__personalFinance;export const HW='entitlement';export const LW='links';export const BW='content';export const MW='chats';export const Pzt='/finances';",
  "export const N6t=()=>({accountId:runtime.state.accountId});export const Ygn=props=>({type:'navigate',props});export const a_n=()=>runtime.state.routeTab==null?null:{params:{tab:runtime.state.routeTab}};export const o_n=()=> (path,options)=>runtime.state.navigations.push({path,options});",
].join("\n");
mocks["plaid-link"] = "const runtime=globalThis.__personalFinance;export const n=()=>{runtime.state.plaidInitialized+=1};export const r=async(_scope,options)=>{runtime.state.calls.push({type:'plaid',options});return true};";
mocks["accounts-valdi"] = "export const PersonalFinanceAccountsValdi=props=>({type:'accounts-panel',props});";
mocks.transactions = "export const PersonalFinanceTransactions=props=>({type:'transactions-panel',props});";
mocks["chatgpt-entity-side-panel-tab"] = "export const ChatGptEntitySidePanelTab=props=>({type:'entity-panel',props});";

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/personal-finance-page/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, metafile: true, logLevel: "silent",
  plugins: [{ name: "personal-finance-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath, kind }) => ({ path: importPath.slice(8), namespace: kind === "dynamic-import" ? "dynamic-mock" : "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
    build.onLoad({ filter: /.*/, namespace: "dynamic-mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module), ["PersonalFinancePage"]);
assert.equal(state.initialized, 1);
assert.equal(state.plaidInitialized, 1);
const source = fs.readFileSync(path.join(ROOT, "src/renderer/personal-finance-page/index.ts"), "utf8");
const staticFound = [...new Set([...source.matchAll(/(?:from\s+|import\s+)["']@rchunk\/([^"']+)["']/g)].map((match) => match[1]))];
const dynamicFound = [...source.matchAll(/import\(["']@rchunk\/([^"']+)["']\)/g)].map((match) => match[1]);
assert.deepEqual(staticFound, staticDependencies);
assert.deepEqual(dynamicFound.sort(), [...dynamicDependencies].sort());

function render(clear = false) { hookIndex = 0; effects.length = 0; if (clear) hooks.length = 0; const view = module.PersonalFinancePage(); const pending = effects.splice(0).map((effect) => effect()).filter((value) => value instanceof Promise); return { view, pending }; }
async function settle() { for (let index = 0; index < 8; index += 1) await Promise.resolve(); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" "); return text(value.props?.children); }
function find(view, predicate) { return walk(view).find(predicate); }
function button(view, label) { return find(view, (node) => node.type === "button" && text(node) === label); }

state.entitlementLoading = true;
let view = render(true).view;
assert.equal(find(view, (node) => node.props?.role === "status") != null, true);
state.entitlementLoading = false; state.entitlement.finances = false;
view = render(true).view;
assert.equal(view.type, "navigate");
assert.equal(view.props.to, "/");
assert.equal(view.props.replace, true);
state.entitlement.finances = true; state.linksLoading = true;
view = render(true).view;
assert.equal(text(view).includes("Loading your finances"), true);
state.linksLoading = false; state.linksError = true;
view = render(true).view;
assert.equal(text(view).includes("couldn’t be loaded"), true);
button(view, "Try again").props.onClick();
assert.deepEqual(state.calls.slice(-2), ["refetch-links", "refetch-content"]);
state.linksError = false;

view = render(true).view;
assert.equal(text(view).includes("A new way to manage your finances"), true);
assert.equal(text(view).includes("licensed investment adviser"), true);
button(view, "Connect Finances").props.onClick(); await settle();
assert.equal(state.calls.at(-1).type, "plaid");
assert.equal(state.calls.at(-1).options.accountId, "acct-1");

state.links = [{ id: "link-1", institution_name: "Neighborhood Bank" }];
state.content = { content_state: "linked_accounts", widgets: [{ id: "balance", title: "Net balance", value: "$12,345", can_hide: true }] };
view = render(true).view;
assert.equal(text(view).includes("••••"), true);
button(view, "Show values").props.onClick(); view = render().view;
assert.equal(text(view).includes("$12,345"), true);
button(view, "Hide widget").props.onClick(); view = render().view;
assert.equal(text(view).includes("Your dashboard is ready"), true);
button(view, "Manage institutions").props.onClick(); view = render().view;
assert.equal(text(view).includes("Neighborhood Bank"), true);
button(view, "Reconnect").props.onClick(); await settle();
assert.equal(state.calls.at(-1).options.linkId, "link-1");
button(view, "View financial memories").props.onClick(); view = render().view;
assert.equal(text(view).includes("Review information ChatGPT remembers"), true);

button(view, "Chats").props.onClick();
assert.deepEqual(state.navigations.at(-1), { path: "/finances/chats", options: { replace: true } });
state.routeTab = "chats"; state.chats = { data: { pages: [{ items: [] }] }, hasNextPage: false, isLoading: false, isError: false };
view = render(true).view;
assert.equal(text(view).includes("No finance conversations yet"), true);
state.chats = { data: { pages: [{ items: [{ id: "c1", title: null, snippet: "Budget review", update_time: "2026-09-29" }] }] }, hasNextPage: true, isLoading: false, isError: false };
view = render(true).view;
assert.equal(text(view).includes("Finance conversation"), true);
assert.equal(text(view).includes("Budget review"), true);
button(view, "Load more").props.onClick();
assert.equal(state.calls.at(-1), "next-page");
state.chats = { data: undefined, hasNextPage: false, isLoading: false, isError: true };
view = render(true).view; button(view, "Try again").props.onClick();
assert.equal(state.calls.at(-1), "refetch-chats");

state.routeTab = "accounts"; view = render(true).view; await settle(); view = render().view;
assert.equal(find(view, (node) => node.type === "accounts-panel") != null, true);
assert.equal(find(view, (node) => node.type === "accounts-panel").props.accountId, "acct-1");
state.routeTab = "transactions"; view = render(true).view; await settle(); view = render().view;
assert.equal(find(view, (node) => node.type === "transactions-panel") != null, true);
assert.equal(find(view, (node) => node.type === "transactions-panel").props.isActive, true);
state.routeTab = "dashboard"; view = render().view;
assert.equal(find(view, (node) => node.type === "transactions-panel").props.isActive, false);
assert.equal(find(view, (node) => node.type === "section" && node.props.hidden === true) != null, true);

hooks.length = 0; state.routeTab = "dashboard"; view = render().view;
button(view, "View details").props.onClick(); view = render().view; await settle(); view = render().view;
const entity = find(view, (node) => node.type === "entity-panel");
assert.equal(entity != null, true);
assert.equal(entity.props.params.widgetId, "balance");
assert.equal(entity.props.params.sensitive_values_hidden, true);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " personal finance page assertions passed");
