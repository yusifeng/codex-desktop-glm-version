import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = {
  apiCalls: [],
  auth: { accountId: "account-1", authMethod: "chatgpt", userId: "user-1" },
  codeReviewQuery: { data: { data: [{ n_comments: 2, n_reactions: 0, n_reviews: 1 }] }, isError: false, isLoading: false },
  gates: new Map([
    ["1748121887", false], ["4027330399", true], ["1014047933", false],
    ["1709920343", true], ["393259752", true], ["998088620", false],
  ]),
  plan: { isUsageSettingsAccessLoading: false, isUsageSettingsVisible: true, plan: "plus" },
  profile: { isProfileVisible: true, isProfileVisibilityLoading: false },
  signals: new Map([
    ["account-state", { accountId: "account-1", status: "allowed", userId: "user-1" }],
    ["chatgpt", true], ["codex", true],
    ["usage-query", { data: { credits: { balance: 5 } } }],
  ]),
  trustedQuery: { data: true, isError: false, isLoading: false, isPending: false },
};
globalThis.__settingsRuntimeContracts = state;

const sharedMock = `
export const $O={ONE_MINUTE:60000,THIRTY_SECONDS:30000};
export const pL=value=>value;
export const vW="X-OpenAI-Expected-Account-Id";
export const wL=()=>{};
export const HX=signal=>globalThis.__settingsRuntimeContracts.signals.get(signal);
export const BX=(_signal,input)=>({isCapable:input.name==="chatgpt.cme",isLoading:false});
export const Ew=()=>globalThis.__settingsRuntimeContracts.profile;
export const _L=options=>options.queryKey?.includes("enabled")?globalThis.__settingsRuntimeContracts.trustedQuery:options.queryKey?.includes("code-review")?globalThis.__settingsRuntimeContracts.codeReviewQuery:{};
`;
const initialMock = `
export const NT=["usage","analytics","consumer-view","usage-code-review","profile","trusted-contact"].map(slug=>({label:slug,slug}));
export const MT="usage",ugn="local",LS="codex",gmn="codex",Sht="codex",htt="chatgpt",Xet="capability",bL="account-state",f0t="usage-query";
export const Wgn=()=>true;
export const N6t=()=>globalThis.__settingsRuntimeContracts.auth;
export const dS=()=>globalThis.__settingsRuntimeContracts.plan;
export const Bln=plan=>plan==="business"||plan==="enterprise";
export const Hln=plan=>plan==="business"||plan==="enterprise";
export const vS=plan=>plan==="enterprise";
export const Pdn={FREE:"free",GO:"go",ENT26:"ent26"};
export const ofn=id=>globalThis.__settingsRuntimeContracts.gates.get(id)??false;
export const cJt=()=>{},M6t=()=>{};
export const udn={safeGet:(path,options)=>{globalThis.__settingsRuntimeContracts.apiCalls.push({method:"GET",path,options});return Promise.resolve({data:[]})},safePost:(path,options)=>{globalThis.__settingsRuntimeContracts.apiCalls.push({method:"POST",path,options});return Promise.resolve({})}};
export const rJt=udn;
`;
const moduleMocks = {
  "app-shared": sharedMock,
  "app-initial": initialMock,
  "command-menu-client": `export const i=(userId,accountId)=>({enabled:{queryKey:["trusted-contact",userId,accountId,"enabled"]}});export const r=()=>{};`,
  "command-menu-queries": `export const n=options=>({queryKey:["usage-settings","usage-billing","code-review"],...options});export const t=()=>{};`,
  "import-settings-gate": `export const n=()=>{};export const t="3278809559";`,
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "settings-runtime-contract-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: moduleMocks[importPath] ?? "export {};", loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

const visibleSettingsReleaseAssertions = assertReleaseOwner("use-visible-settings-sections");

const client = await bundle("command-menu-client");
const trusted = client.i("user-7", "account-9");
assert.deepEqual(trusted.enabled.queryKey, ["trusted-contact", "user-7", "account-9", "enabled"]);
await trusted.enabled.queryFn({ signal: undefined });
assert.equal(state.apiCalls.at(-1).path, "/trusted_contact/enabled");
assert.equal(state.apiCalls.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-9");
assert.equal(state.apiCalls.at(-1).options.additionalHeaders["X-OpenAI-Expected-Account-Id"], "account-9");

const queries = await bundle("command-menu-queries");
const codeReview = queries.n({ auth: state.auth, days: 30, enabled: true, isPolling: false, scope: "consumer" });
assert.equal(codeReview.enabled, true);
assert.equal(codeReview.refetchInterval, false);
assert.equal(typeof codeReview.queryFn, "function");
await codeReview.queryFn();
assert.equal(state.apiCalls.at(-1).path, "/wham/analytics/daily-code-review-metrics");
assert.equal(state.apiCalls.at(-1).options.parameters.query.group_by, "day");
assert.equal(state.apiCalls.at(-1).options.parameters.query.workspace_user, true);

console.log(`8 settings runtime/query contract assertions and ${visibleSettingsReleaseAssertions} visible settings release assertions passed`);
