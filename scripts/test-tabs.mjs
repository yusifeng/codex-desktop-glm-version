import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__tabsTest = {
  initialized: [],
  selected: [],
  closed: 0,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/security-tabs/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          () => ({
            contents: `
              const state = globalThis.__tabsTest; const init = (name) => state.initialized.push(name);
              export const I3 = () => { init("I3"); return state.jsx; }; export const m4 = (...values) => values.flat(Infinity).filter(Boolean).join(" ");
              export const Yh = "InsetButton"; export const ig = "CloseIcon";
              export const $3 = () => init("$3"); export const h4 = () => init("h4"); export const ag = () => init("ag"); export const Zh = () => init("Zh");
            `,
            loader: "js",
          }),
        );
      },
    },
  ],
});
const tabs = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const items = [
  { key: "one", name: "One", panelId: "panel-one", icon: "Icon" },
  {
    key: "two",
    name: "Two",
    panelId: "panel-two",
    onClose: () => state.closed++,
    closeLabel: "Close Two",
  },
  { key: "three", name: "Three" },
];
const onSelect = (key) => state.selected.push(key);

tabs.n();
check(state.initialized.length === 5, "initializes all tab dependencies");
let node = tabs.t({
  tabs: items,
  selectedKey: "one",
  onSelect,
  ariaLabel: "Views",
});
check(
  node.type === "div" &&
    node.props.role === "tablist" &&
    node.props["aria-label"] === "Views",
  "renders an accessible tab list",
);
check(node.props.children.length === 3, "renders every tab");
let first = node.props.children[0];
let firstButton = first.props.children[0];
check(
  firstButton.type === "button" &&
    firstButton.props["aria-selected"] === true &&
    firstButton.props.tabIndex === 0,
  "marks the selected tab",
);
check(
  firstButton.props.id === "panel-one-tab" &&
    firstButton.props["aria-controls"] === "panel-one",
  "links tabs to their panels",
);
check(
  firstButton.props.children[0].props.children === "Icon",
  "renders optional tab icons",
);
firstButton.props.onClick();
check(state.selected.length === 0, "ignores selected automatic tab clicks");
let second = node.props.children[1];
second.props.children[0].props.onClick();
check(state.selected.at(-1) === "two", "selects an inactive tab");
check(
  second.props.children[2].props["aria-label"] === "Close Two",
  "renders accessible close actions",
);
second.props.children[2].props.onClick();
check(state.closed === 1, "forwards tab close actions");
check(
  first.props.children[3] != null &&
    node.props.children[2].props.children[3] === null,
  "draws segmented dividers between tabs",
);

node = tabs.t({
  tabs: items,
  selectedKey: "one",
  onSelect,
  variant: "underline",
});
check(
  node.props.children[0].props.children[1] != null,
  "draws the selected underline indicator",
);
check(
  node.props.children[1].props.children[1] === null,
  "omits underline on inactive tabs",
);

node = tabs.t({
  tabs: items,
  selectedKey: "one",
  onSelect,
  variant: "inset",
  fill: true,
});
firstButton = node.props.children[0].props.children[0];
check(
  firstButton.type === "InsetButton" &&
    firstButton.props.color === "segmentedInsetSelected",
  "uses inset button styling",
);
check(
  node.props.className.includes("w-full") &&
    firstButton.props.children[1].type === "span",
  "fills and truncates tab labels",
);

node = tabs.t({
  tabs: items,
  selectedKey: "one",
  onSelect,
  activationMode: "manual",
});
node.props.children[0].props.children[0].props.onClick();
check(
  state.selected.at(-1) === "one",
  "allows activating the selected tab in manual mode",
);

const elements = items.map(() => ({
  focused: 0,
  scrolled: 0,
  focus() {
    this.focused++;
  },
  scrollIntoView() {
    this.scrolled++;
  },
}));
globalThis.getComputedStyle = () => ({ direction: "ltr" });
let prevented = 0;
node = tabs.t({ tabs: items, selectedKey: "one", onSelect, scrollable: true });
node.props.onKeyDown({
  key: "ArrowRight",
  target: elements[0],
  currentTarget: { querySelectorAll: () => elements },
  preventDefault: () => prevented++,
  stopPropagation: () => prevented++,
});
check(
  elements[1].focused === 1 && elements[1].scrolled === 1,
  "moves focus and scrolls with arrow keys",
);
check(
  state.selected.at(-1) === "two" && prevented === 2,
  "automatically selects the keyboard target",
);

globalThis.getComputedStyle = () => ({ direction: "rtl" });
node.props.onKeyDown({
  key: "ArrowLeft",
  target: elements[0],
  currentTarget: { querySelectorAll: () => elements },
  preventDefault() {},
  stopPropagation() {},
});
check(elements[1].focused === 2, "reverses horizontal navigation in RTL");

const scroller = { scrollLeft: 5 };
node.props.onWheel({ deltaX: 0, deltaY: 12, currentTarget: scroller });
check(
  scroller.scrollLeft === 17,
  "translates wheel motion into horizontal scrolling",
);

console.log(`${assertions} tabs assertions passed`);
