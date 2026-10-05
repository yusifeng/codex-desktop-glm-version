import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createAnnotationPointerSelection } = require('../app/.vite/build/browser-page-preload/annotation-pointer-selection.js');

const ownerDocument = {};
const rootHost = { ownerDocument };
const range = { ownerDocument };
const events = [];
let selection = { id: 'selection' };
let disposed = 0;
const controller = createAnnotationPointerSelection(rootHost, {
  onPointerModeChange: value => events.push(['mode', value]),
  onPointerChange: value => events.push(['point', value]),
  onClearHover: () => events.push(['clear-hover']),
}, {
  resolvePoint: () => range,
  canStartSelection: () => true,
  isSelectionBlocked: () => false,
  clearSelection: () => events.push(['clear-selection']),
  createHighlight: () => () => disposed++,
  applySelection: (...args) => events.push(['apply', ...args]),
  hideHover: (...args) => events.push(['hide', ...args]),
  stopEvent: (...args) => events.push(['stop', ...args]),
  readSelection: () => selection,
  toViewportPoint: (_window, point) => ({ x: point.x + 1, y: point.y + 1 }),
});
assert.equal(controller.handlePointerDown({}, { pointerId: 3 }, { x: 10, y: 20 }, true), true);
assert.equal(controller.isDragging, true);
assert.equal(controller.handlePointerMove({}, { pointerId: 3, buttons: 1, clientX: 2, clientY: 4 }), true);
let result;
assert.equal(controller.handlePointerUp({ isTrusted: true, pointerId: 3 }, value => { result = value; }), true);
assert.equal(result, selection);
assert.equal(disposed, 1);
assert.equal(controller.handlePointerCancel({ pointerId: 3 }), false);
assert.equal(events.filter(([type]) => type === 'mode').length, 1);
assert.equal(events.filter(([type]) => type === 'point').length, 2);
assert.equal(events.filter(([type]) => type === 'apply').length, 1);
assert.equal(events.filter(([type]) => type === 'hide').length, 1);

const blocked = createAnnotationPointerSelection(rootHost, { onPointerModeChange() {}, onPointerChange() {}, onClearHover() {} }, {
  resolvePoint: () => range,
  canStartSelection: () => true,
  isSelectionBlocked: () => true,
  clearSelection() {}, createHighlight() { throw new Error('must not highlight'); }, applySelection() {}, hideHover() {}, stopEvent() {}, readSelection() {}, toViewportPoint() {},
});
assert.equal(blocked.handlePointerDown({}, { pointerId: 4 }, { x: 0, y: 0 }, true), true);
assert.equal(blocked.isDragging, false);
assert.equal(blocked.updatePointer({ x: 0, y: 0 }, true), false);
blocked.dispose();
blocked.dispose();
assert.equal(blocked.updatePointer({ x: 0, y: 0 }, true), false);
assert.equal(blocked.handlePointerDown({}, { pointerId: 5 }, { x: 0, y: 0 }, true), false);
assert.equal(blocked.handlePointerMove({}, { pointerId: 5, buttons: 1, clientX: 0, clientY: 0 }), false);
assert.equal(blocked.handlePointerUp({ isTrusted: true, pointerId: 5 }, () => { throw new Error('disposed selection callback'); }), false);
assert.equal(blocked.handlePointerCancel({ pointerId: 5 }), false);
console.log('test-preload-annotation-pointer-selection: 18 assertions passed');
