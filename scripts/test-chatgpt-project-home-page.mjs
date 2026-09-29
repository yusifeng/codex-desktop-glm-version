import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/chatgpt-project-home-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = [];
let stateIndex = 0;
const calls = { navigate: [] };
const React = { Fragment: "Fragment", useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__projectHome = { React, jsx, calls };
const dialogModule = (name) => `export const ${name}=props=>({type:'lazy-dialog',props:{...props,dialogName:'${name}'}});`;
const mocks = {
  "app-shared": "const r=globalThis.__projectHome;export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
  "app-initial": "const r=globalThis.__projectHome;export const o_n=()=>path=>r.calls.navigate.push(path);",
  "chatgpt-project-settings-modal": dialogModule("ChatGptProjectSettingsModal"),
  "chatgpt-project-share-dialog": dialogModule("ChatGptProjectShareDialog"),
  "chatgpt-project-report-dialog": dialogModule("ChatGptProjectReportDialog"),
  "chatgpt-project-add-sources-dialog": dialogModule("ChatGptProjectAddSourcesDialog"),
  "source-file-delete-dialog": dialogModule("ChatGptProjectFileDeleteDialog"),
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "project-home-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() { state.length = 0; stateIndex = 0; calls.navigate.length = 0; }
function render(props = {}) { stateIndex = 0; return module.ChatGptProjectHome({ projectId: "p1", ...props }); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" " ); return text(value.props?.children); }
function find(view, type, label) { return walk(view).find((node) => node.type === type && (label == null || text(node) === label)); }
function findAll(view, type, label) { return walk(view).filter((node) => node.type === type && (label == null || text(node) === label)); }
function panel(view, label) { return walk(view).find((node) => node.props?.role === "tabpanel" && node.props?.["aria-label"] === label); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

deepEqual(Object.keys(module), ["ChatGptProjectHome"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "tabs", "partition", "conversation-move-menu-items", "source-dashed-border", "chatgpt-projects-runtime", "project-share-model"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), ["chatgpt-project-settings-modal", "chatgpt-project-share-dialog", "chatgpt-project-report-dialog", "chatgpt-project-add-sources-dialog", "source-file-delete-dialog"]);

const project = { id: "p1", name: "Launch plan", description: "Prepare the release", canEdit: true, canShare: true, isPinned: false, isShared: true, creatorName: "Avery", memberCount: 4 };
const chats = [{ id: "c1", title: "Roadmap", updatedAt: "Sep 20", isOwner: true }, { id: "c2", isOwner: false, pinned: true }];
const sources = [{ id: "s1", name: "Brief.pdf", type: "files", createdAt: "2026-09-20" }, { id: "s2", name: "Slack channel", type: "apps", createdAt: "2026-09-22" }, { id: "s3", name: "Saved answer", type: "saves", createdAt: "2026-09-21" }];

reset();
let view = render({ projectState: "loading" });
equal(text(view), "Loading project");
reset();
let retried = 0;
view = render({ projectState: "error", onRetryProject: () => retried++ });
equal(text(view).includes("This project is unavailable"), true);
find(view, "button", "Try again").props.onClick();
equal(retried, 1);
reset();
view = render({ projectState: "unavailable" });
find(view, "button", "Go home").props.onClick();
equal(calls.navigate.at(-1), "/");

reset();
let joined = 0;
let declined = 0;
view = render({ project, invited: true, onJoinInvitation: async () => { joined++; }, onDeclineInvitation: async () => { declined++; } });
equal(text(view).includes("Avery invited you to join the project"), true);
equal(text(view).includes("4 members"), true);
find(view, "button", "Join project").props.onClick();
find(view, "button", "Decline").props.onClick();
await flush();
equal(joined, 1);
equal(declined, 1);
reset();
view = render({ project, invited: true, invitationState: "joining", invitationError: "Invite expired" });
equal(text(view).includes("Joining…"), true);
equal(text(view).includes("Invite expired"), true);

const events = { archived: [], deleted: [], moved: [], pinnedChats: [], renamed: [], shared: [] };
let projectPinned;
let started = 0;
let more = 0;
reset();
view = render({ project, chats, chatsNextCursor: "next", sources, onArchiveChat: (chat) => events.archived.push(chat.id), onDeleteChat: (chat) => events.deleted.push(chat.id), onMoveChat: (chat) => events.moved.push(chat.id), onPinChat: (chat, value) => events.pinnedChats.push([chat.id, value]), onPinProject: (value) => { projectPinned = value; }, onRenameChat: (chat, title) => events.renamed.push([chat.id, title]), onShareChat: (chat) => events.shared.push(chat.id), onStartChat: () => started++, onLoadMoreChats: () => more++ });
equal(text(view).includes("Launch plan"), true);
equal(text(view).includes("Prepare the release"), true);
equal(find(view, "nav").props["aria-label"], "Project views");
equal(panel(view, "Chats").props.hidden, false);
equal(panel(view, "Sources").props.hidden, true);
equal(text(panel(view, "Chats")).includes("Roadmap"), true);
equal(text(panel(view, "Chats")).includes("Untitled"), true);
find(view, "button", "Roadmap").props.onClick();
equal(calls.navigate.at(-1), "/c/c1");
find(view, "button", "New chat").props.onClick();
equal(started, 1);
find(view, "button", "Pin project").props.onClick();
equal(projectPinned, true);
find(view, "button", "Load more").props.onClick();
equal(more, 1);
findAll(view, "button", "Archive")[0].props.onClick();
findAll(view, "button", "Move")[0].props.onClick();
findAll(view, "button", "Share chat")[0].props.onClick();
findAll(view, "button", "Delete")[0].props.onClick();
findAll(view, "button", "Pin")[0].props.onClick();
deepEqual(events.archived, ["c1"]);
deepEqual(events.moved, ["c1"]);
deepEqual(events.shared, ["c1"]);
deepEqual(events.deleted, ["c1"]);
deepEqual(events.pinnedChats, [["c1", true]]);
equal(findAll(view, "button", "Share chat")[1].props.disabled, true);
equal(findAll(view, "button", "Unpin")[0].props.disabled, true);
findAll(view, "button", "Rename")[0].props.onClick();
view = render({ project, chats, sources, onRenameChat: (chat, title) => events.renamed.push([chat.id, title]) });
const rename = walk(view).find((node) => node.props?.["aria-label"] === "Rename chat");
equal(rename.props.value, "Roadmap");
rename.props.onChange({ currentTarget: { value: "Release roadmap" } });
view = render({ project, chats, sources, onRenameChat: (chat, title) => events.renamed.push([chat.id, title]) });
find(view, "button", "Save name").props.onClick();
deepEqual(events.renamed, [["c1", "Release roadmap"]]);

reset();
view = render({ project, chatsState: "loading" });
equal(text(panel(view, "Chats")).includes("Loading project chats"), true);
reset();
view = render({ project, chatsState: "error" });
equal(text(panel(view, "Chats")).includes("Could not load project chats"), true);
reset();
view = render({ project, chats: [] });
equal(text(panel(view, "Chats")).includes("No chats yet"), true);
equal(text(panel(view, "Chats")).includes("Chats in Launch plan will live here"), true);

reset();
view = render({ project, activeTab: "sources", sources, sourceAccessWarning: true, sourceFileLimit: 3 });
equal(panel(view, "Sources").props.hidden, false);
equal(text(panel(view, "Sources")).includes("Some apps are unavailable"), true);
equal(text(panel(view, "Sources")).includes("limit of 3 files"), true);
equal(find(view, "button", "Add sources").props.disabled, true);
equal(text(panel(view, "Sources")).includes("Brief.pdf"), true);
equal(text(panel(view, "Sources")).includes("Saved response"), true);
const selects = walk(view).filter((node) => node.type === "select");
equal(selects.length, 2);
selects[1].props.onChange({ currentTarget: { value: "apps" } });
view = render({ project, activeTab: "sources", sources });
equal(text(panel(view, "Sources")).includes("Slack channel"), true);
equal(text(panel(view, "Sources")).includes("Brief.pdf"), false);
selects[0].props.onChange({ currentTarget: { value: "alphabetical" } });

reset();
view = render({ project, activeTab: "sources", sourcesState: "loading" });
equal(text(panel(view, "Sources")).includes("Loading project sources"), true);
reset();
view = render({ project, activeTab: "sources", sourcesState: "error" });
equal(text(panel(view, "Sources")).includes("Could not load project sources"), true);
reset();
view = render({ project, activeTab: "sources", sources: [] });
equal(text(panel(view, "Sources")).includes("No sources found"), true);

reset();
view = render({ project, activeTab: "sources", sources });
find(view, "button", "Add sources").props.onClick();
await flush();
view = render({ project, activeTab: "sources", sources });
equal(walk(view).find((node) => node.type === "lazy-dialog").props.dialogName, "ChatGptProjectAddSourcesDialog");
reset();
let deletedSource = [];
view = render({ project, activeTab: "sources", sources, onDeleteSource: async (source) => deletedSource.push(source.id) });
findAll(view, "button", "Delete source")[0].props.onClick();
await flush();
view = render({ project, activeTab: "sources", sources, onDeleteSource: async (source) => deletedSource.push(source.id) });
const deleteDialog = walk(view).find((node) => node.type === "lazy-dialog");
equal(deleteDialog.props.dialogName, "ChatGptProjectFileDeleteDialog");
equal(deleteDialog.props.source.id, "s2");
await deleteDialog.props.onDelete();
deepEqual(deletedSource, ["s2"]);

for (const [label, dialogName] of [["Project actions", "ChatGptProjectSettingsModal"], ["Share", "ChatGptProjectShareDialog"], ["Report project", "ChatGptProjectReportDialog"]]) {
  reset(); view = render({ project, sources }); find(view, "button", label).props.onClick(); await flush(); view = render({ project, sources }); equal(walk(view).find((node) => node.type === "lazy-dialog").props.dialogName, dialogName);
}
reset();
view = render({ project, sources });
find(view, "button", "Sources").props.onClick();
equal(calls.navigate.at(-1), "/projects/p1?tab=sources");
view = render({ project, sources });
find(view, "button", "Chats").props.onClick();
equal(calls.navigate.at(-1), "/projects/p1");

console.log(`chatgpt-project-home-page tests passed (${assertions} assertions)`);
