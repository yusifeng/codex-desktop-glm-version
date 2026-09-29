import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/select-workspace-page/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const hookState = [];
let hookIndex = 0;
const effects = [];
const handlers = new Map();
const state = {
  dispatched: [],
  initialized: 0,
  navigated: [],
  remote: false,
};
const React = {
  useEffect(effect) {
    effects.push(effect);
  },
  useRef(value) {
    return { current: value };
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
globalThis.__selectWorkspacePage = { handlers, jsx, React, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const r=globalThis.__selectWorkspacePage;",
    "export const $3=()=>{r.state.initialized+=1};export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
    "export const II=value=>value.replace(/\\\\/g,'/').replace(/\\/$/,'').split('/').at(-1);",
    "export const G3={dispatchMessage:(type,payload)=>r.state.dispatched.push({type,payload})};",
    "export const K3=(type,handler)=>r.handlers.set(type,handler);",
    "export const Qh=props=>({type:'spinner',props});export const Yh=props=>({type:'button',props});",
  ].join("\n"),
  "app-initial": [
    "const r=globalThis.__selectWorkspacePage;",
    "export const _N=()=>r.state.remote;export const o_n=()=>((path,options)=>r.state.navigated.push({path,options}));export const pnt={};",
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
      name: "select-workspace-page-mocks",
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

function render(props = {}) {
  hookIndex = 0;
  effects.length = 0;
  return module.SelectWorkspacePage(props);
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
function checkboxes(view) {
  return walk(view).filter(
    (node) => node.type === "input" && node.props.type === "checkbox",
  );
}
async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}
function resetHooks() {
  hookState.length = 0;
  hookIndex = 0;
  effects.length = 0;
  handlers.clear();
  state.dispatched.length = 0;
  state.navigated.length = 0;
  state.remote = false;
}

assert.deepEqual(Object.keys(module), ["SelectWorkspacePage"]);
assert.equal(state.initialized, 1);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map(
    (match) => match[1],
  ),
  ["rolldown-runtime", "app-shared", "app-initial"],
);
assert.equal(
  /\b(?:appInitialChunk|appSharedChunk|runtimeChunk)\s*\./.test(source),
  false,
);
assert.equal(/\bany\b/.test(source), false);

let view = render({ isLoading: true });
assert.equal(text(view).includes("Select a project"), true);
assert.equal(text(view).includes("Loading projects…"), true);
assert.equal(text(view).includes("Add a project to continue."), false);
assert.equal(button(view, "Skip").props.disabled, false);

resetHooks();
view = render({ isLoading: false });
assert.equal(text(view).includes("Add a project to continue."), true);
assert.equal(button(view, "Continue"), undefined);
button(view, "Add project").props.onClick();
view = render({ isLoading: false });
assert.equal(text(view).includes("Start from scratch"), true);
assert.equal(text(view).includes("Use an existing folder"), true);
button(view, "Use an existing folder").props.onClick();
assert.deepEqual(state.dispatched.at(-1), {
  type: "electron-pick-workspace-root-option",
  payload: { allowMultiple: false },
});

resetHooks();
const service = {
  calls: [],
  result: [{}],
  async createOrSelectLocalProjects(roots) {
    this.calls.push([...roots]);
    return this.result;
  },
};
const roots = [
  { root: "/Users/test/Zeta", label: "Zeta", selected: false },
  { root: "/Users/test/alpha/", selected: true },
  { root: "/users/test/ALPHA", label: "Duplicate" },
  { root: "/missing", exists: false },
];
view = render({ isLoading: false, roots, service });
assert.equal(
  walk(view).some(
    (node) => node.props?.["aria-label"] === "Available projects",
  ),
  true,
);
assert.equal(text(view).includes("Duplicate"), true);
assert.equal(text(view).includes("Zeta"), true);
assert.equal(text(view).includes("missing"), false);
assert.equal(checkboxes(view).length, 3);
assert.equal(button(view, "Continue").props.disabled, false);
checkboxes(view)[2].props.onChange({ currentTarget: { checked: true } });
view = render({ isLoading: false, roots, service });
assert.equal(checkboxes(view)[0].props.checked, true);
button(view, "Continue").props.onClick();
await flush();
assert.deepEqual(service.calls, [["/users/test/ALPHA", "/Users/test/Zeta"]]);
assert.equal(state.navigated[0].path, "/");
assert.deepEqual(state.navigated[0].options, {
  replace: true,
  state: { focusComposerNonce: 1 },
});

resetHooks();
const failingService = {
  async createOrSelectLocalProjects() {
    throw new Error("denied");
  },
};
view = render({
  isLoading: false,
  roots: [{ root: "/project", selected: true }],
  service: failingService,
});
button(view, "Continue").props.onClick();
await flush();
view = render({
  isLoading: false,
  roots: [{ root: "/project", selected: true }],
  service: failingService,
});
assert.equal(text(view).includes("Could not add the selected folders"), true);

resetHooks();
view = render({ isLoading: false });
button(view, "Skip").props.onClick();
assert.deepEqual(state.dispatched.at(-1), {
  type: "electron-onboarding-skip-workspace",
  payload: { initializeGitRepository: true },
});
view = render({ isLoading: false });
assert.equal(text(view).includes("Creating a new project…"), true);
handlers.get("electron-onboarding-skip-workspace-result")({
  type: "electron-onboarding-skip-workspace-result",
  success: false,
  error: "Folder unavailable",
});
view = render({ isLoading: false });
assert.equal(text(view).includes("Folder unavailable"), true);
assert.equal(
  text(view).includes("Couldn't create a new project: Folder unavailable"),
  true,
);
handlers.get("workspace-root-option-picked")({
  type: "workspace-root-option-picked",
  root: "/new/project",
});
view = render({ isLoading: false, service });
assert.equal(text(view).includes("project"), true);
assert.equal(button(view, "Continue").props.disabled, false);

resetHooks();
state.remote = true;
view = render({ isLoading: false, isRemoteHost: true });
assert.equal(button(view, "Skip"), undefined);
button(view, "Add project").props.onClick();
assert.equal(
  state.dispatched.at(-1).type,
  "electron-pick-workspace-root-option",
);
assert.equal(
  text(render({ isLoading: false, isRemoteHost: true })).includes(
    "Start from scratch",
  ),
  false,
);

const assertionCount = [
  ...fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .matchAll(/\bassert\./g),
].length;
console.log(assertionCount + " select workspace page assertions passed");
