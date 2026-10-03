import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationProtocol } = require("../app/.vite/build/browser-page-preload/annotation-protocol.js");
const schema = (kind) => ({ kind, min(value) { return { ...this, min: value }; }, max(value) { return { ...this, max: value }; }, regex(value) { return { ...this, regex: String(value) }; }, optional() { return { ...this, optional: true }; }, nullable() { return { ...this, nullable: true }; }, positive() { return { ...this, positive: true }; } });
const protocol = createAnnotationProtocol({
  object: (shape) => ({ kind: "object", shape, optional() { return { ...this, optional: true }; }, nullable() { return { ...this, nullable: true }; } }),
  string: () => schema("string"),
  unknown: () => schema("unknown"),
  number: () => schema("number"),
  boolean: () => schema("boolean"),
  enumValues: (values) => ({ kind: "enum", values }),
  metadataLimits: { maxKeys: 6 },
});

assert.equal(protocol.channels.requestEvent, "codex:annotation-surface-request");
assert.equal(protocol.channels.deadlineMs, 250);
assert.equal(protocol.id.max, 128);
assert.equal(protocol.role.max, 64);
assert.deepEqual(protocol.response.shape.type.values, ["registered", "invalidated", "disposed", "rendering-failed", "result"]);
assert.equal(protocol.response.shape.hit.optional, true);

console.log("6 preload annotation protocol assertions passed");
