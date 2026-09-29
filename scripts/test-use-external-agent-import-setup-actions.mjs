import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(ROOT, "src/renderer/use-external-agent-import-setup-actions/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map((match) => match[1]);
sourceAssert(JSON.stringify(dependencies) === JSON.stringify(["rolldown-runtime","app-shared","app-initial","tabs","app-connect-modal","use-app-connect-flow","hooks-settings-route","first-app-connect-ambient-suggestions","app-card"]), "exact static dependencies");
sourceAssert(!source.includes("import("), "no dynamic imports");
sourceAssert(!/\bany\b/.test(source), "no any");
sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), "no direct namespace member consumption");
for (const expected of ["ImportedSetupSummary as a","ExternalAgentImportSetupDialog as i","useExternalAgentImportSetupActions as n","initializeExternalAgentImportSetupUi as o","ImportedSetupContent as r","initializeExternalAgentImportSetupActions as t"]) sourceAssert(source.includes(expected), "export " + expected);

const state = globalThis.__externalImportSetupTest = { effects: [], invalidations: [], opened: [], navigated: [], tracked: [], logs: [], refreshes: 0, rpcCalls: [], initializers: [], pendingIds: new Set(), completion: null };
const jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const React = {
  useEffect(effect) { state.effects.push(effect); },
  useEffectEvent(callback) { return callback; },
  useRef(value) { return { current: value }; },
  useState(value) { let current = typeof value === "function" ? value() : value; return [current, (next) => { current = typeof next === "function" ? next(current) : next; }]; },
};
const marker = (name) => "() => globalThis.__externalImportSetupTest.initializers.push(" + JSON.stringify(name) + ")";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "export const $3=" + marker("shared") + ";",
    "export const I3=()=>globalThis.__externalImportSetupTest.jsx;",
    "export const e6=()=>globalThis.__externalImportSetupTest.React;",
    "export const LX=()=>({id:'scope'});export const ZI={};",
    "export const CL=()=>({invalidateQueries:o=>globalThis.__externalImportSetupTest.invalidations.push(o)});",
    "export const QI=()=>d=>globalThis.__externalImportSetupTest.navigated.push(d);",
    "export const HX=()=>globalThis.__externalImportSetupTest.completion;",
    "export const BX=()=>({data:[{id:'connected',isAccessible:true,isEnabled:true}]});",
    "export const Q3={error:(...a)=>globalThis.__externalImportSetupTest.logs.push(a)};",
    "export const Y2='FormattedMessage';export const cN={CODEX_PLUGIN_MARKETPLACE_SURFACE_CONNECTOR_SETUP:'setup'};",
    "export const pN={CODEX_PLUGIN_SOURCE_EXTERNAL_AGENT_IMPORT:'external'};",
  ].join("\n"),
  "app-initial": [
    "export const $Zt={};export const MEt={};export const qsn=['mcp-status'];export const ta={route:'import-settings'};",
    "export const U2=()=>({installPlugin:(plugin,options)=>{globalThis.__externalImportSetupTest.install=[plugin,options];return true;},status:null});",
    "export const Ugn=()=>({sendRequest:async(method,payload)=>{globalThis.__externalImportSetupTest.rpcCalls.push([method,payload]);return {authorizationUrl:'https://auth.test/'+payload.name};}});",
    "export const Wv=(...a)=>globalThis.__externalImportSetupTest.navigationRecords=a;",
    "export const kft=t=>globalThis.__externalImportSetupTest.opened.push(t);export const xpn=(...a)=>globalThis.__externalImportSetupTest.tracked.push(a);",
  ].join("\n"),
  "tabs": "export const n=" + marker("tabs") + ";export const t='Tabs';",
  "app-connect-modal": "export const u=" + marker("connect-modal") + ";export const l='ScrollArea';",
  "use-app-connect-flow": "export const t=" + marker("connect-flow") + ";export const n=o=>({clearConnectingApp(){},connectingApp:null,handleAppConnectOAuthStarted(){},handleConnectApp:a=>o.onConnectStarted(a),isAppConnectPending:id=>globalThis.__externalImportSetupTest.pendingIds.has(id)});",
  "hooks-settings-route": "export const r=" + marker("hooks-route") + ";export const t=o=>({route:'hooks',...o});",
  "first-app-connect-ambient-suggestions": "export const t=" + marker("ambient") + ";export const n=async()=>{globalThis.__externalImportSetupTest.refreshes+=1};",
  "app-card": "export const n=" + marker("app-card") + ";export const t='AppCard';",
};
state.jsx = jsx;
state.React = React;
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ contents: mocks[name] ?? "export {};", loader: "js" })); } }] });
const out = path.join("/tmp", "external-import-actions-" + process.pid + ".mjs");
fs.writeFileSync(out, result.outputFiles[0].text);
const module = await import(pathToFileURL(out).href);
fs.unlinkSync(out);
let runtimeAssertions = 0;
const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

