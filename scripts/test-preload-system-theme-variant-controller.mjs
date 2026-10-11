import assert from "node:assert/strict";
const { createSystemThemeVariantController } = await import("../src/main/preload/system-theme-variant-controller.ts");
let element = null;
let ready;
let observed = 0;
let disposed = 0;
const controller = createSystemThemeVariantController(`light`, {
  getDocumentElement: () => element,
  observeDocument: (callback) => { observed += 1; ready = callback; return () => { disposed += 1; }; },
});
assert.equal(observed, 1);
assert.equal(controller.get(), `light`);
const changes = [];
const unsubscribe = controller.subscribe(() => changes.push(controller.get()));
controller.update(`dark`);
assert.deepEqual(changes, [`dark`]);
element = { dataset: {} };
ready();
assert.equal(element.dataset.theme, `dark`);
assert.equal(disposed, 1);
unsubscribe();
controller.dispose();
assert.equal(disposed, 1);
console.log("7 preload system-theme-variant-controller assertions passed");
