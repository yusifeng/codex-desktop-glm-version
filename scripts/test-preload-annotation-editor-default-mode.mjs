import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readAnnotationEditorDefaultMode } = require("../app/.vite/build/browser-page-preload/annotation-editor-default-mode.js");
const config = { name: "oai-annotation-editor-default-mode", values: ["advanced", "basic"] };
const documentLike = (values) => ({ head: { querySelectorAll(selector) { assert.equal(selector, `meta[name="${config.name}"]`); return values.map((content) => ({ getAttribute(name) { assert.equal(name, "content"); return content; } })); } } });
assert.equal(readAnnotationEditorDefaultMode(documentLike(["unknown", "basic"]), config), "basic");
assert.equal(readAnnotationEditorDefaultMode(documentLike(["unknown"]), config), undefined);
assert.equal(readAnnotationEditorDefaultMode({ head: null }, config), undefined);
console.log("3 preload annotation editor default mode assertions passed");
