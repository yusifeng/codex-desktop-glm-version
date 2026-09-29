import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/plugin-installation-content/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
let sourceAssertions = 0;
const sourceCheck = (value, message) => { assert.ok(value, message); sourceAssertions += 1; };
const dependencies = [...new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]))].sort();
sourceCheck(JSON.stringify(dependencies) === JSON.stringify(["app-card","app-connect-availability","app-connect-link-navigation","app-connect-modal","app-initial","app-primary","app-shared","browser-extension-setup-messages","browser-extension-status-description","computer-use-app-approvals-query","find-plugin-mcp-extension-view","first-app-connect-ambient-suggestions","plugin-disabled-reason","profile-lock","requested-plugin-connection","rolldown-runtime"]), "preserves all sixteen direct dependencies");
sourceCheck(!/import\s*\(/.test(source), "has no published lazy dependencies");
sourceCheck(!/\bany\b/.test(source), "does not introduce an explicit unsafe type");
sourceCheck(!/\b[A-Za-z]+Chunk\s*\./.test(source), "does not consume namespace members");
sourceCheck(source.includes("useCallback") && !source.includes("useEffect("), "uses stable callbacks without unnecessary effects");

const state = (globalThis.__pluginInstallationContentTest = { initializers: [], session: { kind: "closed" }, controller: {} });
const render = (type, props, key) => typeof type === "function" ? type(props) : ({ type, props, key });
const jsx = { Fragment: "Fragment", jsx: render, jsxs: render };
const react = { useCallback: (callback) => callback };
const mocks = new Proxy({
  "app-shared": `
    const s=globalThis.__pluginInstallationContentTest;
    export const $3=()=>s.initializers.push('$3'); export const K2=()=>s.initializers.push('K2');
    export const I3=()=>globalThis.__pluginInstallationContentTest.jsx; export const e6=()=>globalThis.__pluginInstallationContentTest.react;
    export const HX=()=>s.session; export const Y2='FormattedMessage'; export const Yh='Button';
  `,
  "app-initial": `
    const s=globalThis.__pluginInstallationContentTest;
    export const g2t=()=>s.initializers.push('g2t'); export const v2t={id:'plugin-session'}; export const S2t=()=>s.controller;
  `,
}, { get(target, key) { return target[key] ?? "export {};"; } });
state.jsx = jsx; state.react = react;
const result = await esbuild.build({
  entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "plugin-installation-content-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] }));
  } }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let runtimeAssertions = 0;
const runtimeCheck = (value, message) => { assert.ok(value, message); runtimeAssertions += 1; };
const plugin = { plugin: { id: "plugin-1", name: "Calendar Helper", description: "Schedules meetings" }, interface: { defaultPrompt: "Schedule a meeting" } };
const calls = { close: 0, connect: [], install: [], details: [], retry: 0, chat: [] };
state.controller = {
  closePluginInstall: () => { calls.close += 1; },
  connectRequiredApp: (app) => calls.connect.push(app.appId),
  installPlugin: (value) => calls.install.push(value.plugin.id),
  openPluginInstallDetails: (value) => calls.details.push(value.plugin.id),
  retryPluginInstall: () => { calls.retry += 1; },
  tryPluginInChat: (value, prompt) => calls.chat.push({ id: value.plugin.id, prompt }),
};
runtimeCheck(Object.keys(module).join(",") === "PluginInstallationContent", "preserves the sole public export");
runtimeCheck(state.initializers.join(",") === "$3,K2,g2t", "initializes the published runtime surfaces once");
state.session = { kind: "closed" }; runtimeCheck(module.PluginInstallationContent() === null, "hides a closed installation session");
state.session = { kind: "loadingPlugin" }; let view = module.PluginInstallationContent(); runtimeCheck(view.type === "div" && view.props.role === "status", "renders the loading state accessibly");
state.session = { kind: "reviewIncentive", requestId: "request-1", title: "Claim offer" }; view = module.PluginInstallationContent();
const incentive = view.props.children[0]; incentive.props.children[1].props.onClick(); runtimeCheck(incentive.props["data-request-id"] === "request-1" && calls.close === 1, "renders and closes the incentive review state");
state.session = { kind: "details", plugin }; view = module.PluginInstallationContent(); let panel = view.props.children[1]; let actions = panel.props.children[3].props.children;
actions[1].props.onClick(); actions[2].props.onClick(); actions[3].props.onClick();
runtimeCheck(calls.details[0] === "plugin-1" && calls.chat[0].prompt === "Schedule a meeting" && calls.install[0] === "plugin-1", "wires details, try-in-chat, and installation actions");
const pendingApp = { appId: "calendar", name: "Calendar", description: "Calendar access", status: "pending" };
state.session = { kind: "needsApps", plugin, requiredApps: [pendingApp], requiredBrowserExtensions: [{ browserFamily: "chrome", name: "Chrome extension", isInstalled: false }] }; view = module.PluginInstallationContent(); panel = view.props.children[1];
const appRow = panel.props.children[1].props.children[1].props.children[0]; appRow.props.children[1].props.onClick(); actions = panel.props.children[3].props.children;
runtimeCheck(calls.connect[0] === "calendar" && actions[3].props.disabled === true, "connects required apps and blocks installation until requirements are ready");
state.session = { kind: "needsApps", plugin, requiredApps: [{ ...pendingApp, status: "connected" }], requiredBrowserExtensions: [{ browserFamily: "chrome", isInstalled: true }] }; view = module.PluginInstallationContent(); panel = view.props.children[1]; actions = panel.props.children[3].props.children;
runtimeCheck(actions[3].props.disabled === false, "enables installation after apps and browser extensions are ready");
state.session = { kind: "connectApp", plugin, app: { ...pendingApp, status: "waitingForCallback" } }; view = module.PluginInstallationContent(); panel = view.props.children[1]; const waitingButton = panel.props.children[1].props.children[1].props.children[0].props.children[1];
runtimeCheck(waitingButton.props.loading === true && waitingButton.props.disabled === false, "shows the waiting-for-callback connection state");
state.controller = { ...state.controller, isInstalling: true }; state.session = { kind: "installing", plugin }; view = module.PluginInstallationContent(); panel = view.props.children[1]; actions = panel.props.children[3].props.children;
runtimeCheck(actions[3].props.loading === true && actions[3].props.disabled === true, "disables actions while installation is in progress");
state.controller = { ...state.controller, isInstalling: false }; state.session = { kind: "error", plugin, message: "Network unavailable" }; view = module.PluginInstallationContent(); panel = view.props.children[1]; panel.props.children[2].props.children[0].props.onClick(); panel.props.children[2].props.children[1].props.onClick();
runtimeCheck(panel.props.role === "alert" && calls.retry === 1 && calls.close === 2, "renders retry and close actions for installation failures");
state.controller = { ...state.controller, session: { kind: "details", plugin: { ...plugin, plugin: { ...plugin.plugin, id: "controller-session" } } } }; state.session = { kind: "closed" }; view = module.PluginInstallationContent(); panel = view.props.children[1];
runtimeCheck(panel.props.children[0].props.children[0].props.children === "Calendar Helper", "prefers the controller's normalized session when available");
console.log(`${sourceAssertions} source assertions, ${runtimeAssertions} runtime assertions passed for plugin installation content`);
