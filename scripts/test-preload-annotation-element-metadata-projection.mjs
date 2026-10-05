import assert from "node:assert/strict";
import { projectAnnotationElementMetadata } from "../app/.vite/build/browser-page-preload/annotation-element-metadata-projection.js";
const style = { borderRadius: ``, color: `rgb(1 2 3)`, fontSize: `12px`, fontFamily: `sans`, display: `block` };
const result = projectAnnotationElementMetadata({ tagName: `DIV` }, { getRect: () => ({ x: 1, y: 2, width: 10, height: 20 }), getComputedStyle: () => style, normalizeColor: (value) => value, collectStyles: () => [], baseProperties: [], flexProperties: [] });
assert.equal(result.borderRadius, `0px`); assert.equal(result.size, `10x20`); assert.equal(result.tagName, `div`);
console.log("test-preload-annotation-element-metadata-projection: 3 assertions passed");
