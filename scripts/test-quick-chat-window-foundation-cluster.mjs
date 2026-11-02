import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const dragPortalContext = Symbol("drag-portal");
const dragStateContext = Symbol("drag-state");
const bottomOffsetContext = Symbol("bottom-offset");
const contentController = {
  tabById$: (tabId) => (tabId === "tab-1" ? { dndId: "drag-1", tabId } : null),
  tabIds$: () => ["tab-1"],
};
let registeredDropTarget = null;
const contextValues = new Map([
  [dragPortalContext, { id: "portal-container" }],
  [bottomOffsetContext, 64],
  [
    dragStateContext,
    {
      dragState: {
        draggedTab: { dndId: "drag-1", tabId: "tab-1" },
        sourceController: contentController,
      },
      registerSelectionCapture: (capture) => {
        const restore = capture();
        assert.equal(typeof restore, "function");
        return () => {};
      },
    },
  ],
]);
const react = {
  useCallback: (callback) => callback,
  useContext: (context) => contextValues.get(context) ?? null,
  useLayoutEffect: (effect) => effect(),
  useMemo: (factory) => factory(),
  useRef: (value) => ({ current: value }),
};
globalThis.__quickChatTest = {
  bottomOffsetContext,
  contentController,
  dragPortalContext,
  dragStateContext,
  jsx,
  react,
  captureDropTarget(value) {
    registeredDropTarget = value;
  },
};
globalThis.document = { body: { id: "document-body" } };

