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

assertReleaseOwner("plan-summary-page");
assertReleaseOwner("gpt-chat-page");
assertReleaseOwner("open-source-licenses-page");
assertReleaseOwner("plugin-mcp-app-deep-link-page");

assertReleaseOwner("asb-conversation-page");
assertReleaseOwner("hotkey-window-thread-page");
assertReleaseOwner("workspace-agent-detail-page");

console.log("lightweight route pages cluster complete");
