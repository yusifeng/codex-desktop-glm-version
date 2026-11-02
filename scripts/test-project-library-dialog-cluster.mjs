import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__projectLibraryDialogTest = { React, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "project-library-dialog-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__projectLibraryDialogTest.jsx;export const e6=globalThis.__projectLibraryDialogTest.React;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const dictionary = await bundle("dictionary-dialog");
assert.deepEqual(Object.keys(dictionary), ["DictionaryDialog"]);
let dictionaryClosed = 0, deletedWord, addedWord, importedWords, dictionaryRetried = 0;
const dictionaryMount = mount(dictionary.DictionaryDialog, { accountId: "a", userId: "u", words: [{ id: "1", text: "Codex" }], maxWords: 3, onClose() { dictionaryClosed++; }, onDelete(word) { deletedWord = word; }, onAdd(word) { addedWord = word; }, onImport(words) { importedWords = words; } });
let dictionaryUi = dictionaryMount.render();
assert.equal(dictionaryUi.type, "dialog");
assert.match(text(dictionaryUi), /1 of 3 words/);
find(dictionaryUi, node => node.props?.["aria-label"] === "Delete Codex").props.onClick();
assert.equal(deletedWord.text, "Codex");
const dictionaryInput = find(dictionaryUi, node => node.props?.name === "word");
dictionaryInput.props.onChange({ currentTarget: { value: " Canvas " } });
dictionaryUi = dictionaryMount.render();
find(dictionaryUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(addedWord, "Canvas");
dictionaryUi = dictionaryMount.render();
assert.equal(find(dictionaryUi, node => node.props?.name === "word").props.value, "");
const importBox = find(dictionaryUi, node => node.type === "textarea");
importBox.props.onChange({ currentTarget: { value: "alpha, beta\ngamma" } });
dictionaryUi = dictionaryMount.render();
find(dictionaryUi, node => node.props?.children === "Import").props.onClick();
await Promise.resolve();
assert.deepEqual(importedWords, ["alpha", "beta", "gamma"]);
find(dictionaryUi, node => node.props?.["aria-label"] === "Close dictionary").props.onClick();
assert.equal(dictionaryClosed, 1);
const fullDictionary = mount(dictionary.DictionaryDialog, { accountId: "a", userId: "u", words: [{ id: "1", text: "A" }], maxWords: 1, onClose() {} }).render();
assert.match(text(fullDictionary), /Dictionary limit reached/);
assert.equal(find(fullDictionary, node => node.props?.name === "word").props.disabled, true);
const failedDictionary = mount(dictionary.DictionaryDialog, { accountId: "a", userId: "u", error: "Offline", onClose() {}, onRetry() { dictionaryRetried++; } }).render();
assert.equal(find(failedDictionary, node => node.props?.role === "alert").type, "div");
find(failedDictionary, node => node.props?.children === "Try again").props.onClick();
assert.equal(dictionaryRetried, 1);

const items = await bundle("library-item-dialogs");
assert.deepEqual(Object.keys(items).sort(), ["ConfirmLibraryItemsDialog", "RenameLibraryItemDialog"]);
const fileEntry = { node: { id: "f1", kind: "file", name: "notes.txt" } };
let renamed, renameClosed = 0;
const renameMount = mount(items.RenameLibraryItemDialog, { accountId: "a", userId: "u", entry: fileEntry, onClose() { renameClosed++; }, onRename(entry, name) { renamed = `${entry.node.id}:${name}`; return true; } });
let renameUi = renameMount.render();
assert.match(text(renameUi), /Rename file/);
assert.match(text(renameUi), /File name/);
find(renameUi, node => node.props?.name === "name").props.onChange({ currentTarget: { value: " final.txt " } });
renameUi = renameMount.render();
find(renameUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(renamed, "f1:final.txt");
assert.equal(renameClosed, 1);
let confirmedAction, completedAction, confirmClosed = 0;
const confirmUi = mount(items.ConfirmLibraryItemsDialog, { accountId: "a", userId: "u", entries: [fileEntry], action: "deleteForever", onClose() { confirmClosed++; }, onConfirm(entries, action) { confirmedAction = `${entries.length}:${action}`; }, onCompleted(entries, action) { completedAction = `${entries[0].node.id}:${action}`; } }).render();
assert.match(text(confirmUi), /Delete forever/);
assert.match(text(confirmUi), /can't be undone/);
find(confirmUi, node => node.type === "button" && node.props?.children === "Delete forever").props.onClick();
await Promise.resolve();
assert.equal(confirmedAction, "1:deleteForever");
assert.equal(completedAction, "f1:deleteForever");
assert.equal(confirmClosed, 1);
assert.match(text(mount(items.ConfirmLibraryItemsDialog, { accountId: "a", userId: "u", entries: [fileEntry, fileEntry], action: "restore", onClose() {} }).render()), /These 2 selected files/);

const move = await bundle("library-move-dialog");
assert.deepEqual(Object.keys(move), ["MoveLibraryItemsDialog"]);
let movedIds, moveClosed = 0, moveRetried = 0;
const moveMount = mount(move.MoveLibraryItemsDialog, { accountId: "a", userId: "u", entries: [fileEntry], destinations: [{ id: "d1", name: "Research" }], onClose() { moveClosed++; }, onMoved(ids) { movedIds = ids; }, onMove(entries, directoryId) { return entries.map(entry => `${entry.node.id}@${directoryId}`); } });
let moveUi = moveMount.render();
assert.match(text(moveUi), /Move to…/);
assert.match(text(moveUi), /Research/);
find(moveUi, node => node.props?.children === "Research").props.onClick();
moveUi = moveMount.render();
find(moveUi, node => node.type === "button" && node.props?.children === "Move").props.onClick();
await Promise.resolve();
assert.deepEqual(movedIds, ["f1@d1"]);
assert.equal(moveClosed, 1);
assert.equal(find(moveUi, node => node.props?.children === "New folder").type, "button");
const moveLoading = mount(move.MoveLibraryItemsDialog, { accountId: "a", userId: "u", entries: [], isLoading: true, onClose() {}, onMoved() {} }).render();
assert.equal(find(moveLoading, node => node.props?.role === "status").props.children, "Loading folders");
const moveError = mount(move.MoveLibraryItemsDialog, { accountId: "a", userId: "u", entries: [], error: "No folders", onClose() {}, onMoved() {}, onRetry() { moveRetried++; } }).render();
assert.match(text(find(moveError, node => node.props?.role === "alert")), /No folders/);
find(moveError, node => node.props?.children === "Try again").props.onClick();
assert.equal(moveRetried, 1);

const create = await bundle("chatgpt-project-create-dialog");
assert.deepEqual(Object.keys(create), ["ChatGptProjectCreateDialog"]);
let createdInput, createdProject, createClosed = 0;
const createMount = mount(create.ChatGptProjectCreateDialog, { onClose() { createClosed++; }, onCreate(input) { createdInput = input; return { id: "p1", name: input.name, type: input.type }; }, onCreated(project) { createdProject = project; } });
let createUi = createMount.render();
assert.match(text(createUi), /Create project/);
assert.equal(all(createUi, node => node.props?.name === "project-type").length, 2);
find(createUi, node => node.props?.name === "project-name").props.onChange({ currentTarget: { value: " Launch " } });
createUi = createMount.render();
find(createUi, node => node.type === "select").props.onChange({ currentTarget: { value: "global" } });
createUi = createMount.render();
find(createUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(createdInput.name, "Launch");
assert.equal(createdInput.memoryScope, "global");
assert.equal(createdProject.id, "p1");
assert.equal(createClosed, 1);
const cloudOnly = mount(create.ChatGptProjectCreateDialog, { allowLocalProjectCreation: false, forceGlobalMemory: true, onClose() {} }).render();
assert.equal(find(cloudOnly, node => node.type === "fieldset"), undefined);
assert.equal(find(cloudOnly, node => node.type === "select"), undefined);

const restoredOwnerAssertions =
  assertReleaseOwner("chatgpt-project-add-sources-dialog") +
  assertReleaseOwner("create-project-dialog-core");

console.log(`project library dialog cluster tests passed with ${restoredOwnerAssertions} release assertions`);
