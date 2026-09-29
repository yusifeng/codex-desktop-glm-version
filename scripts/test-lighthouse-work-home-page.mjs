import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/lighthouse-work-home-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const hookState = [];
let hookIndex = 0;
const effects = [];
const runtime = {
  account: undefined,
  connectCalls: [],
  connectingApp: null,
  initialized: [],
  navigated: [],
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
globalThis.__lighthouseWork = { React, jsx, runtime };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__lighthouseWork;",
    "export const $3=()=>r.runtime.initialized.push('jsx');export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
    "export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__lighthouseWork;",
    "export const uht=()=>({data:r.runtime.account,isLoading:r.runtime.account==null});",
    "export const o_n=()=>((destination,options)=>r.runtime.navigated.push({destination,options}));",
  ].join("\n"),
  "app-primary": "export {};",
  "home-suggestion-list":
    "const r=globalThis.__lighthouseWork;export const n=()=>r.runtime.initialized.push('list');export const t=props=>({type:'suggestion-list',props});",
  "app-connect-modal":
    "const r=globalThis.__lighthouseWork;export const n=()=>r.runtime.initialized.push('modal');export const t=props=>({type:'connect-modal',props});",
  "use-app-connect-flow": [
    "const r=globalThis.__lighthouseWork;",
    "export const t=()=>r.runtime.initialized.push('connect-flow');",
    "export const n=()=>({connectingApp:r.runtime.connectingApp,clearConnectingApp:()=>{r.runtime.connectingApp=null},handleConnectApp:async(app,options)=>{r.runtime.connectingApp=app;r.runtime.connectCalls.push({app,options})},handleAppConnectOAuthStarted:()=>{}});",
  ].join("\n"),
  "chatgpt-tasks-runtime": "export {};",
  "home-task-suggestions-core": "export {};",
  "chatgpt-work-home-page-core":
    "const r=globalThis.__lighthouseWork;export const n=()=>r.runtime.initialized.push('core');export const t=props=>({type:'work-core',props:{...props,children:props.renderHomeContent?.({setPrompt:()=>{}})}});",
  "chatgpt-user-context": "export {};",
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
      name: "lighthouse-work-home-page-mocks",
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
  runtime.account = undefined;
  runtime.connectCalls.length = 0;
  runtime.connectingApp = null;
  runtime.navigated.length = 0;
}
function render(props = {}) {
  hookIndex = 0;
  effects.length = 0;
  return module.LighthouseWorkHomePage(props);
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

deepEqual(Object.keys(module), ["LighthouseWorkHomePage"]);
deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "rolldown-runtime",
    "app-shared",
    "app-initial",
    "app-primary",
    "home-suggestion-list",
    "app-connect-modal",
    "use-app-connect-flow",
    "chatgpt-tasks-runtime",
    "home-task-suggestions-core",
    "chatgpt-work-home-page-core",
    "chatgpt-user-context",
  ],
);
equal(/\bany\b/.test(source), false);
equal(
  /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|runtimeChunk)\s*\./.test(
    source,
  ),
  false,
);
deepEqual(runtime.initialized, [
  "jsx",
  "list",
  "modal",
  "connect-flow",
  "core",
]);
equal(source.includes("/composer/items/interactions"), true);
equal(source.includes("/composer/items?limit=20&entrypoint=work"), true);
equal(source.includes("/inbox/items?unread_only=true&limit=100"), true);

const composer = { id: "composer" };
let view = render({
  composer,
  takeoverTarget: { type: "takeover", props: {} },
});
equal(text(view).includes("Loading Work…"), true);
ok(find(view, "spinner"));
ok(walk(view).find((node) => node.props?.["data-testid"] === "work-composer"));
ok(find(view, "takeover"));

reset();
view = render({ canUseWork: false, composer });
equal(text(view).includes("don't have access to Work"), true);
equal(
  walk(view).filter((node) => node.props?.["data-testid"] === "work-composer")
    .length,
  1,
);
equal(find(view, "work-core"), undefined);

