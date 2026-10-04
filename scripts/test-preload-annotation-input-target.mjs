import assert from "node:assert/strict";
import { DEFAULT_TEXT_INPUT_TYPES, isAnnotationTextInput } from "../app/.vite/build/browser-page-preload/annotation-input-target.js";
class Input { constructor(type) { this.type = type; } }
class Textarea {}
const windowLike = { HTMLInputElement: Input, HTMLTextAreaElement: Textarea };
assert.equal(isAnnotationTextInput(new Input("text"), windowLike), true);
assert.equal(isAnnotationTextInput(new Input("password"), windowLike), false);
assert.equal(isAnnotationTextInput(new Textarea(), windowLike), true);
assert.equal(isAnnotationTextInput({ type: "text" }, windowLike), false);
assert.equal(isAnnotationTextInput(new Input("text"), null), false);
assert.equal(DEFAULT_TEXT_INPUT_TYPES.has("url"), true);
console.log("annotation input target assertions passed: 6");
