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

const libraryItemReleaseAssertions = assertReleaseOwner("library-item-dialogs");
const libraryMoveReleaseAssertions = assertReleaseOwner("library-move-dialog");

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
  libraryItemReleaseAssertions +
  libraryMoveReleaseAssertions +
  assertReleaseOwner("chatgpt-project-add-sources-dialog") +
  assertReleaseOwner("create-project-dialog-core");

console.log(`project library dialog cluster tests passed with ${restoredOwnerAssertions} release assertions`);