const account = {
  id: "workspace-1",
  structure: "workspace",
  plan_type: "team",
};
const emptySnapshot = { data: [], loading: false };
const serviceCalls = {
  dismiss: [],
  interactions: [],
  loadConversations: [],
  loadSuggestions: [],
};
const service = {
  async dismissConversation(accountId, item) {
    serviceCalls.dismiss.push({ accountId, item });
  },
  async loadConversations(accountId, workspaceId) {
    serviceCalls.loadConversations.push({ accountId, workspaceId });
    return [];
  },
  async loadSuggestions(accountId) {
    serviceCalls.loadSuggestions.push(accountId);
    return [];
  },
  async recordSuggestionInteraction(item, interaction) {
    serviceCalls.interactions.push({ id: item.id, interaction });
  },
};

reset();
view = render({
  account,
  composer,
  conversationsSnapshot: emptySnapshot,
  displayName: "Avery Morgan",
  service,
  suggestionsSnapshot: emptySnapshot,
});
ok(find(view, "work-core"));
equal(text(view).includes("Good "), true);
equal(text(view).includes("Avery"), true);
equal(text(view).includes("What would you like to work on?"), true);
equal(find(view, "suggestion-list").props.items.length, 0);

reset();
view = render({
  account,
  composer,
  conversationsSnapshot: emptySnapshot,
  displayName: "12345",
  service,
  suggestionsSnapshot: emptySnapshot,
});
equal(text(view).includes("12345"), false);

const conversations = Array.from({ length: 7 }, (_, index) => ({
  id: `conversation-${index + 1}`,
  title: index === 0 ? "Quarterly plan" : `Chat ${index + 1}`,
  summary: index === 0 ? "Draft ready" : null,
  activityText: index === 1 ? "Checking sources" : null,
  running: index === 1,
  recencyAt: 100 - index,
  backend: index === 6 ? "app-server" : "chatgpt",
}));
reset();
view = render({
  account,
  composer,
  conversationsSnapshot: { data: conversations, error: "refresh-error" },
  service,
  suggestionsSnapshot: emptySnapshot,
});
equal(text(view).includes("You have 7 chats to check in on"), true);
equal(text(view).includes("Some chats couldn't be refreshed"), true);
let lists = walk(view).filter((node) => node.type === "suggestion-list");
equal(lists[0].props.items.length, 5);
equal(lists[0].props.items[0].label, "Quarterly plan · Draft ready");
equal(lists[0].props.items[1].label, "Chat 2 · Checking sources");
equal(lists[0].props.items[1].onDismiss, undefined);
ok(find(view, "button", "2 more"));
find(view, "button", "2 more").props.onClick();
view = render({
  account,
  composer,
  conversationsSnapshot: { data: conversations },
  service,
  suggestionsSnapshot: emptySnapshot,
});
lists = walk(view).filter((node) => node.type === "suggestion-list");
equal(lists[0].props.items.length, 7);
ok(find(view, "button", "Show less"));

lists[0].props.items[0].onClick();
equal(runtime.navigated.at(-1).destination, "/c/conversation-1");
await flush();
equal(serviceCalls.dismiss.at(-1).item.id, "conversation-1");

reset();
const openedLocal = [];
view = render({
  account,
  composer,
  conversationsSnapshot: { data: [conversations[6]] },
  onOpenLocalConversation: (item) => openedLocal.push(item.id),
  service,
  suggestionsSnapshot: emptySnapshot,
});
find(view, "suggestion-list").props.items[0].onClick();
deepEqual(openedLocal, ["conversation-7"]);

