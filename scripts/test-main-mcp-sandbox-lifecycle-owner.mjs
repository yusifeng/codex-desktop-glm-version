import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/mcp-sandbox/lifecycle.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createMcpSandboxLifecycleRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

class WebContentsMock extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.destroyed = false;
    this.openedDevtools = [];
    this.posted = [];
  }
  getURL() { return this.url ?? ""; }
  isDestroyed() { return this.destroyed; }
  openDevTools(options) { this.openedDevtools.push(options); }
  postMessage(...args) { this.posted.push(args); }
  setWindowOpenHandler(handler) { this.windowOpenHandler = handler; }
}

const ipcListeners = new Map();
const logs = [];
const errors = [];
const warnings = [];
const configured = [];
const prewarmed = [];
const contextMenus = [];
const webContents = new Map();
const session = { id: "session" };
const runtime = createMcpSandboxLifecycleRuntime({
  canUseSandboxProtocol: true,
  configureSession(value, getSandboxState, applicationNetwork) {
    configured.push({ value, getSandboxState, applicationNetwork });
  },
  forwardInitChannel: "sandbox:init:forward",
  getLocale: () => "en-US",
  getSkybridgeCacheState: () => "warm",
  initChannel: "sandbox:init",
  ipcMain: { on(channel, listener) { ipcListeners.set(channel, listener); } },
  isPortNameList: (value) => Array.isArray(value) && value.every((entry) => typeof entry === "string"),
  isSandboxId: (value) => /^sandbox-[a-z]+$/u.test(value),
  logEvent(event, state, tags = {}) { logs.push({ event, state, tags }); },
  logger: () => ({
    error(message, tags) { errors.push({ message, tags }); },
    warning(message, tags) { warnings.push({ message, tags }); },
  }),
  matchesAccelerator: (event, accelerator) => event.accelerator === accelerator,
  parseInitId: (url) => new URL(url).searchParams.get("init"),
  parseOrigin: (url) => new URL(url).searchParams.get("origin"),
  parsePartitionSandbox: (partition) => partition.startsWith("partition:")
    ? partition.slice("partition:".length)
    : partition.startsWith("persist:")
      ? partition.slice("persist:".length)
      : null,
  parsePersistentSandbox: (url) => new URL(url).searchParams.get("sandbox"),
  persistentPartition: "persist:shared",
  async prewarmSandbox(locale) { prewarmed.push(locale); },
  sanitizeUrl: (url) => `safe:${new URL(url).protocol}`,
  sandboxPreloadPath: "/app/sandbox-preload.js",
  sessionFromPartition: () => session,
  showDevtoolsContextMenu(guest, owner) { contextMenus.push({ guest, owner }); },
  webContentsFromId: (id) => webContents.get(id) ?? null,
});

equal(runtime.parseInitMessage(null), null, "null init payload is rejected");
equal(runtime.parseInitMessage({ type: "other", initId: "i", origin: "o", portNames: [] }), null, "wrong init type is rejected");
equal(runtime.parseInitMessage({ type: "init", initId: "", origin: "o", portNames: [] }), null, "empty init identity is rejected");
equal(runtime.parseInitMessage({ type: "init", initId: "i", origin: "o", portNames: ["tool"] }), {
  initId: "i", origin: "o", portNames: ["tool"],
}, "valid init payload is projected");
equal(runtime.parseViewInstanceId("7"), 7, "positive integer view identity is accepted");
equal(runtime.parseViewInstanceId("0"), null, "zero view identity is rejected");
equal(runtime.parseViewInstanceId("1.5"), null, "fractional view identity is rejected");

runtime.initialize();
runtime.initialize();
equal(ipcListeners.size, 1, "IPC initialization listener installs once");

const owner = new WebContentsMock(10);
const navigationRuns = [];
const navigation = {
  getAccelerators(command) {
    return command === "navigateBack" ? ["MouseBack", "Alt+Left"] : ["MouseForward", "Alt+Right"];
  },
  run(command) { navigationRuns.push(command); },
};
runtime.bindOwnerWebviews(owner, true, {
  applicationNetwork: { name: "network" },
  navigation,
});
equal(owner.listenerCount("will-attach-webview"), 1, "owner receives one admission listener");
equal(owner.listenerCount("did-attach-webview"), 1, "owner receives one attachment listener");

const sourceUrl = "codex-sandbox://app/page?origin=https%3A%2F%2Fwidget.example&init=init-1&locale=fr";
const preferences = {};
let attachPrevented = 0;
owner.emit(
  "will-attach-webview",
  { preventDefault() { attachPrevented += 1; } },
  preferences,
  { instanceId: "7", partition: "partition:sandbox-alpha", src: sourceUrl },
);
equal(attachPrevented, 0, "valid sandbox attachment is admitted");
equal(configured.length, 1, "sandbox session restrictions configure once");
equal(configured[0].value, session, "session restriction receives the selected partition session");
equal(configured[0].applicationNetwork, { name: "network" }, "session restriction receives application network owner");
equal(prewarmed, ["fr"], "sandbox protocol prewarms the requested locale");
equal(preferences, {
  session,
  preload: "/app/sandbox-preload.js",
  nodeIntegration: false,
  nodeIntegrationInSubFrames: false,
  contextIsolation: true,
  disableDialogs: true,
  sandbox: true,
  webSecurity: true,
  plugins: false,
  allowRunningInsecureContent: false,
  devTools: true,
  webviewTag: false,
}, "admission hardens every guest web preference");

