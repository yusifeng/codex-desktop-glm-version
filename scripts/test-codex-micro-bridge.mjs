import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bus = new EventTarget();
globalThis.addEventListener = bus.addEventListener.bind(bus);
globalThis.removeEventListener = bus.removeEventListener.bind(bus);
globalThis.dispatchEvent = bus.dispatchEvent.bind(bus);

let resolveFirstLighting;
const state = globalThis.__microBridgeTest = {
  getStateCalls: 0,
  ownsCalls: 0,
  lighting: [],
  agentKeys: [],
  service: {
    async getState() { state.getStateCalls++; return { status: "connected", model: "micro" }; },
    async ownsPrimaryWindow() { state.ownsCalls++; return true; },
    updateAgentThreadKeys(...args) { state.agentKeys.push(args); },
    updateLighting(value) {
      state.lighting.push(value);
      if (state.lighting.length === 1) return new Promise((resolve) => { resolveFirstLighting = resolve; });
      return Promise.resolve();
    },
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/codex-micro-bridge/index.ts")],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "bridge-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => {
      if (moduleName === "app-initial") return { loader: "js", contents: "export const pnt={codexMicro:globalThis.__microBridgeTest.service};" };
      if (moduleName === "codex-micro-commands") return { loader: "js", contents: `
        export const i=()=>{},n=(id)=>id==="missing"?null:{id:id==="newThread"?"newTask":id};
      ` };
      if (moduleName === "codex-micro-layout") return { loader: "js", contents: `
        export const o=()=>{},t=(key)=>/^ACT(0[6-9]|1[0-2])$/.test(key)?key:null;
        export const a=(slot)=>slot.keycapId==="MIC"?{type:"push-to-talk"}:slot.keycapId==="FAST"?{type:"command",command:"composer.toggleFastMode"}:null;
      ` };
      if (["codex-micro-onboarding-animation","codex-micro-slot-signals","codex-micro-joystick-feedback","codex-micro-mini-games"].includes(moduleName)) {
        const name = moduleName === "codex-micro-mini-games" ? "s" : moduleName === "codex-micro-onboarding-animation" ? "o" : "r";
        return { loader: "js", contents: `export const ${name}=()=>{};` };
      }
      return { loader: "js", contents: "export {};" };
    });
  }}],
});
const bridge = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#bridge`);

assert.equal(bridge.CodexMicroBridge(), null);
assert.equal(bridge.CodexMicroBridge(), null);
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.getStateCalls, 1);
assert.equal(state.ownsCalls, 1);

function emit(type, detail) { globalThis.dispatchEvent(new CustomEvent(type, { detail })); }
emit("codex-micro-lighting-state-changed", { state: { frame: 1 } });
emit("codex-micro-lighting-state-changed", { state: { frame: 2 } });
emit("codex-micro-lighting-state-changed", { state: { frame: 3 } });
assert.equal(state.lighting.length, 1);
assert.equal(state.lighting[0].frame, 1);
resolveFirstLighting();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(state.lighting.length, 2);
assert.equal(state.lighting[1].frame, 3);

emit("codex-micro-agent-keys-changed", {
  threadKeys: ["thread-1", 42], kinds: ["thread", null], singleTapAgentKeys: true,
});
assert.deepEqual(state.agentKeys[0], [["thread-1", null], ["thread", "thread"], true]);

const actions = [];
globalThis.addEventListener("codex-micro-action", (event) => actions.push(event.detail.action));
const layout = { separateMicrophoneKeys: true, slots: {
  ACT06: { keycapId: "FAST" }, ACT10: { keycapId: "MIC" }, ACT11: { keycapId: "MIC" },
} };
emit("codex-micro-key-event", { event: { act: 1, key: "ACT06" }, layout });
assert.deepEqual(actions.at(-1), { type: "command", command: "composer.toggleFastMode" });
emit("codex-micro-key-event", { event: { act: 1, key: "ACT10" }, layout });
assert.equal(actions.at(-1).type, "push-to-talk-press");
emit("codex-micro-key-event", { event: { act: 0, key: "ACT10" }, layout });
assert.equal(actions.at(-1).type, "push-to-talk-release");
emit("codex-micro-key-event", { event: { act: 1, key: "ENC" }, layout });
assert.equal(actions.at(-1).type, "encoder-press");
emit("codex-micro-key-event", { event: { act: 0, key: "ENC" }, layout });
assert.equal(actions.at(-1).type, "encoder-release");
emit("codex-micro-key-event", {
  event: { act: 1, key: "AG00" }, layout,
  assignment: { type: "command", commandId: "newThread" },
});
assert.deepEqual(actions.at(-1), { type: "command", command: "newTask" });
const count = actions.length;
emit("codex-micro-key-event", { event: { act: 0, key: "ACT06" }, layout });
assert.equal(actions.length, count);

emit("codex-micro-window-ownership-changed", { isOwner: false });
emit("codex-micro-lighting-state-changed", { state: { frame: 4 } });
await Promise.resolve();
assert.equal(state.lighting.length, 2);

console.log("codex-micro bridge: 17 assertions");