const suggestions = [
  {
    id: "prompt",
    item_type: "task_suggestion",
    title: "Draft update",
    producer: "tasks",
    destination_metadata: {
      type: "prompt",
      prompt: "Draft an update",
      developer_message: "Use concise prose",
    },
  },
  {
    id: "connector",
    item_type: "plugin_activation_suggestion",
    action_type: "connect_connector",
    title: "Calendar",
    description: "Connect Calendar",
    destination_metadata: { type: "connector", connector_id: "calendar" },
  },
  {
    id: "conversation",
    item_type: "automation_suggestion",
    title: "Review automation",
    destination_metadata: { type: "conversation", conversation_id: "target-9" },
  },
  {
    id: "fourth",
    item_type: "task_suggestion",
    title: "Fourth",
    destination_metadata: { type: "prompt", prompt: "Fourth prompt" },
  },
  {
    id: "ignored",
    item_type: "unread_automation",
    title: "Ignored",
    destination_metadata: { type: "conversation", conversation_id: "ignored" },
  },
  { id: "missing", item_type: "task_suggestion", title: "Missing" },
];
const composerCalls = { set: [], submit: [] };
const interactiveComposer = {
  setText(value) {
    composerCalls.set.push(value);
  },
  async submit(options) {
    composerCalls.submit.push(options);
  },
};
reset();
view = render({
  account,
  composer: interactiveComposer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsSnapshot: { data: suggestions, error: "refresh-error" },
});
equal(text(view).includes("Suggested for you"), true);
equal(text(view).includes("Suggestions couldn't be refreshed"), true);
lists = walk(view).filter((node) => node.type === "suggestion-list");
equal(lists[1].props.items.length, 3);
equal(lists[1].props.items[1].label, "Connect Calendar");
equal(lists[1].props.items[1].trailing, "Connect");
lists[1].props.items[0].onClick();
await flush();
deepEqual(composerCalls.set, ["Draft an update"]);
deepEqual(composerCalls.submit, [
  { developerInstructions: "Use concise prose" },
]);
deepEqual(serviceCalls.interactions.at(-1), {
  id: "prompt",
  interaction: "clicked",
});

reset();
view = render({
  account,
  composer: interactiveComposer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsSnapshot: { data: suggestions },
});
lists = walk(view).filter((node) => node.type === "suggestion-list");
lists[1].props.items[2].onClick();
await flush();
equal(runtime.navigated.at(-1).destination, "/c/target-9");

reset();
view = render({
  account,
  composer: interactiveComposer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsSnapshot: { data: suggestions },
});
lists = walk(view).filter((node) => node.type === "suggestion-list");
lists[1].props.items[1].onClick();
await flush();
deepEqual(runtime.connectCalls.at(-1), {
  app: { id: "calendar", name: "Calendar" },
  options: { forceInApp: true },
});
view = render({
  account,
  composer: interactiveComposer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsSnapshot: { data: suggestions },
});
equal(find(view, "connect-modal").props.app.id, "calendar");

reset();
view = render({
  account,
  composer: interactiveComposer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsSnapshot: { data: suggestions },
});
lists = walk(view).filter((node) => node.type === "suggestion-list");
lists[1].props.items[0].onDismiss();
await flush();
deepEqual(serviceCalls.interactions.at(-1), {
  id: "prompt",
  interaction: "dismissed",
});
view = render({
  account,
  composer: interactiveComposer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsSnapshot: { data: suggestions },
});
lists = walk(view).filter((node) => node.type === "suggestion-list");
equal(
  lists[1].props.items.some((item) => item.id === "prompt"),
  false,
);

reset();
view = render({
  account,
  composer,
  conversationsSnapshot: emptySnapshot,
  homepageTakeover: true,
  service,
  suggestionsSnapshot: { data: suggestions },
  takeoverTarget: { type: "takeover", props: { label: "Welcome" } },
});
equal(text(view).includes("Suggested for you"), false);
ok(find(view, "takeover"));
ok(walk(view).find((node) => node.props?.["data-testid"] === "work-composer"));

reset();
view = render({
  account,
  composer,
  conversationsSnapshot: emptySnapshot,
  service,
  suggestionsAllowed: false,
  suggestionsSnapshot: { data: suggestions },
});
equal(text(view).includes("Suggested for you"), false);
equal(walk(view).filter((node) => node.type === "suggestion-list").length, 1);

console.log(`${assertions} assertions passed`);
