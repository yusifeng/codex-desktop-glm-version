import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/context-menu.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

const Fragment = Symbol("Fragment");
const stateWrites = [];
const effects = [];
globalThis.__RENDERER_JSX_RUNTIME__ = {
  Fragment,
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
globalThis.__RENDERER_REACT__ = {
  cloneElement: (element, props) => ({
    ...element,
    props: { ...element.props, ...props },
  }),
  useEffect: (effect, dependencies) => effects.push({ effect, dependencies }),
  useRef: (value) => ({ current: value }),
  useState: (value) => [value, (next) => stateWrites.push(next)],
};

const nativeCalls = [];
const fakeWindow = { electronBridge: undefined };
globalThis.window = fakeWindow;

const contextMenu = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const items = [
  {
    id: "open",
    message: { id: "open", defaultMessage: "Open {name}" },
    messageValues: { name: "file" },
    tooltipMessage: { id: "open.tip", defaultMessage: "Open now" },
    accelerator: "CmdOrCtrl+O",
    checked: true,
  },
  {
    id: "heading",
    type: "label",
    message: { id: "heading", defaultMessage: "More" },
  },
  { id: "divider", type: "separator", submenu: [{ id: "ignored" }] },
  {
    id: "parent",
    message: { id: "parent", defaultMessage: "Parent" },
    submenu: [
      {
        id: "child",
        message: { id: "child", defaultMessage: "Child" },
        type: "radio",
        checked: true,
      },
    ],
  },
];

const prepared = contextMenu.prepareContextMenuItems(items);
equal(prepared[0].nativeLabel, "Open file", "formats message values");
equal(prepared[0].nativeTooltip, "Open now", "formats tooltip messages");
equal(prepared[2].nativeLabel, "", "keeps separators unlabeled");
equal(prepared[2].submenu, undefined, "removes separator submenus");
equal(prepared[3].submenu[0].nativeLabel, "Child", "prepares nested items");

const nativeItems = contextMenu.toNativeContextMenuItems(prepared);
equal(nativeItems[0].label, "✓ Open file", "prefixes checked native commands");
equal(nativeItems[0].enabled, true, "enables commands by default");
equal(nativeItems[1].enabled, false, "disables native labels");
equal(nativeItems[2].type, "separator", "preserves native separators");
equal(nativeItems[3].submenu[0].type, "radio", "preserves nested radio items");
equal(nativeItems[3].submenu[0].checked, true, "preserves native radio state");
equal(
  contextMenu.findContextMenuItem(prepared, "child").id,
  "child",
  "finds nested selectable items",
);
equal(
  contextMenu.findContextMenuItem(prepared, "heading"),
  undefined,
  "does not select labels",
);
equal(
  contextMenu.normalizeAccelerator("CmdOrCtrl+Option+P", false),
  "Control+Alt+P",
  "normalizes cross-platform accelerators",
);
equal(
  contextMenu.normalizeAccelerator("Cmd+Ctrl+P", true),
  "Meta+Control+P",
  "normalizes explicit command keys",
);

const child = {
  type: "button",
  props: { className: "trigger", children: "Actions" },
};
let selected = [];
let node = contextMenu.ContextMenu({
  children: child,
  disableNative: true,
  open: true,
  trigger: "click",
  items: [
    {
      id: "title",
      type: "label",
      message: { id: "title", defaultMessage: "Title" },
    },
    { id: "separator", type: "separator" },
    {
      id: "check",
      type: "checkbox",
      checked: true,
      onSelect: () => selected.push("check"),
    },
    {
      id: "disabled",
      enabled: false,
      onSelect: () => selected.push("disabled"),
    },
    {
      id: "submenu",
      submenu: [{ id: "nested", onSelect: () => selected.push("nested") }],
    },
  ],
});
equal(node.type, "div", "renders a web context-menu root");
equal(node.props["data-state"], "open", "honors controlled open state");
const [webTrigger, content] = node.props.children;
equal(webTrigger.type, "button", "clones the web trigger");
equal(webTrigger.props["aria-haspopup"], "menu", "announces click menus");
equal(content.type.name, "MenuContent", "uses the semantic menu surface");
equal(content.props["data-content-width"], "menu", "defaults web menu width");
const rows = content.props.children;
equal(rows.length, 5, "renders every web menu row");
equal(rows[0].type.name, "MenuTitle", "renders label rows");
equal(rows[1].type.name, "MenuSeparator", "renders separators");
equal(rows[2].type.name, "MenuCheckboxItem", "renders checkbox rows");
equal(rows[4].type.name, "MenuFlyoutSubmenuItem", "renders nested flyouts");

let prevented = 0;
rows[2].props.onSelect({
  preventDefault: () => (prevented += 1),
  stopPropagation() {},
});
equal(selected, ["check"], "runs enabled web selections");
rows[3].props.onSelect({
  preventDefault: () => (prevented += 1),
  stopPropagation() {},
});
equal(prevented, 1, "prevents disabled web selections");
equal(selected, ["check"], "does not run disabled selections");

stateWrites.length = 0;
let clickPrevented = 0;
webTrigger.props.onClick({
  defaultPrevented: false,
  preventDefault: () => (clickPrevented += 1),
  stopPropagation() {},
});
equal(stateWrites.at(-1), true, "opens click-triggered web menus");
equal(clickPrevented, 0, "does not suppress web trigger clicks");

stateWrites.length = 0;
prevented = 0;
let stopped = 0;
webTrigger.props.onKeyDown({
  key: "F10",
  shiftKey: true,
  target: webTrigger,
  currentTarget: webTrigger,
  defaultPrevented: false,
  preventDefault: () => (prevented += 1),
  stopPropagation: () => (stopped += 1),
});
equal([prevented, stopped], [1, 1], "contains context-menu keyboard shortcuts");
equal(stateWrites.at(-1), true, "opens web menus from the keyboard");

let customCalls = 0;
node = contextMenu.ContextMenu({
  children: child,
  disableNative: true,
  open: true,
  items: [{ id: "custom" }],
  renderItem: (item) => {
    customCalls += 1;
    return { custom: item.id };
  },
});
equal(
  node.props.children[1].props.children[0],
  { custom: "custom" },
  "supports custom row rendering",
);
equal(customCalls, 1, "calls the custom renderer once per row");

const openChanges = [];
let beforeOpen = 0;
let focused = 0;
let closeEvents = 0;
selected = [];
globalThis.document = {
  activeElement: { focus: () => (focused += 1) },
};
fakeWindow.electronBridge = {
  showContextMenu: async (template) => {
    nativeCalls.push(template);
    return { id: "nested" };
  },
};
node = contextMenu.ContextMenu({
  children: child,
  items: [
    {
      id: "parent",
      submenu: [{ id: "nested", onSelect: () => selected.push("nested") }],
    },
  ],
  onBeforeOpen: async () => {
    beforeOpen += 1;
  },
  onOpenChange: (open) => openChanges.push(open),
  onCloseAutoFocus: () => {
    closeEvents += 1;
  },
});
equal(node.type, "button", "uses only the cloned trigger for native menus");
let nativePrevented = 0;
stopped = 0;
node.props.onContextMenu({
  defaultPrevented: false,
  preventDefault: () => (nativePrevented += 1),
  stopPropagation: () => (stopped += 1),
});
await new Promise((resolve) => setTimeout(resolve, 0));
equal(beforeOpen, 1, "awaits native pre-open work");
equal(nativePrevented, 1, "suppresses the native browser context menu");
equal(stopped, 1, "contains native context-menu events");
equal(nativeCalls.length, 1, "opens one Electron context menu");
equal(
  nativeCalls[0][0].submenu[0].id,
  "nested",
  "passes nested native templates",
);
equal(openChanges, [true, false], "reports the native menu lifecycle");
equal(selected, ["nested"], "selects returned native item ids");
equal(closeEvents, 1, "runs native close autofocus callbacks");
equal(focused, 1, "restores focus after native selection");

nativeCalls.length = 0;
node.props.onClick({
  defaultPrevented: false,
  preventDefault() {},
  stopPropagation() {},
});
await Promise.resolve();
equal(
  nativeCalls.length,
  0,
  "does not open context-triggered native menus on click",
);

equal(
  contextMenu.initializeContextMenu(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared context menu behavior: ${assertions}/${assertions} assertions passed`,
);
