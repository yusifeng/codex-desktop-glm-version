import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__popcornSurfaceTest = {
  jsx: {
    Fragment: "fragment",
    jsx(type, props, key) {
      return typeof type === "function" ? type(props) : { type, props, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function" ? type(props) : { type, props, key };
    },
  },
};
async function importOwner(owner) {
  const result = await esbuild.build({
    entryPoints: [path.join(root, "src/renderer", owner, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "popcorn-surface-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath,
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents: importPath.endsWith("app-shared")
                ? "export const I3 = () => globalThis.__popcornSurfaceTest.jsx;"
                : "export {};",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

const [underline, surface] = await Promise.all([
  importOwner("text-underline-icon"),
  importOwner("popcorn-electron-surface-style"),
]);
let assertions = 0;
const check = (value, message) => {
  assert.ok(value, message);
  assertions += 1;
};

check(
  Object.keys(underline).length === 37,
  "preserves the text/shape toolbar release ABI",
);
check(
  underline.N.insert.includes("slide") &&
    underline.N.header.includes("annotation"),
  "restores presentation toolbar actions",
);
check(
  !underline.M.insert.includes("slide") && underline.M.floating.length === 0,
  "restores document toolbar actions",
);
check(
  underline.F(underline.M, { floating: ["bold"] }).floating[0] === "bold",
  "merges toolbar configuration",
);
check(
  underline.F(underline.M, { floating: ["bold"] }).insert ===
    underline.M.insert,
  "preserves untouched toolbar sections",
);
check(
  underline.j(-3, 0, 10) === 0 && underline.j(13, 0, 10) === 10,
  "clamps numeric values",
);
check(
  underline.k(400.7) === 400 && underline.k(-1) === 1,
  "normalizes font sizes",
);
check(
  underline.f(12, 1) === 14 && underline.f(12, -1) === 11,
  "steps across standard font sizes",
);
check(
  underline.D("ellipse").geometry === "ellipse",
  "finds shape presets by id",
);
check(underline.D("missing") === null, "returns null for unknown shapes");
check(
  underline
    .E("flowchart")
    .map((shape) => shape.id)
    .join(",") === "process,decision",
  "filters shapes by category",
);
check(
  underline._.some((shape) => shape.id === "star"),
  "publishes the complete semantic shape catalog",
);
check(
  underline.b("#ABC") === "#abc" && underline.b("transparent") === null,
  "normalizes editor colors",
);
check(
  underline.c([0, 10]).every((bar) => bar.height >= 0),
  "creates safe chart thumbnail geometry",
);
check(
  underline.c([0, 10])[1].height === 56,
  "scales chart thumbnail bars to the viewport",
);
const underlineIcon = underline.t();
check(
  underlineIcon.type === "svg" && underlineIcon.props.children.length === 2,
  "renders the underline glyph",
);
const navigation = underline.I({
  currentIndex: 1,
  totalCount: 3,
  itemLabel: "slide",
  onChangeIndex() {},
});
check(
  navigation.type === "div" &&
    navigation.props.children[1].props.children.join("") === "2/3",
  "renders page navigation state",
);
check(
  navigation.props.children[0].props.disabled === false &&
    navigation.props.children[2].props.disabled === false,
  "enables valid navigation directions",
);
check(
  underline.I({
    currentIndex: 0,
    totalCount: 1,
    itemLabel: "page",
    onChangeIndex() {},
  }) === null,
  "hides navigation for a single page",
);
const picker = underline.C({
  color: "#000000",
  onChange() {},
  allowNone: true,
});
check(
  picker.props.children.length === 9 &&
    picker.props.children[0].props["aria-label"] === "No color",
  "renders nullable color choices",
);
const inspector = underline.T({ title: "Format", children: "controls" });
check(
  inspector.type === "section" && inspector.props["aria-label"] === "Format",
  "renders a semantic inspector panel",
);

const expectedSurfaceExports = [
  "$",
  "A",
  "B",
  "C",
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
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "_",
  "a",
  "at",
  "b",
  "c",
  "ct",
  "d",
  "dt",
  "et",
  "f",
  "g",
  "h",
  "i",
  "it",
  "j",
  "k",
  "l",
  "lt",
  "m",
  "n",
  "nt",
  "o",
  "ot",
  "p",
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
  "w",
  "x",
  "y",
  "z",
];
check(
  Object.keys(surface).join(",") === expectedSurfaceExports.sort().join(","),
  "preserves all 65 Popcorn surface exports",
);
const sorted = surface.ut({
  rects: [
    { left: 0, top: 0, width: 10, height: 10 },
    { left: 20, top: 0, width: 10, height: 10 },
  ],
  activeIndex: 0,
  overIndex: 1,
  index: 0,
});
check(
  sorted.x === 20 && sorted.scaleX === 1,
  "calculates sortable rectangle transforms",
);
const horizontal = surface.ct({
  rects: [
    { left: 0, top: 0, width: 10, height: 10 },
    { left: 20, top: 0, width: 10, height: 10 },
  ],
  activeIndex: 0,
  overIndex: 1,
  index: 1,
});
check(
  horizontal.x === -20 && horizontal.y === 0,
  "calculates horizontal list transforms with item gaps",
);
const sortable = surface.dt({
  id: "b",
  items: ["a", "b", "c"],
  activeId: "a",
  overId: "c",
});
check(
  sortable.index === 1 &&
    sortable.activeIndex === 0 &&
    sortable.overIndex === 2,
  "tracks sortable indices",
);
check(
  sortable.isSorting && sortable.newIndex === 0,
  "derives the post-sort index",
);
const sortableContext = surface.st({
  id: "slides",
  items: [{ id: "s1" }, { id: "s2" }],
  children: "slides",
});
check(
  sortableContext.props["data-items"] === "s1,s2",
  "normalizes sortable object ids",
);

const ordinals = surface.at([
  {
    annotationId: "a",
    target: {
      type: "workbook-range",
      sheetName: "Sheet1",
      rect: { r1: 1, c1: 1, r2: 2, c2: 2 },
    },
  },
  {
    annotationId: "b",
    target: {
      type: "workbook-range",
      sheetName: "Sheet1",
      rect: { r1: 1, c1: 1, r2: 2, c2: 2 },
    },
  },
]);
check(
  ordinals.get("a") === 0 && ordinals.get("b") === 1,
  "assigns stable marker ordinals per annotation target",
);
check(
  surface
    .M({
      type: "presentation-element-selection",
      slideId: "slide",
      elementIds: ["z", "a"],
    })
    .endsWith(":a,z"),
  "canonicalizes presentation selections",
);
check(
  surface.N({ left: 10, top: 20, width: 30, height: 40 }, "bottom-left", 1)
    .top === 80,
  "positions ordinal annotation markers",
);
check(
  surface.O({ left: 10, top: 10 }, [{ left: 11, top: 11 }]).top === 37,
  "avoids marker collisions",
);
const marker = surface.$({
  position: { left: 10, top: 20 },
  selected: true,
  icon: "!",
  onClick() {},
});
check(
  marker.type === "button" && marker.props.style.left === 10,
  "renders interactive annotation markers",
);
check(
  marker.props["aria-pressed"] === true &&
    marker.props.children[1].props.children === "!",
  "renders annotation selection and icon state",
);
const presence = surface.y({
  position: { left: 3, top: 4 },
  author: { displayName: "Ada Lovelace", initials: "AL" },
});
check(
  presence.props.children === "AL" && presence.props.style.top === 4,
  "renders collaborator presence fallbacks",
);

check(
  surface.J([
    {
      color: "#000",
      strokeWidth: 2,
      points: [
        { x: 2, y: 3 },
        { x: 12, y: 13 },
      ],
    },
  ]).width === 10,
  "computes drawing stroke bounds",
);
const padded = surface.Y({ left: 10, top: 10, width: 20, height: 30 });
check(
  padded.width === 96 && padded.height === 96,
  "enforces minimum drawing crop size",
);
const clamped = surface.K(
  { left: -4, top: 90, width: 60, height: 30 },
  { width: 100, height: 100 },
);
check(
  clamped.left === 0 && clamped.top === 70,
  "clamps drawing crop to the viewport",
);
const payload = surface.q({
  drawingId: "drawing-1",
  screenshot: { url: "image" },
  markerViewportPoint: { x: 5, y: 6 },
});
check(
  payload.localBrowserScreenshot.commentId === "drawing-1",
  "links drawing screenshots to comments",
);
check(
  payload.localBrowserCommentMetadata.markerViewportPoint.x === 5,
  "preserves drawing marker coordinates",
);
check(
  surface.B("drawing").startsWith("drawing-") &&
    surface.B("drawing") !== surface.B("drawing"),
  "creates unique drawing ids",
);
const overlay = surface.H({
  strokes: [
    {
      color: "red",
      strokeWidth: 2,
      points: [
        { x: 1, y: 1 },
        { x: 5, y: 6 },
      ],
    },
  ],
  projectPoint: (point) => point,
});
check(
  overlay.type === "svg" && overlay.props.children[0].type === "path",
  "renders drawing strokes as SVG paths",
);
check(
  surface.H({ strokes: [], projectPoint: (point) => point }) === null,
  "skips empty drawing overlays",
);

const annotationButton = surface.I({ active: true, onClick() {} });
check(
  annotationButton.props["aria-label"] === "Annotating" &&
    annotationButton.props["aria-pressed"] === true,
  "renders annotation mode state",
);
const commentsButton = surface.L({ active: true, onClick() {} });
check(
  commentsButton.props["aria-expanded"] === true,
  "renders comment sidebar toggle state",
);
const badge = surface.T({ kind: "workbook", children: "W" });
check(
  badge.props["data-kind"] === "workbook" &&
    badge.props.className.includes("#04b84c"),
  "renders artifact-kind badges",
);
const colorPicker = surface.d({
  color: "#ef4444",
  onChange() {},
  allowNone: true,
});
check(
  colorPicker.props.children.length === 10,
  "renders full surface color palette",
);
check(
  surface.m("#ef4444", "#EF4444"),
  "compares editor colors case-insensitively",
);
const fontPicker = surface.f({ fontSize: 14, onChange() {} });
check(
  fontPicker.props.children.length === 13 &&
    fontPicker.props.children[5].props["aria-selected"],
  "renders standard font size controls",
);

const bootstrap = surface.a({
  initialCrdtState: new Uint8Array([1]),
  externalCrdtUpdates: [new Uint8Array([2]), new Uint8Array()],
});
check(
  Array.from(bootstrap.initialCrdtState).join(",") === "1,2",
  "merges initial and external CRDT state",
);
check(
  bootstrap.bootstrappedExternalCrdtUpdates.length === 1 &&
    bootstrap.externalCrdtUpdates.length === 0,
  "removes bootstrapped updates from replay",
);
const applied = [];
const bridge = surface.o({
  artifactLabel: "Workbook",
  externalCrdtUpdates: [new Uint8Array([3, 4])],
  controller: {
    async applyCrdtUpdate(update) {
      applied.push(...update);
    },
    async requestCrdtSnapshot() {
      return new Uint8Array([9]);
    },
  },
});
check(
  bridge.crdtPublishingReady && bridge.restoreState === null,
  "reports a ready CRDT publisher",
);
await bridge.restore();
check(
  applied.join(",") === "3,4",
  "applies pending CRDT updates during restore",
);
check(
  surface.s(new Error("decode failed"), "Workbook") === "decode failed",
  "preserves actionable CRDT errors",
);
check(
  surface.s("failure", "Workbook").includes("workbook"),
  "provides a fallback CRDT error",
);
const restoring = surface.r({
  artifactLabel: "Workbook",
  restoreState: { kind: "restoring", pendingUpdateCount: 501 },
});
check(
  restoring.props.role === "status" && restoring.props.children.includes("501"),
  "renders CRDT restoration progress",
);
const failed = surface.r({
  artifactLabel: "Workbook",
  restoreState: {
    kind: "failed",
    pendingUpdateCount: 2,
    errorMessage: "bad update",
  },
});
check(
  failed.props.role === "alert" && failed.props.children.includes("bad update"),
  "renders CRDT restoration failures",
);
check(
  surface.t("codex")["--color-token-bg-primary"] === "var(--color-surface)",
  "maps Codex surface theme tokens",
);
const customTheme = { "--custom": "red" };
check(
  surface.t("custom", customTheme) === customTheme,
  "preserves non-Codex theme maps",
);

console.log(`${assertions} Popcorn editor surface contract assertions passed`);
