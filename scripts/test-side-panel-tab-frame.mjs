import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/side-panel-tab-frame/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const calls = { initializers: [], routes: [], resolved: [] };
const state = { recipient: { value: { kind: "local", conversationId: "thread-1" } } };
const component = (name) => (props) => ({ component: name, props });
globalThis.__sidePanelTabFrame = { calls, state, component };
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => {
    const init = (name) => "()=>{globalThis.__sidePanelTabFrame.calls.initializers.push('" + name + "')}";
    if (module === "app-shared") return { contents: "const s=globalThis.__sidePanelTabFrame;export const FX=" + init("maitai") + ";export const I3=()=>({jsx:(type,props)=>type(props)});export const LX=()=>s.state.recipient;export const lY=id=>{const route={id};s.calls.routes.push(route);return route};export const mZ=(recipient,signal,route)=>{const value={recipient,signal,route};s.calls.resolved.push(value);return value};export const wL=" + init("utilities") + ";", loader: "js" };
    if (module === "app-initial") return { contents: "const s=globalThis.__sidePanelTabFrame;export const Ftn=" + init("mcp-frame") + ";export const Mtn=(recipient,route)=>({recipient,route,resolved:true});export const Rht=" + init("thread-recipients") + ";export const kht={id:'active-recipient'};", loader: "js" };
    if (module === "view-frame") return { contents: "const s=globalThis.__sidePanelTabFrame;export const n=" + init("view-frame") + ";export const t=s.component('view-frame');", loader: "js" };
    if (module === "file-viewer-frame") return { contents: "const s=globalThis.__sidePanelTabFrame;export const n=" + init("file-viewer-frame") + ";export const t=s.component('file-viewer-frame');", loader: "js" };
    return { contents: "export {};", loader: "js" };
  });
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
const equal = (actual, expected) => { assertions++; assert.equal(actual, expected); };
const deepEqual = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
deepEqual(Object.keys(module), ["McpExtensionSidePanelTabFrame"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/(?:from )?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "view-frame", "file-viewer-frame"]);
deepEqual(calls.initializers, ["maitai", "utilities", "thread-recipients", "mcp-frame", "file-viewer-frame", "view-frame"]);

const localView = module.McpExtensionSidePanelTabFrame({ content: { type: "view", sourceThreadId: "thread-1", url: "https://example.com" }, tabState: { mcpAppId: "app-1" } });
equal(localView.component, "view-frame");
equal(localView.props.lifetime, "thread");
equal(localView.props.url, "https://example.com");
equal(localView.props.mcpAppId, "app-1");
equal(localView.props.recipient, state.recipient);
equal("type" in localView.props, false);
equal(calls.resolved.length, 0);

const redirected = module.McpExtensionSidePanelTabFrame({ content: { type: "view", sourceThreadId: "thread-2", title: "Other" }, tabState: {} });
equal(redirected.component, "view-frame");
equal(calls.routes.at(-1).id, "thread-2");
equal(redirected.props.recipient.route.resolved, true);
equal(redirected.props.recipient.route.route.id, "thread-2");

const file = module.McpExtensionSidePanelTabFrame({ content: { type: "file-viewer", path: "/tmp/a.ts", view: "code" }, tabState: { mcpAppId: "app-2" } });
equal(file.component, "file-viewer-frame");
equal(file.props.filePath, "/tmp/a.ts");
equal(file.props.fileViewer, "code");
equal(file.props.lifetime, "thread");
equal(file.props.recipient, state.recipient);

state.recipient = { value: { kind: "other" } };
const otherFile = module.McpExtensionSidePanelTabFrame({ content: { type: "file-viewer", path: "/tmp/b.ts", view: "raw" }, tabState: {} });
equal(otherFile.props.recipient, null);
console.log("side-panel-tab-frame tests passed (" + assertions + " assertions)");
