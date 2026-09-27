import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

globalThis.__microSurface = {
  commands: new Map([["newTask", { id: "newTask" }], ["settings", { id: "settings" }]]),
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props) => ({ type, props: props ?? {} }),
    jsxs: (type, props) => ({ type, props: props ?? {} }),
  },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{ name: "codex-micro-surface-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
        path: importPath.slice("@rchunk/".length), namespace: "mock",
      }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => {
        if (moduleName === "app-shared") return { loader: "js", contents: `
          const state=globalThis.__microSurface;
          export const SX={safeParse:(value)=>value?.valid?{success:true,data:value.data}:{success:false}};
          export const yX={version:1,separateMicrophoneKeys:false,slots:{},analogStick:{},encoder:{},encoderMode:"custom",voiceButtonMode:"push-to-talk"};
          export const wL=()=>{},FX=()=>{},ZI={name:"app-scope"};
          export const vX=["AG00","AG01","AG02","AG03","AG04","AG05"];
          export const TX=(value)=>value==="off"?null:30000;
          export const rJ=(value)=>value.startsWith("client-");
          export const pZ=(_scope,value)=>({name:"signal",value});
          export const sZ=(_scope,derive)=>({name:"derived",derive});
          export const EX=(status)=>({off:0,idle:0x112233,working:0xabcdef,unread:1,error:2,"awaiting-approval":3,"awaiting-response":4})[status];
          export const G2=(messages)=>messages,I3=()=>state.jsx,Y2="FormattedMessage";
          export const h4=()=>{},m4=(...values)=>values.filter(Boolean).join(" ");
          export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace("{position}",String(values?.position??""))});
          export const o_="Tooltip";
        ` };
        if (moduleName === "app-initial") return { loader: "js", contents: `
          export const dun=(_key,value)=>({name:"persisted",value});
        ` };
        if (moduleName === "codex-micro-commands") return { loader: "js", contents: `
          export const i=()=>{},n=(id)=>globalThis.__microSurface.commands.get(id)??null;
        ` };
        return { loader: "js", contents: "export {};" };
      });
    }}],
  });
  const source = Buffer.from(result.outputFiles[0].text).toString("base64");
  return import(`data:text/javascript;base64,${source}#${directory}-${Math.random()}`);
}

const layout = await bundle("codex-micro-layout");
layout.o();
assert.equal(layout.u.length, 39);
assert.equal(layout.r("FAST").action.command, "composer.toggleFastMode");
assert.equal(layout.r("missing").id, "FAST");
assert.deepEqual(layout.d(layout.r("EMPT1")), ["blank", "custom", "empty", "shortcut"]);
assert.deepEqual(layout.d(layout.r("YOLO")), ["Write :yolo: in the composer", ":yolo:"]);
assert.deepEqual(layout.n("ACT10_ACT11").map((keycap) => keycap.id), ["MIC", "EMPT5"]);
assert.equal(layout.n("ACT06").every((keycap) => keycap.size === "single"), true);
assert.equal(layout.t("ACT06"), "ACT06");
assert.equal(layout.t("ACT10_ACT11"), null);
assert.equal(layout.t("other"), null);
const parsed = { version: 1, slots: { ACT06: { keycapId: "FAST" } } };
assert.equal(layout.i({ valid: true, data: parsed }), parsed);
assert.equal(layout.i({ invalid: true }).version, 1);
const baseConfig = { version: 1, separateMicrophoneKeys: false, slots: {
  ACT06: { keycapId: "FAST" }, ACT07: { keycapId: "BUG" }, ACT10: { keycapId: "MIC1" },
}, analogStick: { click: "old" }, encoder: { click: "old" } };
assert.equal(layout.s(baseConfig, "click", "new").analogStick.click, "new");
assert.equal(layout.c(baseConfig, "click", "new").encoder.click, "new");
const swapped = layout.l(baseConfig, "ACT07", { keycapId: "FAST" });
assert.equal(swapped.slots.ACT07.keycapId, "FAST");
assert.equal(swapped.slots.ACT06.keycapId, "BUG");
assert.equal(layout.a({ keycapId: "NEW", commandId: "newTask" }).command, "newTask");
assert.equal(layout.a({ keycapId: "MIC1" }).type, "push-to-talk");
assert.equal(layout.a({ keycapId: "YOLO" }).text, ":yolo:");
assert.equal(layout.a({ keycapId: "EMPT1", commandId: "missing" }), null);
assert.equal(layout.a({ keycapId: "OAI" }).url, "https://developers.openai.com");

