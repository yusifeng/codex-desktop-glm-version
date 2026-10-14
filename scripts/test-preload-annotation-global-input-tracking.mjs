import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "annotation-global-input-tracking-"));
const output = path.join(tempDir, "controller.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/browser-page-preload/annotation-global-input-tracking.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { createAnnotationGlobalInputTracking } = createRequire(import.meta.url)(output);
const events = [];
const listeners = new Map();
const windowLike = {
  addEventListener(type, callback, capture) { events.push(["add", type, capture]); listeners.set(`${type}:${capture === true}`, callback); },
  removeEventListener(type, callback, capture) { events.push(["remove", type, capture]); assert.equal(listeners.get(`${type}:${capture === true}`), callback); listeners.delete(`${type}:${capture === true}`); },
};
let frameCleanup;
let focus = true;
let pointer;
let keyDown = 0;
let keyUp = 0;
let blur = 0;
let clear = 0;
const controller = createAnnotationGlobalInputTracking({
  observeFrames: (install) => { frameCleanup = install({}, windowLike); return () => frameCleanup?.(); },
  isTrusted: (event) => event.isTrusted === true,
  toViewportPoint: (_window, point) => ({ ...point, projected: true }),
  onKeyDown: () => { keyDown += 1; },
  onKeyUp: () => { keyUp += 1; },
  onPointerMove: (value) => { pointer = value; },
  onBlur: () => { blur += 1; },
  hasFocus: () => focus,
  clearTransientModifierState: () => { clear += 1; },
});
const dispose = controller.install();
listeners.get("mousemove:true")({ isTrusted: true, clientX: 3, clientY: 4 });
listeners.get("mousemove:true")({ isTrusted: false, clientX: 8, clientY: 9 });
listeners.get("keydown:true")({});
listeners.get("keyup:true")({});
focus = false;
listeners.get("blur:false")({});
assert.deepEqual(pointer, { x: 3, y: 4, projected: true });
assert.equal(keyDown, 1);
assert.equal(keyUp, 1);
assert.equal(blur, 1);
assert.equal(clear, 1);
dispose();
assert.equal(events.filter(([action]) => action === "remove").length, 4);
controller.dispose();
assert.equal(controller.install()(), undefined);
console.log("test-preload-annotation-global-input-tracking: 8 assertions passed");
