import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({ entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-media-state-tracker.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false });
const { createBrowserMediaStateTracker } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

let now = 100;
let nextTimerId = 1;
const timers = new Map();
const cleared = [];
const runtime = {
  now: () => now,
  setTimer(callback, delay) {
    const timer = { id: nextTimerId++, delay, callback, unrefCount: 0, unref() { this.unrefCount += 1; } };
    timers.set(timer.id, timer);
    return timer;
  },
  clearTimer(timer) { cleared.push(timer.id); timers.delete(timer.id); },
};
const fire = (timer) => { timers.delete(timer.id); timer.callback(); };
let changes = 0;
const tracker = createBrowserMediaStateTracker({ onStateChanged: () => { changes += 1; } }, runtime);

equal(tracker.state, { isAudible: false, isCapturingUserMedia: false });
tracker.updateAudible(true);
equal(tracker.state.isAudible, true);
equal(changes, 1);
tracker.updateAudible(true);
equal(changes, 1);
tracker.updateAudible(false);
const audibleOff = [...timers.values()][0];
equal(audibleOff.delay, 2_000);
equal(audibleOff.unrefCount, 1);
equal(tracker.state.isAudible, true);
tracker.updateAudible(false);
equal(timers.size, 1);
tracker.updateAudible(true);
equal(cleared, [audibleOff.id]);
equal(timers.size, 0);
tracker.updateAudible(false);
const audibleOffAgain = [...timers.values()][0];
fire(audibleOffAgain);
equal(tracker.state.isAudible, false);
equal(changes, 2);

tracker.updateUserMediaCapture({ isCapturingUserMedia: true, isCapturingCamera: true, isCapturingMicrophone: false });
equal(tracker.state, { isAudible: false, isCapturingUserMedia: true, isCapturingCamera: true, isCapturingMicrophone: false });
equal(changes, 3);
now = 1_100;
tracker.updateUserMediaCapture({ isCapturingUserMedia: false });
const captureOff = [...timers.values()][0];
equal(captureOff.delay, 4_000);
equal(captureOff.unrefCount, 1);
tracker.updateUserMediaCapture({ isCapturingUserMedia: false });
equal(timers.size, 1);
tracker.updateUserMediaCapture({ isCapturingUserMedia: true, isCapturingCamera: false, isCapturingMicrophone: true });
equal(cleared.includes(captureOff.id), true);
equal(tracker.state.isCapturingCamera, false);
equal(tracker.state.isCapturingMicrophone, true);
equal(changes, 4);
now = 10_000;
tracker.updateUserMediaCapture({ isCapturingUserMedia: false });
const minimumCaptureOff = [...timers.values()][0];
equal(minimumCaptureOff.delay, 1_000);
fire(minimumCaptureOff);
equal(tracker.state.isCapturingUserMedia, false);
equal(tracker.state.isCapturingCamera, undefined);
equal(tracker.state.isCapturingMicrophone, undefined);
equal(changes, 5);

tracker.updateAudible(true);
tracker.updateUserMediaCapture({ isCapturingUserMedia: true, isCapturingCamera: true, isCapturingMicrophone: true });
tracker.updateAudible(false);
tracker.updateUserMediaCapture({ isCapturingUserMedia: false });
equal(timers.size, 2);
tracker.reset();
equal(timers.size, 0);
equal(tracker.state, { isAudible: false, isCapturingUserMedia: false, isCapturingCamera: undefined, isCapturingMicrophone: undefined });
equal(changes, 7);
tracker.dispose();
tracker.updateAudible(true);
tracker.updateUserMediaCapture({ isCapturingUserMedia: true, isCapturingCamera: true, isCapturingMicrophone: true });
equal(tracker.state.isAudible, false);
equal(tracker.state.isCapturingUserMedia, false);
equal(changes, 7);

let captureClock = 50;
const initiallyCapturing = createBrowserMediaStateTracker({ initialState: { isAudible: false, isCapturingUserMedia: true } }, { ...runtime, now: () => captureClock });
captureClock = 3_050;
initiallyCapturing.updateUserMediaCapture({ isCapturingUserMedia: false });
equal([...timers.values()][0].delay, 2_000);
initiallyCapturing.dispose();

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const bindingController = fs.readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-media-state-tracker.js")'), true);
equal(main.includes("function KX("), false);
equal(main.includes("mediaIndicator: KX()"), false);
equal(bindingController.includes("KX({\n        initialState:"), true);
console.log(`${assertions} main browser media state tracker assertions passed`);
