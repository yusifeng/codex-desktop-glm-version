import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__automationInfrastructureTest = {
  initialized: [],
  invalidations: [],
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
    jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  },
  hookState: { cursor: 0, values: [] },
  react: {
    useEffect() {},
    useState(initialValue) { const state = globalThis.__automationInfrastructureTest.hookState; const index = state.cursor++; if (!(index in state.values)) state.values[index] = typeof initialValue === "function" ? initialValue() : initialValue; return [state.values[index], nextValue => { state.values[index] = typeof nextValue === "function" ? nextValue(state.values[index]) : nextValue; }]; },
  },
  render(component, props) { this.hookState.cursor = 0; return component(props); },
  resetHooks() { this.hookState.cursor = 0; this.hookState.values = []; },
};
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "automation-infrastructure-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__automationInfrastructureTest.jsx;export const e6=()=>globalThis.__automationInfrastructureTest.react;export const $O={ONE_MINUTE:60000};export const FX=()=>{};export const QI=()=>{};export const ZI='scope';export const ek=()=>{};export const pZ=(scope,initialValue)=>({scope,initialValue});export const eZ=(scope,derive)=>({scope,derive});" : importPath === "app-initial" ? "export const $ln=name=>[name];export const Rln=()=>{};export const Sun=()=>{};export const Wln=()=>false;export const _un='user';export const cJt=()=>globalThis.__automationInfrastructureTest.initialized.push('automation-api');export const mfn=id=>'gate:'+id;export const mnt=()=>{};export const mun='account';export const nun=()=>{};export const pfn=()=>{};export const pnt={automations:{getState:async()=>({status:'complete'})}};export const vun='auth';export const w8=()=>({data:{models:[{model:'gpt-5',displayName:'GPT-5',supportedReasoningEfforts:['medium','high']}]}});" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const parts = []; walk(node, value => { const children = value.props?.children; if (typeof children === "string") parts.push(children); }); return parts.join(" "); }

const share = await bundle("automation-share-dialog");
assert.deepEqual(Object.keys(share), ["ScheduledTaskShareDialog"]);
let copied, refreshed = 0, deleted = 0;
const shareUi = share.ScheduledTaskShareDialog({ automationName: "Daily brief", shareLink: "https://example/task", onClose() {}, onCopy(value) { copied = value; }, onRefresh() { refreshed++; }, onDelete() { deleted++; } });
assert.match(text(shareUi), /Share Daily brief.*Copy link.*Refresh link.*Delete link/);
find(shareUi, node => node.props?.children === "Copy link").props.onClick();
find(shareUi, node => node.props?.children === "Refresh link").props.onClick();
find(shareUi, node => node.props?.children === "Delete link").props.onClick();
assert.equal(copied, "https://example/task");
assert.equal(refreshed, 1);
assert.equal(deleted, 1);

const frequencyAssertions = assertReleaseOwner("automation-frequency-section");

const automationDialog = await bundle("automation-dialog");
assert.deepEqual(Object.keys(automationDialog), ["a", "i", "n", "r", "t"]);
automationDialog.a();
assert.equal(globalThis.__automationInfrastructureTest.initialized.includes("automation-api"), true);
let selectedModel;
const modelPicker = automationDialog.n({ field: "model", selectedModel: null, onSelect(model, effort) { selectedModel = [model, effort]; } });
find(modelPicker, node => node.type === "select").props.onChange({ currentTarget: { value: "gpt-5" } });
assert.deepEqual(selectedModel, ["gpt-5", "medium"]);
const reasoningPicker = automationDialog.n({ field: "reasoning", selectedModel: "gpt-5", reasoningEffort: "medium", onSelect(model, effort) { selectedModel = [model, effort]; } });
find(reasoningPicker, node => node.type === "select").props.onChange({ currentTarget: { value: "high" } });
assert.deepEqual(selectedModel, ["gpt-5", "high"]);

const migration = await bundle("habitat-automation-migration-state");
assert.deepEqual(Object.keys(migration), ["n", "r", "t"]);
assert.equal(migration.n, undefined);
migration.t();
assert.deepEqual(migration.r, { scope: "scope", initialValue: null });
const migrationQuery = migration.n.derive({ get(signal) { if (signal === "account") return "a"; if (signal === "user") return "u"; if (signal === "auth") return { status: "allowed", plan: "plus" }; if (signal === "gate:4020418403") return true; }, scope: { queryClient: { invalidateQueries(input) { globalThis.__automationInfrastructureTest.invalidations.push(input); } } } });
assert.deepEqual(migrationQuery.queryKey, ["local-automation-habitat-migration", "a", "u"]);
assert.deepEqual(await migrationQuery.queryFn(), { status: "complete" });
assert.equal(migrationQuery.refetchInterval({ state: { data: { status: "unavailable" }, dataUpdateCount: 2 } }), 1000);
assert.deepEqual(globalThis.__automationInfrastructureTest.invalidations[0].queryKey, ["list-automations"]);

const blocker = await bundle("navigation-blocker");
assert.deepEqual(Object.keys(blocker), ["n", "t"]);
const blocked = blocker.t(() => true);
assert.equal(blocked.state, "blocked");
blocked.proceed();
assert.equal(blocked.isCommitting, true);
assert.equal(blocked.state, "proceeding");

const restoredOwnerAssertions =
  assertReleaseOwner("platform-ui-kit-provider") +
  assertReleaseOwner("cloud-automation-detail-panel") +
  frequencyAssertions;

console.log(`automation infrastructure cluster tests passed with ${restoredOwnerAssertions} release assertions`);
