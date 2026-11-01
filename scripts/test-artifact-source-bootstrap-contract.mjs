import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__artifactSourceTest = {
  installedShapes: null,
  jsx: {
    Fragment: "fragment",
    jsx(type, props, key) {
      return typeof type === "function" ? type(props) : { type, props, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function" ? type(props) : { type, props, key };
    },
  },
  react: {
    useEffect() {},
    useLayoutEffect() {},
    useId() {
      return "test-id";
    },
    useMemo(factory) {
      return factory();
    },
    useRef(value) {
      return { current: value };
    },
    useState(value) {
      let current = typeof value === "function" ? value() : value;
      return [
        current,
        (next) => {
          current = typeof next === "function" ? next(current) : next;
        },
      ];
    },
  },
};
const result = await esbuild.build({
  entryPoints: [
    path.join(root, "src/renderer/artifact-source-bootstrap/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "artifact-source-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath,
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => {
            if (importPath.endsWith("app-shared"))
              return {
                contents:
                  "export const I3=()=>globalThis.__artifactSourceTest.jsx; export const e6=()=>globalThis.__artifactSourceTest.react; export const m4=(...v)=>v.filter(Boolean).join(' ');",
                loader: "js",
              };
            if (importPath.endsWith("artifact-workbook-runtime"))
              return {
                contents:
                  "export const Bt=new Proxy({}, {get:(_,key)=>String(key)}); export const tt=(shapes)=>{globalThis.__artifactSourceTest.installedShapes=shapes};",
                loader: "js",
              };
            return { contents: "export {};", loader: "js" };
          },
        );
      },
    },
  ],
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const artifact = await import(moduleUrl);
let assertions = 0;
const check = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};

const expectedExports = [
  "$",
  "A",
  "B",
  "C",
  "Ct",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "St",
  "T",
  "Tt",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "_",
  "_t",
  "a",
  "at",
  "b",
  "bt",
  "c",
  "ct",
  "d",
  "dt",
  "et",
  "f",
  "ft",
  "g",
  "gt",
  "h",
  "ht",
  "i",
  "it",
  "j",
  "k",
  "l",
  "lt",
  "m",
  "mt",
  "n",
  "nt",
  "o",
  "ot",
  "p",
  "pt",
  "q",
  "r",
  "rt",
  "s",
  "st",
  "t",
  "tt",
  "u",
  "ut",
  "v",
  "vt",
  "w",
  "wt",
  "x",
  "xt",
  "y",
  "yt",
  "z",
];
check(
  Object.keys(artifact).join(",") === expectedExports.sort().join(","),
  "preserves all 79 artifact bootstrap exports",
);

const layout = artifact.wt({ header: "header", children: "content" });
check(
  layout.type === "fragment" &&
    layout.props.children.join(":") === "header:content",
  "renders the default artifact layout",
);
check(
  artifact.wt({
    header: "h",
    children: "c",
    renderLayout: ({ header, content }) => `${header}/${content}`,
  }) === "h/c",
  "supports host-provided artifact layouts",
);
const group = artifact.St({
  compact: true,
  children: "actions",
  testId: "group",
});
check(
  group.props.className.includes("gap-1") &&
    group.props["data-testid"] === "group",
  "renders compact header groups",
);
const header = artifact.xt({
  title: "deck.pptx",
  compactTitle: true,
  navigationContent: "nav",
  actions: "actions",
  onClose() {},
});
check(
  header.type === "header" &&
    header.props["data-testid"] === "popcorn-artifact-header",
  "renders the artifact header landmark",
);
const headerParts = header.props.children.props.children;
check(
  headerParts[0].props.children.find(
    (child) => child?.props?.["data-testid"] === "popcorn-file-title",
  ).props.children[0] === "deck",
  "uses compact file titles",
);
check(headerParts[2].props.children === "actions", "renders header actions");
const customHeader = artifact.xt({
  title: "Deck",
  headerTitleContent: "Custom",
  centeredContent: "pages",
});
check(
  customHeader.props.className.includes("grid-cols-[1fr_auto_1fr]"),
  "allocates centered header content",
);
const zoom = artifact.yt({
  zoom: 1,
  onZoomChange() {},
  fitOption: { label: "Fit", selected: false, onSelect() {} },
});
check(
  zoom.props.children[1].type === "select" &&
    zoom.props.children[1].props.children.length === 6,
  "renders standard and fit zoom choices",
);
check(zoom.props.children[1].props.value === "1", "selects the current zoom");