const sharedMock = `
const test=globalThis.__quickChatTest;
export const I3=()=>test.jsx;
export const e6=()=>test.react;
export const $3=()=>({c:size=>Array(size).fill(Symbol.for("react.memo_cache_sentinel"))});
export const $f=[.16,1,.3,1];
export const Eh=()=>{};
export const a$=()=>{};
export const h4=()=>{};
export const m4=(...values)=>values.filter(Boolean).join(" ");
export const o$={div:"div",section:"section"};
export const tp=()=>{};
export const LX=()=>({get:signal=>signal.value,set:(signal,value)=>{signal.value=value;}});
export const BX=(family,parameter)=>typeof family==="function"?family(parameter):family;
export const HX=signal=>typeof signal==="function"?signal():signal;
export const P3=()=>({createPortal:(node,container)=>({portal:true,node,container})});
export const __=callback=>callback;
export const e$=(input,project)=>project(input);
export const f1=options=>({name:"size",options});
export const m1=()=>{};
export const p1=()=>({floatingStyles:{position:"fixed"},refs:{setFloating(){},setReference(){}}});
export const u1=value=>({name:"offset",value});
export const x_=()=>2;
export const n4=()=>({locale:"en-US"});
export const $Q=()=>{}; export const FX=()=>{}; export const K2=()=>{};
export const l1=()=>{}; export const g_=()=>{}; export const y_=()=>{};
`;
const initialMock = `
const test=globalThis.__quickChatTest;
export const $g={height:400,width:600};
export const AS="QuickChatSurface";
export const MS={floatingSurface:"floating",singleLineSurface:"single-line"};
export const NS=()=>{};
export const Qat=(...refs)=>value=>refs.forEach(ref=>typeof ref==="function"&&ref(value));
export const Zat=()=>{}; export const i_=()=>{}; export const jS=()=>{};
export const $en={}; export const Cet=test.dragStateContext; export const T7=test.dragPortalContext;
export const V7=test.bottomOffsetContext; export const Vvt=test.contentController;
export const cvt={value:"selection"}; export const fbt=true; export const mbt=true;
export const NDt=()=>["left","right","bottom"];
export const Bct=()=>true;
export const Hct=(scope,input,destination,sourceController)=>{globalThis.__quickChatTest.performedDrop={input,destination,sourceController};};
export const mxt=(ratio,width)=>ratio*width;
export const pxt=()=>({bottomPanelTargetHeight:180,contentPaneWidthRatio:.4,mainContentWidth:1000});
export const rCn=options=>{test.captureDropTarget(options);return{isOver:true,setNodeRef(){}};};
export const sxt=locale=>locale.startsWith("ar")?"rtl":"ltr";
export const $Sn=()=>{}; export const U7=()=>{}; export const fxt=()=>{};
export const E7=()=>{}; export const Wvt=()=>{}; export const wet=()=>{};
export const FDt=()=>{}; export const hxt=()=>{}; export const Ebt=()=>{};
export const itn=()=>{}; export const Vct=()=>{}; export const rvt=()=>{};
`;

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
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => ({
              contents:
                value === "app-shared"
                  ? sharedMock
                  : value === "app-initial"
                    ? initialMock
                    : value === "quick-chat-obstacles"
                      ? "export const i=()=>{};export const o='QuickChatResizeHandles';export const r=()=>{};export const s=()=>{};"
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
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
};

assertReleaseOwner("quick-chat-obstacles");

const frame = await bundle("quick-chat-frame");
frame.n();
const frameTree = frame.t({
  children: "content",
  currentSize: { height: 400, width: 600 },
  variant: "window",
});
assert.equal(frameTree.type, "QuickChatSurface");
const frameSection = frameTree.props.children;
assert.equal(frameSection.type, "section");
assert.match(frameSection.props.className, /zoomedViewport/);
assert.equal(frameSection.props.children[2], "content");
const resizableTree = frame.t({
  children: "content",
  currentSize: { height: 400, width: 600 },
  variant: "panel",
});
const resizeHandle = nodes(resizableTree).find(
  (node) => node.type === "QuickChatResizeHandles",
);
assert.deepEqual(resizeHandle.props.currentSize, { height: 400, width: 600 });
const minimized = frame.t({
  isMinimized: true,
  minimizedContent: "mini",
  prefersCompactPresentation: true,
});
assert.equal(
  nodes(minimized).some((node) => node.props.children === "mini"),
  true,
);

const zones = await bundle("quick-chat-drop-zones");
zones.r();
const zonePortal = zones.n();
assert.equal(zonePortal.portal, true);
assert.equal(zonePortal.container.id, "portal-container");
assert.equal(zonePortal.node.props.children.length, 3);
const leftTarget = zonePortal.node.props.children[0];
assert.equal(leftTarget.props.destination, "left");
const renderedTarget = leftTarget.type(leftTarget.props);
assert.match(renderedTarget.props.children[0].props.className, /left-0/);
assert.equal(registeredDropTarget.id, "unified-workspace-left");
registeredDropTarget.data.onDrop({
  draggedTab: { dndId: "drag-1", tabId: "tab-1" },
  sourceController: contentController,
});
assert.equal(globalThis.__quickChatTest.performedDrop.destination, "left");
const indicator = zones.t({
  destination: "right",
  direction: "ltr",
  surface: "content",
});
assert.equal(indicator.props.children[1].portal, true);
assert.equal(
  indicator.props.children[1].node.props[
    "data-unified-workspace-drop-indicator"
  ],
  "right",
);

const pipMessages = [];
const animationFrames = [];
class MockElement {
  constructor(rect, width = rect.width) {
    this.rect = rect;
    this.offsetWidth = width;
    this.hidden = false;
  }
  getBoundingClientRect() {
    return { ...this.rect, left: this.rect.x, top: this.rect.y };
  }
  matches() {
    return true;
  }
  querySelector() {
    return null;
  }
}
globalThis.HTMLElement = MockElement;
globalThis.ResizeObserver = class {
  observe() {}
  disconnect() {}
};
globalThis.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
};
const pipHost = new MockElement({ height: 800, width: 1200, x: 0, y: 0 });
const pipHome = new MockElement({ height: 100, width: 300, x: 0, y: 0 }, 300);
globalThis.window = {
  electronBridge: {
    sendMessageFromView: (message) => pipMessages.push(message),
  },
  getComputedStyle: () => ({ visibility: "visible" }),
  requestAnimationFrame: (callback) => (
    animationFrames.push(callback),
    animationFrames.length
  ),
  cancelAnimationFrame() {},
  addEventListener() {},
  removeEventListener() {},
};
globalThis.document = {
  body: {},
  querySelector: (selector) =>
    selector.includes("data-pip-anchor-host") ? pipHost : null,
  querySelectorAll: (selector) =>
    selector.includes("data-pip-home-surface") ? [pipHome] : [],
  addEventListener() {},
  removeEventListener() {},
};
const pip = await bundle("remote-hosted-pip-anchor-bridge");
pip.i();
pip.t();
assert.equal(pip.r, "codex-main-thread");
const bridge = pip.n();
bridge.setCodexHomeAvailable(true);
while (animationFrames.length) animationFrames.shift()();
const layout = pipMessages.at(-1).layout;
assert.equal(layout.anchors.length, 4);
assert.equal(layout.homeSurfaceWidth, 300);
assert.equal(layout.presentationScope, "thread");
assert.deepEqual(layout.anchors[1], {
  alignment: "top-right",
  point: { x: 300, y: 0 },
});
assert.equal(typeof bridge.stop, "function");
bridge.stop();

console.log("29 quick chat window foundation cluster assertions passed");
