import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__conversationBridgeTest = {
  initialized: [],
  imageMode: "always",
  imagePreview: { id: "preview" },
  scopedFamilies: [],
});

const marker = (name) => (...arguments_) => ({ name, arguments: arguments_ });
globalThis.__conversationBridgeMarker = marker;

function appSharedMock() {
  return `
    const state = globalThis.__conversationBridgeTest;
    export const FX = () => state.initialized.push("signals");
    export const wL = () => state.initialized.push("app-runtime");
    export const oZ = (scope, factory, options, familyOptions) => {
      const family = { scope, factory, options, familyOptions };
      state.scopedFamilies.push(family);
      return family;
    };
  `;
}

function appInitialMock() {
  return `
    const state = globalThis.__conversationBridgeTest;
    const marker = globalThis.__conversationBridgeMarker;
    export const Ict = marker("toggle-thread-side-panel");
    export const Pct = () => state.initialized.push("thread-right-panel");
    export const gAt = async (...args) => ({ name: "refetch-conversation", args });
    export const mAt = () => state.initialized.push("conversation-updates");
    export const _vt = () => state.initialized.push("thread-accounts");
    export const fvt = marker("activate-thread-panel-tab");
    export const hvt = marker("get-thread-panel-tab-controller");
    export const d2 = () => state.initialized.push("start-new-conversation");
    export const f2 = marker("reveal-new-chat");
    export const h2 = marker("use-start-new-conversation");
    export const m2 = marker("start-new-conversation");
    export const p2 = value => value === "work";
    export const FR = marker("open-mcp-extension-thread-tab");
    export const IR = marker("restore-mcp-extension-tab");
    export const MR = () => state.initialized.push("mcp-extension-tab");
    export const NR = "mcp-extension";
    export const PR = marker("open-mcp-extension-file-tab");
    export const Qen = () => state.initialized.push("side-panel-registry");
    export const jct = () => state.initialized.push("thread-side-panel-state");
    export const $en = { id: "conversation-scope" };
    export const itn = () => state.initialized.push("conversation-scope");
    export const B4t = () => state.initialized.push("image-preview-source");
    export const U3t = () => state.initialized.push("image-output-visibility");
    export const V3t = () => state.imagePreview;
    export const Y9t = () => state.initialized.push("output-visibility");
    export const q9t = () => state.imageMode;
    export const z4t = value => ({ sourceFor: value });
  `;
}

function coreMock(name) {
  const simple = {
    "conversation-markdown": `export const n = input => "markdown:" + input.title; export const t = () => globalThis.__conversationBridgeTest.initialized.push("conversation-markdown");`,
    "open-thread-pull-request-code-tab": `export const n = globalThis.__conversationBridgeMarker("open-pr-code-tab"); export const t = () => globalThis.__conversationBridgeTest.initialized.push("pr-code-tab");`,
    "open-local-conversation-subagents-panel": `export const n = globalThis.__conversationBridgeMarker("open-subagents-panel"); export const t = () => globalThis.__conversationBridgeTest.initialized.push("subagents-panel");`,
    "thread-app-shell-chrome": `export const n = () => globalThis.__conversationBridgeTest.initialized.push("thread-shell"); export const t = "ThreadAppShellChrome";`,
    "open-local-conversation-sources-side-panel-tab": `export const n = globalThis.__conversationBridgeMarker("open-sources-panel"); export const t = () => globalThis.__conversationBridgeTest.initialized.push("sources-panel");`,
    "open-local-conversation-background-terminal-tab": `export const n = globalThis.__conversationBridgeMarker("open-background-terminal"); export const t = () => globalThis.__conversationBridgeTest.initialized.push("background-terminal");`,
    "chatgpt-conversation-transcript": `export const n = () => globalThis.__conversationBridgeTest.initialized.push("transcript"); export const t = "ChatGptConversationTranscript";`,
    "conversation-ui": `export const i = () => globalThis.__conversationBridgeTest.initialized.push("conversation-ui"); export const n = "BusinessAgentConversationHeader"; export const r = "BusinessAgentHomeHero";`,
    "local-conversation-thread": `export const r = "LocalConversationSideChatTab"; export const s = () => globalThis.__conversationBridgeTest.initialized.push("local-thread"); export const t = "LocalConversationBackgroundAgentTab";`,
    "local-conversation-webmcp-tools-model": `export const i = () => globalThis.__conversationBridgeTest.initialized.push("webmcp-model"); export const n = calls => calls.filter(call => call.visible); export const r = calls => new Map([["tool", calls]]); export const t = url => new URL(url).hostname;`,
    "local-conversation-sources-signals": `export const i = { id: "source-links" }; export const n = { id: "prior-turns" }; export const r = { id: "source-turns" }; export const t = () => globalThis.__conversationBridgeTest.initialized.push("source-signals");`,
    "open-thread-pull-request-side-panel-tab": `export const i = globalThis.__conversationBridgeMarker("restore-pr-panel"); export const n = globalThis.__conversationBridgeMarker("open-canonical-pr-panel"); export const r = globalThis.__conversationBridgeMarker("open-pr-panel"); export const t = () => globalThis.__conversationBridgeTest.initialized.push("pr-panel");`,
  };
  return simple[name] ?? "export const sideEffect = true;";
}