const guest = new WebContentsMock(20);
guest.session = session;
guest.viewInstanceId = 7;
guest.url = sourceUrl;
webContents.set(guest.id, guest);
owner.emit("did-attach-webview", {}, guest);
const state = runtime.getSandboxState(guest.id);
equal(state.sandboxId, "sandbox-alpha", "attached guest owns the admitted sandbox identity");
equal(state.allowLocalDevelopment, true, "attachment state retains local-development admission");
equal(state.skybridgeCacheState, "warm", "attachment state retains cache warmth");
equal(logs.at(-1).event, "guest_attached", "successful attachment is logged");
equal(guest.listenerCount("will-navigate"), 1, "guest navigation lifecycle is installed");

const ipc = ipcListeners.get("sandbox:init");
ipc({ sender: guest, ports: ["control", "tool-port"] }, {
  type: "init",
  initId: "init-1",
  origin: "https://widget.example",
  portNames: ["tool"],
});
equal(owner.posted, [[
  "sandbox:init:forward",
  {
    initId: "init-1",
    origin: "https://widget.example",
    portNames: ["tool"],
    sandboxId: "sandbox-alpha",
    skybridgeCacheState: "warm",
    type: "init",
  },
  ["control", "tool-port"],
]], "validated IPC init transfers the complete MessagePort list to the owner");

ipc({ sender: { id: 999 }, ports: [] }, {});
equal(warnings.at(-1).tags.safe.reason, "unknown_guest", "unknown IPC senders are rejected");
ipc({ sender: guest, ports: [] }, { type: "broken" });
equal(logs.at(-1).tags.safe.reason, "invalid_message", "invalid IPC payload is rejected");
ipc({ sender: guest, ports: [] }, {
  type: "init", initId: "wrong", origin: "https://widget.example", portNames: [],
});
equal(logs.at(-1).tags.safe.reason, "init_id_mismatch", "mismatched init identity is rejected");
ipc({ sender: guest, ports: [] }, {
  type: "init", initId: "init-1", origin: "https://other.example", portNames: [],
});
equal(logs.at(-1).tags.safe.reason, "origin_mismatch", "mismatched origin is rejected");
ipc({ sender: guest, ports: [] }, {
  type: "init", initId: "init-1", origin: "https://widget.example", portNames: [1],
});
equal(logs.at(-1).tags.safe.reason, "invalid_port_names", "invalid port names are rejected");
ipc({ sender: guest, ports: [] }, {
  type: "init", initId: "init-1", origin: "https://widget.example", portNames: ["tool"],
});
equal(logs.at(-1).tags.safe.reason, "port_count_mismatch", "port count must include the control port");

const popup = guest.windowOpenHandler({ url: "https://popup.example" });
equal(popup, { action: "deny" }, "guest popups are always denied");
equal(logs.at(-1).event, "popup_blocked", "blocked popup is logged");

let prevented = 0;
guest.emit("will-navigate", { preventDefault() { prevented += 1; } }, "https://evil.example");
equal(prevented, 1, "main-frame navigation away from source is blocked");
guest.emit("will-navigate", { preventDefault() { prevented += 1; } }, sourceUrl);
equal(prevented, 1, "exact source navigation remains allowed");
guest.emit("will-frame-navigate", {
  isMainFrame: false,
  url: "file:///private",
  preventDefault() { prevented += 1; },
});
equal(prevented, 2, "privileged subframe protocols are blocked");
guest.emit("will-frame-navigate", {
  isMainFrame: false,
  url: "https://widget.example/frame",
  preventDefault() { prevented += 1; },
});
equal(prevented, 2, "ordinary HTTPS subframes remain allowed");
guest.emit("will-redirect", {
  isMainFrame: true,
  preventDefault() { prevented += 1; },
}, "https://redirect.example");
equal(prevented, 3, "main-frame redirects away from source are blocked");

const beforeCommitLogs = logs.length;
guest.emit("did-frame-navigate", {}, sourceUrl, 200, "OK", true);
guest.emit("did-frame-navigate", {}, sourceUrl, 200, "OK", true);
guest.emit("did-frame-navigate", {}, "https://widget.example/frame", 200, "OK", false);
guest.emit("did-frame-navigate", {}, "https://widget.example/frame2", 200, "OK", false);
equal(logs.slice(beforeCommitLogs).map(({ event }) => event), [
  "sandbox_document_committed", "widget_frame_committed",
], "main and widget commit telemetry emit once each");

