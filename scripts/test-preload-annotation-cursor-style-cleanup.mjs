import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { removeAnnotationCursorStyles } = require("../app/.vite/build/browser-page-preload/annotation-cursor-style-cleanup.js");
let restored = 0, removed = 0; removeAnnotationCursorStyles({}, { restoreCursor: () => { restored += 1; }, queryAllStyles: () => [{ remove: () => { removed += 1; } }, { remove: () => { removed += 1; } }], attribute: "data-cursor" }); assert.equal(restored, 1); assert.equal(removed, 2); console.log("2 preload annotation cursor cleanup assertions passed");