runtimeAssert(Object.keys(module).sort(), ["a","i","n","o","r","t"], "exact exports");
runtimeAssert(state.initializers, ["shared","connect-flow","hooks-route","ambient"], "actions initializer order");
module.o();
runtimeAssert(state.initializers, ["shared","connect-flow","hooks-route","ambient","shared","connect-modal","tabs","app-card"], "ui initializer order");

const calls = [];
const actions = module.n({ hostId: "host-1", hasImportedMcpServers: true, hardRefetchAppsList: () => calls.push("refresh-list"), retryImportHistories: () => calls.push("histories"), retryImportedApps: () => calls.push("apps"), retryMcpServerStatuses: () => calls.push("mcps"), onBeforeNavigate: () => calls.push("before") });
actions.handleRetry("apps"); actions.handleRetry("hooks"); actions.handleRetry("mcps");
runtimeAssert(calls.slice(0, 4), ["apps","histories","histories","mcps"], "retry routing");
await actions.handleAuthenticateMcp("github");
await actions.handleAuthenticateMcp("github");
runtimeAssert(state.rpcCalls, [["mcpServer/oauth/login",{name:"github"}]], "MCP auth request deduplicated");
runtimeAssert(state.opened.length, 2, "cached OAuth URL reopens");
runtimeAssert(state.opened[0].openTarget, "external-browser", "external browser target");
actions.handleOpenHooksSettings();
actions.handleOpenImportSettings();
runtimeAssert(state.navigated, [{route:"hooks",hostId:"host-1"},{route:"import-settings"}], "settings navigation");
runtimeAssert(calls.slice(-2), ["before","before"], "before navigate callback");
await actions.handleAppConnected();
runtimeAssert(state.refreshes, 1, "connected apps refresh");
actions.handleConnectApp({id:"slack"});
runtimeAssert(state.tracked.length, 1, "connector setup tracked");
state.pendingIds.add("slack");
runtimeAssert(actions.isAppConnectPending("slack"), true, "connect pending delegated");
actions.handleInstallPlugin({plugin:{id:"plugin-1"}}, {id:"linear"});
runtimeAssert(state.install[1].hostId, "host-1", "plugin host forwarded");
runtimeAssert(state.install[1].marketplaceAnalytics, {source:"external",surface:"setup"}, "plugin analytics forwarded");

const summary = module.a({ appsRequiringConnection:[{id:"a"}], connectedApps:[{id:"b"}], hasImportedHooks:true, importedPlugins:[{app:{id:"c"},plugin:{plugin:{id:"p"}}}], mcpServerNamesRequiringAuthentication:["m"], tabStatus:{apps:"ready",mcps:"ready",hooks:"ready"} });
runtimeAssert(summary.props.values.categories, "apps_mcps_hooks", "dialog category summary");
runtimeAssert(summary.props.values.settingsAvailable, "false", "settings availability");
const onboardingSummary = module.a({ appsRequiringConnection:[], connectedApps:[], hasImportedHooks:true, importedPlugins:[], mcpServerNamesRequiringAuthentication:[], tabStatus:{apps:"ready",mcps:"ready",hooks:"error"}, variant:"onboarding" });
runtimeAssert(onboardingSummary.props.values.categories, "", "onboarding excludes hooks");
const content = module.r({ appsRequiringConnection:[{id:"a"}], connectedApps:[], hasImportedHooks:false, importedPlugins:[], isAppConnectPending:()=>false, mcpServerNamesRequiringAuthentication:[], selectedTab:"hooks", tabStatus:{apps:"ready",mcps:"ready",hooks:"ready"}, onConnectApp(){}, onInstallPlugin(){}, onOpenHooksSettings(){}, onAuthenticateMcp(){}, onRetry(){}, onSelectTab(){} });
runtimeAssert(content.props.children[0].props.selectedKey, "apps", "falls back to visible tab");
const empty = module.r({ appsRequiringConnection:[], connectedApps:[], hasImportedHooks:false, importedPlugins:[], isAppConnectPending:()=>false, mcpServerNamesRequiringAuthentication:[], selectedTab:"apps", tabStatus:{apps:"ready",mcps:"ready",hooks:"ready"}, onConnectApp(){}, onInstallPlugin(){}, onOpenHooksSettings(){}, onAuthenticateMcp(){}, onRetry(){}, onSelectTab(){} });
runtimeAssert(empty, null, "empty content");
const dialog = module.i({ open:true, appsRequiringConnection:[], connectedApps:[], hasImportedHooks:false, importedPlugins:[], isAppConnectPending:()=>false, mcpServerNamesRequiringAuthentication:[], selectedTab:"apps", tabStatus:{apps:"ready",mcps:"ready",hooks:"ready"}, onOpenChange(){}, onConnectApp(){}, onInstallPlugin(){}, onOpenHooksSettings(){}, onAuthenticateMcp(){}, onRetry(){}, onSelectTab(){} });
runtimeAssert(dialog.type, "dialog", "dialog root");
runtimeAssert(state.effects.length >= 2, true, "minimal effects registered");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
