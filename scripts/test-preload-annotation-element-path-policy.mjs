import assert from "node:assert/strict";
import { projectAnnotationElementPath } from "../app/.vite/build/browser-page-preload/annotation-element-path-policy.js";
const html = { tagName: `HTML` }; const body = { tagName: `BODY` }; const div = { tagName: `DIV`, parent: body }; body.parent = html;
assert.equal(projectAnnotationElementPath(div, (value) => value.parent), `div`);
assert.equal(projectAnnotationElementPath(div, (value) => value.parent, 1), `div`);
assert.equal(projectAnnotationElementPath(html, () => null), `html`);
console.log("test-preload-annotation-element-path-policy: 3 assertions passed");
