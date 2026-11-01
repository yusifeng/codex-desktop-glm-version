import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["pepper-onboarding-modal", "appgen-share-dialog", "thread-handoff-modal", "app-connect-modal", "codex-mobile-setup-dialog"];
const state = globalThis.__highValueDialogsTest = { apiCalls: [], initialized: [] };
const jsxRuntime = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const reactRuntime = { useEffect: () => {}, useRef: value => ({ current: value }), useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } };
const apiClient = {
  async safePatch(pathname, options) { state.apiCalls.push({ method: "PATCH", pathname, options }); return { success: true }; },
  async safePost(pathname, options) { state.apiCalls.push({ method: "POST", pathname, options }); return state.nextPostResult ?? { success: true }; },
};
Object.assign(state, { apiClient, jsxRuntime, reactRuntime });

const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const item of match[1].split(",")) names.add(item.trim().split(/\s+as\s+/)[0]);
    imports.set(match[2], names);
  }
}
const overrides = {
  "app-shared": { I3: "() => globalThis.__highValueDialogsTest.jsxRuntime", e6: "Object.assign(() => globalThis.__highValueDialogsTest.reactRuntime, globalThis.__highValueDialogsTest.reactRuntime)" },
  "app-initial": { cJt: "() => globalThis.__highValueDialogsTest.initialized.push('api')", rJt: "globalThis.__highValueDialogsTest.apiClient" },
};
const sideEffects = new Set(["rolldown-runtime", "pepper-persona", "chatgpt-accent-messages", "voice-personalization-dialog-entry", "appgen-access", "appgen-site-card", "dialog-action", "permission-dropdown", "app-primary", "use-codex-worktrees", "git-branch-switcher", "country-codes", "google-logo", "connector-post-connect-dialog", "computer-use-app-approvals-query", "use-home-directory", "security-browser"]);
function generic(moduleName, exportName) { return `(...args) => { globalThis.__highValueDialogsTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return args[0]; }`; }
function mock(name) { if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].filter(Boolean).map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`).join("\n"); }
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "high-value-dialog-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" }));
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }
const byText = (tree, text) => nodes(tree).find(node => node.props?.children === text);
const button = (tree, text) => nodes(tree).find(node => node.type === "button" && node.props.children === text);

// pepper-onboarding-modal: 7
const pepper = await bundle("pepper-onboarding-modal");
let pepperClosed = false;
let pepperCompleted = false;
const pepperTree = pepper.PepperOnboardingModal({ accountId: "account-1", initialAccent: "purple", initialStep: 4, onClose: () => { pepperClosed = true; }, onComplete: () => { pepperCompleted = true; } });
assert.equal(byText(pepperTree, "Wellbeing").type, "h2");
assert.equal(byText(pepperTree, "5 of 5").type, "p");
await button(pepperTree, "Finish").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/accounts/{account_id}/settings");
assert.equal(state.apiCalls.at(-1).options.requestBody.accent_color, "purple");
assert.equal(state.apiCalls.at(-1).options.parameters.path.account_id, "account-1");
assert.equal(pepperCompleted, true);
assert.equal(pepperClosed, true);

// appgen-share-dialog: 7
const appgen = await bundle("appgen-share-dialog");
let appgenClosed = false;
const appgenTree = appgen.AppgenShareDialog({ projectId: "site-1", source: "settings", initialAccess: "public", initialPeople: ["a@example.com"], onClose: () => { appgenClosed = true; } });
assert.equal(byText(appgenTree, "Share site").type, "h2");
assert.equal(nodes(appgenTree).find(node => node.type === "select").props.value, "public");
assert.equal(byText(appgenTree, "a@example.com").type, "li");
await button(appgenTree, "Save").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/appgen/projects/{project_id}/access");
assert.deepEqual(state.apiCalls.at(-1).options.requestBody.allowed_users, ["a@example.com"]);
assert.equal(appgenClosed, true);
await button(appgenTree, "Copy link").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/appgen/projects/{project_id}/share-link");

// thread-handoff-modal: 7
const handoff = await bundle("thread-handoff-modal");
handoff.n();
let handoffInput = null;
let handoffClosed = false;
const handoffTree = handoff.t({ conversationId: "thread-1", gitRoot: "/repo", onClose: () => { handoffClosed = true; }, threadHandoff: { conversationTitle: "Fix bug", cwd: "/repo", direction: "to-worktree", perform: async input => { handoffInput = input; } } });
assert.equal(byText(handoffTree, "Move thread to worktree").type, "h2");
assert.equal(byText(handoffTree, "Fix bug").type, "p");
await button(handoffTree, "Move thread").props.onClick();
assert.equal(handoffInput.conversationId, "thread-1");
assert.equal(handoffInput.direction, "to-worktree");
assert.equal(handoffInput.gitRoot, "/repo");
assert.equal(handoffClosed, true);
assert.equal(state.initialized.includes("api"), true);

// app-connect-modal: 14
const connect = await bundle("app-connect-modal");
const gmailId = "connector_2128aebfecb84f64a069897515042a44";
const outlookId = "connector_4aaab2856305417b993eca9a216aaf6e";
const outlookConnector = { id: "outlook", status: "READY" };
assert.deepEqual(connect.a({ availableAppIds: new Set([outlookId]), companionConnectorIds: [outlookId], companionConnectors: [outlookConnector], companionLinks: [null] })[0].connector, outlookConnector);
const enabledStatsig = { checkGate: () => true };
assert.equal(connect.c({ connectorId: outlookId, statsigClient: enabledStatsig }), true);
const googleDefinitions = [{ connectorId: gmailId, kind: "gmail" }];
assert.deepEqual(connect.d({ availableAppIds: new Set([gmailId]), companionConnectorIds: [gmailId], companionConnectors: [{ status: "READY" }], companionLinks: [null], connectors: googleDefinitions })[0].definition, googleDefinitions[0]);
assert.equal(connect.f({ connectorId: gmailId, statsigClient: enabledStatsig }).length, 4);
assert.deepEqual(connect.m(gmailId, googleDefinitions), googleDefinitions[0]);
assert.equal(connect.o(outlookId).length, 3);
assert.deepEqual(connect.p(gmailId, googleDefinitions), []);
let connected = false;
let oauthEvent = null;
state.nextPostResult = { oauth_url: "https://example.com/oauth" };
const connectTree = connect.t({ app: { id: "drive", name: "Drive", description: "Use [Drive](https://drive.google.com) files" }, onOpenChange: () => {}, onConnected: () => { connected = true; }, onOAuthStarted: event => { oauthEvent = event; } });
assert.equal(byText(connectTree, "Connect Drive").type, "h2");
assert.equal(byText(connectTree, "Use Drive files").type, "p");
await button(connectTree, "Connect").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/connectors/{connector_id}/connect");
assert.equal(state.apiCalls.at(-1).options.parameters.path.connector_id, "drive");
assert.equal(oauthEvent.redirectUrl, "https://example.com/oauth");
assert.equal(connected, false);
connect.n();
assert.equal(state.initialized.includes("api"), true);
state.nextPostResult = null;

// codex-mobile-setup-dialog: 9
const mobile = await bundle("codex-mobile-setup-dialog");
mobile.n();
assert.equal(mobile.c.key, "electron:codex-mobile-setup-step-debug-override");
assert.equal(mobile.o("allow-host"), "Allow this computer");
assert.match(mobile.r("mfa-required"), /multi-factor/);
let started = false;
let skipped = false;
const initialTree = mobile.i({ step: "initial", onStartSetup: () => { started = true; }, onSkip: () => { skipped = true; } });
button(initialTree, "Start setup").props.onClick();
button(initialTree, "Not now").props.onClick();
assert.equal(started, true);
assert.equal(skipped, true);
assert.equal(initialTree.props["data-step"], "initial");
let dialogOpen = true;
const mobileDialog = mobile.t({ open: true, step: "connected", onOpenChange: value => { dialogOpen = value; } });
assert.equal(mobileDialog.type, "dialog");
button(mobileDialog, "Close").props.onClick();
assert.equal(dialogOpen, false);
assert.equal(state.initialized.includes("api"), true);

console.log("44 high-value dialogs cluster assertions passed");