const slots = await bundle("codex-micro-slot-signals");
slots.f();
assert.deepEqual(Object.keys(slots.o), ["AG00", "AG01", "AG02", "AG03", "AG04", "AG05"]);
assert.equal(slots.d(0), "AG00");
assert.equal(slots.d(5), "AG05");
assert.equal(slots.d(6), null);
const signalValues = new Map();
const scope = {
  get(signal) { return signalValues.has(signal) ? signalValues.get(signal) : signal.value; },
  set(signal, value) { signalValues.set(signal, value); },
};
assert.equal(slots.s(scope, "AG00", "not-client"), false);
assert.equal(slots.s(scope, "AG00", "client-1"), true);
assert.equal(signalValues.get([...signalValues.keys()][0]).clientThreadId, "client-1");
slots.c(scope, "AG00", { hostId: "local", threadKey: "thread-1", title: "One" });
assert.equal(scope.get(slots.u).AG00.threadKey, "thread-1");
const serialized = JSON.parse(slots.i({
  brightness: 0.7, inactivityTimeoutMs: null, slots: [{ id: 0, pulsing: 1, selected: true, status: "working", threadKey: "t1" }], voiceState: "idle",
}));
assert.equal(serialized.brightness, 0.7);
assert.equal(serialized.slots[0].pulsing, true);
assert.equal(serialized.preserveSelectionLighting, false);
assert.equal(serialized.suspendDeviceStatusRefresh, false);

const surface = await bundle("codex-micro-keyboard-surface");
surface.p();
surface.u();
assert.deepEqual(surface.d, ["codex-micro-input-monitoring-permission"]);
assert.equal(surface.f, 1000);
const shell = surface.c({ className: "custom", children: "label" });
assert.equal(shell.type, "div");
assert.match(shell.props.className, /custom/);
assert.equal(surface.l({ keycap: { id: "YOLO", icon: "empty" } }).props.children.type, "FormattedMessage");
assert.equal(surface.l({ keycap: { id: "EMPT1", icon: "empty" } }).type, "span");
assert.equal(surface.l({ keycap: { id: "FAST", icon: "lightning" } }).props["data-codex-micro-icon"], "lightning");
const preview = surface.o({ position: 2, slot: { status: "idle", threadKey: "t", title: "Task" } });
assert.equal(preview.type, "Tooltip");
assert.equal(preview.props.children.props["aria-label"], "Task");
const buttonPreview = surface.o({ position: 3, onClick() {}, showTooltip: false });
assert.equal(buttonPreview.type, "button");
assert.match(buttonPreview.props["aria-label"], /agent key 3/);
const keyboard = surface.i({ className: "wide", children: "keys" });
assert.match(keyboard.props.className, /grid-cols-4/);
assert.equal(keyboard.props.children[1], "keys");
const knob = surface.n({ ariaLabel: "Encoder", pulse: "clockwise" });
assert.equal(knob.props.role, "img");
assert.equal(knob.props.children[0].props["data-pulse"], "clockwise");
const joystick = surface.t({ joystick: { angle: 0, distance: 2 } });
assert.equal(joystick.props.children.props.style.transform, "translate(7px, 0px)");
assert.equal(surface.r().props.children.length, 2);

console.log("codex-micro input surface cluster: 50 assertions");
