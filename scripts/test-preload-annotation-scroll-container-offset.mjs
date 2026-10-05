import assert from "node:assert/strict";
import { getAnnotationScrollContainerOffset } from "../app/.vite/build/browser-page-preload/annotation-scroll-container-offset.js";

const first = { scrollLeft: 15, scrollTop: 8 };
const second = { scrollLeft: 2, scrollTop: 9 };
const lookup = new Map([[`first`, first], [`second`, second]]);
const deps = {
  resolveSelector: (_documentLike, selector) => lookup.get(selector),
  isElement: (value) => value != null,
  getScrollLeft: (element) => element.scrollLeft,
  getScrollTop: (element) => element.scrollTop,
};

assert.deepEqual(getAnnotationScrollContainerOffset({ scrollContainers: [{ selector: `first`, scrollLeft: 5, scrollTop: 3 }, { selector: `second`, scrollLeft: 4, scrollTop: 1 }] }, {}, deps), { x: 8, y: 13 });
assert.deepEqual(getAnnotationScrollContainerOffset({ scrollContainers: [{ selector: `missing`, scrollLeft: 1, scrollTop: 1 }] }, {}, deps), { x: 0, y: 0 });
assert.deepEqual(getAnnotationScrollContainerOffset({}, {}, deps), { x: 0, y: 0 });
console.log(`test-preload-annotation-scroll-container-offset: 3 assertions passed`);
