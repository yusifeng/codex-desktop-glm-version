import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/standalone-elicitation-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const hookState = [];
let hookIndex = 0;
const effects = [];
const runtime = {
  hostId: "host-1",
  initialized: [],
  reloads: 0,
  searchParams: new URLSearchParams("thread_id=thread-1&request_id=request-1"),
  userId: "user-1",
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
globalThis.__standaloneElicitation = { React, jsx, runtime };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__standaloneElicitation;",
    "export const $3=()=>r.runtime.initialized.push('jsx');export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
    "export const HX=signal=>signal();export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__standaloneElicitation;",
    "export const d_n=()=>[r.runtime.searchParams,()=>{}];export const mun=()=>r.runtime.hostId;export const _un=()=>r.runtime.userId;",
  ].join("\n"),
  "app-primary": "export {};",
  "page-layout":
    "const r=globalThis.__standaloneElicitation;export const n=()=>r.runtime.initialized.push('layout');export const t=props=>({type:'page-layout',props});",
  "mcp-server-elicitation-request-panel":
    "const r=globalThis.__standaloneElicitation;export const n=()=>r.runtime.initialized.push('panel');export const t=props=>({type:'elicitation-panel',props});",
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
      name: "standalone-elicitation-page-mocks",
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
  runtime.hostId = "host-1";
  runtime.userId = "user-1";
  runtime.searchParams = new URLSearchParams(
    "thread_id=thread-1&request_id=request-1",
  );
  runtime.reloads = 0;
}
function render(props = {}) {
  hookIndex = 0;
  effects.length = 0;
  return module.StandaloneElicitationPage(props);
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

deepEqual(Object.keys(module), ["StandaloneElicitationPage"]);
deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "rolldown-runtime",
    "app-shared",
    "app-initial",
    "app-primary",
    "page-layout",
    "mcp-server-elicitation-request-panel",
  ],
);
equal(/\bany\b/.test(source), false);
equal(
  /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|runtimeChunk)\s*\./.test(
    source,
  ),
  false,
);
deepEqual(runtime.initialized, ["jsx", "layout", "panel"]);
equal(source.includes("/flora/browser/form-fill"), true);
equal(source.includes("challenge_id"), true);
equal(source.includes("selected_option"), true);

let view = render({
  reload: () => {
    runtime.reloads++;
  },
  searchParams: new URLSearchParams(),
});
equal(text(view).includes("no longer available"), true);
find(view, "button", "Check again").props.onClick();
equal(runtime.reloads, 1);

reset();
view = render({ hostId: null });
equal(text(view).includes("no longer available"), true);
reset();
view = render({ userId: null });
equal(text(view).includes("no longer available"), true);

reset();
view = render({ connectionStatus: "connecting" });
equal(text(view).includes("Connecting to your request…"), true);
ok(find(view, "spinner"));

reset();
view = render({
  connectionStatus: "unavailable",
  reload: () => {
    runtime.reloads++;
  },
});
equal(text(view).includes("already be answered or cancelled"), true);
find(view, "button", "Check again").props.onClick();
equal(runtime.reloads, 1);

const genericRequest = {
  requestId: "request-1",
  elicitation: { kind: "form", title: "Choose a region" },
};
reset();
view = render({
  connectionStatus: "ready",
  pendingRequest: genericRequest,
});
equal(find(view, "page-layout").props.title, "Continue your request");
equal(find(view, "page-layout").props.showFooter, false);
deepEqual(find(view, "elicitation-panel").props, {
  conversationId: "thread-1",
  hostId: "host-1",
  pendingRequest: genericRequest,
});