const workerMessages = [];
let terminated = false;
const worker = {
  onmessage: null,
  onerror: null,
  onmessageerror: null,
  postMessage(message) {
    workerMessages.push(message);
  },
  terminate() {
    terminated = true;
  },
};
const events = [];
const transport = new artifact.pt(worker, (event) => events.push(event));
transport.bootstrap({ document: 1 });
transport.dispatch({ edit: 2 });
check(
  workerMessages[0].type === "bootstrap" && workerMessages[1].type === "intent",
  "dispatches worker bootstrap and intent messages",
);
const request = transport.request({ inspect: 3 });
check(
  workerMessages[2].type === "request" && workerMessages[2].requestId === "1",
  "assigns stable worker request ids",
);
worker.onmessage({
  data: { type: "response", requestId: "1", payload: { ok: true } },
});
check((await request).ok, "resolves worker responses");
worker.onmessage({ data: { type: "event", payload: "changed" } });
check(events[0] === "changed", "forwards worker events");
transport.dispose();
check(
  terminated && workerMessages.at(-1).type === "dispose",
  "disposes worker transports",
);
await assert.rejects(transport.request({}), /disposed/);
assertions += 1;
check(
  artifact.mt.prototype instanceof Error,
  "publishes the terminal transport error type",
);
assert.throws(() => artifact.ht(new Error("fatal")), /fatal/);
assertions += 1;

const store = new artifact.at({ count: 1, label: "a" });
let notifications = 0;
const unsubscribe = store.subscribe(() => notifications++);
check(
  !store.replace({ count: 1, label: "a" }),
  "deduplicates shallow-equal store replacements",
);
check(
  store.patch({ count: 2 }) && store.getState().count === 2,
  "patches external store state",
);
check(notifications === 1, "notifies store subscribers once per change");
unsubscribe();
store.dispose();

const element = {
  clientWidth: 100,
  clientHeight: 50,
  getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 100 }),
};
check(
  artifact.rt(element, 110, 70).x === 50 &&
    artifact.rt(element, 110, 70).y === 25,
  "maps client points into local coordinates",
);
check(
  artifact.nt(element, 50, 25).x === 110 &&
    artifact.nt(element, 50, 25).y === 70,
  "maps local points into client coordinates",
);
check(
  artifact.Q("ArrowLeft").dx === -1 && artifact.Q("Escape") === null,
  "maps navigation arrow directions",
);
check(
  artifact.tt({
    repeat: false,
    nativeEvent: {},
    keyCode: 65,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
  }),
  "accepts unmodified editing shortcuts",
);
check(
  !artifact.tt({
    repeat: false,
    nativeEvent: {},
    keyCode: 65,
    altKey: false,
    shiftKey: false,
    metaKey: true,
    ctrlKey: false,
  }),
  "rejects unexpected primary modifiers",
);

const cameraEvents = [];
const viewport = new artifact.X({
  enabled: true,
  initialCamera: { x: 0, y: 0, k: 1 },
  minZoom: 0.5,
  maxZoom: 2,
  requestDraw() {
    cameraEvents.push("draw");
  },
});
viewport.setCamera({ x: 10, y: 20, k: 8 });
check(
  viewport.getCamera().k === 2 && viewport.getCamera().x === 10,
  "clamps viewport camera zoom",
);
viewport.zoomTo(1, { screenX: 20, screenY: 30 });
check(viewport.getCamera().k === 1, "zooms the viewport around a screen point");
viewport.panByScroll(3, 4);
check(cameraEvents.length === 3, "requests redraws for camera mutations");
check(
  viewport.getViewportSnapshot().scrollLeft ===
    -viewport.getCamera().x / viewport.getCamera().k,
  "projects camera into a viewport snapshot",
);

