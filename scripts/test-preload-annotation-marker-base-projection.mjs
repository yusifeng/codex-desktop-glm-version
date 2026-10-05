import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationMarkerBase } = require("../app/.vite/build/browser-page-preload/annotation-marker-base-projection.js");
const result = projectAnnotationMarkerBase({ kind: "region" }, 2, null, { readViewportSize: () => ({ width: 10, height: 20 }), readThemeVariant: () => "dark", readViewportRect: () => ({ x: 1 }), resolveMarkerPoint: () => ({ x: 3, y: 4 }) }, [{ kind: "text" }]);
assert.equal(result.themeVariant, "dark");
assert.deepEqual(result.viewportSize, { width: 10, height: 20 });
assert.equal(result.additionalAnchors.length, 1);
console.log("test-preload-annotation-marker-base-projection: 3 assertions passed");
