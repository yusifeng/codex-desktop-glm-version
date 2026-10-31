import assert from "node:assert/strict";
import fs from "node:fs";
import { z } from "zod";
import { createTabDragPreviewServiceClass } from "../src/main/main-app/window/tab-drag-preview-service.ts";

const runtime = {
  Uf: class {},
  wf: (shape) => z.object(shape),
  Cf: () => z.number(),
  Of: () => z.string(),
  df: (values) => z.enum(values),
};
let pointer = { x: 150, y: 90 };
const window = {
  destroyed: false,
  visible: true,
  fullScreen: false,
  isDestroyed() { return this.destroyed; },
  isVisible() { return this.visible; },
  isFullScreen() { return this.fullScreen; },
  getContentBounds: () => ({ x: 50, y: 10, width: 800, height: 600 }),
};
const origin = {
  destroyed: false,
  isDestroyed() { return this.destroyed; },
  getZoomFactor: () => 2,
};
const presentationConfigs = [];
const sessionConfigs = [];
class PresentationWindow {
  constructor(config) { presentationConfigs.push(config); }
}
class DragSession {
  constructor(config) { sessionConfigs.push(config); Object.assign(this, config); }
}
function create(platform) {
  return createTabDragPreviewServiceClass({
    runtime,
    platform,
    TabDragPresentationWindow: PresentationWindow,
    TabDragSession: DragSession,
    electron: {
      BrowserWindow: Object.assign(class {}, { fromWebContents: () => window }),
      screen: { getCursorScreenPoint: () => pointer },
    },
    setTimer: (callback, delay) => ({ callback, delay }),
    clearTimer: () => {},
    setRepeatingTimer: (callback, delay) => ({ callback, delay }),
    clearRepeatingTimer: () => {},
  });
}

const LinuxService = create("linux");
assert.equal(LinuxService.create(origin), undefined);
const Service = create("darwin");
const service = Service.create(origin);
assert.equal(service instanceof Service, true);
assert.deepEqual(service.getPointerPosition(), { x: 50, y: 40 });
pointer = { x: 70, y: 30 };
assert.deepEqual(service.getPointerPosition(), { x: 10, y: 10 });

const session = service.prepare();
assert.equal(session instanceof DragSession, true);
assert.equal(session.owner, window);
assert.equal(presentationConfigs.length, 1);
assert.equal(presentationConfigs[0].isDarwin, true);
assert.equal(presentationConfigs[0].operationTimeoutMs, 3000);
assert.deepEqual(session.parsePoint({ x: 1, y: 2 }), { x: 1, y: 2 });
assert.equal(session.parsePoint({ x: "bad", y: 2 }), undefined);
assert.deepEqual(session.parseCue({ destination: "left" }), { destination: "left" });
assert.equal(session.parseCue(null), null);
assert.equal(session.parseCue({ destination: "invalid" }), undefined);
const load = {
  size: { width: 400, height: 300 }, grabOffset: { x: 10, y: 20 }, borderRadius: 8, zoom: 1.5, markup: "<div />",
};
assert.deepEqual(session.parseLoad(load), load);
assert.equal(session.parseLoad({ ...load, zoom: 5 }), undefined);
assert.equal(session.parseLoad({ ...load, markup: "" }), undefined);

origin.destroyed = true;
assert.equal(service.getPointerPosition(), null);
assert.equal(service.prepare(), null);
origin.destroyed = false;
window.destroyed = true;
assert.equal(service.getPointerPosition(), null);
window.destroyed = false;
window.visible = false;
assert.equal(service.prepare(), null);
window.visible = true;
window.fullScreen = true;
assert.equal(service.prepare(), null);
window.fullScreen = false;

const direct = new Service(origin, () => { throw new Error("presentation failed"); });
assert.equal(direct.prepare(), null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /Ett = createTabDragPreviewServiceClass\(\{/);
assert.doesNotMatch(main, /Ett = class/);
assert.doesNotMatch(main, /m5 = n\.wf/);
assert.match(main, /tabDragPreview: Ett\.create\(e\)/);

console.log("tab drag preview service assertions: 31");