const segmentA = {
  paraIndex: 0,
  runIndex: 0,
  charStart: 0,
  charEnd: 3,
  advance: [0, 5, 10, 15],
  widthPx: 15,
  text: "abc",
};
const segmentB = {
  paraIndex: 0,
  runIndex: 1,
  charStart: 0,
  charEnd: 2,
  advance: [0, 6, 12],
  widthPx: 12,
  text: "de",
};
const block = {
  id: "block",
  rotationDeg: 0,
  zIndex: 2,
  hitBox: { x: 0, y: 0, width: 100, height: 20 },
  layout: {
    x: 0,
    y: 0,
    width: 100,
    lines: [
      {
        heightPx: 20,
        widthPx: 27,
        baselineOffsetPx: 15,
        maxAscentPx: 12,
        maxDescentPx: 4,
        segments: [segmentA, segmentB],
      },
    ],
  },
  getRunText(para, run) {
    return para === 0 && run === 0 ? "abc" : "de";
  },
};
const index = new artifact.z({ blocks: [block] });
check(
  index.getBlock("block") === block && index.hitOrder[0] === block,
  "indexes text blocks by id and z-order",
);
check(
  artifact.G(block.layout, {
    blockId: "block",
    paraIndex: 0,
    runIndex: 0,
    charIndex: 2,
  }).segment === segmentA,
  "finds text layout segments",
);
const caret = artifact.U(block.layout, {
  blockId: "block",
  paraIndex: 0,
  runIndex: 0,
  charIndex: 2,
});
check(caret.x === 10 && caret.height === 16, "projects text caret rectangles");
const hit = artifact.V(index, { x: 8, y: 10 });
check(hit.blockId === "block" && hit.runIndex === 0, "hit-tests text blocks");
check(
  artifact.W(
    { blockId: "block", paraIndex: 0, runIndex: 0, charIndex: 9 },
    block,
  ).charIndex === 3,
  "clamps text positions to grapheme length",
);
const ranges = artifact.F(
  block.layout,
  { blockId: "block", paraIndex: 0, runIndex: 0, charIndex: 1 },
  { blockId: "block", paraIndex: 0, runIndex: 1, charIndex: 1 },
  block.getRunText,
);
check(
  ranges.length === 2 && ranges[0].start === 1 && ranges[1].end === 1,
  "builds cross-run selection ranges",
);
const selection = new artifact.P();
selection.setActiveCaret({
  blockId: "block",
  paraIndex: 0,
  runIndex: 0,
  charIndex: 0,
});
selection.setActiveCaret(
  { blockId: "block", paraIndex: 0, runIndex: 0, charIndex: 2 },
  { preserveAnchor: true },
);
check(
  selection.hasSelection() && selection.getRanges(index)[0].end === 2,
  "tracks active text selections",
);
selection.collapseTo({
  blockId: "block",
  paraIndex: 0,
  runIndex: 0,
  charIndex: 1,
});
check(!selection.hasSelection(), "collapses text selections to a caret");

check(
  artifact.j(1) === 1 && artifact.j(2) === 2 && artifact.j(5) === 3,
  "normalizes click counts",
);
const firstClick = artifact.O(
  null,
  {
    timeStamp: 1,
    clientX: 5,
    clientY: 5,
    button: 0,
    pointerType: "mouse",
    detail: 1,
  },
  "shape",
);
const secondClick = artifact.O(
  firstClick,
  {
    timeStamp: 100,
    clientX: 6,
    clientY: 6,
    button: 0,
    pointerType: "mouse",
    detail: 2,
  },
  "shape",
);
check(secondClick.count === 2, "recognizes spatially stable double clicks");
check(
  artifact.k({ clientX: 0, clientY: 0 }, { clientX: 6, clientY: 0 }),
  "detects pointer drag thresholds",
);
check(
  artifact.T({ name: "photo.PNG", type: "" }) === "image/png",
  "infers image MIME types from extensions",
);
check(
  artifact.T({ name: "file.txt", type: "text/plain" }) === null,
  "rejects non-image MIME types",
);
const copied = artifact.t(new Uint8Array([1, 2, 3]));
check(
  copied instanceof ArrayBuffer && new Uint8Array(copied).join(",") === "1,2,3",
  "copies transferable byte buffers",
);

artifact.ct();
check(
  globalThis.__artifactSourceTest.installedShapes != null,
  "installs recovered shape presets into the workbook runtime",
);
check(
  Object.keys(globalThis.__artifactSourceTest.installedShapes).length > 100,
  "preserves the full Office shape geometry catalog",
);
const menu = artifact.C({
  ariaLabel: "Insert",
  primaryItems: [{ id: "text", label: "Text" }],
  secondaryItems: [{ id: "image", label: "Image" }],
});
check(
  menu.props.children[0].props["aria-label"] === "Insert",
  "renders insert menu triggers",
);
check(
  menu.props.children[1].props.children[0][0].props[
    "data-popcorn-insert-item"
  ] === "text",
  "renders semantic insert items",
);
const leftIcon = artifact.a({ className: "custom" });
check(
  leftIcon.type === "svg" && leftIcon.props.children.length === 3,
  "renders alignment icons",
);
check(
  artifact.c({}).props.children[1].props.d === "M3.5 10H17.5",
  "renders justify alignment geometry",
);

console.log(
  `${assertions} artifact source bootstrap contract assertions passed`,
);
