import assert from "node:assert/strict";
import { buildAnnotationDesignStyleRule, buildAnnotationDesignStyles, escapeAnnotationDesignSelector } from "../app/.vite/build/browser-page-preload/annotation-design-styles.js";
assert.equal(escapeAnnotationDesignSelector(`a\\b"c`), `a\\\\b\\"c`);
assert.deepEqual(buildAnnotationDesignStyleRule({ draftAttribute: `group-1`, declarations: [{ property: `color`, value: `red`, previousValue: `blue` }, { property: `margin`, value: `0`, previousValue: `0` }] }), [`[data-codex-browser-design-group~="group-1"] {\n  color: red !important;\n}`]);
assert.deepEqual(buildAnnotationDesignStyleRule({ draftAttribute: `unchanged`, declarations: [{ property: `color`, value: `red`, previousValue: ` red ` }] }), []);
assert.equal(buildAnnotationDesignStyles([{ draftAttribute: `a`, declarations: [{ property: `color`, value: `red`, previousValue: `blue` }] }, { draftAttribute: `b`, declarations: [{ property: `display`, value: `block`, previousValue: `none` }] }], `data-x`), `[data-x~="a"] {\n  color: red !important;\n}\n\n[data-x~="b"] {\n  display: block !important;\n}`);
console.log("test-preload-annotation-design-css: 4 assertions passed");
