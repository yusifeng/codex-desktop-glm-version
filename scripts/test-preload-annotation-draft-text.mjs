import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { findLatestDraftTextChange } = require("../app/.vite/build/browser-page-preload/annotation-draft-text.js");
assert.deepEqual(findLatestDraftTextChange([]), null, "empty changes");
assert.deepEqual(findLatestDraftTextChange([{ text: { value: "same", previousValue: "same" } }]), null, "unchanged text");
assert.deepEqual(
  findLatestDraftTextChange([
    { text: { value: "first", previousValue: "old" } },
    { text: { value: "second", previousValue: "second" } },
  ]),
  { value: "first", previousValue: "old" },
  "skips unchanged latest entry",
);
assert.deepEqual(
  findLatestDraftTextChange([{ text: { value: "first" } }, { text: null }]),
  { value: "first" },
  "accepts missing previous value",
);
console.log("4 preload annotation draft-text assertions passed");
