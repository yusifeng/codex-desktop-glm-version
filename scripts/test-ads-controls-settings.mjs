import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/ads-controls-settings/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const hookState = [];
let hookIndex = 0;
const effects = [];
const runtime = {
  accountId: "acct-1",
  gate: true,
  initialized: 0,
  searchParams: new URLSearchParams("view=ads"),
  searchUpdates: [],
};
const React = {
  Fragment: "Fragment",
  useEffect(effect) {
    effects.push(effect);
  },
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
globalThis.__adsControls = { React, jsx, runtime };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__adsControls;",
    "export const $3=()=>{r.runtime.initialized+=1};export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
    "export const HX=signal=>signal();export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__adsControls;",
    "export const U6t=()=>r.runtime.accountId;export const ofn=()=>r.runtime.gate;",
    "export const d_n=()=>[r.runtime.searchParams,next=>{r.runtime.searchParams=next;r.runtime.searchUpdates.push(next.toString())}];",
  ].join("\n"),
  "command-menu-availability": "export {};",
  "ads-controls-state": "export {};",
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "ads-controls-settings-mocks",
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

let assertions = 0;
function equal(actual, expected) {
  assertions++;
  assert.equal(actual, expected);
}
function deepEqual(actual, expected) {
  assertions++;
  assert.deepEqual(actual, expected);
}
function ok(value) {
  assertions++;
  assert.ok(value);
}
function reset() {
  hookState.length = 0;
  hookIndex = 0;
  effects.length = 0;
  runtime.accountId = "acct-1";
  runtime.gate = true;
  runtime.searchParams = new URLSearchParams("view=ads");
  runtime.searchUpdates.length = 0;
}
function render(props = {}) {
  hookIndex = 0;
  effects.length = 0;
  return module.AdsControlsSettings(props);
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
function text(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(text).join(" ");
  return text(value.props?.children);
}
function find(view, type, label) {
  return walk(view).find(
    (node) => node.type === type && (label == null || text(node) === label),
  );
}
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

deepEqual(Object.keys(module), ["AdsControlsSettings"]);
deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "rolldown-runtime",
    "app-shared",
    "app-initial",
    "command-menu-availability",
    "ads-controls-state",
  ],
);
equal(/\bany\b/.test(source), false);
equal(
  /\b(?:appInitialChunk|appSharedChunk|runtimeChunk)\s*\./.test(source),
  false,
);
equal(runtime.initialized, 1);
equal(source.includes("/bazaar/profile"), true);
equal(source.includes("/bazaar/history"), true);
equal(source.includes("/bazaar/preferences"), true);
equal(source.includes("/settings/account_user_setting"), true);

equal(render({ accountId: null }), null);
equal(render({ available: false }), null);

let view = render({ settingsSnapshot: { loading: true } });
equal(text(view).includes("Loading ads controls…"), true);
ok(find(view, "spinner"));

reset();
view = render({ settingsSnapshot: { error: "failed" } });
equal(text(view).includes("Couldn’t load ads controls"), true);
ok(find(view, "button", "Retry"));

const settings = {
  bazaarPersonalizationEnabled: true,
  bazaarPersonalizationUnavailable: false,
  freeAdsOptOut: false,
};
const calls = { deletes: 0, history: [], settings: 0, topics: [], updates: [] };
const service = {
  async deleteData() {
    calls.deletes++;
    return true;
  },
  async loadHistory(accountId, cursor) {
    calls.history.push({ accountId, cursor });
    return { history: [] };
  },
  async loadSettings() {
    calls.settings++;
    return settings;
  },
  async loadTopics(accountId, cursor) {
    calls.topics.push({ accountId, cursor });
    return { preferences: [] };
  },
  async updateSetting(accountId, input) {
    calls.updates.push({ accountId, input });
    return true;
  },
};

reset();
view = render({ service, settingsSnapshot: { data: settings } });
equal(text(view).includes("Ads controls"), true);
ok(find(view, "button", "History"));
ok(find(view, "button", "Topics"));
ok(find(view, "button", "Delete"));
ok(find(view, "button", "Change plan"));
equal(text(view).includes("Ads personalization"), true);
const personalization = walk(view).find(
  (node) => node.type === "input" && node.props.type === "checkbox",
);
equal(personalization.props.checked, true);
equal(personalization.props["aria-disabled"], false);

find(view, "button", "History").props.onClick();
equal(runtime.searchUpdates.at(-1), "view=ads-history");
find(view, "button", "Topics").props.onClick();
equal(runtime.searchUpdates.at(-1), "view=ads-topics");

