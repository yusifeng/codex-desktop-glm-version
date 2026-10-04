import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveAnnotationThemeVariant } = require("../app/.vite/build/browser-page-preload/annotation-theme.js");
assert.equal(resolveAnnotationThemeVariant({ matchMedia: () => ({ matches: true }) }), "dark", "dark preference");
assert.equal(resolveAnnotationThemeVariant({ matchMedia: () => ({ matches: false }) }), "light", "light preference");
assert.equal(resolveAnnotationThemeVariant({}), "light", "missing matchMedia");
console.log("3 preload annotation theme assertions passed");
