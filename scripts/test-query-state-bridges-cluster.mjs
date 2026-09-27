import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resetState() {
  globalThis.__queryStateTest = {
    derived: [],
    families: [],
    infiniteFamilies: [],
    mutations: [],
    opens: [],
    persisted: [],
    queries: [],
    safeDelete: [],
    safeGet: [],
    safePatch: [],
    safePost: [],
    featureValues: { purchase_flow_enabled: true, desktop_beacon_enabled: true },
    auth: { authMethod: "chatgpt", hasChatGptToken: true, isLoading: false },
    account: { data: { id: "acct", plan_type: "plus" }, isLoading: false },
    queryResult: { data: { eligible: true }, isLoading: false },
  };
  return globalThis.__queryStateTest;
}

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
      name: "query-state-bridge-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => {
          if (value === "app-shared") return { contents: `
            const state=globalThis.__queryStateTest;
            export const $O={FIVE_SECONDS:5000,FIVE_MINUTES:300000,ONE_MINUTE:60000,THIRTY_SECONDS:30000};
            export const FX=()=>{}; export const QI=()=>{}; export const ek=()=>{}; export const jZ=()=>{}; export const lk=()=>{};
            export const ZI={}; export const FZ=()=>Promise.reject(new Error("missing"));
            export const pL=(value)=>value; export const uL=(value)=>value;
            export const QX=(_scope,factory)=>{state.families.push(factory);return {factory}};
            export const eZ=(_scope,factory)=>{state.queries.push(factory);return {factory}};
            export const XX=(_scope,factory)=>{state.infiniteFamilies.push(factory);return {factory}};
            export const YX=(_scope,factory)=>{state.mutations.push(factory);return {factory}};
            export const oZ=(_scope,factory)=>({factory});
            export const rZ=(_scope,factory)=>{state.derived.push(factory);return {factory}};
            export const UI=(promise)=>promise;
            export const pk={}; export const _L=()=>state.queryResult; export const gL=()=>{}; export const $3=()=>{};
          `, loader: "js" };
          if (value === "app-initial") return { contents: `
            const state=globalThis.__queryStateTest;
            const noop=()=>{};
            export const cJt=noop,ldn=noop,A1t=noop,pfn=noop,uun=noop,Dft=noop,M6t=noop,ifn=noop,pdn=noop,rht=noop;
            export const $fn=noop,$sn=noop,xu=noop,mnt=noop,Ozt=noop,Sqt=noop,eq=noop,ppn=noop,ydn=noop,wdn=noop,Yr=noop;
            export const cdn=(id)=>["accounts",id]; export const dun=(key,initial)=>(state.persisted.push({key,initial}),{key,initial});
            export const M1t={}; export const mfn={}; export const U6t={}; export const $K={}; export const pk={}; export const mpn={};
            export const N6t=()=>state.auth; export const uht=()=>state.account; export const ufn=()=>({get:(key,fallback)=>state.featureValues[key]??fallback});
            export const kft=(input)=>state.opens.push({kind:"plain",...input}); export const Oft=(input)=>state.opens.push({kind:"tracked",...input});
            export const Tzt=(error)=>error.code; export class Sdn extends Error {constructor(message,status){super(message);this.status=status}}
            export const Jr="github",Kr="enterprise",Su=()=>true,Qfn=()=>({}),Ysn={};
            const api={
              safeGet:async(path,options)=>{state.safeGet.push({path,options}); if(path.includes("customer-balance")) return state.balance??{}; if(path==="/memories") return {memories:[]}; if(path.includes("by-template")) return {connectors:[]}; return state.getResponse??{accounts:{acct:{ok:true}}}},
              safeDelete:async(path,options)=>{state.safeDelete.push({path,options});return state.deleteResponse??{success:true}},
              safePatch:async(path,options)=>{state.safePatch.push({path,options});return {}},
              safePost:async(path,options)=>{state.safePost.push({path,options});return {}},
            };
            export const rJt=api,udn=api;
            const settings={
              removeAppApproval:async(id)=>({op:"remove-app",id}), searchMessagesChats:async(query)=>({query}),
              setMessagesReadAccessPolicy:async(value)=>value,setMessagesReadDecision:async(...values)=>values,
              removeMessagesReadDecision:async(value)=>value,setMessagesSendAllowAllChats:async(value)=>value,
              removeMessagesSendApproval:async(value)=>value,setSoundMode:async(value)=>value,setLockedUseEnabled:async(value)=>value,
              getAppApprovals:async()=>["app"],getMessagesReadDecisions:async()=>["read"],getMessagesSendApprovals:async()=>["send"],
              getSoundMode:async()=>"sound",getLockedUseState:async()=>true,
            };
            export const pnt={computerUseSettings:settings};
          `, loader: "js" };
          return { contents: "export {};", loader: "js" };
        });
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

let state = resetState();
const billing = await bundle("queries");
billing.i();
assert.equal(state.families.length, 2);
const accountOptions = billing.n("acct");
assert.deepEqual(accountOptions.queryKey, ["accounts", "acct"]);
assert.equal(accountOptions.refetchOnMount, "always");
assert.deepEqual(accountOptions.select({ accounts: { acct: { active: true } } }), { active: true });
state.balance = { available: 5 };
const walletOptions = state.families[1]("acct");
const wallet = await walletOptions.queryFn({
  signal: new AbortController().signal,
  client: { getQueryData: () => ({ has_redeemed_gift_card: true }) },
});
assert.deepEqual(wallet, { available: 5, has_redeemed_gift_card: true });
assert.equal(walletOptions.gcTime, 0);

