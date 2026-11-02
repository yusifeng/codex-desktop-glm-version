import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__jsx = jsx;
async function load(name) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({ path: modulePath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => modulePath === "app-shared" ? { loader: "js", contents: "export const I3=()=>globalThis.__jsx;" } : { loader: "js", contents: "export {};" });
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`);
}

const profile = await load("profile-page");
let username = null;
const profileView = profile.ProfilePage({ today: "2026-09-27", username: "David", children: "profile-body", onUsernameChanged: (value) => { username = value; } });
assert.equal(profileView.type, "main");
assert.equal(profileView.props["data-profile-v2-enabled"], true);
assert.equal(profileView.props.children[0].props.children.props.children, "David's profile");
assert.equal(profileView.props.children[1].props["data-today"], "2026-09-27");
assert.equal(profileView.props.children[1].props.children[0], "profile-body");
profileView.props.children[1].props.children[1].props.onChange({ currentTarget: { value: "Ada" } });
assert.equal(username, "Ada");
assert.equal(profile.ProfilePage({ editPaneOpen: true }).props.children[0], null);

const share = await load("browser-plugin-share-page");
assert.equal(share.BrowserPluginSharePage({ isLoading: true }).props["aria-busy"], true);
assert.equal(share.BrowserPluginSharePage({ shareKey: "Bad Key", resolvedPluginId: "p1" }).props.role, "alert");
assert.equal(share.BrowserPluginSharePage({ shareKey: "foo@unknown", resolvedPluginId: "p1" }).props.role, "alert");
assert.equal(share.BrowserPluginSharePage({ shareKey: "foo@openai-bundled" }).props.role, "alert");
const sharedPlugin = share.BrowserPluginSharePage({ shareKey: "foo-bar@openai-primary-runtime", resolvedPluginId: "plug/in", search: "source=share" });
assert.equal(sharedPlugin.props["data-redirect"], true);
assert.match(sharedPlugin.props.href, /^\/plugins\/plug%2Fin\?/);
assert.match(sharedPlugin.props.href, /source=share/);
assert.match(sharedPlugin.props.href, /open_in_app=true/);

const mobile = await load("codex-mobile-page");
assert.equal(mobile.CodexMobilePage({ isMfaSetupRequiredFetching: true }), null);
let closed = 0;
const setup = mobile.CodexMobilePage({ mfaSetupRequired: true, setupStepDebugOverride: "verify", onClose: () => { closed += 1; } });
assert.equal(setup.props.className, "codex-mobile-setup-flow");
assert.equal(setup.props["data-step"], "verify");
setup.props.children[1].props.onClick();
assert.equal(closed, 1);
let managed = 0;
const connections = mobile.CodexMobilePage({ remoteControlStatus: "connected", onManageConnections: () => { managed += 1; } });
assert.equal(connections.props["data-status"], "connected");
connections.props.children[1].props.onClick();
assert.equal(managed, 1);
assert.equal(mobile.CodexMobilePage({ mfaSetupRequired: true, isMfaSetupRequiredError: true }).props.className, "codex-mobile-connections");

const plan = await load("plan-summary-page");
assert.equal(plan.PlanSummaryPage({}).props["aria-busy"], true);
assert.equal(plan.PlanSummaryPage({ state: { planContent: "Ship it", conversationId: "c1" } }).props["aria-busy"], true);
const planView = plan.PlanSummaryPage({ state: { planContent: "Ship it", conversationId: "c1", hostId: "h1" } });
assert.equal(planView.props["data-conversation-id"], "c1");
assert.equal(planView.props["data-host-id"], "h1");
assert.equal(planView.props.children.props["data-role"], "assistant");
assert.equal(planView.props.children.props.children[1].props.children, "Ship it");

const gpt = await load("gpt-chat-page");
assert.equal(gpt.GptChatPage({ isLoading: true }).props["aria-busy"], true);
assert.equal(gpt.GptChatPage({ errorStatus: 404 }).props.children[0].props.children, "GPT not found");
let retried = 0;
const gptError = gpt.GptChatPage({ errorStatus: 500, onRetry: () => { retried += 1; } });
assert.equal(gptError.props.role, "alert");
gptError.props.children[1].props.onClick();
assert.equal(retried, 1);
const canonical = gpt.GptChatPage({ gpt: { id: "g1", short_url: "writer" }, pathname: "/g/g1", search: "?x=1", hash: "#top" });
assert.equal(canonical.props.href, "/g/writer?x=1#top");
const chat = gpt.GptChatPage({ gpt: { id: "g1", name: "Writer", description: "Writes" }, pathname: "/g/g1" });
assert.equal(chat.props["data-gpt-id"], "g1");
assert.equal(chat.props.children[0].props.children, "Writer");

const licenses = await load("open-source-licenses-page");
assert.equal(licenses.OpenSourceLicensesPage({ isLoading: true }).props.children[2].props["aria-busy"], true);
assert.equal(licenses.OpenSourceLicensesPage({ state: { licensesBackPath: "/evil" } }).props.children[0].props.href, "/settings/general");
const licenseView = licenses.OpenSourceLicensesPage({ noticesText: "MIT", state: { licensesBackPath: "/settings/about" } });
assert.equal(licenseView.props.children[0].props.href, "/settings/about");
assert.equal(licenseView.props.children[2].type, "pre");
assert.equal(licenseView.props.children[2].props.children, "MIT");
let back = null, prevented = 0;
const customBack = licenses.OpenSourceLicensesPage({ onBack: (value) => { back = value; } });
customBack.props.children[0].props.onClick({ preventDefault: () => { prevented += 1; } });
assert.equal(prevented, 1);
assert.equal(back, "/settings/general");

const deepLink = await load("plugin-mcp-app-deep-link-page");
assert.equal(deepLink.PluginMcpAppDeepLinkPage({}).props.role, "alert");
assert.equal(deepLink.PluginMcpAppDeepLinkPage({ pluginId: "p", toolName: "t", isLoading: true }).props["aria-busy"], true);
const view = { entrypoint: "global", pluginId: "demo@openai-bundled", toolName: "run", url: "/view/1" };
const unique = deepLink.PluginMcpAppDeepLinkPage({ pluginId: "demo", toolName: "run", views: [view] });
assert.equal(unique.props["data-redirect"], true);
assert.equal(unique.props.href, "/view/1");
const ambiguous = deepLink.PluginMcpAppDeepLinkPage({ pluginId: "demo", toolName: "run", views: [view, { ...view, url: "/view/2" }] });
assert.equal(ambiguous.props["data-match-count"], 2);
assert.equal(ambiguous.props.children, "Choose an extension view");
const unavailable = deepLink.PluginMcpAppDeepLinkPage({ pluginId: "demo", toolName: "missing", views: [view], activationState: "unavailable" });
assert.equal(unavailable.props["data-activation-state"], "unavailable");

assertReleaseOwner("asb-conversation-page");
assertReleaseOwner("hotkey-window-thread-page");
assertReleaseOwner("workspace-agent-detail-page");

console.log("lightweight route pages cluster complete");
