import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/queued-message-list/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const quickChatContext = { name: "quick-chat" };
const state = {
  initialized: 0,
  quickChat: false,
  sortable: new Map(),
};
const React = {
  useContext(context) {
    assert.equal(context, quickChatContext);
    return { isQuickChatFloatingSurface: state.quickChat };
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
globalThis.__queuedMessageList = { React, jsx, quickChatContext, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__queuedMessageList;",
    "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const n4=()=>({formatMessage:(descriptor,values={})=>String(descriptor.defaultMessage).replace('{count}',values.count??'').replace('#',values.count??'')});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__queuedMessageList;",
    "export const $Sn=()=>{runtime.state.initialized+=1};export const bet=()=>{runtime.state.initialized+=1};export const $Z=runtime.quickChatContext;",
    "export const Set='vertical-list';export const XSn='keyboard';export const ZSn='closest-center';export const iCn='pointer';",
    "export const aCn=(...sensors)=>sensors;export const cCn=(sensor,options)=>({sensor,options});",
    "export const oCn={Translate:{toString:value=>value==null?undefined:'translate('+value.x+'px,'+value.y+'px)'}};",
    "export const vet=(items,from,to)=>{const next=[...items];next.splice(to,0,next.splice(from,1)[0]);return next};",
    "export const xet=({id,disabled})=>runtime.state.sortable.get(id)??({attributes:{'data-sort-id':id},listeners:{onPointerDown(){ }},setActivatorNodeRef(){},setNodeRef(){},transform:null,transition:undefined,isDragging:false,disabled});",
    "export const qSn=props=>({type:'dnd-context',props});export const _et=props=>({type:'sortable-context',props});",
  ].join("\n"),
  "app-primary":
    "export const Lo=()=>{globalThis.__queuedMessageList.state.initialized+=1};export const Yp=()=>{globalThis.__queuedMessageList.state.initialized+=1};",
  "modifiers.esm": [
    "export const i='parent';export const n='vertical';",
    "export const t=(items,from,to)=>{const next=[...items];next.splice(to,0,next.splice(from,1)[0]);return next};",
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
  plugins: [
    {
      name: "queued-message-list-mocks",
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
function findButton(view, label) {
  return walk(view).find(
    (node) => node.type === "button" && text(node) === label,
  );
}
function event() {
  return {
    stopped: false,
    stopPropagation() {
      this.stopped = true;
    },
  };
}
function message(id, value, context = {}) {
  return {
    id,
    text: value,
    context: { imageAttachments: [], ...context },
  };
}
const calls = {
  deletes: [],
  edits: [],
  opened: [],
  queueing: [],
  reorder: [],
  resume: 0,
  sends: [],
};
function props(messages, overrides = {}) {
  return {
    editingMessageId: null,
    hostId: "host-1",
    isInterrupted: false,
    isMessagePaused: (reason) => reason === "failed",
    isQueueingEnabled: true,
    isSendNowDisabled: false,
    messages,
    onDeleteMessage: (id) => calls.deletes.push(id),
    onEditMessage: (id) => calls.edits.push(id),
    onOpenInSideChatMessage: (id) => calls.opened.push(id),
    onQueueingChange: (enabled) => calls.queueing.push(enabled),
    onReorderMessages: (ids) => calls.reorder.push(ids),
    onResumeInterruptedQueue: () => {
      calls.resume += 1;
    },
    onSendNowMessage: (id) => calls.sends.push(id),
    ...overrides,
  };
}

assert.deepEqual(Object.keys(module), ["QueuedMessageList"]);
assert.equal(state.initialized, 5);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "app-initial",
    "app-primary",
    "app-shared",
    "modifiers.esm",
    "rolldown-runtime",
  ],
);
assert.equal(
  /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|modifiersChunk|runtimeChunk)\s*\./.test(
    source,
  ),
  false,
);
assert.equal(/\bany\b/.test(source), false);
assert.equal(module.QueuedMessageList(props([])), null);

let view = module.QueuedMessageList(
  props([message("m1", "First queued message")]),
);
assert.equal(view.props["data-variant"], "default");
assert.equal(text(view).includes("First queued message"), true);
assert.equal(findButton(view, "Steer").props.disabled, false);
let click = event();
findButton(view, "Steer").props.onClick(click);
assert.equal(click.stopped, true);
assert.deepEqual(calls.sends, ["m1"]);
click = event();
findButton(view, "Delete").props.onClick(click);
assert.deepEqual(calls.deletes, ["m1"]);
findButton(view, "Edit message").props.onClick(event());
findButton(view, "Open in side chat").props.onClick(event());
findButton(view, "Turn off queueing").props.onClick(event());
assert.deepEqual(calls.edits, ["m1"]);
assert.deepEqual(calls.opened, ["m1"]);
assert.deepEqual(calls.queueing, [false]);

view = module.QueuedMessageList(
  props([{ ...message("m1", "Retry me"), pausedReason: "failed" }], {
    isSendNowDisabled: true,
    editingMessageId: "m1",
  }),
);
assert.equal(
  text(view).includes("This queued message could not be sent"),
  true,
);
assert.equal(findButton(view, "Retry").props.disabled, true);
assert.equal(
  walk(view).find((node) => node.props?.["data-message-id"] === "m1").props
    .className,
  "opacity-60",
);

view = module.QueuedMessageList(
  props([message("m1", "one"), message("m2", "two")], { isInterrupted: true }),
);
assert.equal(text(view).includes("Queue paused because you interrupted"), true);
findButton(view, "Resume").props.onClick();
assert.equal(calls.resume, 1);
assert.equal(
  walk(view).filter(
    (node) => node.props?.["aria-label"] === "Reorder queued message",
  ).length,
  2,
);
const dnd = walk(view).find((node) => node.type === "dnd-context");
assert.deepEqual(dnd.props.modifiers, ["vertical", "parent"]);
dnd.props.onDragEnd({ active: { id: "m1" }, over: { id: "m2" } });
assert.deepEqual(calls.reorder, [["m2", "m1"]]);
dnd.props.onDragEnd({ active: { id: "m1" }, over: null });
assert.equal(calls.reorder.length, 1);

view = module.QueuedMessageList(
  props([message("code", "```ts\nconst value = 1;\n```")]),
);
assert.equal(text(view).includes("const value = 1;"), true);
assert.equal(text(view).includes("```"), false);

view = module.QueuedMessageList(
  props([
    message("image", "", {
      imageAttachments: [{ src: "image.png", previewSrc: "preview.png" }],
    }),
  ]),
);
assert.equal(
  walk(view).find((node) => node.type === "img").props.src,
  "preview.png",
);
assert.equal(text(view).includes("1 image"), true);

view = module.QueuedMessageList(
  props([
    message("paste", "", {
      pastedTextAttachments: [{ preview: "Snippet" }, {}],
    }),
  ]),
);
assert.equal(
  text(view).includes("Snippet (+1 more pasted text attachments)"),
  true,
);

view = module.QueuedMessageList(
  props([
    message("selection", "", {
      selectedTextAttachments: [
        { source: { kind: "file" } },
        { source: { kind: "file" } },
      ],
    }),
  ]),
);
assert.equal(text(view).includes("2 selections"), true);

view = module.QueuedMessageList(
  props([
    message("comments", "", {
      commentAttachments: [{ kind: "annotation", comments: [{}, {}] }],
      responseTextAnnotations: [{}],
    }),
  ]),
);
assert.equal(text(view).includes("3 comments"), true);

view = module.QueuedMessageList(
  props([
    message("pr", "Please update", {
      selectedTextAttachments: [
        {
          source: {
            kind: "pull-request-action",
            hostId: "local",
            title: "Feature",
            pullRequest: {
              hostname: "github.com",
              number: 4,
              owner: "openai",
              repository: "codex",
            },
          },
        },
      ],
    }),
  ]),
);
assert.equal(
  text(view).includes(
    "Pull latest · Feature · openai/codex (local) — Please update",
  ),
  true,
);

view = module.QueuedMessageList(
  props([
    message("appshot", "", { appshotContexts: [{ imagePath: "appshot.png" }] }),
  ]),
);
assert.equal(
  walk(view).find((node) => node.type === "img").props.src,
  "appshot.png",
);

view = module.QueuedMessageList(
  props([
    message("mcp", "", {
      mcpAppModelContextAttachments: [
        { imageAttachments: [{ src: "mcp.png" }] },
      ],
    }),
  ]),
);
assert.equal(
  walk(view).find((node) => node.type === "img").props.src,
  "mcp.png",
);

state.quickChat = true;
view = module.QueuedMessageList(
  props([message("inline", "Inline")], {
    isQueueingEnabled: false,
    onOpenInSideChatMessage: null,
  }),
);
assert.equal(view.props["data-variant"], "inline");
assert.equal(findButton(view, "Turn on queueing") != null, true);
assert.equal(findButton(view, "Open in side chat"), undefined);

console.log("38 queued message list assertions passed");
