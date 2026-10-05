import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveAnnotationThemeVariant } = require("../app/.vite/build/browser-page-preload/annotation-theme-policy.js");
assert.equal(resolveAnnotationThemeVariant({ matchMedia: () => ({ matches: true }) }), "dark");
assert.equal(resolveAnnotationThemeVariant({ matchMedia: () => ({ matches: false }) }), "light");
assert.equal(resolveAnnotationThemeVariant({}), "light");
console.log("test-preload-annotation-theme-policy: 3 assertions passed");
