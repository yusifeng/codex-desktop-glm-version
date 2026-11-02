import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
  },
  jsxs(type, props, key) {
    return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
  },
};
const React = {
  useEffect(effect) { effect(); },
  useRef(value) { return { current: value }; },
  useState(value) {
    let current = typeof value === "function" ? value() : value;
    return [current, (next) => { current = typeof next === "function" ? next(current) : next; }];
  },
  useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
};
const state = {
  attached: false,
  binding: { environmentId: "environment-1", workspaceRoot: "/repo/one" },
  conversation: { cwdBySessionId: { "local-1": "/repo/one" }, sessionIds: ["local-1"] },
  created: [],
  registered: null,
  shellCwd: "/repo/two",
  snapshot: { output: "ready", shell: "bash" },
  userInteracted: false,
  writes: [],
};
globalThis.__terminalPanelTab = { jsx, React, state };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "export const $3=()=>{};",
    "export const I3=()=>globalThis.__terminalPanelTab.jsx;",
    "export const e6=()=>globalThis.__terminalPanelTab.React;",
    "export const Y2=props=>({type:'message',props});",
    "export const Yh=props=>({type:'button',props});",
    "export const II=value=>String(value).split(/[\\\\/]/).filter(Boolean).at(-1)??'';",
    "export const m4=(...values)=>values.filter(Boolean).join(' ');",
  ].join("\n"),
  "app-initial": [
    "const state=globalThis.__terminalPanelTab.state;",
    "export const jet=props=>props.children;",
    "export const ket=props=>({type:'empty-state',props});",
    "export const E6t=()=>({platform:'macOS'});",
    "export const Rgn={",
    " close(id){state.closed=id;},",
    " create(options){state.created.push(options);return options.sessionId??'created-session';},",
    " getConversationSnapshot(){return state.conversation;},",
    " getShellCwd(){return Promise.resolve(state.shellCwd);},",
    " getSnapshot(){return state.snapshot;},",
    " getWorkspaceBinding(){return state.binding;},",
    " hasUserInteraction(){return state.userInteracted;},",
    " isSessionAttached(){return state.attached;},",
    " isSessionStarted(){return false;},",
    " recordUserInteraction(id){state.interacted=id;},",
    " register(id,handlers){state.registered={id,handlers};return ()=>{state.unregistered=id;};},",
    " subscribeToConversation(){return ()=>{};},",
    " subscribeToSessionSnapshot(){return ()=>{};},",
    " write(id,data,source){state.writes.push({id,data,source});}",
    "};",
  ].join("\n"),
  "app-primary": "export {};",
  "terminal-workspace-warning-state": "export {};",
  "shell-label": "export {};",
  "theme-font-family": "export {};",
  "theme-font-face-loader": "export {};",
  "xterm-window-zoom": "export {};",
  "terminal-panel-bootstrap": "export {};",
  "terminal-panel": "export const TerminalPanel=props=>({type:'terminal-panel',props});",
};

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "terminal-panel-tab-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({
          contents: mocks[module] ?? "export {};",
          loader: "js",
        }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}

function keyboardEvent(key, overrides = {}) {
  return {
    altKey: false,
    code: "",
    ctrlKey: false,
    key,
    metaKey: false,
    shiftKey: false,
    type: "keydown",
    prevented: false,
    stopped: false,
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
    ...overrides,
  };
}

const terminalPanelReleaseAssertions = assertReleaseOwner("terminal-panel");

const terminalTabReleaseAssertions = assertReleaseOwner("terminal-tab");

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + ` assertions and ${terminalTabReleaseAssertions + terminalPanelReleaseAssertions} terminal release assertions passed`);
