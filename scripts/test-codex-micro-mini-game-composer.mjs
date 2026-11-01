import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/codex-micro-mini-game-composer/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = globalThis.__miniGameComposerTest = {
  effects: [],
  eventListeners: new Map(),
  registrations: [],
  cleared: 0,
  refs: [],
  refCursor: 0,
  selection: { composerId: "composer-1", game: "asteroids" },
  status: { status: "connected" },
};
state.jsx = { jsx: (type, props, key) => ({ type, props, key }) };
state.react = {
  useEffect(effect) { state.effects.push(effect); effect(); },
  useRef(initialValue) { const index = state.refCursor++; return state.refs[index] ??= { current: initialValue }; },
};

const mocks = {
  "app-shared": `
    export const ZI = { name: "scope" };
    export const I3 = () => globalThis.__miniGameComposerTest.jsx;
    export const e6 = () => globalThis.__miniGameComposerTest.react;
    export const LX = () => ({ get(signal) { return signal === nSignal ? globalThis.__miniGameComposerTest.selection : null; } });
    export const HX = signal => signal === globalThis.__miniGameComposerTest.selectionSignal ? globalThis.__miniGameComposerTest.selection : globalThis.__miniGameComposerTest.status;
    export const BX = (_query, conversationId) => ({ items: conversationId == null ? [] : [{ id: "queried", type: "agentMessage", text: "Queried text" }] });
    export const K3 = (name, listener) => globalThis.__miniGameComposerTest.eventListeners.set(name, listener);
    const nSignal = globalThis.__miniGameComposerTest.selectionSignal;
  `,
  "app-initial": `
    export const $C = globalThis.__miniGameComposerTest.statusSignal;
    export const Iht = value => value;
    export const Rht = event => event?.key === "AG00" && event?.act === 1;
    export const Slt = () => false;
    export const kht = { value: "composer-1" };
    export const lQt = {};
    export const non = text => [{ type: "paragraph", tokens: [{ type: "strong", text, tokens: [{ type: "text", text }] }] }];
  `,
  "codex-micro-mini-games": `
    export const n = globalThis.__miniGameComposerTest.selectionSignal;
    export const d = (id, input, onRemoved) => { globalThis.__miniGameComposerTest.registrations.push({ id, input, onRemoved }); return () => {}; };
    export const t = () => { globalThis.__miniGameComposerTest.cleared += 1; };
  `,
};
state.selectionSignal = {};
state.statusSignal = {};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "mini-game-composer-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice("@rchunk/".length), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mocks[importPath] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(module), ["CodexMicroMiniGameComposer"]);
assert.equal(module.CodexMicroMiniGameComposer({ composerInput: {}, activeComposer: false, status: "connected", game: "snake" }), null);
assert.equal(module.CodexMicroMiniGameComposer({ composerInput: {}, activeComposer: true, status: "not-detected", game: "snake" }), null);

function fakeCanvas(width = 480) {
  const calls = [];
  const context = {
    canvas: null,
    calls,
    beginPath() {}, arc() {}, clearRect() {}, closePath() {}, fill() {}, fillText(text) { calls.push(String(text)); },
    lineTo() {}, measureText(text) { return { width: String(text).length * 7 }; }, moveTo() {}, restore() {}, rotate() {},
    roundRect() {}, save() {}, setTransform() {}, translate() {},
  };
  const canvas = { clientWidth: width, ownerDocument: { defaultView: null } };
  context.canvas = canvas;
  return { canvas, context, calls };
}
globalThis.getComputedStyle = () => ({ color: "#fff", fontFamily: "monospace" });

for (const game of ["asteroids", "brick-breaker", "snake"]) {
  state.refCursor = 0; state.refs = []; state.effects = []; state.eventListeners.clear();
  const rendered = module.CodexMicroMiniGameComposer({
    composerInput: { value: game }, activeComposer: true, status: "connected", game,
    conversationItems: [{ id: "message-1", type: "agentMessage", text: "Hello!" }],
  });
  assert.equal(typeof rendered.type, "function");
  assert.equal(state.registrations.at(-1).id, "composer-1");
  const surface = rendered.type(rendered.props);
  assert.equal(typeof surface.type, "function");
  assert.equal(surface.props.playing, true);
  const { canvas, context, calls } = fakeCanvas();
  surface.props.onResize(context, canvas, 480, true);
  assert.equal(surface.props.onFrame(context, canvas, 1 / 60, 100), true);
  assert.equal(calls.some(value => value.includes("H") || value.includes("00000") || value.includes("•")), true);
  assert.equal(state.eventListeners.has("codex-micro-joystick-event"), true);
  if (game === "asteroids") {
    state.eventListeners.get("codex-micro-joystick-event")({ event: { angle: 0, distance: 1 } });
    state.eventListeners.get("codex-micro-hid-event")({ event: { key: "AG00", act: 1 } });
    assert.equal(surface.props.onFrame(context, canvas, 1 / 60, 120), true);
  }
}

state.refCursor = 0; state.refs = [];
const queried = module.CodexMicroMiniGameComposer({ composerInput: {}, conversationId: "conversation-1", activeComposer: true, status: "connected", game: "brick-breaker" });
assert.equal(typeof queried.type, "function");
assert.match(source, /stepAsteroids/);
assert.match(source, /stepBricks/);
assert.match(source, /stepSnake/);
assert.match(source, /ResizeObserver/);
assert.doesNotMatch(source, /kind:\s*["']codex-micro-mini-game-composer/);

console.log("24 codex micro mini-game composer assertions passed");