function mockChunk(name) {
  if (name === "app-shared") return appSharedMock();
  if (name === "app-initial") return appInitialMock();
  return coreMock(name);
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockChunk(importPath), loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const rightPanel = await bundle("thread-right-panel-state");
assert.equal(rightPanel.toggleThreadSidePanel().name, "toggle-thread-side-panel");
assert.equal(state.initialized.includes("thread-right-panel"), true);

const markdown = await bundle("conversation-markdown-entry");
assert.equal(markdown.renderConversationMarkdown({ title: "Task" }), "markdown:Task");
assert.equal(state.initialized.includes("conversation-markdown"), true);

const prCode = await bundle("open-thread-pull-request-code-tab-entry");
assert.equal(prCode.openThreadPullRequestCodeTab("thread").name, "open-pr-code-tab");
assert.equal(state.initialized.includes("pr-code-tab"), true);

const subagents = await bundle("open-local-conversation-subagents-panel-entry");
assert.equal(subagents.openLocalConversationSubagentsPanel("thread").name, "open-subagents-panel");
assert.equal(state.initialized.includes("subagents-panel"), true);

const shell = await bundle("thread-app-shell-chrome-entry");
assert.equal(shell.ThreadAppShellChrome, "ThreadAppShellChrome");
assert.equal(state.initialized.includes("thread-shell"), true);

const updates = await bundle("chatgpt-conversation-updates-runtime");
assert.equal((await updates.refetchChatGptConversation("conversation")).name, "refetch-conversation");
assert.equal(state.initialized.includes("conversation-updates"), true);

const sourcesPanel = await bundle("open-local-conversation-sources-side-panel-tab-entry");
assert.equal(sourcesPanel.openLocalConversationSourcesSidePanelTab("thread").name, "open-sources-panel");
assert.equal(state.initialized.includes("sources-panel"), true);

const panelState = await bundle("thread-panel-state");
assert.equal(panelState.activateThreadPanelTab("code").name, "activate-thread-panel-tab");
assert.equal(panelState.getThreadPanelTabController("thread").name, "get-thread-panel-tab-controller");
assert.equal(state.initialized.includes("thread-accounts"), true);

const terminal = await bundle("open-local-conversation-background-terminal-tab-entry");
assert.equal(terminal.openLocalConversationBackgroundTerminalTab("thread").name, "open-background-terminal");
assert.equal(state.initialized.includes("background-terminal"), true);

const transcript = await bundle("chatgpt-conversation-transcript-entry");
assert.equal(transcript.ChatGptConversationTranscript, "ChatGptConversationTranscript");
assert.equal(state.initialized.includes("transcript"), true);

const conversationUi = await bundle("conversation-ui-entry");
assert.equal(conversationUi.BusinessAgentConversationHeader, "BusinessAgentConversationHeader");
assert.equal(conversationUi.BusinessAgentHomeHero, "BusinessAgentHomeHero");
assert.equal(state.initialized.includes("conversation-ui"), true);

const localThread = await bundle("local-conversation-thread-entry");
assert.equal(localThread.LocalConversationBackgroundAgentTab, "LocalConversationBackgroundAgentTab");
assert.equal(localThread.LocalConversationSideChatTab, "LocalConversationSideChatTab");
assert.equal(state.initialized.includes("local-thread"), true);

const webMcp = await bundle("local-conversation-webmcp-tools-model-entry");
assert.equal(webMcp.getHostnameFromWebUrl("https://example.com/path"), "example.com");
assert.deepEqual(webMcp.getWebMcpCallsForSummaryPanel([{ visible: true }, { visible: false }]), [{ visible: true }]);
assert.equal(webMcp.groupWebMcpCallsByName([1]).get("tool")[0], 1);
assert.equal(state.initialized.includes("webmcp-model"), true);

const sourceSignals = await bundle("local-conversation-sources-signals-entry");
assert.equal(sourceSignals.sourceLinksByThread.id, "source-links");
assert.equal(sourceSignals.priorConversationTurns$.id, "prior-turns");
assert.equal(sourceSignals.conversationTurnsForSources$.id, "source-turns");
assert.equal(state.initialized.includes("source-signals"), true);

const prPanel = await bundle("open-thread-pull-request-side-panel-tab-entry");
assert.equal(prPanel.openThreadCanonicalPullRequestSidePanelTab().name, "open-canonical-pr-panel");
assert.equal(prPanel.openThreadPullRequestSidePanelTab().name, "open-pr-panel");
assert.equal(prPanel.restoreThreadPullRequestSidePanelTab().name, "restore-pr-panel");
assert.equal(state.initialized.includes("pr-panel"), true);

const newConversation = await bundle("use-start-new-conversation");
assert.equal(newConversation.revealNewChat().name, "reveal-new-chat");
assert.equal(newConversation.startNewConversation().name, "start-new-conversation");
assert.equal(newConversation.useStartNewConversation().name, "use-start-new-conversation");
assert.equal(newConversation.shouldDefaultNewConversationsToWork("work"), true);
assert.equal(newConversation.shouldDefaultNewConversationsToWork("chat"), false);

const mcpTab = await bundle("thread-side-panel-tab");
assert.equal(mcpTab.mcpExtensionTabType, "mcp-extension");
assert.equal(mcpTab.openMcpExtensionThreadSidePanelTab().name, "open-mcp-extension-thread-tab");
assert.equal(mcpTab.openMcpExtensionFileViewerSidePanelTab().name, "open-mcp-extension-file-tab");
assert.equal(mcpTab.restoreMcpExtensionSidePanelTab().name, "restore-mcp-extension-tab");

const sidePanelTabs = await bundle("thread-side-panel-tabs");
sidePanelTabs.t();
assert.equal(sidePanelTabs.r({}, "code"), false);
assert.equal(sidePanelTabs.n({}, "code"), false);
assert.equal(state.initialized.includes("side-panel-registry"), true);
assert.equal(state.initialized.includes("thread-side-panel-state"), true);

const navigation = await bundle("conversation-navigation-state");
navigation.t();
assert.equal(state.scopedFamilies.length > 0, true);
assert.equal(state.scopedFamilies.at(-1).factory("thread", {}), false);
assert.equal(state.scopedFamilies.at(-1).familyOptions.autoDispose, 60000);

const imagePreview = await bundle("local-conversation-summary-panel-image-preview");
imagePreview.n();
assert.deepEqual(imagePreview.t("image"), { sourceFor: "image" });
state.imageMode = "never";
assert.equal(imagePreview.t("image"), null);
state.imageMode = "always";
state.imagePreview = null;
assert.equal(imagePreview.t("image"), null);
assert.equal(state.initialized.includes("image-preview-source"), true);

console.log("conversation bridge batch assertions passed");
