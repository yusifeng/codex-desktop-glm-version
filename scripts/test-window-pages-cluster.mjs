import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__windowPagesTest = {
  allowDebugMenu: true,
  analytics: [],
  closed: 0,
  detailLayout: null,
  effects: [],
  handlers: new Map(),
  params: {},
  quickChatAdds: [],
  ready: [],
  searchParams: new URLSearchParams(),
  selectedProject: { id: "project-1" },
  signalSession: null,
  stateCursor: 0,
  stateValues: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});
globalThis.window = { close: () => state.closed++ };
let nextFrame = 1;
const frames = new Map();
globalThis.requestAnimationFrame = (callback) => {
  const id = nextFrame++;
  frames.set(id, callback);
  return id;
};
globalThis.cancelAnimationFrame = (id) => frames.delete(id);

async function bundle(directory) {
  state.effects = [];
  state.stateValues = [];
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mock-renderer-chunks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice("@rchunk/".length),
            namespace: "mock-renderer-chunk",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock-renderer-chunk" },
            ({ path: importPath }) => ({
              contents: mockChunk(importPath),
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

function mockChunk(name) {
  if (name === "app-shared")
    return `
    const reactRuntime = {
      useEffect(effect) { globalThis.__windowPagesTest.effects.push(effect()); },
      useState(initial) { const index = globalThis.__windowPagesTest.stateCursor++; const current = globalThis.__windowPagesTest.stateValues[index] ?? initial; const setter = value => { globalThis.__windowPagesTest.stateValues[index] = typeof value === "function" ? value(current) : value; }; return [current, setter]; },
    };
    export const $3 = () => {}; export const FX = () => {}; export const K2 = () => {}; export const QI = () => {}; export const W3 = () => {}; export const wL = () => {};
    export const I3 = () => globalThis.__windowPagesTest.jsx; export const HX = signal => signal.kind === "project" ? globalThis.__windowPagesTest.selectedProject : globalThis.__windowPagesTest.signalSession;
    export const UB = id => "/conversation/" + id; export const Y2 = "FormattedMessage";
    export const LX = () => ({ id: "scope" }); export const ZI = { id: "app-scope" };
    export const XN = { CODEX_QUICK_CHAT_SURFACE_WINDOW: "window" }; export const qN = { CODEX_QUICK_CHAT_LIFECYCLE_ACTION_CLOSED: "closed" };
    export const lY = id => "parsed:" + id; export const e6 = Object.assign(() => reactRuntime, reactRuntime);
    export const K3 = (type, handler) => globalThis.__windowPagesTest.handlers.set(type, handler);
    export const Cq = { allowDebugMenu: () => globalThis.__windowPagesTest.allowDebugMenu };
  `;
  if (name === "app-initial")
    return `
    export const Dht = () => {}; export const Oht = { kind: "project" }; export const mnt = () => {};
    export const pnt = {
      hotkeyWindowHotkeys: { open: options => { globalThis.__windowPagesTest.hotkeyOpen = options; } },
      quickChatWindow: { rendererReady: id => globalThis.__windowPagesTest.ready.push(id), addToComposer: async content => { globalThis.__windowPagesTest.quickChatAdds.push(content); } },
    };
    export const Evt = () => {}; export const Qgn = () => {}; export const W_ = () => {}; export const bX = () => {}; export const i_ = () => {}; export const oqt = () => {};
    export const G_ = (scope, event) => globalThis.__windowPagesTest.analytics.push({ scope, event });
    export const aqt = id => "normalized:" + id; export const d_n = () => [globalThis.__windowPagesTest.searchParams]; export const h_ = { kind: "session" };
    export const l_n = () => globalThis.__windowPagesTest.params; export const sqt = id => id.includes("missing"); export const xvt = () => { globalThis.__windowPagesTest.prepared = true; };
    export const yX = "QuickChatSurfaceProvider"; export const Oun = () => "desktop"; export const Ygn = "Navigate";
  `;
  if (name === "app-primary")
    return `
    export const Oo = "ComposerSurface"; export const c = "WorkspaceName"; export const dt = () => {}; export const ko = () => {}; export const l = () => {};
    export const nt = "HotkeyWindowPageLayout"; export const o = "ChatGptMark"; export const rt = () => {}; export const s = () => {}; export const ut = "NewThreadComposer";
  `;
  if (name === "thread-scroll-layout")
    return `export const n = () => {}; export const t = "ThreadScrollLayout";`;
  if (name === "use-hotkey-window-detail-layout")
    return `export const n = () => {}; export const r = layout => { globalThis.__windowPagesTest.detailLayout = layout; };`;
  if (name === "quick-chat-window")
    return `export const n = () => {}; export const t = "QuickChatWindow";`;
  if (name === "panel")
    return `export const n = () => {}; export const t = "DebugPanel";`;
  return "export const sideEffect = true;";
}

const hotkey = await bundle("hotkey-window-new-thread-page");
const hotkeyNode = hotkey.HotkeyWindowNewThreadPage();
assert.equal(hotkeyNode.type, "HotkeyWindowPageLayout");
assert.equal(state.detailLayout.mainWindowPath, "/");
assert.equal(state.detailLayout.canCollapseToHome, false);
const threadLayout = hotkeyNode.props.children;
assert.equal(threadLayout.type, "ThreadScrollLayout");
const composer = threadLayout.props.footer.props.children;
assert.deepEqual(composer.props.selectedProject, { id: "project-1" });
assert.equal(composer.props.showWorkspaceDropdownInUtilityBar, false);
composer.props.onLocalConversationCreated("conversation-1");
assert.deepEqual(state.hotkeyOpen, { path: "/conversation/conversation-1" });
assert.equal(
  threadLayout.props.children.props.children.props.children[1].props.children[1]
    .type,
  "WorkspaceName",
);

const quickChat = await bundle("quick-chat-window-page");
state.params = {};
assert.equal(quickChat.QuickChatWindowPage(), null);
assert.deepEqual(state.ready, [null]);
state.params = { conversationId: "conversation-2" };
state.searchParams = new URLSearchParams({
  contextSourceConversationId: "source-1",
  contextSourceHostId: "host-1",
});
const quickChatNode = quickChat.QuickChatWindowPage();
assert.equal(quickChatNode.type, "QuickChatSurfaceProvider");
const quickChatWindow = quickChatNode.props.children;
assert.equal(quickChatWindow.type, "QuickChatWindow");
assert.equal(
  quickChatWindow.props.session.conversationId,
  "normalized:conversation-2",
);
assert.deepEqual(quickChatWindow.props.session.contextSourceThread, {
  threadId: "parsed:source-1",
  hostId: "host-1",
});
assert.equal(quickChatWindow.props.session.hasConversation, true);
assert.equal(state.prepared, true);
for (const callback of frames.values()) callback();
assert.equal(state.ready.at(-1), "conversation-2");
quickChatWindow.props.onClose("escape-key");
assert.equal(state.analytics.at(-1).event.source, "escape-key");
assert.equal(state.analytics.at(-1).event.surface, "window");
assert.equal(state.closed, 1);
await quickChatWindow.props.onAddToComposer({ text: "continue" });
assert.deepEqual(state.quickChatAdds, [{ text: "continue" }]);
state.signalSession = {
  hasConversation: false,
  conversationId: "stored",
  contextSourceThread: null,
};
const storedQuickChat = quickChat.QuickChatWindowPage().props.children;
assert.equal(storedQuickChat.props.session.conversationId, "stored");
assert.equal(storedQuickChat.props.session.hasConversation, false);

const debug = await bundle("debug-window-page");
state.allowDebugMenu = false;
state.stateCursor = 0;
let debugNode = debug.DebugWindowPage();
assert.equal(debugNode.type, "Navigate");
assert.deepEqual(debugNode.props, { to: "/", replace: true });
state.allowDebugMenu = true;
state.stateValues = [];
state.stateCursor = 0;
debugNode = debug.DebugWindowPage();
assert.equal(debugNode.props.children.props.children.type, "DebugPanel");
state.handlers.get("debug-window-origin-conversation-changed")({
  conversationId: "conversation-debug",
});
state.handlers.get("debug-window-client-analytics-history-changed")({
  events: ["opened"],
});
state.stateValues = ["conversation-debug", ["opened"]];
state.stateCursor = 0;
debugNode = debug.DebugWindowPage();
const debugPanel = debugNode.props.children.props.children;
assert.equal(debugPanel.props.conversationIdOverride, "conversation-debug");
assert.deepEqual(debugPanel.props.clientAnalyticsHistory, ["opened"]);
assert.equal(debugPanel.props.showHeader, false);
debugPanel.props.onClose();
assert.equal(state.closed, 2);

console.log("30 window page cluster assertions passed");
