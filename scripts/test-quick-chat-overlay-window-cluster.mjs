import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__quickChatWindowTest = {
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
};

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
      name: "quick-chat-window-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
          path: value.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({
          contents: value === "app-shared"
            ? "export const I3=()=>globalThis.__quickChatWindowTest.jsx;"
            : "export {};",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

function nodes(root) {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}

const overlay = await bundle("content-quick-chat-overlay");
overlay.i();
overlay.n();
assert.equal(overlay.r.key, "quick-chat-presentation");
assert.equal(overlay.r.defaultValue, "compact");
let stopped = false;
let transcriptCalls = 0;
const overlayTree = overlay.t({
  children: "composer",
  onStop() { stopped = true; },
  renderTranscript() { transcriptCalls += 1; return "transcript"; },
  statusState: "working",
  title: "Ask ChatGPT",
  workingStatus: "Searching",
});
assert.equal(overlayTree.props.role, "dialog");
assert.equal(overlayTree.props["aria-label"], "Ask ChatGPT");
assert.equal(overlayTree.props["data-status"], "working");
assert.equal(nodes(overlayTree).find((node) => node.props["aria-live"] === "polite").props.children, "Searching");
assert.equal(nodes(overlayTree).find((node) => node.props.className === "content-quick-chat-overlay__transcript").props.children, "transcript");
nodes(overlayTree).find((node) => node.type === "button").props.onClick();
assert.equal(stopped, true);
assert.equal(transcriptCalls, 1);
const composerOnly = overlay.t({ composerOnly: true, renderTranscript() { transcriptCalls += 1; } });
assert.equal(nodes(composerOnly).some((node) => node.props.className === "content-quick-chat-overlay__transcript"), false);
assert.equal(transcriptCalls, 1);

const windowModule = await bundle("quick-chat-window");
windowModule.n();
let selected = null;
let poppedOut = false;
let closed = false;
let added = null;
let viewedAll = false;
const windowTree = windowModule.t({
  canPopOut: true,
  onAddToComposer(id) { added = id; },
  onClose() { closed = true; },
  onConversationSelect(id) { selected = id; },
  onPopOut() { poppedOut = true; },
  onViewAll() { viewedAll = true; },
  session: {
    conversationId: "current",
    hasConversation: false,
    projectName: "Demo",
    recentConversations: [
      { conversationId: "old", recencyAt: 10, title: "Old" },
      { conversationId: "new", recencyAt: 30, title: "Newest" },
      { conversationId: "middle", recencyAt: 20, title: "Middle" },
      { conversationId: "hidden", recencyAt: 1, title: "Hidden" },
    ],
    title: "Current chat",
  },
});
assert.equal(windowTree.props.role, "dialog");
assert.equal(windowTree.props["data-quick-chat-variant"], "floating");
assert.equal(nodes(windowTree).find((node) => node.props.className === "quick-chat-window__title").props.children, "Demo / Current chat");
const buttons = nodes(windowTree).filter((node) => node.type === "button");
assert.equal(buttons.some((button) => button.props.children === "Hidden"), false);
assert.deepEqual(buttons.filter((button) => ["Newest", "Middle", "Old"].includes(button.props.children)).map((button) => button.props.children), ["Newest", "Middle", "Old"]);
buttons.find((button) => button.props.children === "Newest").props.onClick();
buttons.find((button) => button.props.children === "Open in window").props.onClick();
buttons.find((button) => button.props.children === "Add to composer").props.onClick();
buttons.find((button) => button.props.children === "See all").props.onClick();
buttons.find((button) => button.props["aria-label"] === "Close Quick Chat").props.onClick();
assert.equal(selected, "new");
assert.equal(poppedOut, true);
assert.equal(added, "current");
assert.equal(viewedAll, true);
assert.equal(closed, true);
const activeTree = windowModule.t({ session: { conversationId: "active", hasConversation: true, initialScrollMode: "anchor-latest" }, variant: "window" });
assert.equal(activeTree.props["data-quick-chat-variant"], "window");
assert.equal(nodes(activeTree).find((node) => node.props.className === "quick-chat-window__conversation").props["data-scroll-mode"], "anchor-latest");

console.log("23 quick chat overlay and window cluster assertions passed");
