import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__joystickTest = {
  feedback: {
    action: null, direction: "up", event: { angle: 0.75, distance: 0.8 },
    status: "tracking", visible: true,
  },
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props) => ({ type, props: props ?? {} }),
    jsxs: (type, props) => ({ type, props: props ?? {} }),
  },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true,
    format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
    plugins: [{ name: "joystick-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => {
        if (moduleName === "rolldown-runtime") return { loader: "js", contents: `
          export const n=initializer=>{let initialized=false;return()=>{if(!initialized){initialized=true;initializer();}}};
        ` };
        if (moduleName === "app-shared") return { loader: "js", contents: `
          const state=globalThis.__joystickTest;
          export const FX=()=>{},QI=()=>{},ZI={name:"app"},pZ=(_scope,value)=>({value});
          export const G2=(messages)=>messages,HX=()=>state.feedback,I3=()=>state.jsx,Y2="FormattedMessage";
          export const m4=(...values)=>values.filter(Boolean).join(" ");
          export const n4=()=>({formatMessage:(descriptor)=>descriptor.defaultMessage});
        ` };
        if (moduleName === "codex-micro-joystick-feedback") return { loader: "js", contents: `
          export const r=()=>{},t={name:"feedback"};
        ` };
        if (moduleName === "codex-micro-analog-action-title") return { loader: "js", contents: "export const n=()=>{};" };
        if (moduleName === "app-initial") return { loader: "js", contents: `
          export const dw=()=>{};
          export const uw=({angle},threshold)=>{
            if (!Number.isFinite(angle) || threshold < 0) return null;
            if (angle < 0.125 || angle >= 0.875) return "right";
            if (angle < 0.375) return "down";
            if (angle < 0.625) return "left";
            return "up";
          };
        ` };
        return { loader: "js", contents: "export {};" };
      });
    }}],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

const feedback = await bundle("codex-micro-joystick-feedback");
feedback.r();
let value = feedback.t.value;
const scope = {
  get() { return value; },
  set(_signal, next) { value = typeof next === "function" ? next(value) : next; },
};
assert.equal(value.visible, false);
assert.equal(value.direction, "right");
const mapping = { right: { type: "command", commandId: "newTask" } };
let next = feedback.a(scope, {
  activeDirection: null, enabled: true, event: { angle: 0, distance: 0.5 },
  mapping, previousActiveDirection: null,
});
assert.equal(next.direction, "right");
assert.equal(next.status, "tracking");
assert.equal(next.visible, true);
next = feedback.a(scope, {
  activeDirection: "right", enabled: true, event: { angle: 0, distance: 0.8 },
  executionStatus: "triggered", mapping, previousActiveDirection: null,
});
assert.equal(next.status, "triggered");
assert.equal(next.action.commandId, "newTask");
next = feedback.a(scope, {
  activeDirection: "left", enabled: true, event: { angle: 0.5, distance: 0.8 },
  mapping, previousActiveDirection: "right",
});
assert.equal(next.direction, "left");
assert.equal(next.status, "unassigned");
feedback.o(scope, { angle: 0.25, distance: 0.9 }, 1.5);
assert.equal(value.status, "game-gesture");
assert.equal(value.direction, "down");
assert.equal(value.gameActivationProgress, 1);
feedback.o(scope, { angle: 0.75, distance: 0.9 }, -1);
assert.equal(value.gameActivationProgress, 0);
feedback.n(scope);
assert.equal(value.visible, false);
feedback.i(scope);
assert.equal(value.status, "tracking");
assert.equal(value.event.distance, 0);

const hudReleaseAssertions = assertReleaseOwner("codex-micro-joystick-hud");

console.log(`codex-micro joystick cluster complete (${hudReleaseAssertions} HUD release assertions)`);
