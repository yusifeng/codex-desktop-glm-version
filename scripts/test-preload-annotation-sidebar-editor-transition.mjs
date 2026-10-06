import assert from "node:assert/strict";
import { reduceAnnotationSidebarEditorTransition } from "../app/.vite/build/browser-page-preload/annotation-sidebar-editor-transition.js";
const select = { type: `browser-sidebar-runtime-select-comment` };
assert.equal(reduceAnnotationSidebarEditorTransition(null, select), select);
assert.equal(reduceAnnotationSidebarEditorTransition(select, { type: `browser-sidebar-runtime-restore-editor` }), select);
assert.equal(reduceAnnotationSidebarEditorTransition(select, { type: `browser-sidebar-runtime-close-editor` }), null);
console.log(`test-preload-annotation-sidebar-editor-transition: 3 assertions passed`);
