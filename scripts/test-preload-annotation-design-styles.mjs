import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  collectAnnotationStyleDeclarations,
  mergeAnnotationStyleDeclarations,
  readAnnotationDirectText,
  createAnnotationTextDraft,
  projectAnnotationStyleProvenance,
  isAnnotationInteractionTargetMatch,
} = require("../app/.vite/build/browser-page-preload/annotation-design-styles.js");

const computed = { getPropertyValue: (property) => ({ color: " red ", gap: " 4px" }[property] ?? "") };
assert.deepEqual(collectAnnotationStyleDeclarations(computed, ["color", "gap"]), [
  { property: "color", value: "red", previousValue: "red" },
  { property: "gap", value: "4px", previousValue: "4px" },
]);
assert.deepEqual(mergeAnnotationStyleDeclarations(
  [{ property: "color", value: "red", previousValue: "red" }, { property: "gap", value: "4px" }],
  [{ property: "color", value: "blue", previousValue: "red" }],
), [{ property: "color", value: "blue", previousValue: "red" }, { property: "gap", value: "4px" }]);
const direct = { childNodes: [{ nodeType: 3, textContent: " Hello  world " }], children: [] };
assert.equal(readAnnotationDirectText(direct), "Hello world");
assert.deepEqual(createAnnotationTextDraft(direct), { value: "Hello world", previousValue: "Hello world" });
assert.equal(readAnnotationDirectText({ childNodes: [{ nodeType: 3, textContent: "text" }], children: [{ textContent: "nested" }] }), null);
assert.deepEqual(projectAnnotationStyleProvenance([{ property: "color", value: "red" }]), [{ property: "color" }]);
assert.equal(isAnnotationInteractionTargetMatch({ mode: "edit", commentId: "a" }, { mode: "edit", commentId: "a" }), true);
assert.equal(isAnnotationInteractionTargetMatch({ mode: "edit", commentId: "a" }, { mode: "edit", commentId: "b" }), false);
assert.equal(isAnnotationInteractionTargetMatch({ mode: "design", groupId: "g" }, { mode: "design", groupId: "g" }), true);
console.log("9 preload annotation design-styles assertions passed");
