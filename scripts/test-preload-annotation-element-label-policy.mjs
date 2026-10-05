import assert from "node:assert/strict";
import { projectAnnotationElementLabel } from "../app/.vite/build/browser-page-preload/annotation-element-label-policy.js";
assert.equal(projectAnnotationElementLabel({ tagName: `DIV`, textContent: ` hello ` }, () => false), `hello`);
assert.equal(projectAnnotationElementLabel({ tagName: `BODY`, textContent: `hello` }, () => true), `body`);
assert.equal(projectAnnotationElementLabel({ tagName: `DIV`, textContent: ` ` }, () => false), null);
console.log("test-preload-annotation-element-label-policy: 3 assertions passed");
