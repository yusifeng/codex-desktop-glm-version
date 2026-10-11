import assert from "node:assert/strict";
const { createPipVideoDecoderController } = await import("../src/main/preload/pip-video-decoder-controller.ts");
const events = [];
const decoderCallbacks = [];
const controller = createPipVideoDecoderController({
  createDecoder: (callbacks) => { decoderCallbacks.push(callbacks); return { state: `configured`, configure: (config) => events.push([`configure`, config]), decode: (chunk) => events.push([`decode`, chunk]), reset: () => events.push(`reset`), close: () => events.push(`close`), callbacks }; },
  createChunk: (input) => input, getOrigin: () => `https://example.test`, postFrame: () => events.push(`frame`), postError: () => events.push(`error`),
});
const message = { presentationID: `p1`, threadID: `t1`, codec: `vp09`, timestamp: 1, videoData: new Uint8Array([1]), isKeyFrame: true, decoderConfiguration: new Uint8Array([1, 2]) };
assert.equal(controller.handle({ ...message, isKeyFrame: false, decoderConfiguration: null }), false);
assert.equal(controller.handle(message), true);
assert.equal(controller.handle({ ...message, isKeyFrame: false, timestamp: 2 }), true);
assert.equal(events.filter((event) => Array.isArray(event) && event[0] === `decode`).length, 2);
assert.equal(controller.handle({ ...message, timestamp: 3, decoderConfiguration: new Uint8Array([9]) }), true);
assert.ok(events.includes(`reset`));
controller.handle({ ...message, presentationID: `p2`, threadID: `t2` });
decoderCallbacks[1].error();
assert.ok(events.includes(`error`));
controller.stopThread(`t1`);
assert.ok(events.includes(`close`));
controller.handle({ ...message, presentationID: `p3`, threadID: `t3` });
controller.disposeRemoved({ activeThreadID: `t3`, orderedPresentationIDs: [] });
controller.disposeRemoved({ activeThreadID: `t2`, orderedPresentationIDs: [] });
assert.ok(events.filter((event) => event === `close`).length >= 2);
console.log("8 preload pip-video-decoder-controller assertions passed");
