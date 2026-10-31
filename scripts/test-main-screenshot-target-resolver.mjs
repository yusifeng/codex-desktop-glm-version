import assert from "node:assert/strict";
import fs from "node:fs";
import { createScreenshotTargetResolver } from "../src/main/main-app/fetch-handler/screenshot-target.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const webContents = { getZoomFactor: () => 1.5 };
const window = { isDestroyed: () => false, getContentBounds: () => ({ x: 100, y: 200, width: 800, height: 600 }) };
const frames = [];
const resolveTarget = createScreenshotTargetResolver({
  fromWebContents: (value) => value === webContents ? window : null,
  getDisplayMatching: (frame) => {
    frames.push(frame);
    return {
      id: 7,
      scaleFactor: 2,
      bounds: { x: 0, y: 0, width: 1920, height: 1080, ignored: true },
      workArea: { x: 0, y: 20, width: 1920, height: 1060, ignored: true },
    };
  },
});

for (const [viewportFrame, cornerRadius] of [
  [{ x: 0, y: 0, width: 0, height: 10 }, 0],
  [{ x: 0, y: 0, width: 10, height: -1 }, 0],
  [{ x: 0, y: 0, width: 10, height: 10 }, -1],
]) equal(resolveTarget({ viewportFrame, cornerRadius, webContents }), undefined);
equal(resolveTarget({ viewportFrame: { x: 0, y: 0, width: 10, height: 10 }, cornerRadius: 0, webContents: {} }), undefined);
equal(resolveTarget({
  backgroundColor: "background",
  cornerRadius: 4,
  presentationStyle: "overlay",
  primaryTextColor: "foreground",
  viewportFrame: { x: 10, y: 20, width: 30, height: 40 },
  webContents,
}), {
  codexDisplay: {
    bounds: { height: 1080, width: 1920, x: 0, y: 0 },
    id: 7,
    scaleFactor: 2,
    workArea: { height: 1060, width: 1920, x: 0, y: 20 },
  },
  destinationBackgroundColor: "background",
  destinationCornerRadius: 6,
  destinationFrame: { x: 115, y: 230, width: 45, height: 60 },
  destinationPrimaryTextColor: "foreground",
  presentationStyle: "overlay",
});
equal(frames, [{ x: 115, y: 230, width: 45, height: 60 }]);
const destroyedResolver = createScreenshotTargetResolver({
  fromWebContents: () => ({ isDestroyed: () => true }),
  getDisplayMatching: () => assert.fail("display lookup for destroyed window"),
});
equal(destroyedResolver({ viewportFrame: { x: 0, y: 0, width: 1, height: 1 }, cornerRadius: 0, webContents }), undefined);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("computeScreenshotTarget({"), true);
equal(main.includes("createScreenshotTargetResolver({"), true);
equal(main.includes("function FBe("), false);
equal(main.includes("function IBe("), false);
equal(main.includes("function LBe("), false);
equal(main.includes("function ZH("), false);
console.log(`${assertions} main screenshot-target resolver assertions passed`);
