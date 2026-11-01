import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__activityBillingContract = {
  hookIndex: 0,
  hooks: [],
  initializers: [],
  query: { data: null, isError: false, isLoading: false, isPending: false, isFetching: false, refetch() { state.refetched = true; } },
  refetched: false,
};
state.React = {
  useState(initial) {
    const index = state.hookIndex++;
    if (!(index in state.hooks)) state.hooks[index] = typeof initial === "function" ? initial() : initial;
    return [state.hooks[index], (next) => { state.hooks[index] = typeof next === "function" ? next(state.hooks[index]) : next; }];
  },
};
state.jsx = {
  Fragment: Symbol.for("contract.fragment"),
  jsx(type, props, key) { return { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return { type, props: props ?? {}, key }; },
};

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": `
    const state=globalThis.__activityBillingContract;
    export const I3=()=>state.jsx;
    export const e6=()=>state.React;
    export const _L=()=>state.query;
  `,
  "app-initial": `
    const state=globalThis.__activityBillingContract;
    export const M6t=()=>state.initializers.push("account");
    export const cJt=()=>state.initializers.push("api");
    export const ifn=()=>state.initializers.push("experiments");
    export const oa=()=>state.initializers.push("layout");
    export const xlt=()=>state.initializers.push("motion");
    export const N6t=()=>({accountId:"account-1",userId:"user-1",authMethod:"chatgpt"});
    export const udn={safeGet:async()=>state.query.data};
  `,
};

async function load(entry) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, entry)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "analytics-contract-mocks", setup(build) {
      build.onResolve({ filter: /^@exact-chunk\// }, ({ path: importPath }) => ({ path: importPath, namespace: "mock" }));
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => {
        const moduleName = importPath.slice(8);
        if (moduleName === "activity-chart") return { path: path.join(ROOT, "src/renderer/activity-chart/index.ts") };
        return { path: moduleName, namespace: "mock" };
      });
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

const activity = await load("src/renderer/activity-chart/index.ts");
assert.deepEqual(Object.keys(activity).sort(), ["A", "B", "C", "D", "E", "F", "H", "I", "L", "M", "N", "O", "P", "R", "S", "T", "U", "V", "_", "a", "b", "c", "d", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y", "z"]);
assert.equal(activity.F(0.125, "percent"), "12.5%");
assert.equal(activity.F(1234, "tokens").replaceAll(",", ""), "1234");
assert.equal(activity.M({ date: "2026-11-01", values: { codex: -2 } }, "codex"), 0);
assert.equal(activity.M({ date: "2026-11-01", values: { codex: 4 } }, "codex"), 4);
assert.equal(activity.V({ data: [], series: [], total: 0 }), false);
assert.equal(activity.V({ data: [], series: [], total: 1 }), true);

let selectedDays = 0;
state.hookIndex = 0;
const range = activity.H({ ariaLabel: "Range", days: 7, onChange(days) { selectedDays = days; } });
assert.equal(range.props.role, "group");
assert.equal(range.props.children.length, 2);
assert.equal(range.props.children[0].props["aria-pressed"], true);
range.props.children[1].props.onClick();
assert.equal(selectedDays, 30);

const chartData = {
  total: 9,
  series: [{ key: "codex", name: "Codex", total: 6 }, { key: "work", name: "Work", total: 3 }],
  data: [
    { date: "2026-11-01", values: { codex: 2, work: 1 } },
    { date: "2026-11-02", values: { codex: 4, work: 2 } },
  ],
};
state.hookIndex = 0; state.hooks = [];
const chart = activity.t({ ariaLabel: "Usage", data: chartData, title: "Plan usage", unit: "turns", visualization: "stacked-bar", status: {} });
assert.equal(chart.type, "section");
assert.equal(chart.props["aria-label"], "Usage");
assert.equal(chart.props.children[0].props.children[0].props.children[0].props.children, "Plan usage");
assert.equal(chart.props.children[0].props.children[0].props.children[1].props.children, "9");
assert.equal(chart.props.children[1].props.children.length, 2);

state.hookIndex = 0; state.hooks = [];
const loading = activity.t({ title: "Usage", status: { isLoading: true } });
assert.equal(loading.props.children[1].props.role, "status");
assert.equal(loading.props.children[1].props.children, "Loading usage…");
state.hookIndex = 0; state.hooks = [];
const empty = activity.t({ title: "Usage", data: { data: [], series: [], total: 0 }, status: {} });
assert.equal(empty.props.children[1].props.children, "No usage recorded during this period");

const billing = await load("src/renderer/billing-analytics/index.ts");
assert.deepEqual(Object.keys(billing).sort(), ["n", "t"]);
assert.deepEqual(state.initializers, ["account", "api", "experiments", "layout", "motion"]);
state.query.data = {
  data_as_of: "2026-11-02T09:00:00Z",
  periods: [
    { id: "five-1", window_minutes: 300, starts_at: "2026-11-01T00:00:00Z", ends_at: "2026-11-01T05:00:00Z", used_basis_points: 2500, breakdowns: [{ dimension: "thread_source", rows: [{ key: "codex", basis_points: 1500 }, { key: "work", basis_points: 1000 }] }] },
    { id: "week-1", window_minutes: 10080, starts_at: "2026-10-26T00:00:00Z", ends_at: "2026-11-02T00:00:00Z", used_basis_points: 6000, breakdowns: [{ dimension: "thread_source", rows: [{ key: "codex", basis_points: 4000 }, { key: "work", basis_points: 2000 }] }] },
  ],
};
state.hookIndex = 0; state.hooks = [];
const billingView = billing.t({ scope: "consumer", isPolling: false });
assert.equal(billingView.type, "div");
assert.equal(billingView.props.children.length, 3);
const fiveHourChart = billingView.props.children[1];
const weeklyChart = billingView.props.children[2];
assert.equal(fiveHourChart.props.title, "5-hour periods");
assert.equal(fiveHourChart.props.data.total, 0.25);
assert.deepEqual(fiveHourChart.props.data.series.map((series) => series.name), ["Codex", "Work"]);
assert.equal(fiveHourChart.props.data.data[0].values.codex, 0.15);
assert.equal(weeklyChart.props.data.total, 0.6);
assert.equal(weeklyChart.props.data.data[0].values.work, 0.2);

const activitySource = fs.readFileSync(path.join(ROOT, "src/renderer/activity-chart/index.ts"), "utf8");
const billingSource = fs.readFileSync(path.join(ROOT, "src/renderer/billing-analytics/index.ts"), "utf8");
assert.deepEqual([...activitySource.matchAll(/@exact-chunk\/([^"']+)/gu)].map((match) => match[1]), [
  "linear-51abf1a86c3b.js", "line-5171f1d885cc.js", "area-76377dfd01aa.js", "step-cc59eba019a7.js", "monotone-68fb4f84bd88.js",
  "BarChart-2010e7d67e4a.js", "queries-a53713419c4d.js",
]);
assert.deepEqual([...billingSource.matchAll(/@exact-chunk\/([^"']+)/gu)].map((match) => match[1]), ["BarChart-2010e7d67e4a.js", "queries-a53713419c4d.js"]);
for (const source of [activitySource, billingSource]) assert.equal(/@ts-nocheck|@ts-expect-error/u.test(source), false);
assert.equal(fs.existsSync(path.join(ROOT, "src/renderer/activity-chart/exact.js")), false);
assert.equal(fs.existsSync(path.join(ROOT, "src/renderer/billing-analytics/exact.js")), false);

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./gu)].length;
console.log(`${assertionCount} activity and billing analytics contract assertions passed`);
