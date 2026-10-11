import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationTextHighlightController } = require("../app/.vite/build/browser-page-preload/annotation-text-highlight-controller.js");

const events = [];
const controller = createAnnotationTextHighlightController({
  apply: (anchor) => {
    events.push(`apply:${anchor.id}`);
    return () => events.push(`cleanup:${anchor.id}`);
  },
});
controller.update({ id: "one" });
controller.update({ id: "two" });
assert.deepEqual(events, ["apply:one", "cleanup:one", "apply:two"]);
controller.update(null);
assert.deepEqual(events, ["apply:one", "cleanup:one", "apply:two", "cleanup:two"]);
controller.update({ id: "three" });
controller.dispose();
controller.dispose();
assert.deepEqual(events, ["apply:one", "cleanup:one", "apply:two", "cleanup:two", "apply:three", "cleanup:three"]);
controller.update({ id: "four" });
assert.equal(events.includes("apply:four"), false);
console.log("8 preload annotation text-highlight-controller assertions passed");
