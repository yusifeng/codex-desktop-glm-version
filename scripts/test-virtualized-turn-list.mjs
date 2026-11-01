import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(ROOT, "src/renderer/virtualized-turn-list/index.ts"), "utf8");
assert.match(source, /const nearBottom = preserveViewport && rawDistance <=/);
const state = globalThis.__virtualizedTurnListTest = { initialized: [] };
state.jsx = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const react = {
  memo: component => component,
  useContext: () => null,
  useEffect: () => {},
  useId: () => "panel-id",
  useLayoutEffect: () => {},
  useRef: value => ({ current: value }),
  useState: value => [typeof value === "function" ? value() : value, () => {}],
};
const noopNames = ["$3","C_","FQ","FX","JQ","K2","QI","Xi","Yi","g_","h4","lk","qQ","qm","t$","y_"];
const appShared = [
  ...noopNames.map(name => "export const " + name + "=()=>globalThis.__virtualizedTurnListTest.initialized.push(" + JSON.stringify(name) + ");"),
  "export const e6=()=>globalThis.__virtualizedTurnListTest.react;",
  "export const I3=()=>globalThis.__virtualizedTurnListTest.jsx;",
  "export const __=callback=>callback;",
  "export const x_=()=>1;",
  "export const P3=()=>({flushSync:callback=>callback()});",
  "export const m4=(...values)=>values.flat().filter(Boolean).join(' ');",
  "export const HX=signal=>signal?.value;",
  "export const BX=(signal,key)=>signal?.get?signal.get(key):signal?.value;",
  "export const LX=()=>({set(){}}); export const IQ=()=>callback=>callback();",
  "export const ZI={}; export const pZ=(root,value)=>({root,value}); export const rZ=(root,derive)=>({root,derive});",
  "export const n$=value=>({value,get(){return this.value},set(next){this.value=next},jump(next){this.value=next}});",
  "export const i$=()=>{}; export const fk=()=>{}; export const r$=()=>{};",
  "export const b_=(value,zoom)=>zoom===1?value:Math.round(value/zoom);",
  "export const S_='IconAsset'; export const Y2='FormattedMessage';",
].join("\n");
const appInitial = [
  "export const $en={}; export const bS={Content:'DynamicIsleContent'}; export const CS='PaginatedList';",
  "export const jat=entry=>({height:entry.height??entry.contentRect?.height??0});",
  "export const Oin=value=>value; export const TS='Button'; export const DS='ButtonIcon'; export const ES='ButtonLabel';",
  "export const Fbt='globalPinned'; export const Dbt='keyedPinned'; export const uyt='hidePanel';",
  "export const _yt={value:'isle-prefix'};",
  "export const _bt='layoutDependency'; export const ybt='widthDependency'; export const gbt='session'; export const Jbt='route'; export const Ukt='disableAnimation';",
  "export const wbt=value=>Boolean(value); export const lxt={}; export const uxt={};",
].join("\n");
const scrollController = {
  addScrollListener() { return () => {}; },
  addUserScrollListener() { return () => {}; },
  compensateScrollToDistanceFromBottomPx() {},
  getLastScrollDistanceFromBottomPx() { return 0; },
  getScrollElement() { return null; },
  getUnroundedScrollDistanceFromBottomPx(value) { return value; },
  preserveScrollPositionForNextLayout() {},
  scrollToDistanceFromBottomPx() {},
};
state.react = react;
state.controller = scrollController;
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/virtualized-turn-list/index.ts")],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "virtualized-turn-list-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\/thread-virtualizer$/ }, () => ({ path: path.join(ROOT, "src/renderer/thread-virtualizer/index.ts") }));
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
      contents: importPath === "app-shared" ? appShared
        : importPath === "app-initial" ? appInitial
        : importPath === "thread-scroll-controller-context-value"
          ? "export const n=()=>{}; export const r=()=>globalThis.__virtualizedTurnListTest.controller;"
          : "export {};",
      loader: "js",
    }));
  } }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
assert.deepEqual(Object.keys(module).sort(), ["a","c","d","f","i","l","m","n","o","p","r","s","t","u"]);

const entries = [
  { turnKey: "one", type: "turn", estimatedHeightPx: 100 },
  { turnKey: "two", type: "turn", estimatedHeightPx: 120 },
  { turnKey: "three", type: "turn", estimatedHeightPx: 140 },
];
const tree = module.t({ entries, RowComponent: "TurnRow", className: "custom", latestTurnFooter: "footer" });
assert.equal(tree.type, "div");
assert.equal(tree.props.className, "relative shrink-0 custom");
assert.deepEqual(tree.props.style, { height: 384 });
const rowNodes = tree.props.children.props.children;
assert.equal(rowNodes.length, 3);
assert.deepEqual(rowNodes.map(node => node.props.entry.turnKey), ["one", "two", "three"]);
assert.deepEqual(rowNodes.map(node => node.props.gapBeforePx), [0, 12, 12]);
assert.equal(rowNodes[2].props.latestTurnFooter, "footer");
const renderedRow = rowNodes[1].type(rowNodes[1].props);
assert.equal(renderedRow.props.style.height, 120);
assert.equal(renderedRow.props.style.marginTop, 12);
assert.equal(renderedRow.props.children.props["data-turn-key"], "two");
assert.equal(renderedRow.props.children.props.children.type, "TurnRow");

module.c();
assert.deepEqual(module.u.value, { displayMode: "overlay", isPopoverOpen: false });
assert.equal(typeof module.l.derive, "function");
assert.equal(module.l.derive(true, { get: token => token === module.u ? module.u.value : token === "globalPinned" }), false);
const shiftState = module.i({});
assert.equal(shiftState.contentShift.get(), 0);
assert.equal(shiftState.shouldShow, false);
assert.equal(shiftState.visibleSurface, null);
assert.deepEqual(module.o({ name: "file" }, "https://fallback.test"), { name: "file", url: "https://fallback.test" });
const dynamic = module.p({ children: "status" });
assert.equal(dynamic.type, "DynamicIsleContent");
assert.equal(dynamic.props.variant, "dynamic-isle");
assert.deepEqual(dynamic.props.children, ["isle-prefix", "status"]);
const paginated = module.d({ items: [1, 2] });
assert.equal(paginated.type, "PaginatedList");
assert.equal(typeof paginated.props.renderPagination, "function");
console.log("virtualized turn list tests passed");
