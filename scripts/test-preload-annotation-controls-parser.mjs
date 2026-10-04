import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseAnnotationControlsPayload } = require("../app/.vite/build/browser-page-preload/annotation-controls-parser.js");
const parse = (value) => ({ success: value && typeof value === "object" && typeof value.controls === "number", data: value });

assert.deepEqual(parseAnnotationControlsPayload('{"controls":1}', parse, parse), { controls: 1 });
assert.deepEqual(parseAnnotationControlsPayload('{"controls":2}', parse, parse, { controls: 1 }), { controls: 2 });
assert.equal(parseAnnotationControlsPayload('{"controls":"bad"}', parse, parse), undefined);
assert.equal(parseAnnotationControlsPayload('{"controls":1}', parse, () => ({ success: false }), { controls: 0 }), undefined);
assert.equal(parseAnnotationControlsPayload("not-json", parse, parse), undefined);
assert.equal(parseAnnotationControlsPayload('{"controls":1}', parse, parse, undefined, 5), undefined);

console.log("test-preload-annotation-controls-parser: 6 assertions passed");
