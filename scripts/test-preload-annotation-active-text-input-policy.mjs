import assert from "node:assert/strict";
import { isAnnotationTextInput } from "../app/.vite/build/browser-page-preload/annotation-input-target.js";
class Input {}
class Textarea {}
const windowLike = { HTMLInputElement: Input, HTMLTextAreaElement: Textarea };
assert.equal(isAnnotationTextInput(Object.assign(new Input(), { type: `email` }), windowLike), true);
assert.equal(isAnnotationTextInput(Object.assign(new Input(), { type: `checkbox` }), windowLike), false);
assert.equal(isAnnotationTextInput(new Textarea(), windowLike), true);
console.log(`test-preload-annotation-active-text-input-policy: 3 assertions passed`);