const browserRequest = {
  requestId: "request-1",
  elicitation: {
    kind: "browserAuth",
    challengeId: "challenge-1",
    browserAuth: {
      origin: "https://www.example.com",
      fields: [
        { id: "email", label: "Email", required: true, type: "email" },
        { id: "password", label: "Password", required: true, type: "password" },
      ],
    },
  },
};
const calls = { replies: [], submissions: [] };
const service = {
  async reply(input) {
    calls.replies.push(input);
  },
  async submitBrowserAuth(input) {
    calls.submissions.push(input);
    return "submitted";
  },
};
reset();
view = render({
  connectionStatus: "ready",
  pendingRequest: browserRequest,
  service,
});
equal(text(view).includes("Sign in to example.com"), true);
equal(text(view).includes("https://www.example.com"), true);
equal(text(view).includes("password isn't stored"), true);
equal(find(view, "button", "Sign in").props.disabled, true);
equal(find(view, "button", "Skip").props.disabled, false);
const inputs = walk(view).filter((node) => node.type === "input");
equal(inputs.length, 2);
equal(inputs[1].props.type, "password");
inputs[0].props.onChange({ target: { value: "user@example.com" } });
inputs[1].props.onChange({ target: { value: "secret" } });
view = render({
  connectionStatus: "ready",
  pendingRequest: browserRequest,
  service,
});
equal(find(view, "button", "Sign in").props.disabled, false);
find(view, "button", "Show").props.onClick();
view = render({
  connectionStatus: "ready",
  pendingRequest: browserRequest,
  service,
});
equal(walk(view).filter((node) => node.type === "input")[1].props.type, "text");
equal(find(view, "button", "Hide").props["aria-label"], "Hide password");
find(view, "form").props.onSubmit({ preventDefault() {} });
await flush();
equal(calls.submissions.length, 1);
deepEqual(calls.submissions[0], {
  challengeId: "challenge-1",
  conversationId: "thread-1",
  fields: {
    email: { value: "user@example.com" },
    password: { value: "secret" },
  },
  selectedOption: undefined,
});
equal(calls.replies[0].action, "accept");
view = render({
  connectionStatus: "ready",
  pendingRequest: browserRequest,
  service,
});
equal(text(view).includes("Signing in to example.com"), true);
equal(text(view).includes("return to your conversation"), true);

reset();
calls.replies.length = 0;
view = render({
  connectionStatus: "ready",
  pendingRequest: browserRequest,
  service,
});
find(view, "button", "Skip").props.onClick();
await flush();
equal(calls.replies[0].action, "decline");
view = render({
  connectionStatus: "ready",
  pendingRequest: browserRequest,
  service,
});
equal(text(view).includes("Sign-in skipped"), true);

const optionRequest = {
  requestId: "request-2",
  elicitation: {
    kind: "browserAuth",
    challengeId: "challenge-2",
    browserAuth: {
      origin: "https://login.example.org",
      fields: [
        { id: "token", label: "API token", required: true, type: "password" },
      ],
      options: [
        { id: "token", label: "Use API token", fieldIds: ["token"] },
        { id: "continue", label: "Continue in browser", fieldIds: [] },
      ],
    },
  },
};
reset();
view = render({
  connectionStatus: "ready",
  pendingRequest: optionRequest,
  service,
});
equal(text(view).includes("Use API token"), true);
equal(text(view).includes("Continue in browser"), true);
equal(walk(view).filter((node) => node.type === "input").length, 0);
find(view, "button", "Use API token").props.onClick();
view = render({
  connectionStatus: "ready",
  pendingRequest: optionRequest,
  service,
});
equal(walk(view).filter((node) => node.type === "input").length, 1);
ok(find(view, "button", "Change sign-in method"));
equal(find(view, "button", "Cancel").props.disabled, false);
find(view, "button", "Change sign-in method").props.onClick();
view = render({
  connectionStatus: "ready",
  pendingRequest: optionRequest,
  service,
});
equal(walk(view).filter((node) => node.type === "input").length, 0);

reset();
calls.submissions.length = 0;
view = render({
  connectionStatus: "ready",
  pendingRequest: optionRequest,
  service,
});
find(view, "button", "Continue in browser").props.onClick();
await flush();
equal(calls.submissions.length, 1);
equal(calls.submissions[0].selectedOption, "continue");
deepEqual(calls.submissions[0].fields, {});

const unavailableService = {
  async reply() {},
  async submitBrowserAuth() {
    return "unavailable";
  },
};
reset();
view = render({
  connectionStatus: "ready",
  pendingRequest: optionRequest,
  reload: () => {
    runtime.reloads++;
  },
  service: unavailableService,
});
find(view, "button", "Continue in browser").props.onClick();
await flush();
view = render({
  connectionStatus: "ready",
  pendingRequest: optionRequest,
  reload: () => {
    runtime.reloads++;
  },
  service: unavailableService,
});
equal(text(view).includes("no longer available"), true);

console.log(`${assertions} assertions passed`);
