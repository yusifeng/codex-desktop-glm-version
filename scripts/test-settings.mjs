import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/settings/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const accessSignal = { name: "parental-access" };
const hookValues = [];
let hookIndex = 0;
const state = {
  access: { status: "loading" },
  current: null,
  currentRefetches: 0,
  initialized: 0,
  invalidations: [],
  layout: null,
  layoutRefetches: 0,
  members: null,
  membersRefetches: 0,
  navigations: [],
  search: new URLSearchParams(),
  searchWrites: [],
  settings: null,
  settingsRefetches: 0,
};

const React = {
  useState(initialValue) {
    const index = hookIndex++;
    if (!(index in hookValues)) {
      hookValues[index] =
        typeof initialValue === "function" ? initialValue() : initialValue;
    }
    return [
      hookValues[index],
      (next) => {
        hookValues[index] =
          typeof next === "function" ? next(hookValues[index]) : next;
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
function queryState(kind, overrides = {}) {
  return {
    data: state[kind],
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: async () => {
      state[kind + "Refetches"] += 1;
    },
    ...overrides,
  };
}
function queryFor(options) {
  const kind = options.queryKey.at(-1);
  if (kind === "current") return queryState("current");
  if (kind === "members") return queryState("members");
  if (kind === "layout") return queryState("layout");
  if (kind === "settings") return queryState("settings");
  return queryState("members", { data: undefined });
}
function resetHooks() {
  hookIndex = 0;
}
function clearHooks() {
  hookValues.length = 0;
  hookIndex = 0;
}

globalThis.__settingsChunk = { React, accessSignal, jsx, state, queryFor };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__settingsChunk;",
    "export const $3=()=>{runtime.state.initialized+=1};export const I3=()=>runtime.jsx;export const e6=()=>runtime.React;",
    "export const HX=()=>runtime.state.access;export const _L=options=>runtime.queryFor(options);export const ZI='app-scope';",
    "export const LX=()=>({queryClient:{invalidateQueries:options=>runtime.state.invalidations.push(options)}});",
    "export const Y2=props=>props.defaultMessage;export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__settingsChunk;",
    "export const Xl=()=>{runtime.state.initialized+=1};export const su=()=>{runtime.state.initialized+=1};export const bL=runtime.accessSignal;",
    "export const au=props=>({type:'settings-page',props});",
    "export const d_n=()=>[runtime.state.search,(next,options)=>{runtime.state.search=new URLSearchParams(next);runtime.state.searchWrites.push({search:runtime.state.search.toString(),options})}];",
    "export const o_n=()=>to=>runtime.state.navigations.push(to);",
  ].join("\n"),
  invitations: [
    "const runtime=globalThis.__settingsChunk;",
    "export const i=()=>{runtime.state.initialized+=1};export const m=()=>{runtime.state.initialized+=1};",
    "export const n=props=>({type:'add-family-dialog',props});",
  ].join("\n"),
  "legacy-study-hours-schedule":
    "export const r=()=>{globalThis.__settingsChunk.state.initialized+=1};",
  presentation: [
    "const runtime=globalThis.__settingsChunk;",
    "export const a=()=>{runtime.state.initialized+=1};export const u=()=>{runtime.state.initialized+=1};",
    "export const d=(userId,accountId)=>({current:{queryKey:['parental',userId,accountId,'current']},layout:{queryKey:['parental',userId,accountId,'layout']},members:familyId=>({queryKey:['parental',familyId,'members']}),settings:(familyId,memberId)=>({queryKey:['parental',familyId,memberId,'settings']})});",
  ].join("\n"),
  "settings-loading-row":
    "export const n=()=>{globalThis.__settingsChunk.state.initialized+=1};export const t=props=>({type:'settings-loading-row',props});",
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
      name: "settings-mocks",
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
function render() {
  resetHooks();
  return module.ChatGptParentalControlsSettings();
}

assert.deepEqual(Object.keys(module), ["ChatGptParentalControlsSettings"]);
assert.equal(state.initialized, 9);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  [
    "app-initial",
    "app-shared",
    "invitations",
    "legacy-study-hours-schedule",
    "presentation",
    "rolldown-runtime",
    "settings-loading-row",
  ],
);
assert.equal(
  /\b(?:appInitialChunk|appSharedChunk|invitationsChunk|legacyStudyHoursScheduleChunk|presentationChunk|runtimeChunk|settingsLoadingRowChunk)\s*\./.test(
    source,
  ),
  false,
);
assert.equal(/\bany\b/.test(source), false);

let view = render();
assert.equal(
  walk(view).some((node) => node.type === "settings-loading-row"),
  true,
);

state.access = { status: "denied" };
view = render();
assert.equal(
  textContent(view).includes(
    "Parental controls are available in your personal ChatGPT account",
  ),
  true,
);

state.access = { status: "error" };
view = render();
button(view, "Retry").props.onClick();
assert.deepEqual(state.invalidations, [{ queryKey: ["accounts", "check"] }]);

state.access = { status: "allowed", accountId: "acct-1", userId: "user-1" };
state.current = undefined;
view = render();
assert.equal(
  textContent(view).includes("Your family information couldn’t be loaded"),
  true,
);
button(view, "Retry").props.onClick();
await Promise.resolve();
assert.equal(state.currentRefetches, 1);

state.current = { id: "family-1", role: "owner" };
state.members = {
  items: [
    { user_id: "child-1", name: "Avery", role: "child", status: "accepted" },
    { email: "pending@example.com", role: "child", status: "invited" },
  ],
};
clearHooks();
view = render();
assert.equal(textContent(view).includes("Parental controls"), true);
assert.equal(textContent(view).includes("Family members"), true);
assert.equal(textContent(view).includes("Avery"), true);
assert.equal(textContent(view).includes("Invitation sent"), true);
assert.equal(button(view, "Add child") != null, true);
assert.equal(textContent(view).includes("Safety notifications"), true);
button(view, "Manage notifications").props.onClick();
assert.deepEqual(state.navigations, ["/settings/notifications"]);

walk(view)
  .find((node) => node.type === "button" && textContent(node).includes("Avery"))
  .props.onClick();
assert.equal(state.search.toString(), "member=child-1");
assert.equal(state.searchWrites.at(-1).options, undefined);

state.layout = {
  root_page_id: "root",
  pages: [
    {
      id: "root",
      heading: "Controls for Avery",
      sections: [
        {
          id: "main",
          items: [
            {
              id: "model",
              kind: "setting",
              label: "Model training",
              settings: ["model_enabled"],
            },
            {
              id: "schedule-link",
              label: "Schedule",
              type: "navigation",
              target_page_id: "schedule",
            },
          ],
        },
      ],
    },
    {
      id: "schedule",
      heading: "Schedule",
      sections: [
        {
          id: "schedule-main",
          items: [
            {
              id: "days",
              type: "multi_select",
              setting: "days",
              label: "Days",
              default_value: ["monday"],
              options: [{ value: "monday", label: "Monday" }],
            },
          ],
        },
      ],
    },
  ],
};
state.settings = {
  permissions: [],
  settings: { model_enabled: true, days: ["monday"] },
};
clearHooks();
view = render();
assert.equal(textContent(view).includes("Controls for Avery"), true);
assert.equal(
  walk(view).find(
    (node) => node.type === "input" && node.props?.type === "checkbox",
  ).props.checked,
  true,
);
button(view, "Schedule").props.onClick();
view = render();
assert.equal(
  walk(view).some((node) => node.props?.["data-page-id"] === "schedule"),
  true,
);
assert.equal(textContent(view).includes("Monday"), true);
button(view, "Back").props.onClick();
view = render();
assert.equal(
  walk(view).some((node) => node.props?.["data-page-id"] === "root"),
  true,
);

state.search = new URLSearchParams("member=missing");
clearHooks();
view = render();
assert.equal(
  textContent(view).includes("This family member is no longer available"),
  true,
);
button(view, "Back").props.onClick();
assert.equal(state.search.toString(), "");
assert.deepEqual(state.searchWrites.at(-1).options, { replace: true });

state.search = new URLSearchParams();
state.current = { id: "family-1", role: "child" };
clearHooks();
view = render();
assert.equal(button(view, "Add family member"), undefined);
assert.equal(textContent(view).includes("Safety notifications"), false);

state.current = { id: null, role: "member_role" };
state.members = undefined;
clearHooks();
view = render();
assert.equal(textContent(view).includes("Parental controls"), true);
assert.equal(button(view, "Add family member") != null, true);
button(view, "Add family member").props.onClick();
view = render();
assert.equal(
  walk(view).some((node) => node.type === "add-family-dialog"),
  true,
);

state.current = { id: "family-1", role: "owner" };
state.members = {
  items: [
    { user_id: "user-1", name: "Avery", role: "child", status: "accepted" },
  ],
};
state.search = new URLSearchParams("member=user-1");
clearHooks();
view = render();
assert.equal(
  textContent(view).includes(
    "Your parent or guardian can adjust these settings",
  ),
  true,
);
assert.equal(
  walk(view).find(
    (node) => node.type === "input" && node.props?.type === "checkbox",
  ).props.disabled,
  true,
);

state.search = new URLSearchParams();
state.members = { items: [] };
clearHooks();
view = render();
assert.equal(button(view, "Add child") != null, true);
button(view, "Add child").props.onClick();
view = render();
assert.equal(
  walk(view).find((node) => node.type === "add-family-dialog").props.forceTeen,
  true,
);

console.log("36 settings assertions passed");
