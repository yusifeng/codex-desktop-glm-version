import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const posted = [];
let currentFrame;
class MockOffscreenCanvas {
  getContext() { return { clearRect() {}, drawImage(frame) { currentFrame = frame; }, getImageData() { const pixels = new Uint8ClampedArray(8 * 8 * 4); for (let index = 3, alphaIndex = 0; index < pixels.length; index += 4, alphaIndex += 1) pixels[index] = currentFrame.alpha[alphaIndex] ?? 0; return { data: pixels }; } }; }
}
Object.defineProperty(globalThis, "OffscreenCanvas", { value: MockOffscreenCanvas, configurable: true });
globalThis.postMessage = (message, options) => posted.push({ message, options });
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/remote-hosted-pip-frame-filter.worker/index.ts")], bundle: true, format: "esm", platform: "browser", target: "esnext", write: false, logLevel: "silent" });
await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.equal(typeof globalThis.onmessage, "function");
function frame(alphaValue, width = 100, height = 80) { return { alpha: Array(64).fill(alphaValue), displayWidth: width, displayHeight: height, closed: false, close() { this.closed = true; } }; }

const opaque = frame(10);
globalThis.onmessage({ data: opaque });
assert.equal(posted.at(-1).message, opaque);
assert.deepEqual(posted.at(-1).options.transfer, [opaque]);
assert.equal(opaque.closed, false);
const transparent = frame(0);
globalThis.onmessage({ data: transparent });
assert.equal(transparent.closed, true);
assert.equal(posted.at(-1).message, null);
const baseline = frame(200);
globalThis.onmessage({ data: baseline });
assert.equal(posted.at(-1).message, baseline);
const slightDrop = frame(197);
globalThis.onmessage({ data: slightDrop });
assert.equal(posted.at(-1).message, slightDrop);
const suddenDrop = frame(190);
globalThis.onmessage({ data: suddenDrop });
assert.equal(suddenDrop.closed, true);
assert.equal(posted.at(-1).message, null);
const resized = frame(190, 101, 80);
globalThis.onmessage({ data: resized });
assert.equal(resized.closed, false);
assert.equal(posted.at(-1).message, resized);

const source = fs.readFileSync(path.join(ROOT, "src/renderer/remote-hosted-pip-frame-filter.worker/index.ts"), "utf8");
assert.deepEqual([...source.matchAll(/@rchunk\//g)], []);
assert.deepEqual([...source.matchAll(/export\s+/g)], []);
const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(assertionCount + " remote PiP frame filter assertions passed");
