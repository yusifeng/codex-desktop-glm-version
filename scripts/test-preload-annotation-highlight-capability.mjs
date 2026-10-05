import assert from "node:assert/strict";
import { supportsAnnotationCssHighlights } from "../app/.vite/build/browser-page-preload/annotation-highlight-capability.js";
const good = { CSS: { highlights: new Map() }, Highlight: function Highlight() {}, CSSStyleSheet: function CSSStyleSheet() {} }; good.CSSStyleSheet.prototype.replaceSync = () => {};
assert.equal(supportsAnnotationCssHighlights(good), true);
assert.equal(supportsAnnotationCssHighlights({ CSS: {}, Highlight: function Highlight() {}, CSSStyleSheet: function CSSStyleSheet() {} }), false);
console.log("test-preload-annotation-highlight-capability: 2 assertions passed");
