import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { reducePendingEditorMessage } = require("../app/.vite/build/browser-page-preload/pending-editor-message.js");
const select = { type: "browser-sidebar-runtime-select-comment", id: "comment-1" };
const create = { type: "browser-sidebar-runtime-create-comment-at-point" };
const restore = { type: "browser-sidebar-runtime-restore-editor" };

assert.equal(reducePendingEditorMessage(null, select), select);
assert.equal(reducePendingEditorMessage(select, restore), select);
assert.equal(reducePendingEditorMessage({ type: "browser-sidebar-runtime-sync" }, restore), restore);
assert.equal(reducePendingEditorMessage(select, { type: "browser-sidebar-runtime-sync" }), select);
assert.equal(reducePendingEditorMessage(create, { type: "browser-sidebar-runtime-close-editor" }), null);
assert.equal(reducePendingEditorMessage(select, { type: "unrelated" }), undefined);

console.log("6 preload pending editor message assertions passed");