const beforeFailureLogs = logs.length;
guest.emit("did-fail-load", {}, -3, "aborted", sourceUrl, true, 1, 2);
equal(logs.length, beforeFailureLogs, "aborted loads do not emit failure telemetry");
guest.emit("did-fail-load", {}, -105, "name not resolved", sourceUrl, true, 1, 2);
equal(logs.at(-1).event, "guest_load_failed", "real load failures are logged");
guest.emit("preload-error", {}, "/preload.js", new Error("preload"));
equal(errors.at(-1).message, "mcp_app_sandbox.preload_failed", "preload failure reaches the error logger");
guest.emit("render-process-gone", {}, { reason: "clean-exit", exitCode: 0 });
const cleanExitCount = logs.length;
guest.emit("render-process-gone", {}, { reason: "crashed", exitCode: 9 });
equal(logs.length, cleanExitCount + 1, "non-clean renderer exit is logged");

let mousePrevented = 0;
guest.emit("before-mouse-event", { preventDefault() { mousePrevented += 1; } }, {
  type: "mouseDown", button: "back",
});
equal(runtime.consumeUserGesture(owner, "sandbox-alpha", "init-1"), true, "mouseDown creates a consumable gesture token");
equal(runtime.consumeUserGesture(owner, "sandbox-alpha", "init-1"), false, "gesture token is single-use");
guest.emit("before-mouse-event", { preventDefault() { mousePrevented += 1; } }, {
  type: "mouseUp", button: "back",
});
equal(navigationRuns.at(-1), "navigateBack", "enabled mouse back accelerator runs navigation");
equal(mousePrevented, 2, "back mouse down and up are both intercepted");

let keyPrevented = 0;
guest.emit("before-input-event", { preventDefault() { keyPrevented += 1; } }, {
  type: "keyDown", key: "Enter", isAutoRepeat: false, accelerator: "Alt+Right",
});
equal(runtime.consumeUserGestureForGuest(guest), true, "Enter records a direct guest gesture");
equal(navigationRuns.at(-1), "navigateForward", "matching keyboard accelerator runs navigation");
guest.emit("before-input-event", { preventDefault() { keyPrevented += 1; } }, {
  type: "keyDown", key: "x", isAutoRepeat: true, accelerator: "Alt+Right",
});
equal(keyPrevented, 2, "auto-repeat navigation key is intercepted");
equal(navigationRuns.filter((value) => value === "navigateForward").length, 1, "auto-repeat does not rerun navigation");

guest.emit("context-menu");
equal(contextMenus, [{ guest, owner }], "context menu delegates with guest and owner identity");

guest.emit("destroyed");
equal(runtime.getSandboxState(guest.id), null, "guest destruction removes sandbox state");
equal(guest.listenerCount("will-navigate"), 0, "guest destruction removes navigation listeners");
equal(runtime.findGuest(owner, "sandbox-alpha", "init-1"), null, "destroyed guest is no longer discoverable");

const unmatched = new WebContentsMock(21);
unmatched.session = session;
unmatched.viewInstanceId = 999;
unmatched.url = sourceUrl;
owner.emit("did-attach-webview", {}, unmatched);
equal(warnings.at(-1).message, "mcp_app_sandbox.attach_unmatched", "unmatched guest attachment is rejected");

const invalidOwner = new WebContentsMock(30);
runtime.bindOwnerWebviews(invalidOwner, false, {
  applicationNetwork: {}, navigation,
});
let rejected = 0;
invalidOwner.emit("will-attach-webview", { preventDefault() { rejected += 1; } }, {}, {
  instanceId: "1", partition: "ordinary", src: "https://example.com",
});
equal(rejected, 1, "non-sandbox webviews are rejected by default");
equal(warnings.at(-1).tags.safe.reason, "non_mcp_app_sandbox_webview", "non-sandbox rejection is classified");

const permissiveOwner = new WebContentsMock(31);
runtime.bindOwnerWebviews(permissiveOwner, false, {
  applicationNetwork: {}, allowNonMcpAppSandboxWebviews: true, navigation,
});
let permissiveRejected = 0;
permissiveOwner.emit("will-attach-webview", { preventDefault() { permissiveRejected += 1; } }, {}, {
  instanceId: "1", partition: "ordinary", src: "https://example.com",
});
equal(permissiveRejected, 0, "explicitly allowed ordinary webviews bypass MCP hardening");

const pendingOwner = new WebContentsMock(40);
runtime.bindOwnerWebviews(pendingOwner, false, { applicationNetwork: {}, navigation });
pendingOwner.emit("will-attach-webview", { preventDefault() {} }, {}, {
  instanceId: "8", partition: "partition:sandbox-alpha", src: sourceUrl,
});
pendingOwner.emit("destroyed");
equal(pendingOwner.listenerCount("will-attach-webview"), 0, "owner destruction removes admission listener");
equal(pendingOwner.listenerCount("did-attach-webview"), 0, "owner destruction removes attachment listener");

ok(assertions >= 50, "MCP sandbox lifecycle has broad identity, IPC, navigation, and cleanup coverage");
console.log(`${assertions} main MCP sandbox lifecycle owner assertions passed`);
