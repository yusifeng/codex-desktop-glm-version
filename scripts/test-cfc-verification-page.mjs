import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/cfc-verification-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = {
  accountCheck: { data: {}, refetch: () => ({}) },
  accountsQuery: { data: { accounts: [], email: "doctor@clinic.example", name: "Doctor" }, isLoading: false, refetch: async () => ({ data: state.accountsQuery.data }) },
  analytics: [],
  apiGets: [],
  apiPosts: [],
  auth: { accountId: "account-1", userId: "user-1", authMethod: "chatgpt", isLoading: false },
  client: {},
  effects: [],
  enrollment: { data: { metadata: { verification_status: "unverified" } }, isFetching: false, isError: false, refetch: async () => ({ data: state.enrollment.data }) },
  gates: { "1588629910": false, "2369709783": false },
  getQueue: [],
  initialized: 0,
  navigations: [],
  personaDisposals: 0,
  personaOptions: [],
  postQueue: [],
  queryOptions: [],
  refIndex: 0,
  search: "?source=test&beacon_id=beacon-1",
  stateIndex: 0,
  stateSetCalls: [],
  stateValues: [],
  switches: [],
};
const node = (type, props = {}, key) => ({ type, props, key });
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : node(type, props ?? {}, key);
  },
  jsxs(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : node(type, props ?? {}, key);
  },
};
globalThis.__cfcVerification = { state, node, jsx };

const initializer = "()=>{globalThis.__cfcVerification.state.initialized+=1}";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__cfcVerification; const s=r.state;",
    "export const $3=" + initializer + "; export const FX=" + initializer + "; export const K2=" + initializer + "; export const QI=" + initializer + "; export const Zh=" + initializer + ";",
    "export const I3=()=>r.jsx; export const ZI='global'; export const LX=()=>({scope:'global'});",
    "export const Y2=props=>r.node('message',props); export const Yh=props=>r.node('button',props); export const Ad=props=>r.node('checkbox',props);",
    "export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace(/\\{([^}]+)\\}/g,(_,key)=>String(values?.[key]??''))});",
    "export const e6=()=>({useEffect(effect,deps){const cleanup=effect();s.effects.push({cleanup,deps})},useRef(value){return {current:value}},useState(value){const index=s.stateIndex++;const initial=index<s.stateValues.length?s.stateValues[index]:(typeof value==='function'?value():value);return [initial,next=>s.stateSetCalls.push({index,next:typeof next==='function'?next(initial):next})]}});",
    "export const _L=options=>{s.queryOptions.push(options);return options.queryKey[0]==='cfc-verification-accounts'?s.accountCheck:s.enrollment};",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__cfcVerification; const s=r.state;",
    "export const JMt=" + initializer + "; export const M6t=" + initializer + "; export const Qgn=" + initializer + "; export const cJt=" + initializer + "; export const fMt=" + initializer + "; export const gC=" + initializer + "; export const rht=" + initializer + ";",
    "export const Let=props=>r.node('loading',props); export const N6t=()=>s.auth; export const cfn=()=>({client:s.client}); export const iht=()=>s.accountsQuery;",
    "export const i_n=()=>({search:s.search}); export const o_n=()=>destination=>s.navigations.push(destination); export const ofn=gate=>s.gates[gate]??false; export const qgn=props=>r.node('link',props); export const r_n=path=>'https://chatgpt.com'+path;",
    "export const Nx=async(accounts,accountId,client,destination)=>{s.switches.push({accounts,accountId,client,destination})};",
    "export const xpn=(client,event,payload)=>s.analytics.push({client,event,payload});",
    "export class Sdn extends Error{constructor(message,status,errorCode){super(message);this.status=status;this.errorCode=errorCode}}",
    "export const rJt={safeGet:async(path,options)=>{s.apiGets.push({path,options});const value=s.getQueue.shift();if(value instanceof Error)throw value;return value??{}},safePost:async(path,options)=>{s.apiPosts.push({path,options});const value=s.postQueue.shift();if(value instanceof Error)throw value;return value??{}}};",
  ].join("\n"),
  messages: [
    "export const n=" + initializer + ";",
    "export const t={verificationFaqSectionTitle:{id:'faq-title',defaultMessage:'Frequently asked questions'},faq1Answer:{id:'faq-one',defaultMessage:'Persona handles verification.'},faq7Answer:{id:'faq-seven',defaultMessage:'Verification is secure.'}};",
  ].join("\n"),
  "cfc-persona-verification": [
    "const s=globalThis.__cfcVerification.state;",
    "export const n=options=>{s.personaOptions.push(options);return ()=>{s.personaDisposals+=1}};",
    "export const t=" + initializer + ";",
  ].join("\n"),
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "cfc-verification-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function tick() { return new Promise((resolve) => setTimeout(resolve, 0)); }
function reset() {
  state.accountCheck = { data: {}, isLoading: false, refetch: () => ({}) };
  state.accountsQuery = { data: { accounts: [], email: "doctor@clinic.example", name: "Doctor" }, isLoading: false, refetch: async () => ({ data: state.accountsQuery.data }) };
  state.analytics.length = 0;
  state.apiGets.length = 0;
  state.apiPosts.length = 0;
  state.auth = { accountId: "account-1", userId: "user-1", authMethod: "chatgpt", isLoading: false };
  state.effects.length = 0;
  state.enrollment = { data: { metadata: { verification_status: "unverified" } }, isFetching: false, isError: false, refetch: async () => ({ data: state.enrollment.data }) };
  state.gates = { "1588629910": false, "2369709783": false };
  state.getQueue.length = 0;
  state.navigations.length = 0;
  state.personaDisposals = 0;
  state.personaOptions.length = 0;
  state.postQueue.length = 0;
  state.queryOptions.length = 0;
  state.stateIndex = 0;
  state.stateSetCalls.length = 0;
  state.stateValues = [];
  state.switches.length = 0;
}
function render() { state.stateIndex = 0; return module.CfcVerificationPage(); }
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; }
  output.push(value); walk(value.props?.children, output); return output;
}
function find(view, predicate) { return walk(view).find(predicate); }
function byType(view, type) { return find(view, (item) => item.type === type); }
function byData(view, key, value) { return find(view, (item) => item.props?.[key] === value); }

