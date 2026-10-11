import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationDesignEditorOpenController } = require("../app/.vite/build/browser-page-preload/annotation-design-editor-open-controller.js");
const calls = [];
const controller = createAnnotationDesignEditorOpenController({
  resolveCard: () => ({ rect: { x: 1 } }), normalizeAnchor: (element, anchor) => ({ ...anchor, element }),
  projectCardRect: () => ({ x: 2 }), projectDesign: () => ({ id: `design-1` }),
  rememberTarget: () => calls.push(`remember`), createTargetMap: () => new Map(),
  applyDesignChange: () => calls.push(`change`), openEditor: () => calls.push(`open`),
  refreshViewport: () => calls.push(`refresh`), setEditorState: () => calls.push(`state`),
  setCard: () => calls.push(`card`), closePopover: () => calls.push(`close`),
});
assert.equal(controller.open({ node: true }, { anchor: { kind: `element` }, themeVariant: `light` }, {
  rootHost: {}, canUseSiteAnnotationApi: true, viewportScale: 1, zoom: 1,
}), true);
assert.deepEqual(calls, [`remember`, `change`, `open`, `refresh`, `state`, `card`, `close`]);
controller.dispose();
assert.equal(controller.open({}, { anchor: {} }, { rootHost: {}, canUseSiteAnnotationApi: true, viewportScale: 1, zoom: 1 }), false);
console.log("7 preload annotation design-editor-open-controller assertions passed");
