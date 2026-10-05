import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createAnnotationSiteRequestState } = require(
  "../app/.vite/build/browser-page-preload/annotation-site-request-state.js",
);

const state = createAnnotationSiteRequestState();
const first = { id: 1 };
const second = { id: 2 };

assert.equal(state.canBegin(true, false), true);
assert.equal(state.canBegin(false, false), false);
assert.equal(state.canBegin(true, true), false);
assert.equal(state.begin(first), true);
assert.equal(state.pending, first);
assert.equal(state.begin(second), false);
assert.equal(state.isCurrent(first), true);
state.clear(second);
assert.equal(state.pending, first);
state.clear(first);
assert.equal(state.pending, null);

assert.equal(state.begin(first), true);
state.hide();
assert.equal(state.pageHidden, true);
assert.equal(state.pending, null);
assert.equal(state.isCurrent(first), false);
assert.equal(state.begin(second), false);
state.show();
assert.equal(state.canBegin(true, false), true);

assert.equal(state.begin(second), true);
assert.equal(state.dispose(), true);
assert.equal(state.disposed, true);
assert.equal(state.pending, null);
assert.equal(state.dispose(), false);
state.show();
assert.equal(state.pageHidden, true);
assert.equal(state.begin(first), false);
assert.equal(state.canBegin(true, false), false);

console.log(`test-preload-annotation-site-request-state: 23 assertions passed`);
