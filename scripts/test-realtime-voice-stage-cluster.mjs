import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__voiceStageTest = {
  experiment: true,
  platform: "macOS",
});
state.jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.requestAnimationFrame = (callback) => {
  callback();
  return 1;
};
globalThis.cancelAnimationFrame = () => {};
async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "voice-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => ({
              contents:
                value === "rolldown-runtime"
                  ? "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};"
                  : value === "app-shared"
                    ? `
      export const I3=()=>globalThis.__voiceStageTest.jsx;
      export const $3=()=>({c:size=>Array(size).fill(Symbol.for('react.memo_cache_sentinel'))});
      export const e6=()=>({useRef:value=>({current:value}),useEffect:effect=>effect(),useEffectEvent:callback=>callback});
      export const $Q=()=>{}; export const a$=()=>{}; export const h4=()=>{}; export const t$=()=>{};
      export const n$=value=>({get:()=>value,set:next=>{value=next}});
      export const e$=(value,mapper)=>typeof value==='function'?{get:value}:{get:()=>mapper(value.get())};
      export const o$={div:'MotionDiv',span:'MotionSpan'};
      export const m4=(...values)=>values.filter(Boolean).join(' ');
      export const x_=()=>1;export const y_=()=>{};`
                    : value === "app-initial"
                      ? "export const Mrn=()=>globalThis.__voiceStageTest.platform;export const ofn=()=>globalThis.__voiceStageTest.experiment;export const Slt=()=>false;export const xlt=()=>{};export const $n=(rect,screen)=>({height:rect.height,width:rect.width,x:rect.x+screen.screenX,y:rect.y+screen.screenY});export const Qn=value=>value;export const Zn=(origin,bounds)=>({x:origin.x-bounds.x,y:origin.y-bounds.y});"
                      : value === "realtime-voice-motion"
                        ? "export const i=()=>{};export const n={duration:.28};export const r={duration:0};export const t={duration:.2,ease:[.16,1,.3,1]};"
                        : "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}
const nodes = (root) => {
  const out = [];
  const visit = (v) => {
    if (v == null || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(visit);
    if ("type" in v && "props" in v) out.push(v);
    visit(v.props?.children);
  };
  visit(root);
  return out;
};

const motion = await bundle("realtime-voice-motion");
motion.i();
assert.equal(motion.t.duration, 0.2);
assert.deepEqual(motion.t.ease, [0.16, 1, 0.3, 1]);
assert.equal(motion.n.duration, 0.28);
assert.equal(motion.r.duration, 0);
const nativeOverlay = await bundle(
  "use-realtime-voice-native-overlay-transition-enabled",
);
nativeOverlay.t();
assert.equal(nativeOverlay.n(), true);
state.platform = "Windows";
assert.equal(nativeOverlay.n(), false);
state.platform = "macOS";
state.experiment = false;
assert.equal(nativeOverlay.n(), false);
state.experiment = true;
globalThis.window = { screenX: 0, screenY: 0 };
const handoff = await bundle("realtime-voice-handoff-target");
handoff.n();
let animation = null;
const handoffTree = handoff.t({
  children: "orb",
  handoff: { from: "global-overlay", sequence: 1 },
  surface: "main-thread",
});
assert.equal(
  handoffTree.props["data-realtime-voice-handoff-target"],
  "main-thread",
);
handoffTree.props.ref({
  getBoundingClientRect: () => ({ height: 240, width: 240, x: 0, y: 0 }),
  animate: (frames, options) => {
    animation = { frames, options };
    return { cancel() {} };
  },
});
assert.equal(animation.options.duration, 300);
assert.match(animation.frames[0].transform, /translate3d/);
assert.equal(animation.options.easing, "cubic-bezier(0.22, 1, 0.36, 1)");
const stage = await bundle("realtime-voice-stage-layout");
stage.a();
stage.s();
assert.match(stage.n, /bottom-0/);
assert.match(stage.t, /items-center/);
assert.equal(stage.i, "translateY(-28px)");
assert.equal(stage.r, "translateY(52px)");
let completed = false;
const stageTree = stage.o({
  isConnecting: false,
  onHandoffComplete() {
    completed = true;
  },
  orb: "orb",
  orbDiameter: 240,
  reduceMotion: true,
});
assert.equal(completed, true);
assert.deepEqual(stageTree.props.animate, { height: 240, width: 240 });
assert.equal(stageTree.props.transition.duration, 0);
assert.equal(
  nodes(stageTree).some((node) =>
    String(node.props.className).includes("pulsing-dot"),
  ),
  false,
);
const launch = await bundle("realtime-voice-launch-surface");
launch.n();
assert.equal(launch.t({ phase: "connected" }), null);
const connecting = launch.t({
  phase: "connecting",
  threadLocator: { conversationId: "c1", hostId: "local" },
});
assert.equal(connecting.props["aria-busy"], true);
assert.equal(connecting.props["data-thread-id"], "c1");
let settings = false;
const failed = launch.t({
  phase: "failed",
  microphonePermissionDenied: true,
  onOpenSettings() {
    settings = true;
  },
});
assert.equal(failed.props.role, "alert");
assert.equal(
  nodes(failed).find((node) => node.type === "h2").props.children,
  "Microphone permission denied",
);
nodes(failed)
  .find(
    (node) => node.type === "button" && node.props.children === "Open settings",
  )
  .props.onClick();
assert.equal(settings, true);
console.log("23 realtime voice stage cluster assertions passed");
