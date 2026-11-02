import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__searchCommandDialogTest = {
  React,
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) {
      return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
    },
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
      name: "search-command-dialog-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: importPath === "app-shared"
            ? "export const I3=()=>globalThis.__searchCommandDialogTest.jsx;export const e6=globalThis.__searchCommandDialogTest.React;"
            : "export {};",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }

function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit));
  else walk(children, visit);
}

function find(node, predicate) {
  let result;
  walk(node, value => {
    if (result == null && predicate(value)) result = value;
  });
  return result;
}

function all(node, predicate) {
  const result = [];
  walk(node, value => {
    if (predicate(value)) result.push(value);
  });
  return result;
}

function text(node) {
  const parts = [];
  const collect = value => {
    if (typeof value === "string" || typeof value === "number") {
      parts.push(String(value));
      return;
    }
    if (value == null || typeof value !== "object") return;
    const children = value.props?.children;
    if (Array.isArray(children)) children.flat(Infinity).forEach(collect);
    else collect(children);
  };
  collect(node);
  return parts.join(" ");
}

const command = await bundle("command-menu-dialog");
assert.deepEqual(Object.keys(command), ["CommandMenuDialog"]);
let commandClosed = 0;
let selectedCommand = 0;
let selectedChat;
let commandSearch;
const commandMount = mount(command.CommandMenuDialog, {
  chatResults: [{ id: "chat-1", title: "Quarterly planning" }],
  close() { commandClosed++; },
  commands: [{ id: "settings", label: "Open settings", description: "Manage preferences", onSelect() { selectedCommand++; } }],
  onSelectChat(chat) { selectedChat = chat.id; },
  search: "",
  setSearch(value) { commandSearch = value; },
});
let commandUi = commandMount.render();
assert.match(text(commandUi), /Command menu/);
assert.match(text(commandUi), /Quick actions.*Open settings.*Chats.*Quarterly planning/);
find(commandUi, node => node.props?.children?.[0] === "Open settings").props.onClick();
assert.equal(selectedCommand, 1);
assert.equal(commandClosed, 1);
find(commandUi, node => node.props?.children === "Quarterly planning").props.onClick();
assert.equal(selectedChat, "chat-1");
const commandInput = find(commandUi, node => node.props?.role === "combobox");
commandInput.props.onChange({ currentTarget: { value: "settings" } });
assert.equal(commandSearch, "settings");
commandUi = commandMount.render();
assert.equal(find(commandUi, node => node.props?.role === "combobox").props.value, "settings");
const updatedCommandInput = find(commandUi, node => node.props?.role === "combobox");
updatedCommandInput.props.onKeyDown({ key: "Enter", preventDefault() {} });
assert.equal(selectedCommand, 2);
const chatSearchUi = mount(command.CommandMenuDialog, { close() {}, rootChatSearchIntent: true, search: "", setSearch() {} }).render();
assert.match(text(chatSearchUi), /Search chats.*No matches.*Create chat/);
assert.equal(find(mount(command.CommandMenuDialog, { close() {}, isLoading: true, search: "", setSearch() {} }).render(), node => node.props?.role === "status").props.children, "Loading chats…");
let retriedCommand = 0;
const commandErrorUi = mount(command.CommandMenuDialog, { close() {}, error: "offline", onRetry() { retriedCommand++; }, search: "", setSearch() {} }).render();
find(commandErrorUi, node => node.props?.children === "Retry").props.onClick();
assert.equal(retriedCommand, 1);

const search = await bundle("chatgpt-search-dialog");
assert.deepEqual(Object.keys(search), ["ChatGptSearchDialog"]);
let searchClosed = 0;
let openedResult;
let latestSearch;
let latestFilter;
const readyResult = { id: "doc-1", kind: "document", state: "ready", title: "Launch brief", subtitle: "Document" };
const searchMount = mount(search.ChatGptSearchDialog, {
  close() { searchClosed++; },
  loadMore() {},
  onOpen(result, options) { openedResult = `${result.id}:${options.newTab}`; },
  results: [readyResult],
  search: "launch",
  searchFilter: "all",
  setSearch(value, filter) { latestSearch = value; latestFilter = filter; },
});
let searchUi = searchMount.render();
assert.match(text(searchUi), /Global search.*Search your chats, projects, images, and documents/);
assert.equal(all(searchUi, node => node.type === "input" && node.props?.type === "radio").length, 5);
assert.match(text(searchUi), /Launch brief.*Document.*Load more/);
const searchInput = find(searchUi, node => node.props?.role === "searchbox");
searchInput.props.onChange({ currentTarget: { value: "brief" } });
assert.equal(latestSearch, "brief");
assert.equal(latestFilter, "all");
searchUi = searchMount.render();
find(searchUi, node => node.type === "label" && node.key === "documents").props.children[0].props.onChange();
assert.equal(latestFilter, "documents");
searchUi = searchMount.render();
find(searchUi, node => node.props?.children?.[0]?.props?.children === "Launch brief").props.onClick({});
assert.equal(openedResult, "doc-1:false");
assert.equal(searchClosed, 1);
find(searchUi, node => node.props?.children?.[0]?.props?.children === "Launch brief").props.onClick({ metaKey: true });
assert.equal(openedResult, "doc-1:true");
assert.equal(searchClosed, 1);
const recentUi = mount(search.ChatGptSearchDialog, { close() {}, recentResults: [{ id: "chat-1", kind: "chat", title: "Recent conversation" }], search: "", searchFilter: "all", setSearch() {} }).render();
assert.match(text(recentUi), /Recent conversation/);
let blockedOpen = 0;
const processingUi = mount(search.ChatGptSearchDialog, { close() {}, onOpen() { blockedOpen++; }, results: [{ id: "file-1", kind: "document", state: "processing", title: "Import" }], search: "", searchFilter: "documents", setSearch() {} }).render();
assert.match(text(processingUi), /This file is still processing/);
find(processingUi, node => node.type === "button" && /Import/.test(text(node))).props.onClick({});
assert.equal(blockedOpen, 0);
assert.equal(find(mount(search.ChatGptSearchDialog, { close() {}, isLoading: true, search: "", searchFilter: "all", setSearch() {} }).render(), node => node.props?.role === "status").props.children, "Loading search results…");
let retriedSearch = 0;
const searchErrorUi = mount(search.ChatGptSearchDialog, { close() {}, error: "offline", onRetry() { retriedSearch++; }, search: "", searchFilter: "all", setSearch() {} }).render();
find(searchErrorUi, node => node.props?.children === "Retry").props.onClick();
assert.equal(retriedSearch, 1);
assert.match(text(mount(search.ChatGptSearchDialog, { close() {}, search: "missing", searchFilter: "all", setSearch() {} }).render()), /No results/);

console.log("search command dialog cluster tests passed");
