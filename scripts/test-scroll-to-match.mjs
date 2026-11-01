import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__scrollToMatchTest = {
  initialized: 0,
  match: null,
  requests: [],
  scrolled: [],
};
let frameId = 0;
globalThis.window = {
  requestAnimationFrame(callback) {
    const id = ++frameId;
    queueMicrotask(() => callback(performance.now()));
    return id;
  },
  cancelAnimationFrame() {},
  setTimeout,
  clearTimeout,
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/scroll-to-match/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "scroll-to-match-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice(8),
        namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
        contents: importPath === "app-initial"
          ? `
            export const CUt = () => { globalThis.__scrollToMatchTest.initialized += 1; };
            export const xUt = request => {
              globalThis.__scrollToMatchTest.requests.push(request);
              return globalThis.__scrollToMatchTest.match;
            };
          `
          : "export {};",
        loader: "js",
      }));
    },
  }],
});
const scroll = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

scroll.t();
assert.equal(state.initialized, 1);
const element = { scrollIntoView: options => state.scrolled.push(options) };
state.match = element;
const container = { id: "transcript" };
await scroll.n({ container, includeShadowRoots: true, matchId: "turn-1" });
assert.deepEqual(state.requests[0], { container, includeShadowRoots: true, matchId: "turn-1" });
assert.deepEqual(state.scrolled[0], { behavior: "smooth", block: "center" });

state.match = null;
const controller = new AbortController();
controller.abort();
await scroll.n({ container, matchId: "missing", signal: controller.signal });
assert.equal(state.requests.length, 1);

await scroll.r();
assert.equal(frameId >= 2, true);

console.log("7 scroll-to-match assertions passed");
