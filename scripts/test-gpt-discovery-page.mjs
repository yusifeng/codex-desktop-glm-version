import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/gpt-discovery-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const hookState = [];
let hookIndex = 0;
const effects = [];
const runtime = {
  account: undefined,
  gate: true,
  initialized: [],
  location: { hash: "", pathname: "/gpts", search: "", state: null },
  navigated: [],
  opened: [],
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
globalThis.__gptDiscoveryPage = { React, jsx, runtime };
globalThis.open = (url, target, features) =>
  runtime.opened.push({ url, target, features });

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__gptDiscoveryPage;",
    "export const $3=()=>r.runtime.initialized.push('jsx');export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
    "export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
    "export const fW='X-OpenAI-Attach-Auth';",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__gptDiscoveryPage;",
    "export const uht=()=>({data:r.runtime.account,isLoading:r.runtime.account==null});",
    "export const o_n=()=>((destination,options)=>r.runtime.navigated.push({destination,options}));",
    "export const i_n=()=>r.runtime.location;export const ofn=()=>r.runtime.gate;",
    "export const ytn=value=>'/g/'+encodeURIComponent(value);",
  ].join("\n"),
  "security-tabs":
    "const r=globalThis.__gptDiscoveryPage;export const n=()=>r.runtime.initialized.push('tabs');export const t=props=>({type:'tabs',props});",
  "skills-page-grid":
    "const runtimeState=globalThis.__gptDiscoveryPage;export const r=()=>runtimeState.runtime.initialized.push('grid');export const n=props=>({type:'loading-grid',props});export const t=props=>({type:'grid',props});",
  "card-tile":
    "const r=globalThis.__gptDiscoveryPage;export const n=()=>r.runtime.initialized.push('card');export const t=props=>({type:'card',props});",
  "directory-banner": "export {};",
  "gpt-about-dialog-core":
    "const r=globalThis.__gptDiscoveryPage;export const n=()=>r.runtime.initialized.push('dialog');export const t=props=>({type:'dialog',props});",
  "gpt-management-access": "export {};",
  "gpt-management-url":
    "const r=globalThis.__gptDiscoveryPage;export const n=()=>r.runtime.initialized.push('management-url');export const t=path=>'https://chatgpt.com'+path;",
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
      name: "gpt-discovery-page-mocks",
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
function render(props = {}) {
  hookIndex = 0;
  effects.length = 0;
  return module.GptDiscoveryPage(props);
}
function reset() {
  hookState.length = 0;
  hookIndex = 0;
  effects.length = 0;
  runtime.account = undefined;
  runtime.gate = true;
  runtime.location = { hash: "", pathname: "/gpts", search: "", state: null };
  runtime.navigated.length = 0;
  runtime.opened.length = 0;
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
}

deepEqual(Object.keys(module), ["GptDiscoveryPage"]);
deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "rolldown-runtime",
    "app-shared",
    "app-initial",
    "security-tabs",
    "skills-page-grid",
    "card-tile",
    "directory-banner",
    "gpt-about-dialog-core",
    "gpt-management-access",
    "gpt-management-url",
  ],
);
equal(/\bany\b/.test(source), false);
equal(
  /\b(?:appInitialChunk|appSharedChunk|runtimeChunk)\s*\./.test(source),
  false,
);
deepEqual(runtime.initialized, [
  "jsx",
  "tabs",
  "grid",
  "card",
  "dialog",
  "management-url",
]);
equal(source.includes("/public-api/gizmos/discovery"), true);
equal(source.includes("/workspace-resources/${input.accountId}/gizmos"), true);
equal(source.includes("/accounts/${accountId}/users"), true);
equal(source.includes('[attachAuthHeader]: "1"'), true);
equal(source.includes('limit: "10"'), true);
equal(source.includes('limit: "30"'), true);

let view = render();
equal(find(view, "spinner").props.label, "Loading GPTs");

const workspaceAccount = {
  id: "acct-1",
  structure: "workspace",
  plan_type: "team",
  account_user_role: "account-owner",
};
reset();
view = render({
  account: workspaceAccount,
  workspaceSnapshot: { loading: true },
});
equal(text(view).includes("Explore GPTs"), true);
equal(find(view, "loading-grid").props.label, "Loading workspace GPTs");
equal(find(view, "tabs").props.selectedKey, "workspace");
deepEqual(
  find(view, "tabs").props.tabs.map((tab) => tab.key),
  ["workspace", "public"],
);

find(view, "tabs").props.onSelect("public");
deepEqual(runtime.navigated.at(-1), {
  destination: { hash: "", pathname: "/gpts", search: "?view=public" },
  options: { replace: true },
});
find(view, "input").props.onChange({ target: { value: "  data  " } });
equal(runtime.navigated.at(-1).destination.search, "?search=data");

reset();
view = render({
  account: workspaceAccount,
  location: { pathname: "/gpts", search: "?view=public" },
  publicSnapshot: { error: "Discovery unavailable" },
});
equal(text(view).includes("Discovery unavailable"), true);
ok(find(view, "button", "Retry"));

