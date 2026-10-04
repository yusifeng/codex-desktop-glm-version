import assert from "node:assert/strict";
import { isAnnotationSelectionBlocked } from "../app/.vite/build/browser-page-preload/annotation-selection.js";

const parent = new Map();
const element = (name, matches) => ({ name, matches: (selector) => matches.includes(selector) });
const getParent = (value) => parent.get(value) ?? null;
const input = element("input", ["input, button, select, audio, video"]);
const button = element("button", ["input, button, select, audio, video"]);
const wrapper = element("wrapper", []);
parent.set(input, wrapper);
parent.set(button, wrapper);
const deps = { getParent, isTextInput: (value) => value === input };

assert.equal(isAnnotationSelectionBlocked(input, deps), false, "text input remains selectable");
assert.equal(isAnnotationSelectionBlocked(button, deps), true, "button keeps native pointer handling");
assert.equal(isAnnotationSelectionBlocked(wrapper, deps), false, "ordinary ancestors do not block selection");
const nested = element("nested", []);
parent.set(nested, button);
assert.equal(isAnnotationSelectionBlocked(nested, deps), true, "nested content inherits control blocking");
console.log("test-preload-annotation-selection: 4 assertions passed");
