import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(ROOT, "src/renderer/remote-conversation-page/index.ts"),
  "utf8",
);
const signals = { host: {}, task: {}, turn: {} };
const state = {
  hostId: "remote-1",
  hotkeyLayouts: [],
  initialized: 0,
  location: { state: null },
  navigations: [],
  params: { taskId: null },
  sends: [],
  task: { isLoading: true },
  turn: null,
};
const hooks = [];
let hookIndex = 0;
const React = {
  __clear() {
    hooks.length = 0;
    hookIndex = 0;
  },
  __reset() {
    hookIndex = 0;
  },
  useState(initial) {
    const index = hookIndex++;
    if (!(index in hooks))
      hooks[index] = typeof initial === "function" ? initial() : initial;
    return [
      hooks[index],
      (next) => {
        hooks[index] = typeof next === "function" ? next(hooks[index]) : next;
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
globalThis.__remoteConversationPage = { React, jsx, signals, state };

const sideEffects = [
  "ansi-block",
  "bookmarked-thread-user-message-navigation",
  "chat-tab-metadata-bridge",
  "conversation-blocks",
  "conversation-source",
  "local-conversation-turn",
  "preview-footer",
  "scroll-to-match",
  "thread-bridge",
  "user-message",
];
const mocks = Object.fromEntries(
  sideEffects.map((name) => [name, "export {};"]),
);
mocks["rolldown-runtime"] = "export {};";
mocks["app-shared"] = [
  "const r=globalThis.__remoteConversationPage;export const $3=()=>{r.state.initialized+=1};export const FX=()=>{r.state.initialized+=1};export const K2=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=()=>r.React;",
  "export const HX=signal=>signal===r.signals.host?r.state.hostId:signal===r.signals.task?r.state.task:signal===r.signals.turn?r.state.turn:null;",
].join("\n");
mocks["app-initial"] =
  "const r=globalThis.__remoteConversationPage;export const PZt=r.signals.host;export const Vmt=r.signals.task;export const Bmt=r.signals.turn;export const l_n=()=>r.state.params;export const i_n=()=>r.state.location;export const e8t=()=>(destination,options)=>r.state.navigations.push({destination,options});";
mocks["app-primary"] =
  "const r=globalThis.__remoteConversationPage;export const d=()=>{r.state.initialized+=1};";
mocks["document-title"] =
  "const runtime=globalThis.__remoteConversationPage;export const r=()=>{runtime.state.initialized+=1};export const t=props=>({type:'document-title',props});";
mocks["thread-app-shell-chrome"] =
  "const runtime=globalThis.__remoteConversationPage;export const n=()=>{runtime.state.initialized+=1};export const t=props=>({type:'thread-app-shell',props});";
mocks["thread-emoji"] =
  "const runtime=globalThis.__remoteConversationPage;export const n=()=>{runtime.state.initialized+=1};export const t=props=>({type:'thread-emoji',props});";
mocks["thread-scroll-layout"] =
  "const runtime=globalThis.__remoteConversationPage;export const n=()=>{runtime.state.initialized+=1};export const t=props=>({type:'thread-scroll-layout',props});";
mocks["right-panel-composer-overlay"] =
  "const runtime=globalThis.__remoteConversationPage;export const n=()=>{runtime.state.initialized+=1};export const t=props=>({type:'composer-overlay',props});";
mocks["use-hotkey-window-detail-layout"] =
  "const runtime=globalThis.__remoteConversationPage;export const n=()=>{runtime.state.initialized+=1};export const r=layout=>runtime.state.hotkeyLayouts.push(layout);";

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/remote-conversation-page/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "remote-conversation-page-mocks",
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

function render(props = {}, { clear = false } = {}) {
  if (clear) React.__clear();
  else React.__reset();
  return module.RemoteConversationPage(props);
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
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function button(view, label) {
  return walk(view).find(
    (node) => node.type === "button" && textContent(node) === label,
  );
}
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

const expectedDependencies = [
  "ansi-block",
  "app-initial",
  "app-primary",
  "app-shared",
  "bookmarked-thread-user-message-navigation",
  "chat-tab-metadata-bridge",
  "conversation-blocks",
  "conversation-source",
  "document-title",
  "local-conversation-turn",
  "preview-footer",
  "right-panel-composer-overlay",
  "rolldown-runtime",
  "scroll-to-match",
  "thread-app-shell-chrome",
  "thread-bridge",
  "thread-emoji",
  "thread-scroll-layout",
  "use-hotkey-window-detail-layout",
  "user-message",
];
assert.deepEqual(Object.keys(module), ["RemoteConversationPage"]);
assert.deepEqual(
  [...source.matchAll(/@rchunk\/([^"]+)/g)].map((match) => match[1]).sort(),
  expectedDependencies.sort(),
);
assert.equal(
  /\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|documentTitleChunk|rightPanelComposerChunk|threadAppShellChunk|threadEmojiChunk|threadScrollLayoutChunk|hotkeyLayoutChunk)\s*\./.test(
    source,
  ),
  false,
);
assert.equal(/\bany\b/.test(source), false);
assert.equal(state.initialized, 10);

let view = render({}, { clear: true });
assert.equal(view.props.role, "alert");
assert.equal(textContent(view).includes("Conversation not found"), true);
assert.equal(walk(view).find((node) => node.type === "a").props.href, "/");
assert.equal(state.hotkeyLayouts.at(-1), null);

state.params = { taskId: "task-1" };
state.task = { isLoading: true };
view = render({}, { clear: true });
assert.equal(view.props.role, "status");
assert.equal(textContent(view), "Loading conversation…");

let retries = 0;
state.task = {
  isError: true,
  error: new Error("offline"),
  refetch: () => {
    retries += 1;
  },
};
view = render({}, { clear: true });
assert.equal(view.props.role, "alert");
assert.equal(
  textContent(view).includes("Conversation couldn't be loaded"),
  true,
);
button(view, "Retry").props.onClick();
assert.equal(retries, 1);

let exitPreview = 0;
let resolveSend;
const pendingSend = new Promise((resolve) => {
  resolveSend = resolve;
});
state.task = {
  data: {
    hasPatch: true,
    task: {
      title: "Remote build",
      task_status_display: { environment_label: "Cloud box" },
    },
    transcript: ["User request", "Assistant response"],
  },
  isLoading: false,
  onExitArchivedPreview: () => {
    exitPreview += 1;
  },
  onSend: async (message) => {
    state.sends.push(message);
    await pendingSend;
  },
};
state.turn = { turn_status: "in_progress" };
state.location = { state: null };
view = render({}, { clear: true });
assert.equal(
  walk(view).find((node) => node.type === "document-title").props.title,
  "Remote build",
);
const shell = walk(view).find((node) => node.type === "thread-app-shell");
assert.equal(shell.props.threadType, "remote");
assert.equal(shell.props.showReviewTab, true);
const header = walk(view).find((node) => node.type === "header");
assert.equal(textContent(header).includes("Remote build"), true);
assert.equal(textContent(header).includes("Cloud box"), true);
assert.equal(
  walk(header).some(
    (node) => node.type === "thread-emoji" && node.props.threadId === "task-1",
  ),
  true,
);
assert.equal(textContent(view).includes("User request"), true);
assert.equal(textContent(view).includes("Response in progress…"), true);
assert.notEqual(
  walk(view).find((node) => node.type === "composer-overlay"),
  undefined,
);
button(view, "Open review").props.onClick();
view = render();
assert.equal(
  walk(view).find((node) => node.type === "aside").props["aria-label"],
  "Review changes",
);
button(view, "Close review").props.onClick();
view = render();
assert.equal(
  walk(view).find((node) => node.type === "aside"),
  undefined,
);

let textarea = walk(view).find((node) => node.type === "textarea");
assert.equal(button(view, "Send").props.disabled, true);
textarea.props.onChange({ currentTarget: { value: "Ship the fix" } });
view = render();
assert.equal(button(view, "Send").props.disabled, false);
const form = walk(view).find((node) => node.type === "form");
let prevented = false;
form.props.onSubmit({
  preventDefault: () => {
    prevented = true;
  },
});
assert.equal(prevented, true);
assert.equal(state.sends.at(-1), "Ship the fix");
view = render();
assert.equal(button(view, "Sending…").props.disabled, true);
resolveSend();
await flush();
view = render();
assert.equal(button(view, "Send").props.disabled, true);

state.task = {
  data: {
    hasPatch: true,
    task: {
      title: "Remote build",
      task_status_display: { environment_label: "Cloud box" },
    },
    turns: [
      {
        activeId: "a1",
        userTurn: {
          id: "u1",
          input_items: [
            {
              type: "message",
              content: [{ content_type: "text", text: "Structured request" }],
            },
            { type: "image", asset_pointer: "asset://one" },
          ],
        },
        assistantTurns: [
          {
            id: "a1",
            turn_status: "completed",
            output_items: [
              {
                type: "message",
                content: [
                  { content_type: "text", text: "Structured response" },
                ],
              },
              {
                type: "pr",
                pr_title: "Ship PR",
                url: "https://example.com/pr/1",
              },
              { type: "output_diff", diff: "+fixed" },
            ],
          },
        ],
      },
    ],
  },
  isLoading: false,
  onExitArchivedPreview: () => {
    exitPreview += 1;
  },
};
state.turn = { turn_status: "completed" };
view = render({}, { clear: true });
assert.equal(textContent(view).includes("Structured request"), true);
assert.equal(textContent(view).includes("Structured response"), true);
assert.equal(textContent(view).includes("Image attachment"), true);
assert.equal(
  walk(view).some(
    (node) => node.props?.["data-remote-output"] === "pull-request",
  ),
  true,
);
assert.equal(
  walk(view).some((node) => node.props?.["data-remote-output"] === "diff"),
  true,
);

state.location = { state: { archivedConversationPreview: true } };
state.turn = { turn_status: "completed" };
view = render({}, { clear: true });
assert.equal(textContent(view).includes("Archived conversation preview"), true);
assert.equal(
  textContent(
    walk(view).find((node) => node.type === "thread-scroll-layout").props
      .footer,
  ),
  "Archived conversations are read-only",
);
assert.equal(
  walk(view).some((node) => node.type === "textarea"),
  false,
);
assert.equal(
  walk(view).find((node) => node.type === "thread-app-shell"),
  undefined,
);
assert.equal(textContent(view).includes("Response in progress…"), false);
button(view, "Exit preview").props.onClick();
assert.equal(exitPreview, 1);
assert.equal(state.navigations.at(-1).destination, "/");

state.location = { state: null };
view = render({ variant: "hotkey" }, { clear: true });
assert.equal(
  walk(view).some((node) => node.type === "thread-app-shell"),
  false,
);
assert.notEqual(
  walk(view).find(
    (node) => node.props?.className === "remote-conversation-hotkey",
  ),
  undefined,
);
assert.deepEqual(state.hotkeyLayouts.at(-1), {
  mainWindowPath: "/remote/task-1",
  title: "Remote build · Cloud box",
});
assert.notEqual(
  walk(view).find((node) => node.type === "composer-overlay"),
  undefined,
);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " remote conversation page assertions passed");
