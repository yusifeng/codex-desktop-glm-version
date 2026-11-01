import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__automationInfrastructureTest = { invalidations: [], jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "automation-infrastructure-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__automationInfrastructureTest.jsx;export const $O={ONE_MINUTE:60000};export const FX=()=>{};export const QI=()=>{};export const ZI='scope';export const ek=()=>{};export const pZ=(scope,initialValue)=>({scope,initialValue});export const eZ=(scope,derive)=>({scope,derive});" : importPath === "app-initial" ? "export const $ln=name=>[name];export const Rln=()=>{};export const Sun=()=>{};export const Wln=()=>false;export const _un='user';export const mfn=id=>'gate:'+id;export const mnt=()=>{};export const mun='account';export const nun=()=>{};export const pfn=()=>{};export const pnt={automations:{getState:async()=>({status:'complete'})}};export const vun='auth';" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
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

const frequency = await bundle("automation-frequency-section");
assert.deepEqual(Object.keys(frequency).sort(), ["a", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"]);
assert.deepEqual(frequency.d("09:30"), { hour: 9, minute: 30 });
assert.equal(frequency.d("29:30"), null);
assert.equal(frequency.f("9:05"), "09:05");
assert.deepEqual(frequency.c({ frequency: "weekly", days: [5, 1, 5], interval: 0 }), { frequency: "weekly", days: [1, 5], interval: 1, timeZone: "UTC" });
assert.match(frequency.h({ frequency: "daily", time: "8:15", timeZone: "Asia/Shanghai" }), /Daily at 08:15/);
let changedSchedule;
const frequencyUi = frequency.l({ draft: { frequency: "daily", time: "09:00" }, onChange(value) { changedSchedule = value; } });
find(frequencyUi, node => node.props?.["aria-label"] === "Frequency").props.onChange({ currentTarget: { value: "weekly" } });
assert.equal(changedSchedule.frequency, "weekly");

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

const provider = await bundle("platform-ui-kit-provider");
assert.deepEqual(Object.keys(provider), ["n", "r", "t"]);
const providerUi = provider.n({ locale: "zh-CN", timeZone: "Asia/Shanghai", children: "Content" });
assert.equal(providerUi.props["data-locale"], "zh-CN");
assert.equal(providerUi.props["data-time-zone"], "Asia/Shanghai");

const detail = await bundle("cloud-automation-detail-panel");
assert.deepEqual(Object.keys(detail).sort(), ["a", "c", "i", "n", "o", "r", "s", "t"]);
assert.equal(find(detail.n({ isLoading: true }), node => node.props?.role === "status").props.children, "Loading scheduled task…");
assert.equal(find(detail.n({ error: "Offline" }), node => node.props?.role === "alert").props.children, "Offline");
let edited = 0, ran = 0;
const detailUi = detail.n({ automation: { id: "task", name: "Daily report", instructions: "Summarize", schedule: "Daily", destination: "Email" }, onEdit() { edited++; }, onRunNow() { ran++; } });
assert.match(text(detailUi), /Daily report.*Summarize.*Daily.*Email/);
find(detailUi, node => node.props?.children === "Edit").props.onClick();
find(detailUi, node => node.props?.children === "Run now").props.onClick();
assert.equal(edited, 1);
assert.equal(ran, 1);
assert.equal(detail.o({ id: "x", name: "  " }), "Scheduled task");
assert.equal(detail.r({ id: "x", status: "paused" }), false);

console.log("automation infrastructure cluster tests passed");