reset();
runtime.searchParams = new URLSearchParams("view=ads&adsView=history");
view = render({
  historySnapshot: { loading: true },
  service,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("Ads history"), true);
equal(text(view).includes("Loading ads controls…"), true);
find(view, "button", "Back").props.onClick();
equal(runtime.searchUpdates.at(-1), "view=ads");

reset();
view = render({
  historySnapshot: { data: { history: [] } },
  searchParams: new URLSearchParams("view=ads-history"),
  service,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("No ad history"), true);
equal(text(view).includes("Ads you view in ChatGPT will appear here"), true);

const historyPage = {
  cursor: "history-next",
  history: [
    {
      id: "ad-1",
      action: "opened",
      occurred_at: "2026-09-01T00:00:00Z",
      ad_data: { advertiser_brand: { name: "Acme" }, title: "Launch" },
    },
  ],
};
reset();
view = render({
  historySnapshot: { data: historyPage },
  searchParams: new URLSearchParams("view=ads-history"),
  service,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("Acme — Launch"), true);
equal(text(view).includes("Opened"), true);
ok(find(view, "button", "Load more"));
find(view, "button", "Load more").props.onClick();
await flush();
deepEqual(calls.history.at(-1), {
  accountId: "acct-1",
  cursor: "history-next",
});

reset();
view = render({
  historySnapshot: { error: "failed" },
  searchParams: new URLSearchParams("view=ads-history"),
  service,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("Couldn’t load ads controls"), true);

reset();
view = render({
  searchParams: new URLSearchParams("view=ads-topics"),
  service,
  settingsSnapshot: { data: settings },
  topicsSnapshot: { data: { preferences: [] } },
});
equal(text(view).includes("No topics yet"), true);

reset();
view = render({
  searchParams: new URLSearchParams("view=ads-topics"),
  service,
  settingsSnapshot: { data: settings },
  topicsSnapshot: {
    data: {
      cursor: "topics-next",
      preferences: [{ content: "Travel" }, { content: "Technology" }],
    },
  },
});
equal(text(view).includes("Topics inspired by your activity"), true);
equal(text(view).includes("Travel"), true);
equal(text(view).includes("Technology"), true);
find(view, "button", "Load more").props.onClick();
await flush();
deepEqual(calls.topics.at(-1), { accountId: "acct-1", cursor: "topics-next" });

reset();
view = render({
  searchParams: new URLSearchParams("view=ads-topics"),
  service,
  settingsSnapshot: {
    data: { ...settings, bazaarPersonalizationEnabled: false },
  },
  topicsSnapshot: { loading: false },
});
equal(text(view).includes("No topics yet"), true);

reset();
const regionalSettings = {
  ...settings,
  bazaarPersonalizationUnavailable: true,
};
view = render({ service, settingsSnapshot: { data: regionalSettings } });
equal(find(view, "button", "Topics"), undefined);
equal(text(view).includes("currently aren’t available in your region"), true);
const regionalToggle = walk(view).find(
  (node) => node.type === "input" && node.props.type === "checkbox",
);
equal(regionalToggle.props.checked, false);
equal(regionalToggle.props["aria-disabled"], true);
regionalToggle.props.onChange({ target: { checked: true } });
equal(calls.updates.length, 0);

walk(view)
  .filter((node) => node.type === "button" && text(node) === "Delete")
  .at(-1)
  .props.onClick();
view = render({ service, settingsSnapshot: { data: regionalSettings } });
equal(text(view).includes("Delete all ads data?"), true);
equal(text(view).includes("permanently delete your ad history"), true);
find(view, "button", "Cancel").props.onClick();
view = render({ service, settingsSnapshot: { data: regionalSettings } });
equal(text(view).includes("Delete all ads data?"), false);

reset();
view = render({ service, settingsSnapshot: { data: settings } });
find(view, "button", "Delete").props.onClick();
view = render({ service, settingsSnapshot: { data: settings } });
equal(text(view).includes("ads history and ads topics"), true);
walk(view)
  .filter((node) => node.type === "button" && text(node) === "Delete")
  .at(-1)
  .props.onClick();
await flush();
equal(calls.deletes, 1);
view = render({ service, settingsSnapshot: { data: settings } });
equal(text(view).includes("Delete all ads data?"), false);

reset();
personalization.props.onChange({ target: { checked: false } });
await flush();
equal(calls.updates.at(-1).input.feature, "bazaar_personalization_enabled");
equal(calls.updates.at(-1).input.value, false);

reset();
const failingService = {
  ...service,
  async updateSetting() {
    return false;
  },
};
view = render({
  service: failingService,
  settingsSnapshot: { data: settings },
});
walk(view)
  .find((node) => node.type === "input")
  .props.onChange({ target: { checked: false } });
await flush();
view = render({
  service: failingService,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("Couldn’t update ads controls"), true);

reset();
view = render({
  freeOptOutEligible: true,
  service,
  settingsSnapshot: { data: settings },
});
find(view, "button", "Change plan").props.onClick();
view = render({
  freeOptOutEligible: true,
  service,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("Choices to go ad-free"), true);
ok(find(view, "button", "Reduce message limits"));
ok(find(view, "button", "Upgrade to Plus"));
find(view, "button", "Reduce message limits").props.onClick();
await flush();
equal(calls.updates.at(-1).input.feature, "free_ads_opt_out");
equal(calls.updates.at(-1).input.value, true);

reset();
view = render({
  freeOptOutEligible: true,
  service,
  settingsSnapshot: { data: { ...settings, freeAdsOptOut: true } },
});
equal(text(view).includes("Ads are off"), true);
ok(find(view, "button", "Turn on ads"));
find(view, "button", "Turn on ads").props.onClick();
await flush();
equal(calls.updates.at(-1).input.value, false);

reset();
const opened = [];
view = render({
  freeOptOutEligible: false,
  onOpenExternal: (url) => opened.push(url),
  service,
  settingsSnapshot: { data: settings },
});
find(view, "button", "Change plan").props.onClick();
view = render({
  freeOptOutEligible: false,
  onOpenExternal: (url) => opened.push(url),
  service,
  settingsSnapshot: { data: settings },
});
equal(text(view).includes("Upgrade to go ad-free"), true);
equal(find(view, "button", "Reduce message limits"), undefined);
find(view, "button", "Upgrade to Plus").props.onClick();
equal(opened.length, 1);
equal(opened[0].includes("ads_controls_change_plan"), true);
equal(opened[0].includes("targetPlan=plus"), true);

console.log(`${assertions} assertions passed`);
