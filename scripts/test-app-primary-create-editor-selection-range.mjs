import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const result = await esbuild.build({ entryPoints: ["src/renderer/app-primary/runtime/create-editor-selection-range.ts"], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent" });
const { createEditorSelectionRange } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

const text = { nodeType: 3, textContent: "hello" };
const calls = [];
const range = {
  setStart(node, offset) { calls.push(["start", node, offset]); },
  setEnd(node, offset) { calls.push(["end", node, offset]); },
};
const doc = { createRange() { return range; } };
globalThis.document = doc;
const view = {
  dom: { ownerDocument: doc },
  domAtPos(position) { return { node: text, offset: position + 1 }; },
};
assert.equal(createEditorSelectionRange(view, { from: 2, to: 4 }), range);
assert.deepEqual(calls, [["start", text, 3], ["end", text, 5]]);
assert.equal(createEditorSelectionRange({ ...view, dom: { ownerDocument: null } }, { from: 0, to: 0 }), range);
console.log("create editor selection range focused assertions passed");
