import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/window/tab-drag-session.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { TabDragSession } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function isPoint(value) {
  return (
    value != null &&
    typeof value === "object" &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y)
  );
}

function isSize(value) {
  return (
    value != null &&
    typeof value === "object" &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width > 0 &&
    value.height > 0
  );
}

function createHarness(overrides = {}) {
  const calls = [];
  const owner = {
    destroyed: false,
    getContentBounds: () => ({ x: 100, y: 200, width: 800, height: 600 }),
    getContentSize: () => [800, 600],
    isDestroyed() {
      return this.destroyed;
    },
    ...overrides.owner,
  };
  const presentation = {
    disposed: false,
    freeze(point) {
      calls.push(["freeze", point]);
      return true;
    },
    async load(payload) {
      calls.push(["load", payload]);
      return true;
    },
    async ready() {
      calls.push(["ready"]);
      return true;
    },
    async show() {
      calls.push(["show"]);
      return true;
    },
    async updateCue(cue) {
      calls.push(["cue", cue]);
      return true;
    },
    [Symbol.dispose]() {
      calls.push(["dispose"]);
      this.disposed = true;
    },
    ...overrides.presentation,
  };
  const session = new TabDragSession({
    owner,
    parseCue(value) {
      if (value === null) return null;
      return ["left", "right", "new-window"].includes(value?.destination) ? value : undefined;
    },
    parseLoad(value) {
      return value?.valid === true && isPoint(value.grabOffset) && isSize(value.size)
        ? value
        : undefined;
    },
    parsePoint(value) {
      return isPoint(value) ? value : undefined;
    },
    presentation,
  });
  return { calls, owner, presentation, session };
}

{
  const harness = createHarness();
  equal(await harness.session.ready(), true);
  equal(await harness.session.updateCue(null), true);
  equal(harness.calls.at(-1), ["cue", null]);
  equal(await harness.session.updateCue({ destination: "left" }), true);
  equal(harness.calls.at(-1), ["cue", { destination: "left" }]);

  const payload = {
    valid: true,
    size: { width: 800, height: 600 },
    grabOffset: { x: -800, y: 600 },
    markup: "<div></div>",
  };
  equal(await harness.session.load(payload), true);
  equal(harness.calls.at(-1), ["load", payload]);
  equal(await harness.session.load(payload), false);
  equal(harness.calls.filter((call) => call[0] === "load").length, 1);
  equal(await harness.session.show(), true);
  equal(harness.calls.at(-1), ["show"]);
  equal(harness.session.freeze({ x: 25, y: 30 }), true);
  equal(harness.calls.at(-1), ["freeze", { x: 125, y: 230 }]);

  harness.session[Symbol.dispose]();
  equal(harness.presentation.disposed, true);
  equal(await harness.session.ready(), false);
  equal(await harness.session.updateCue({ destination: "right" }), false);
  equal(await harness.session.show(), false);
  equal(harness.session.freeze({ x: 0, y: 0 }), false);
  const disposeCount = harness.calls.filter((call) => call[0] === "dispose").length;
  harness.session[Symbol.dispose]();
  equal(harness.calls.filter((call) => call[0] === "dispose").length, disposeCount);
}

{
  const harness = createHarness();
  equal(await harness.session.updateCue({ destination: "invalid" }), false);
  equal(harness.presentation.disposed, true);
  ok(harness.calls.some((call) => call[0] === "dispose"));
}

for (const payload of [
  { valid: false, size: { width: 1, height: 1 }, grabOffset: { x: 0, y: 0 } },
  { valid: true, size: { width: 801, height: 1 }, grabOffset: { x: 0, y: 0 } },
  { valid: true, size: { width: 1, height: 601 }, grabOffset: { x: 0, y: 0 } },
  { valid: true, size: { width: 1, height: 1 }, grabOffset: { x: 801, y: 0 } },
  { valid: true, size: { width: 1, height: 1 }, grabOffset: { x: 0, y: -601 } },
]) {
  const harness = createHarness();
  equal(await harness.session.load(payload), false);
  equal(harness.presentation.disposed, true);
  equal(harness.calls.filter((call) => call[0] === "load").length, 0);
}

{
  const harness = createHarness({ presentation: { ready: async () => false } });
  equal(await harness.session.load({ valid: true, size: { width: 1, height: 1 }, grabOffset: { x: 0, y: 0 } }), false);
  equal(harness.presentation.disposed, false);
  equal(await harness.session.load({ valid: true, size: { width: 1, height: 1 }, grabOffset: { x: 0, y: 0 } }), false);
}

for (const loadResult of [false, Error("load failure")]) {
  const harness = createHarness({
    presentation: {
      async load() {
        if (loadResult instanceof Error) throw loadResult;
        return loadResult;
      },
    },
  });
  equal(await harness.session.load({ valid: true, size: { width: 1, height: 1 }, grabOffset: { x: 0, y: 0 } }), false);
  equal(harness.presentation.disposed, true);
}

{
  const ready = deferred();
  const harness = createHarness({ presentation: { ready: () => ready.promise } });
  const loading = harness.session.load({
    valid: true,
    size: { width: 1, height: 1 },
    grabOffset: { x: 0, y: 0 },
  });
  harness.session[Symbol.dispose]();
  ready.resolve(true);
  equal(await loading, false);
  equal(harness.calls.filter((call) => call[0] === "load").length, 0);
}

{
  const harness = createHarness();
  equal(harness.session.freeze({ nope: true }), false);
  equal(harness.presentation.disposed, true);
}

{
  const harness = createHarness();
  harness.owner.destroyed = true;
  equal(harness.session.freeze({ x: 1, y: 2 }), false);
  equal(harness.presentation.disposed, true);
  equal(harness.calls.filter((call) => call[0] === "freeze").length, 0);
}

console.log(`${assertions} main tab-drag session assertions passed`);
