import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = [];
let hookIndex = 0;
const state = {
  account: { accountId: "account-1", authMethod: "chatgpt", userId: "user-1" },
  gate: true,
  initialized: 0,
  plan: "consumer",
  query: { data: null, isError: false, isLoading: true, refetches: 0 },
  queryOptions: [],
  reduceMotion: false,
  usage: { data: { credits: { balance: null } } },
};
const React = {
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hookState))
      hookState[index] = typeof initial === "function" ? initial() : initial;
    return [
      hookState[index],
      (next) => {
        hookState[index] =
          typeof next === "function" ? next(hookState[index]) : next;
      },
    ];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function"
      ? type(props ?? {})
      : { type, props: props ?? {}, key };
  },
};
globalThis.__usageCodeReviewSettings = { React, jsx, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__usageCodeReviewSettings;",
    "export const $3=()=>{runtime.state.initialized+=1};export const FX=()=>{};export const gL=()=>{};",
    "export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;export const HX=()=>runtime.state.usage;",
    "export const _L=options=>{runtime.state.queryOptions.push(options);return {...runtime.state.query,refetch:()=>{runtime.state.query.refetches+=1}}};",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage,formatNumber:(value,options)=>new Intl.NumberFormat('en-US',options).format(value)});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__usageCodeReviewSettings;",
    "export const Hln=plan=>plan==='business';export const M6t=()=>{};export const N6t=()=>runtime.state.account;export const Rln=()=>{};export const Slt=()=>runtime.state.reduceMotion;",
    "const Layout=props=>({type:'settings-layout',props});Layout.Header=props=>({type:'settings-header',props});Layout.Content=props=>({type:'settings-content',props});export const aa=Layout;",
    "export const d0t=()=>{};export const dS=()=>({plan:runtime.state.plan});export const f0t='usage-signal';export const ifn=()=>{};export const oa=()=>{};export const ofn=()=>runtime.state.gate;export const uS=()=>{};export const xlt=()=>{};",
  ].join("\n"),
  "command-menu-queries":
    "export const t=()=>{};export const n=options=>{globalThis.__usageCodeReviewSettings.state.queryOptions.push({builder:options});return {kind:'code-review-query',...options}};",
  "activity-chart":
    "export const U=()=>{};export const n=()=>{};export const H=props=>({type:'date-range',props});export const t=props=>({type:'activity-chart',props});",
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/usage-code-review-settings/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "usage-code-review-settings-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: module }) => ({
            contents: mocks[module] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
assert.deepEqual(Object.keys(module), ["UsageCodeReviewSettings"]);
assert.equal(state.initialized, 1);

function render(props = {}) {
  hookIndex = 0;
  return module.UsageCodeReviewSettings(props);
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.children, output);
  return output;
}
function charts(view) {
  return walk(view).filter((node) => node.type === "activity-chart");
}

let view = render();
let renderedCharts = charts(view);
assert.equal(view.type, "settings-layout");
assert.equal(renderedCharts.length, 5);
assert.equal(
  renderedCharts.every((chart) => chart.props.status.isLoading),
  true,
);
assert.equal(
  renderedCharts.every((chart) => chart.props.data === undefined),
  true,
);
assert.equal(state.queryOptions.at(-2).builder.days, 30);
assert.equal(state.queryOptions.at(-2).builder.scope, "consumer");

state.query = { data: null, isError: true, isLoading: false, refetches: 0 };
view = render();
renderedCharts = charts(view);
assert.equal(renderedCharts.length, 5);
assert.equal(
  renderedCharts.every((chart) => chart.props.status.isError),
  true,
);
renderedCharts[0].props.status.onRetry();
assert.equal(state.query.refetches, 1);

state.query = {
  data: { data: [] },
  isError: false,
  isLoading: false,
  refetches: 0,
};
view = render();
renderedCharts = charts(view);
assert.equal(renderedCharts.length, 3);
assert.deepEqual(
  renderedCharts.map((chart) => chart.props.chartKey),
  ["issues", "reviews", "priorities"],
);
assert.equal(
  renderedCharts.every((chart) => chart.props.data.total === 0),
  true,
);

state.query = {
  data: {
    data: [
      {
        date: "2026-09-28",
        n_comments: 5,
        n_reviews: 2,
        n_comments_p0: 1,
        n_comments_p1: 2,
        n_comments_p2: 1,
        n_reactions: 4,
        n_reactions_plus1: 3,
        n_reactions_minus1: 1,
        n_reactions_other: 0,
      },
      {
        date: "2026-09-29",
        n_comments: 2,
        n_reviews: 1,
        n_comments_p0: 0,
        n_comments_p1: 1,
        n_comments_p2: 0,
        n_reactions: 3,
        n_reactions_plus1: 1,
        n_reactions_minus1: 1,
        n_reactions_other: 1,
      },
    ],
  },
  isError: false,
  isLoading: false,
  refetches: 0,
};
view = render({ isPolling: false });
renderedCharts = charts(view);
assert.equal(renderedCharts.length, 5);
const byKey = Object.fromEntries(
  renderedCharts.map((chart) => [chart.props.chartKey, chart.props]),
);
assert.equal(byKey.issues.data.total, 7);
assert.equal(byKey.issues.data.series[0].total, 7);
assert.equal(byKey.issues.visualization, "bar");
assert.equal(byKey.reviews.data.total, 3);
assert.deepEqual(
  byKey.priorities.data.series.map((series) => [series.key, series.total]),
  [
    ["p0", 1],
    ["p1", 3],
    ["p2", 1],
    ["other", 2],
  ],
);
assert.deepEqual(
  byKey.priorities.data.data.map((point) => point.values.other),
  [1, 1],
);
assert.equal(byKey.priorities.visualization, "stacked-bar");
assert.deepEqual(
  byKey.reactions.data.series.map((series) => series.total),
  [4, 2, 1],
);
assert.equal(byKey.reactions.data.total, 7);
assert.equal(byKey.sentiment.hideTotal, true);
assert.equal(byKey.sentiment.totalLabel, "57% positive");
assert.equal(byKey.sentiment.data.data[0].values.plus1, 75);
assert.equal(byKey.sentiment.consumerAnalytics, true);
assert.equal(state.queryOptions.at(-2).builder.isPolling, false);

state.plan = "business";
state.usage = { data: { credits: { balance: 10 } } };
render();
assert.equal(state.queryOptions.at(-2).builder.scope, "business");

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " usage code review settings assertions passed");
