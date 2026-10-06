import assert from "node:assert/strict";
import { resolveAnnotationHighlightContext } from "../app/.vite/build/browser-page-preload/annotation-highlight-context-policy.js";
const root = { ownerDocument: { defaultView: {} } };
const range = { commonAncestorContainer: { getRootNode: () => root } };
const deps = { getRoot: (value) => value.commonAncestorContainer.getRootNode(), isStyleRoot: (value) => value === root, getOwnerWindow: (value) => value.ownerDocument.defaultView, supportsHighlights: () => true };
assert.deepEqual(resolveAnnotationHighlightContext(range, deps), { ownerWindow: root.ownerDocument.defaultView, range, styleRoot: root });
assert.equal(resolveAnnotationHighlightContext(range, { ...deps, supportsHighlights: () => false }), null);
console.log(`test-preload-annotation-highlight-context-policy: 2 assertions passed`);
