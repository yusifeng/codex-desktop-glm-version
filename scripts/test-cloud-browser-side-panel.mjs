import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/cloud-browser-side-panel/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initializers: [], stateUpdates: [], signalReads: [] };
const families = { mode: Symbol("mode"), owner: Symbol("owner"), screenshots: Symbol("screenshots") };
const state = { mode: { mode: "screenshot" }, owner: null, screenshots: [] };
const node = (type, props) => typeof type === "function" ? type(props) : { type, props };
const React = {
  useEffect: () => {},
  useRef: (current) => ({ current }),
  useState: (initial) => [typeof initial === "function" ? initial() : initial, (value) => calls.stateUpdates.push(value)],
};
globalThis.__cloudBrowserPanel = { calls, families, node, React, state };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => {
    const init = (name) => "()=>globalThis.__cloudBrowserPanel.calls.initializers.push('" + name + "')";
    if (module === "app-shared") return { contents: "const s=globalThis.__cloudBrowserPanel;export const $3=" + init("jsx-lazy") + ";export const $h=" + init("hooks") + ";export const BX=(family,id)=>{s.calls.signalReads.push([family,id]);return family===s.families.screenshots?s.state.screenshots:family===s.families.mode?s.state.mode:s.state.owner};export const FX=" + init("maitai") + ";export const I3=()=>({jsx:s.node,jsxs:s.node});export const K2=" + init("utilities") + ";export const Qh=props=>({type:'spinner',props});export const Y2=props=>({type:'message',props});export const e6=()=>s.React;export const h4=" + init("class-names") + ";export const m4=(...v)=>v.filter(Boolean).join(' ');export const n4=()=>({formatMessage:d=>d.id});", loader: "js" };
    if (module === "app-initial") return { contents: "const s=globalThis.__cloudBrowserPanel;export const BL=s.families.screenshots;export const HL=" + init("browser-state") + ";export const VL=(mode,screenshots)=>Math.max(0,screenshots.length-1);export const _dn={getInstance:()=>({fetch:async()=>({text:async()=>''})})};export const fdn=()=>({Authorization:'token'});export const pdn=" + init("browser-auth") + ";export const uHt=" + init("intl") + ";export const wVt=s.families.owner;export const ydn=" + init("network") + ";export const zL=s.families.mode;", loader: "js" };
    if (module === "cloud-browser-preview") return { contents: "const s=globalThis.__cloudBrowserPanel;export const n=" + init("preview") + ";export const t=props=>({type:'preview',props});", loader: "js" };
    return { contents: "export {};", loader: "js" };
  });
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let sourceAssertions = 0;
let runtimeAssertions = 0;
const sourceEqual = (actual, expected) => { sourceAssertions++; assert.equal(actual, expected); };
const sourceDeepEqual = (actual, expected) => { sourceAssertions++; assert.deepEqual(actual, expected); };
const equal = (actual, expected) => { runtimeAssertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { runtimeAssertions++; assert.deepEqual(actual, expected); };
const findNode = (value, predicate) => {
  if (value == null || typeof value !== "object") return null;
  if (predicate(value)) return value;
  const children = value.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) { const found = findNode(child, predicate); if (found != null) return found; }
    return null;
  }
  return findNode(children, predicate);
};

sourceDeepEqual([...source.matchAll(/(?:from )?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "cloud-browser-preview"]);
sourceEqual(/\bany\b/.test(source), false);
sourceEqual(/import \* as/.test(source), false);
for (const marker of ["RTCPeerConnection", "browser/handoff", "browser/client_outcome", "control/request", "control/release", "control/clipboard", "mousemove", "keydown", "connection_error", "handoff_error", "video_error"]) sourceEqual(source.includes(marker), true);
sourceEqual(source.includes("}, [ownerConversationId, targetTabId]);"), true);

deepEqual(Object.keys(module), ["ChatGptCloudBrowserSidePanel"]);
deepEqual(calls.initializers, ["jsx-lazy", "maitai", "class-names", "utilities", "hooks", "browser-auth", "network", "intl", "browser-state", "preview"]);

state.screenshots = [{ browser_conversation_id: "owner-1", image_asset_pointer: { asset_pointer: "asset-1" } }, { browser_conversation_id: "owner-2", image_asset_pointer: { asset_pointer: "asset-2" } }];
state.mode = { mode: "screenshot" };
let panel = module.ChatGptCloudBrowserSidePanel({ conversationId: "conversation-1" });
equal(panel.type, "div");
equal(panel.props.children.type, "preview");
equal(panel.props.children.props.variant, "expanded");
equal(panel.props.children.props.liveView, undefined);
equal(panel.props.children.props.screenshots, state.screenshots);

state.mode = { mode: "live" };
panel = module.ChatGptCloudBrowserSidePanel({ conversationId: "conversation-1" });
const liveView = panel.props.children.props.liveView;
equal(liveView.props["data-codex-cloud-browser"], true);
const video = findNode(liveView, (candidate) => candidate.type === "video");
equal(video.props.autoPlay, true);
equal(video.props.muted, true);
equal(video.props.playsInline, true);
equal(video.props["aria-label"], "chatgptConversations.cloudBrowser.liveView.ariaLabel");
const loading = findNode(liveView, (candidate) => candidate.props?.role === "status");
equal(loading.props["aria-hidden"], false);
const controlButton = findNode(liveView, (candidate) => candidate.type === "button");
equal(typeof controlButton.props.onClick, "function");
controlButton.props.onClick();
equal(calls.stateUpdates.includes(true), true);

state.screenshots = [];
state.owner = null;
panel = module.ChatGptCloudBrowserSidePanel({ conversationId: "conversation-2" });
let unavailableView = panel.props.children.props.liveView;
let errorMessage = findNode(unavailableView, (candidate) => candidate.type === "message");
equal(errorMessage.props.id, "chatgptConversations.cloudBrowser.liveView.unavailable");
equal(findNode(unavailableView, (candidate) => candidate.type === "button"), null);

panel = module.ChatGptCloudBrowserSidePanel({ conversationId: "conversation-2", targetTabId: "closed-tab" });
unavailableView = panel.props.children.props.liveView;
errorMessage = findNode(unavailableView, (candidate) => candidate.type === "message");
equal(errorMessage.props.id, "chatgptConversations.cloudBrowser.liveView.tabUnavailable");
deepEqual(calls.signalReads.slice(-3).map((entry) => entry[1]), ["conversation-2", "conversation-2", "conversation-2"]);

console.log("cloud-browser-side-panel tests passed (" + sourceAssertions + " source assertions, " + runtimeAssertions + " runtime assertions)");