reset();
view = render({
  account: workspaceAccount,
  location: { pathname: "/gpts", search: "?view=public" },
  publicSnapshot: { data: { cuts: [] } },
});
equal(text(view).includes("No GPTs available"), true);

const publicData = {
  workspace_filtered: true,
  cuts: [
    {
      name: "Top picks",
      display_group: "featured",
      items: [
        {
          gizmo: {
            id: "hidden",
            display_name: "Hidden",
            gizmo_type: "snorlax",
          },
        },
        {
          gizmo: {
            id: "writer",
            display_name: "Writer",
            gizmo_type: "gpt",
            description: "Draft copy",
            short_url: "writer-pro",
            author: { name: "Avery" },
            conversation_count: 1200,
          },
        },
      ],
    },
  ],
};
reset();
view = render({
  account: workspaceAccount,
  location: { pathname: "/gpts", search: "?view=public" },
  publicSnapshot: { data: publicData },
});
equal(text(view).includes("approved third-party GPTs"), true);
equal(text(view).includes("Top picks"), true);
equal(walk(view).filter((node) => node.type === "card").length, 1);
equal(find(view, "card").props.title, "Writer");
equal(
  find(view, "card").props.description.includes("1,200 conversations"),
  true,
);
equal(walk(view).filter((node) => node.type === "tabs").length, 2);

find(view, "card").props.onClick();
view = render({
  account: workspaceAccount,
  location: { pathname: "/gpts", search: "?view=public" },
  publicSnapshot: { data: publicData },
});
const dialog = find(view, "dialog");
ok(dialog);
dialog.props.onStartChat();
equal(runtime.navigated.at(-1).destination, "/g/writer-pro");

reset();
view = render({
  account: workspaceAccount,
  location: { pathname: "/gpts", search: "?view=public&search=charts" },
  publicSnapshot: { data: publicData },
});
equal(text(view).includes("Search results for “charts”"), true);
ok(
  walk(view).find(
    (node) => node.props?.["data-testid"] === "public-search-results",
  ),
);
equal(
  walk(view).some((node) => node.type === "card"),
  false,
);

reset();
view = render({
  account: workspaceAccount,
  workspaceSnapshot: { data: { gizmos: [] } },
});
equal(text(view).includes("No GPTs found"), true);
equal(text(view).includes("Categories"), true);
equal(
  walk(view).filter(
    (node) => node.type === "input" && node.props.type === "checkbox",
  ).length,
  7,
);

const workspacePage = {
  gizmos: [
    { id: "analyst", display_name: "Analyst", description: "Analyze data" },
  ],
  query_continuation: "next-2",
};
const workspaceCalls = [];
const workspaceService = {
  loadCreators: async () => ({ items: [], total: 0 }),
  loadPublic: async () => ({ cuts: [] }),
  loadWorkspace: async (input) => {
    workspaceCalls.push(input);
    return { gizmos: [{ id: "second", display_name: "Second" }] };
  },
};
reset();
view = render({
  account: workspaceAccount,
  service: workspaceService,
  workspaceSnapshot: { data: workspacePage },
});
equal(find(view, "card").props.title, "Analyst");
ok(find(view, "button", "Load more"));
find(view, "button", "Load more").props.onClick();
await flush();
equal(workspaceCalls.length, 1);
equal(workspaceCalls[0].continuation, "next-2");
equal(workspaceCalls[0].accountId, "acct-1");
deepEqual(workspaceCalls[0].categories, []);
deepEqual(workspaceCalls[0].creatorIds, []);

reset();
view = render({
  account: workspaceAccount,
  creatorsSnapshot: {
    data: { items: [{ account_user_id: "u1", name: "Morgan" }], total: 31 },
  },
  workspaceSnapshot: { data: workspacePage },
});
find(view, "button", "Creators").props.onClick();
view = render({
  account: workspaceAccount,
  creatorsSnapshot: {
    data: { items: [{ account_user_id: "u1", name: "Morgan" }], total: 31 },
  },
  workspaceSnapshot: { data: workspacePage },
});
equal(text(view).includes("Morgan"), true);
ok(find(view, "button", "Load more creators"));
ok(
  walk(view).find(
    (node) =>
      node.type === "input" && node.props["aria-label"] === "Search creators",
  ),
);

reset();
runtime.gate = true;
view = render({
  account: workspaceAccount,
  workspaceSnapshot: { data: workspacePage },
});
find(view, "button", "My GPTs").props.onClick();
equal(runtime.navigated.at(-1).destination, "/gpts/mine");

reset();
runtime.gate = false;
view = render({
  account: workspaceAccount,
  workspaceSnapshot: { data: workspacePage },
});
find(view, "button", "My GPTs").props.onClick();
deepEqual(runtime.opened.at(-1), {
  url: "https://chatgpt.com/gpts/mine",
  target: "_blank",
  features: "noopener,noreferrer",
});

reset();
const personalAccount = {
  id: "personal",
  structure: "personal",
  plan_type: "plus",
};
view = render({
  account: personalAccount,
  publicSnapshot: { data: publicData },
});
equal(find(view, "tabs").props.ariaLabel, "GPT categories");
equal(walk(view).filter((node) => node.type === "tabs").length, 1);

console.log(`${assertions} assertions passed`);