assert.deepEqual(Object.keys(module), ["CfcVerificationPage"]); assertions += 1;
assert.equal(state.initialized, 14); assertions += 1;
assert.deepEqual([...source.matchAll(/from \"@rchunk\/([^\"]+)\"/g)].map((match) => match[1]), ["app-shared", "app-initial", "messages", "cfc-persona-verification"]); assertions += 1;
assert.equal(source.includes('import "@rchunk/rolldown-runtime"'), true); assertions += 1;
assert.equal(/\bany\b/.test(source), false); assertions += 1;
assert.equal(/\b(?:appSharedChunk|appInitialChunk|messagesChunk|personaChunk)\s*\./.test(source), false); assertions += 1;

reset(); state.auth.isLoading = true;
check(render().type === "loading", "shows loading page while auth loads");

reset();
let view = render();
check(view.type === "main", "renders CFC verification surface");
check(view.props["data-primary-state"] === "start", "starts in verification state");
check(state.queryOptions[0].queryKey[0] === "cfc-verification-enrollment", "queries enrollment state");
check(state.analytics.some((entry) => entry.event.type === "cfc.pageViewed"), "tracks page view");
const primary = byData(view, "data-action", "primary");
check(primary.type === "button", "renders verification CTA");
primary.props.onClick();
check(state.stateSetCalls.some((call) => call.index === 0 && call.next?.isRetry === false), "starts Persona verification");

reset(); state.stateValues[0] = { isRetry: true };
view = render();
check(state.personaOptions.length === 1, "opens Persona when requested");
state.personaOptions[0].onLoad();
check(state.stateSetCalls.some((call) => call.index === 1 && call.next === true), "records Persona load");
state.personaOptions[0].onComplete();
check(state.analytics.some((entry) => entry.event.type === "cfc.personaCompleted"), "tracks Persona completion");
state.personaOptions[0].onCancel();
check(state.analytics.some((entry) => entry.event.type === "cfc.personaCanceled"), "tracks Persona cancellation");
state.personaOptions[0].onError(new Error("failed"));
check(state.stateSetCalls.some((call) => call.index === 2), "surfaces Persona startup error");

reset(); state.gates["1588629910"] = true;
view = render();
const npiForm = byData(view, "data-view", "npi");
check(npiForm.type === "form", "shows NPI preverification gate");
npiForm.props.onSubmit({ preventDefault() {} });
await tick();
check(state.stateSetCalls.some((call) => call.index === 5 && String(call.next).includes("10-digit")), "validates NPI length");

reset(); state.gates["1588629910"] = true; state.stateValues[3] = "1234567890"; state.postQueue.push({ metadata: { verification_status: "pending", deferred_verification: true, npi: "1234567890" } });
view = render();
byData(view, "data-view", "npi").props.onSubmit({ preventDefault() {} });
await tick();
check(state.apiPosts.some((call) => call.path === "/quorum/preverify_npi"), "posts NPI for preverification");
check(state.stateSetCalls.some((call) => call.index === 4 && call.next === "1234567890"), "accepts confirmed NPI");

reset(); state.enrollment.data.metadata = { verification_status: "verified" }; state.stateValues[7] = true; state.stateValues[8] = true; state.postQueue.push({ workspace_id: "workspace-1" });
view = render();
const terms = byData(view, "data-view", "terms");
check(terms.type === "form", "shows clinical workspace terms after verification");
terms.props.onSubmit({ preventDefault() {} });
await tick(); await tick();
check(state.apiPosts.some((call) => call.path === "/accounts/create_quorum_workspace"), "creates Quorum workspace");
check(state.switches.some((entry) => entry.accountId === "workspace-1"), "switches into created workspace");
check(state.analytics.some((entry) => entry.event.type === "cfc.postVerificationWorkspaceCreateSucceeded"), "tracks workspace creation");

reset(); state.accountsQuery.data.accounts = [{ id: "quorum-1", plan_type: "quorum", structure: "team" }];
view = render();
check(view.props["data-primary-state"] === "existing", "blocks duplicate Quorum workspace creation");
byData(view, "data-action", "primary").props.onClick();
check(state.navigations[0] === "https://chatgpt.com/", "continues existing workspace to home");

reset(); state.accountsQuery.data.accounts = [{ id: "deferred-1", plan_type: "quorum", can_access_with_session: true }]; state.accountCheck.data = { accounts: { "deferred-1": { account: { quorum_deferred_persona_verification: true } } } };
render(); await tick();
check(state.switches.some((entry) => entry.accountId === "deferred-1"), "resumes deferred eligible workspace");

reset(); state.enrollment.data.metadata = { verification_status: "failed" };
view = render();
check(view.props["data-primary-state"] === "retry", "offers retry after failed verification");

reset(); state.enrollment.isFetching = true;
view = render();
check(view.props["data-primary-state"] === "loading", "marks polling state as loading");
check(state.queryOptions[0].refetchInterval({ state: { data: { metadata: { verification_status: "pending" } }, status: "success" } }) === 2000, "polls pending enrollment");
check(state.queryOptions[0].refetchInterval({ state: { data: { metadata: { verification_status: "verified" } }, status: "success" } }) === false, "stops polling terminal enrollment");

console.log(assertions + " CFC verification page assertions passed");
