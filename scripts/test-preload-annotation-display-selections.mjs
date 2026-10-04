import assert from "node:assert/strict";
import { projectAnnotationDisplaySelections } from "../app/.vite/build/browser-page-preload/annotation-display-selections.js";

const calls = [];
const make = (kind, id, rect = { x: 2, y: 3, width: 10, height: 8 }) => ({
  anchor: { kind, framePath: [], selector: `#${id}`, elementPath: id, rect },
  liveElement: kind === `element` ? { id } : null,
});
const deps = {
  resolveSelection: (selection) => { calls.push([`resolve`, selection.anchor.kind]); return { ...selection.anchor, id: selection.anchor.selector }; },
  resolveLiveElementRect: (element) => element == null ? null : { rect: { x: 1, y: 1, width: 4, height: 5 }, borderRadius: `2px` },
  getRect: (anchor) => anchor.rect,
  clipRect: (anchor, rect) => { calls.push([`clip`, anchor.kind]); return { ...rect, width: Math.min(rect.width, 3) }; },
  getClassName: (anchor, rect, width, height) => `${anchor.kind}:${width}x${height}`,
  isPageAnnotation: (anchor) => anchor.kind !== `virtual`,
};

const selections = [make(`element`, `a`), make(`region`, `b`), make(`virtual`, `c`)];
const projected = projectAnnotationDisplaySelections(selections, { width: 100, height: 80 }, { clipToVisibleArea: true, selectionIndexOffset: 1 }, deps);
assert.equal(projected.length, 3);
assert.deepEqual(projected.map((item) => item.selectionIndex), [1, 2, 3]);
assert.equal(projected[0].borderRadius, `2px`);
assert.equal(projected[0].rect.width, 3);
assert.equal(projected[1].className, `region:100x80`);
assert.equal(projected[2].isPageAnnotation, false);
assert.deepEqual(calls.filter(([kind]) => kind === `clip`).length, 3);

const unclipped = projectAnnotationDisplaySelections([make(`region`, `d`)], { width: 20, height: 20 }, {}, deps);
assert.equal(unclipped[0].rect.width, 10);
console.log(`annotation display selections: ${7} assertions passed`);