state = resetState();
const announcements = await bundle("task-announcement-state");
announcements.t();
assert.equal(state.persisted[0].key, "voice-reasoning-notice-v3");
assert.deepEqual(state.persisted[0].initial, { impressions: 0, lastSessionId: null, dismissed: false });
const announcementDerive = state.derived[0];
const session = { phase: "active", locator: { conversationId: "c1", hostId: "h1" }, sessionId: "s1" };
const active = announcementDerive({ conversationId: "c1", hostId: "h1" }, {
  get(signal, parameter) {
    if (parameter === "714010102") return true;
    if (signal?.key === "voice-reasoning-notice-v3") return { impressions: 0, lastSessionId: null, dismissed: false };
    return session;
  },
});
assert.equal(active, "s1");
assert.equal(announcementDerive({ conversationId: "other", hostId: "h1" }, { get: () => session }), null);

state = resetState();
const entryPoints = await bundle("entry-point-availability");
entryPoints.i();
entryPoints.a(undefined, "home");
entryPoints.a("gift_click", "settings");
assert.equal(state.opens[0].href, "https://chatgpt.com/gifts/credits?entry_point=home");
assert.equal(state.opens[0].kind, "plain");
assert.equal(state.opens[1].event, "gift_click");
assert.equal(entryPoints.r(), true);
assert.equal(entryPoints.n(), true);
state.featureValues.desktop_beacon_enabled = false;
assert.equal(entryPoints.n(), false);

state = resetState();
const approvals = await bundle("computer-use-app-approvals-query");
approvals._();
approvals.r();
assert.equal(state.derived.length, 1);
assert.equal(state.queries.length, 5);
assert.deepEqual(await approvals.s("bundle"), { op: "remove-app", id: "bundle" });
assert.deepEqual(await approvals.u("hello", new AbortController().signal), { query: "hello" });
assert.equal(await approvals.h("mute"), "mute");
assert.equal(await approvals.d(true), true);
assert.deepEqual(state.queries[0]().queryKey, ["computer-use-app-approvals"]);
assert.equal(state.queries[0]().staleTime, 60000);
assert.equal(state.queries[3]().staleTime, 5000);

state = resetState();
const memories = await bundle("chatgpt-saved-memory-state");
memories.i();
assert.equal(state.families.length, 1);
assert.equal(state.derived.length, 1);
const memoryOptions = state.families[0]("acct");
assert.deepEqual(memoryOptions.queryKey, ["chatgpt-saved-memories", "acct"]);
assert.equal(memoryOptions.staleTime, 30000);
assert.equal(memoryOptions.enabled, true);
await memoryOptions.queryFn();
assert.equal(state.safeGet.at(-1).path, "/memories");

state = resetState();
const environments = await bundle("cloud-environment-queries");
environments.C();
const blank = environments.x(null, "connector-fallback");
assert.equal(blank.machineId, "wham-public/wham-universal");
assert.equal(blank.githubConnectorId, "connector-fallback");
assert.equal(blank.workspaceDirectory, "/workspace");
const invalid = { ...blank, secrets: [{ key: "", value: "x", domain: null }], environmentVariables: [] };
assert.equal(environments.w(invalid).label, "required");
assert.equal(environments.w(invalid).secrets, "name-required");
const valid = {
  ...blank,
  label: " demo ", machineId: "machine", repositoryId: "repo",
  shareSettings: "workspace", shareTargets: [" a@example.com ", ""],
  secrets: [{ key: " TOKEN ", value: "secret", domain: " example.com " }],
  environmentVariables: [{ key: " MODE ", value: "dev" }],
};
assert.deepEqual(environments.w(valid), {});
assert.equal(environments.v(valid, true, "other"), true);
const createRequest = environments.y(valid);
assert.equal(createRequest.label, "demo");
assert.deepEqual(createRequest.env_vars, { MODE: "dev" });
assert.deepEqual(createRequest.share_targets, [{ email: "a@example.com", permission: "editor", type: "user" }]);
assert.deepEqual(createRequest.secrets_with_domains, [{ name: "TOKEN", domain: "example.com", value: "secret" }]);
assert.equal(environments.b("prefix-connector:value"), "connector");
assert.equal(environments.b("invalid"), null);
assert.equal(environments.m({ label: "a", repos: [], task_count: 1 }, { label: "b", repos: [], task_count: 3 }), 2);
const updateRequest = environments.S({
  ...valid,
  secrets: [{ key: "RENAMED", value: "<REDACTED>", domain: "new.example", previousKey: "TOKEN", previousDomain: "old.example" }],
}, { repos: ["repo"], etag: "v1", secrets_with_domains: [{ name: "TOKEN", domain: "old.example" }] });
assert.equal(updateRequest.etag, "v1");
assert.deepEqual(updateRequest.secrets_with_domains[0], {
  name: "RENAMED", domain: "new.example", value: null,
  previous_domain: "old.example", previous_name: "TOKEN",
});
const searchOptions = environments.i("demo");
assert.deepEqual(searchOptions.queryKey, ["cloud-environments", "search", "demo"]);
assert.equal(searchOptions.initialPageParam, null);
assert.equal(searchOptions.getNextPageParam({ cursor: "next" }), "next");
environments.g();
assert.deepEqual(await environments._({ applyEligibilityFilter: true }), []);
environments.d();
assert.equal(state.queries.length, 2);
assert.equal(state.families.length, 4);
assert.equal(state.infiniteFamilies.length, 1);
assert.equal(state.mutations.length, 4);

console.log("55 query and state bridge cluster assertions passed");
