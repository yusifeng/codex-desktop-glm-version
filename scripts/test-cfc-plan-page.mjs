import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/cfc-plan-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let hookIndex = 0;
const hookState = [];
const state = {
  account: { authMethod: null, email: null, isLoading: true },
  accounts: [],
  accountsCheck: { data: undefined, isError: false },
  assigned: [],
  enrollment: { data: undefined, isError: false },
  gate: false,
  initialized: 0,
  location: {
    pathname: "/cfc-plan",
    search: "?source=campaign",
    hash: "",
    state: null,
  },
  navigated: [],
};
const React = {
  Fragment: "Fragment",
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
globalThis.window = {
  location: {
    assign(value) {
      state.assigned.push(value);
    },
  },
};
globalThis.__cfcPlanPage = { React, jsx, state };
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__cfcPlanPage;const s=r.state;export const $3=()=>{s.initialized+=1};export const gL=()=>{s.initialized+=1};",
    "export const I3=()=>r.jsx;export const e6=()=>r.React;export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
    "export const _L=options=>options.queryKey[0]==='cfc-plan-enrollment'?s.enrollment:s.accountsCheck;",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__cfcPlanPage.state;export const cJt=()=>{s.initialized+=1};export const N6t=()=>s.account;export const i_n=()=>s.location;export const iht=()=>({data:{accounts:s.accounts}});export const o_n=()=>((destination,options)=>s.navigated.push({destination,options}));export const ofn=()=>s.gate;",
    "export const rJt={safePost:async()=>({metadata:{verification_status:'verified'}}),safeGet:async()=>({accounts:{}})};",
  ].join("\n"),
  "datadog-rum.browser": "export {};",
  "app-primary": "export {};",
  "google-logo": "export {};",
  messages: "export {};",
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
      name: "cfc-plan-page-mocks",
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
function render() {
  hookIndex = 0;
  return module.CfcPlanPage();
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
function button(view, label) {
  return walk(view).find(
    (node) => node.type === "button" && text(node) === label,
  );
}
function input(view) {
  return walk(view).find(
    (node) => node.type === "input" && node.props.name === "email",
  );
}
function form(view) {
  return walk(view).find((node) => node.type === "form");
}
function resetHooks() {
  hookState.length = 0;
  hookIndex = 0;
}

assert.deepEqual(Object.keys(module), ["CfcPlanPage"]);
assert.equal(state.initialized, 3);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "rolldown-runtime",
    "app-shared",
    "datadog-rum.browser",
    "app-initial",
    "app-primary",
    "google-logo",
    "messages",
  ],
);
assert.equal(
  /\b(?:appSharedChunk|appInitialChunk|appPrimaryChunk|runtimeChunk)\s*\./.test(
    source,
  ),
  false,
);
assert.equal(/\bany\b/.test(source), false);

let view = render();
assert.equal(view.type, "spinner");

state.account = { authMethod: null, email: null, isLoading: false };
resetHooks();
view = render();
assert.equal(text(view).includes("Sign in to get verified"), true);
assert.equal(text(view).includes("ChatGPT for Clinicians"), true);
assert.equal(text(view).includes("Free for verified clinicians"), true);
assert.equal(text(view).includes("Terms of Use"), true);
form(view).props.onSubmit({ preventDefault() {} });
view = render();
assert.equal(text(view).includes("Email is required"), true);
input(view).props.onChange({ target: { value: "invalid" } });
view = render();
form(view).props.onSubmit({ preventDefault() {} });
view = render();
assert.equal(text(view).includes("Email is invalid."), true);
input(view).props.onChange({ target: { value: "clinician@example.com" } });
view = render();
form(view).props.onSubmit({ preventDefault() {} });
assert.equal(
  state.navigated
    .at(-1)
    .destination.includes("login_hint=clinician%40example.com"),
  true,
);
assert.equal(
  state.navigated
    .at(-1)
    .destination.includes(
      "callback_path=%2Fcfc-verification%3Fsource%3Dcampaign",
    ),
  true,
);
button(view, "Continue with Google").props.onClick();
assert.equal(
  state.navigated.at(-1).destination.includes("connection=google-oauth2"),
  true,
);
assert.equal(
  state.navigated.at(-1).destination.includes("screen_hint=login"),
  true,
);

state.account = {
  authMethod: "chatgpt",
  email: "doctor@example.com",
  isLoading: false,
  accountId: "acct",
  userId: "user",
};
state.enrollment = {
  data: { metadata: { verification_status: "pending" } },
  isError: false,
};
state.accounts = [];
resetHooks();
view = render();
assert.equal(
  text(view).includes("You are currently logged in as doctor@example.com"),
  true,
);
button(view, "Get verified").props.onClick();
assert.deepEqual(state.assigned, ["/cfc-verification?source=campaign"]);
button(view, "Log in as a different account").props.onClick();
view = render();
assert.equal(input(view).props.value, "");

state.enrollment = {
  data: { metadata: { verification_status: "verified" } },
  isError: false,
};
state.accounts = [
  {
    id: "workspace-1",
    plan_type: "quorum",
    can_access_with_session: true,
    is_deactivated: false,
  },
];
state.accountsCheck = {
  data: {
    accounts: {
      "workspace-1": {
        account: { quorum_deferred_persona_verification: false },
      },
    },
  },
  isError: false,
};
resetHooks();
view = render();
assert.equal(text(view).includes("already have access"), true);
assert.equal(button(view, "Open ChatGPT") != null, true);
button(view, "Open ChatGPT").props.onClick();
assert.equal(state.navigated.at(-1).destination, "/");

state.accountsCheck = {
  data: {
    accounts: {
      "workspace-1": {
        account: { quorum_deferred_persona_verification: true },
      },
    },
  },
  isError: false,
};
resetHooks();
view = render();
assert.equal(button(view, "Get verified") != null, true);

state.gate = true;
resetHooks();
view = render();
assert.equal(button(view, "Open ChatGPT"), undefined);
assert.equal(button(view, "Get verified") != null, true);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " cfc plan page assertions passed");
