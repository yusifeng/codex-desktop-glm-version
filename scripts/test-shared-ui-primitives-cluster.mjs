import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__sharedPrimitivesTest = {
  highlightInitializations: 0,
  jsx: {
    Fragment: Symbol("Fragment"),
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
  },
  motionDiv: Symbol("motion.div"),
  AnimatePresence: Symbol("AnimatePresence"),
  FormattedMessage: Symbol("FormattedMessage"),
};

const appSharedMock = `
  const s=globalThis.__sharedPrimitivesTest;
  function ReactRuntime(){return ReactRuntime}
  ReactRuntime.useState=(value)=>[typeof value==="function"?value():value,()=>{}];
  ReactRuntime.useSyncExternalStore=(subscribe,getSnapshot)=>getSnapshot();
  export const e6=ReactRuntime;
  export const I3=()=>s.jsx;
  export const G2=(messages)=>messages;
  export const K2=()=>{};
  export const XQ=()=>false;
  export const Y2=s.FormattedMessage;
  export const YQ=()=>{};
  export const a$=()=>{};
  export const d$=s.AnimatePresence;
  export const f$=()=>{};
  export const h4=()=>{};
  export const m4=(...values)=>values.filter(Boolean).join(" ");
  export const n4=()=>({
    locale:"en-US",
    formatMessage:(descriptor,values)=>descriptor.id+":"+JSON.stringify(values??{}),
  });
  export const o$={div:s.motionDiv};
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
        name: "shared-ui-primitives-mocks",
        setup(build) {
          build.onResolve(
            { filter: /^@rchunk\/(values|theme-font-family)$/ },
            ({ path: value }) => ({
              path: path.join(ROOT, "src/renderer", value.slice(8), "index.ts"),
            }),
          );
          build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({
            path: value.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: value }) => {
              if (value === "app-shared")
                return { contents: appSharedMock, loader: "js" };
              if (value === "app-initial")
                return {
                  contents: `export const CUt=()=>{globalThis.__sharedPrimitivesTest.highlightInitializations+=1}; export const _Ut=(turnKey,unitId)=>turnKey+":"+unitId;`,
                  loader: "js",
                };
              if (value === "timestamps")
                return {
                  contents: `export const a=()=>{}; export const r=(_intl,date,now)=>({date:date.getUTCDate()===now.getUTCDate()?"Today":"Earlier",time:"10:30 AM",includeAt:date.getUTCDate()!==now.getUTCDate()});`,
                  loader: "js",
                };
              return { contents: "export {};", loader: "js" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

const values = await bundle("values");
assert.deepEqual(values.t(null), []);
assert.deepEqual(values.t({ a: 1, b: 2 }), [1, 2]);
const random = Math.random;
Math.random = () => 0;
const shuffledSelf = values.n([1, 2, 3], 2);
Math.random = random;
assert.deepEqual(shuffledSelf, [1, 2]);
assert.equal(shuffledSelf.length, 2);

const shuffle = await bundle("shuffle");
Math.random = () => 0;
assert.deepEqual(shuffle.t([1, 2, 3]), [1, 2, 3]);
assert.deepEqual(shuffle.t({ a: "A", b: "B" }), ["A", "B"]);
assert.deepEqual(shuffle.t("abc"), ["a", "b", "c"]);
assert.deepEqual(shuffle.t(null), []);
Math.random = random;

const building = await bundle("building");
building.n();
const buildingIcon = building.t({ className: "building" });
assert.equal(buildingIcon.type, "svg");
assert.equal(buildingIcon.props.width, 20);
assert.equal(buildingIcon.props.className, "building");
assert.equal(
  Array.isArray(buildingIcon.props.children)
    ? buildingIcon.props.children.length
    : 1,
  1,
);

const lock = await bundle("lock");
lock.n();
const lockIcon = lock.t({ className: "lock" });
assert.equal(lockIcon.type, "svg");
assert.equal(lockIcon.props.width, 18);
assert.equal(lockIcon.props.className, "lock");
assert.equal(lockIcon.props.children.length, 3);

const hooks = await bundle("hooks");
hooks.n();
const hooksIcon = hooks.t({ className: "hooks" });
assert.equal(hooksIcon.type, "svg");
assert.equal(hooksIcon.props.width, 18);
assert.equal(hooksIcon.props.className, "hooks");
assert.equal(hooksIcon.props.children.length, 3);

const commands = await bundle("command-execution-command");
commands.n();
assert.equal(commands.t({ command: "zsh -lc pwd", commandActions: [] }), "");
assert.equal(
  commands.t({ command: "npm test", commandActions: [] }),
  "npm test",
);
assert.equal(
  commands.t({
    command: "fallback",
    commandActions: [{ command: "bash" }, { command: " git status " }],
  }),
  "git status",
);
assert.equal(
  commands.t({
    command: "fallback",
    commandActions: [
      { command: "git status" },
      { command: "pwsh.exe -c echo" },
    ],
  }),
  "git status",
);
assert.equal(
  commands.t({
    command: "fallback",
    commandActions: [{ command: "C:\\bin\\cmd.exe /c dir" }],
  }),
  "fallback",
);

const highlights = await bundle("highlight-selectors");
highlights.r();
assert.equal(globalThis.__sharedPrimitivesTest.highlightInitializations, 1);
const highlightList = [
  {
    id: 1,
    location: { domain: "conversation", turnKey: "turn", unitId: "one" },
  },
  {
    id: 2,
    location: { domain: "conversation", turnKey: "turn", unitId: "one" },
  },
  { id: 3, location: { domain: "diff", path: "src/a.ts" } },
  { id: 4, location: { domain: "other" } },
];
assert.deepEqual(
  highlights
    .t(highlightList)
    .get("turn:one")
    .map((item) => item.id),
  [1, 2],
);
assert.equal(highlights.t(highlightList).size, 1);
assert.deepEqual(
  highlights
    .n(highlightList)
    .get("src/a.ts")
    .map((item) => item.id),
  [3],
);
assert.equal(highlights.n(highlightList).size, 1);

const inView = await bundle("use-element-in-view");
inView.t();
const container = {
  addEventListener() {},
  removeEventListener() {},
  getBoundingClientRect: () => ({ top: 10, bottom: 100 }),
};
assert.equal(inView.n({ container: null, target: null }), true);
assert.equal(
  inView.n({
    container,
    target: { getBoundingClientRect: () => ({ top: 20, bottom: 30 }) },
  }),
  true,
);
assert.equal(
  inView.n({
    container,
    target: { getBoundingClientRect: () => ({ top: 100, bottom: 120 }) },
  }),
  false,
);

const wheel = await bundle("wheel-swipe-gesture");
wheel.n();
const gesture = new wheel.t();
assert.equal(gesture.isContinuation({ deltaY: 10, timeStamp: 0 }), false);
gesture.begin({ deltaY: 20, timeStamp: 0 }, 100);
assert.equal(gesture.isContinuation({ deltaY: 15, timeStamp: 20 }), true);
assert.equal(gesture.isContinuation({ deltaY: 5, timeStamp: 40 }), true);
assert.equal(gesture.isContinuation({ deltaY: 20, timeStamp: 220 }), false);
assert.equal(gesture.activeSwipe, null);
gesture.begin({ deltaY: -10, timeStamp: 300 }, 50);
assert.equal(gesture.activeSwipe.lastDeltaY, 10);
assert.equal(gesture.isContinuation({ deltaY: 9, timeStamp: 351 }), false);

const fontFamily = await bundle("theme-font-family");
fontFamily.s();
const face = {
  family: "Inter",
  fullName: "Inter Regular",
  postscriptName: "Inter-Regular",
};
assert.equal(fontFamily.a(face), "Codex selected Inter-Regular");
assert.equal(fontFamily.i('"Inter", system-ui'), '"Inter"');
assert.equal(fontFamily.r('"Inter", system-ui'), "Inter");
assert.equal(fontFamily.r("Open\\ Sans, sans-serif"), "Open Sans");
assert.equal(fontFamily.t("inter, sans-serif", face), true);
assert.equal(fontFamily.n('A\\B"C'), 'A\\\\B\\"C');
assert.equal(
  fontFamily.o("Inter, sans-serif", face),
  '"Codex selected Inter-Regular", Inter, sans-serif',
);
assert.equal(fontFamily.o("Arial, sans-serif", face), "Arial, sans-serif");

const fontLoader = await bundle("theme-font-face-loader");
fontLoader.t();
const originalDocument = globalThis.document;
const originalFontFace = globalThis.FontFace;
globalThis.document = {
  fonts: {
    added: [],
    add(font) {
      this.added.push(font);
    },
  },
};
const loads = [];
globalThis.FontFace = class {
  constructor(family, source) {
    this.family = family;
    this.source = source;
  }
  async load() {
    loads.push(this.source);
    return this;
  }
};
assert.equal(await fontLoader.n(face), true);
assert.equal(await fontLoader.n(face), true);
assert.equal(loads.length, 1);
await fontLoader.r([
  { ui: "Inter, sans-serif", uiFace: face },
  { code: "Arial", codeFace: face },
]);
assert.equal(loads.length, 1);
assert.equal(globalThis.document.fonts.added.length, 1);
globalThis.document = originalDocument;
globalThis.FontFace = originalFontFace;

const timestamp = await bundle("timestamp-separator");
timestamp.i();
timestamp.n();
const collapsed = timestamp.r({ isVisible: false, children: "hidden" });
assert.equal(collapsed.type, globalThis.__sharedPrimitivesTest.AnimatePresence);
assert.equal(collapsed.props.children, null);
const visible = timestamp.r({
  isVisible: true,
  className: "extra",
  children: "shown",
});
assert.equal(
  visible.props.children.type,
  globalThis.__sharedPrimitivesTest.motionDiv,
);
assert.equal(visible.props.children.props.className, "overflow-hidden extra");
assert.equal(timestamp.t({ sentAtMs: Number.NaN }), null);
const stamp = timestamp.t({
  sentAtMs: Date.UTC(2026, 8, 27, 10, 30),
  nowMs: Date.UTC(2026, 8, 27, 12),
});
assert.equal(stamp.type.name, "TimestampLabel");
assert.equal(
  stamp.props.label.startsWith("conversation.timestampSeparator.recent"),
  true,
);

console.log("60 shared UI primitives cluster assertions passed");
