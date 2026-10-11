import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { projectAnnotationActiveView } = require("../app/.vite/build/browser-page-preload/annotation-active-view-projection.js");

const comments = [{ id: "comment-1" }, { id: "comment-2" }];
const designs = [{ id: "design-1" }, { id: "comment-1", source: "design-shadow" }];

const commentView = projectAnnotationActiveView("comment-1", comments, designs);
assert.equal(commentView.active.kind, "comment");
assert.equal(commentView.active.annotation, comments[0]);
assert.equal(commentView.activeId, "comment-1");
assert.deepEqual(commentView.displayAnnotations, [comments[0]]);
assert.equal(commentView.hasActiveSelection, true);

const designView = projectAnnotationActiveView("design-1", comments, designs);
assert.equal(designView.active.kind, "design");
assert.equal(designView.active.annotation, designs[0]);
assert.deepEqual(designView.displayAnnotations, comments);

const missingView = projectAnnotationActiveView("missing", comments, designs);
assert.equal(missingView.active, null);
assert.equal(missingView.activeId, null);
assert.equal(missingView.hasActiveSelection, false);
assert.equal(projectAnnotationActiveView(null, comments, designs).displayAnnotations, comments);
console.log("12 preload annotation active-view projection assertions passed");
