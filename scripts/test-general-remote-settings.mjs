import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__generalRemoteSettings = { jsx };
async function load(name) { const result = await esbuild.build({ entryPoints: [path.join(root, "src/renderer", name, "index.ts")], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ loader: "js", contents: value === "app-shared" ? "export const I3=()=>globalThis.__generalRemoteSettings.jsx;" : "export {};" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`); }
function walk(node, output = []) { if (node == null || typeof node !== "object") return output; output.push(node); const children = node.props?.children; (Array.isArray(children) ? children.flat(Infinity) : [children]).forEach((child) => walk(child, output)); return output; }
function text(node) { if (node == null) return ""; if (typeof node === "string") return node; if (Array.isArray(node)) return node.map(text).join(" "); return text(node.props?.children); }
const general = await load("general-settings");
assert.deepEqual(Object.keys(general), ["a", "i", "n", "o", "r", "t"]);
general.o();
let theme, behavior, queue, awake;
const generalUi = general.i({ theme: "dark", enterBehavior: "cmdAlways", modifierSymbol: "⌘", onThemeChange: value => theme = value, onEnterBehaviorChange: value => behavior = value, onFollowUpQueueChange: value => queue = value, onKeepAwakeChange: value => awake = value });
assert.equal(generalUi.props["data-settings-page"], "general"); assert.match(text(generalUi), /General/); assert.match(text(generalUi), /Follow-up queue/); assert.match(text(generalUi), /Prevent sleep/);
const selects = walk(generalUi).filter(node => node.type === "select");
selects.find(node => node.props["aria-label"] === "Theme").props.onChange({ currentTarget: { value: "light" } }); assert.equal(theme, "light");
selects.find(node => node.props["aria-label"] === "Send messages").props.onChange({ currentTarget: { value: "enter" } }); assert.equal(behavior, "enter");
const switches = walk(generalUi).filter(node => node.props?.role === "switch"); switches[0].props.onClick(); switches[1].props.onClick(); assert.equal(queue, false); assert.equal(awake, true);
assert.match(text(general.r({ behavior: "cmdIfMultiline", modifierSymbol: "⌘" })), /⌘ \+ Enter/);
assert.equal(general.a(), null); assert.equal(general.t({ supported: false }), null); assert.match(text(general.t({ supported: true, enabled: true })), /Windows Subsystem/);
const appearance = general.n({ theme: "system" }); assert.match(text(appearance), /Content font/); assert.match(text(appearance), /Code font/);
const remote = await load("remote-connections-settings");
assert.deepEqual(Object.keys(remote), ["RemoteConnectionsSettings"]);
assert.match(text(remote.RemoteConnectionsSettings({ isLoading: true })), /Loading remote/); assert.match(text(remote.RemoteConnectionsSettings({ error: "Failed" })), /Failed/);
let refreshed = 0, added = 0, paired = 0, edited;
const remoteUi = remote.RemoteConnectionsSettings({ routeDraft: { draft: {} }, sshConnections: [{ hostId: "ssh-1", displayName: "Production", username: "root", status: "connected" }], wslConnections: [{ hostId: "wsl-1", displayName: "Ubuntu" }], remoteControlConnections: [{ hostId: "rc-1", displayName: "Laptop" }], onRefresh() { refreshed++; }, onAdd() { added++; }, onPairMobile() { paired++; }, onEdit(connection) { edited = connection.hostId; } });
assert.equal(remoteUi.props["data-editor-mode"], "add"); assert.match(text(remoteUi), /SSH connections/); assert.match(text(remoteUi), /Production/); assert.match(text(remoteUi), /Remote control connections/);
const buttons = walk(remoteUi).filter(node => node.type === "button"); buttons.find(node => text(node) === "Refresh").props.onClick(); buttons.find(node => text(node) === "Add connection").props.onClick(); buttons.find(node => text(node) === "Pair mobile device").props.onClick(); buttons.find(node => text(node) === "Edit").props.onClick();
assert.deepEqual({ refreshed, added, paired, edited }, { refreshed: 1, added: 1, paired: 1, edited: "ssh-1" });
let toggled, installed, deleted, authorized = 0, savedDraft;
const lifecycleUi = remote.RemoteConnectionsSettings({
  authRequired: true,
  clientAuthorized: false,
  routeDraft: { hostId: "ssh-2", draft: { displayName: "Staging", sshHost: "staging.test", sshPort: "22" } },
  sshConnections: [{ hostId: "ssh-2", displayName: "Staging", autoConnect: true, codexInstalled: false, error: "Login expired", status: "login-required" }],
  supportsWsl: false,
  onAuthorize() { authorized++; },
  onDelete(connection) { deleted = connection.hostId; },
  onInstallCodex(connection) { installed = connection.hostId; },
  onSaveDraft(draft, hostId) { savedDraft = [draft, hostId]; },
  onToggleAutoConnect(connection, enabled) { toggled = [connection.hostId, enabled]; },
});
assert.equal(lifecycleUi.props["data-editor-mode"], "edit");
assert.equal(walk(lifecycleUi).find(node => node.type === "section" && node.props?.["aria-label"] === "WSL connections"), undefined);
walk(lifecycleUi).find(node => node.type === "input" && node.props.type === "checkbox").props.onChange({ currentTarget: { checked: false } });
assert.deepEqual(toggled, ["ssh-2", false]);
walk(lifecycleUi).find(node => node.type === "button" && text(node) === "Install Codex CLI").props.onClick();
walk(lifecycleUi).find(node => node.type === "button" && text(node) === "Delete").props.onClick();
walk(lifecycleUi).find(node => node.type === "button" && text(node) === "Authorize").props.onClick();
assert.deepEqual({ installed, deleted, authorized }, { installed: "ssh-2", deleted: "ssh-2", authorized: 1 });
const editorForm = walk(lifecycleUi).find(node => node.type === "form");
editorForm.props.onSubmit({ preventDefault() {} });
assert.equal(savedDraft[0].displayName, "Staging");
assert.equal(savedDraft[1], "ssh-2");
console.log("31 general and remote settings assertions passed");
