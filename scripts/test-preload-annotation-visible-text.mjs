import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { collectAnnotationVisibleText } = require("../app/.vite/build/browser-page-preload/annotation-visible-text.js");

const accepted = [];
const first = { nodeType: 3, textContent: " first\ntext ", parentElement: { nodeType: 1 } };
const second = { nodeType: 3, textContent: "second", parentElement: { nodeType: 1 } };
const document = {
  body: {},
  createTreeWalker: (_body, _type, options) => ({
    nextNode: () => {
      const node = [first, second][accepted.length];
      if (node != null) accepted.push(node);
      return node ?? null;
    },
    options,
  }),
};
const normalizeText = (value) => typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : undefined;
const result = collectAnnotationVisibleText({ document }, { x: 1 }, {
  getDocument: (value) => value.document,
  normalizeText,
  isHTMLElement: (value) => value?.nodeType === 1,
  isVisibleElement: () => true,
  rangeIntersectsRect: () => true,
});
assert.equal(result, "first text second");
assert.equal(accepted.length, 2);

const hidden = collectAnnotationVisibleText({ document: { body: null } }, {}, {
  getDocument: (value) => value.document,
  normalizeText,
  isHTMLElement: () => true,
  isVisibleElement: () => true,
  rangeIntersectsRect: () => true,
});
assert.equal(hidden, null);

console.log("test-preload-annotation-visible-text: 3 assertions passed");
