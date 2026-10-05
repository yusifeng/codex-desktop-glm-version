import assert from "node:assert/strict";
import { projectAnnotationDirectTextPreview } from "../app/.vite/build/browser-page-preload/annotation-direct-text-preview.js";
const element = { childNodes: [{ nodeType: 3, textContent: ` hello ` }, { nodeType: 1, textContent: `ignored` }, { nodeType: 3, textContent: ` world` }] };
assert.equal(projectAnnotationDirectTextPreview(element, () => false), `hello world`);
assert.equal(projectAnnotationDirectTextPreview(element, () => true), null);
assert.equal(projectAnnotationDirectTextPreview({ childNodes: [{ nodeType: 3, textContent: `   ` }] }, () => false), null);
console.log("test-preload-annotation-direct-text-preview: 3 assertions passed");
