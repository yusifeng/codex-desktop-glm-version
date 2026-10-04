import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationControlHandle } = require("../app/.vite/build/browser-page-preload/annotation-control-handle.js");
const emitted = [];
const handle = createAnnotationControlHandle(
  "control-1",
  (value) => JSON.stringify(value),
  (value) => [...value].filter(Boolean),
  (type, detail) => { emitted.push([type, detail]); return true; },
);
assert.equal(Object.isFrozen(handle), true);
handle.update({ targets: ["target-1", null] });
assert.deepEqual(emitted[0], ["update", { id: "control-1", payload: '{"targets":["target-1",null]}', targets: ["target-1"] }]);
handle.update({});
assert.equal(emitted[1][0], "update");
handle.dispose();
handle.dispose();
assert.deepEqual(emitted.at(-1), ["dispose", { id: "control-1" }]);
assert.equal(emitted.filter(([type]) => type === "dispose").length, 1);
assert.throws(() => handle.update({}), /disposed/);

const failed = createAnnotationControlHandle("bad", () => "payload", (value) => value, () => false);
assert.throws(() => failed.update({}), /Invalid annotation controls update/);
failed.dispose();
assert.equal(Object.isFrozen(failed), true);

console.log("8 preload annotation control handle assertions passed");
