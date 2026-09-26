import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/menu.ts")],
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
globalThis.__RENDERER_JSX_RUNTIME__ = {
  Fragment,
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
globalThis.__RENDERER_REACT__ = {
  Children: {
    toArray: (children) =>
      children == null ? [] : Array.isArray(children) ? children : [children],
  },
  cloneElement: (element, props) => ({
    ...element,
    props: { ...element.props, ...props },
  }),
  isValidElement: (value) =>
    value != null &&
    typeof value === "object" &&
    "type" in value &&
    "props" in value,
  useState: (initialValue) => [
    initialValue,
    (value) => stateWrites.push(value),
  ],
};

const menu = await import(
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

equal(
  Object.keys(menu.Menu),
  [
    "Trigger",
    "Content",
    "Item",
    "ItemSlot",
    "CheckboxItem",
    "RadioGroup",
    "RadioItem",
    "ItemIcon",
    "Input",
    "SearchInput",
    "Separator",
    "SectionLabel",
    "Message",
    "Title",
    "SubmenuItem",
    "FlyoutSubmenuItem",
    "Group",
    "Section",
  ],
  "exposes the complete public menu surface",
);

let node = menu.Menu.Trigger({
  disabled: true,
  className: "extra",
  id: "open",
});
equal(node.type, "button", "uses a native trigger button");
equal(node.props.type, "button", "prevents implicit form submission");
equal(node.props["aria-disabled"], true, "announces disabled triggers");
check(node.props.className.includes("opacity-25"), "dims disabled triggers");
equal(node.props.id, "open", "forwards trigger element props");

node = menu.Menu.Content({
  children: "rows",
  variant: "attached",
  surface: "chatgpt",
  size: "large",
  style: { minWidth: 240 },
});
equal(node.props.role, "menu", "uses the menu role");
equal(node.props.align, "start", "defaults content alignment");
equal(node.props.sideOffset, 1, "defaults the side offset");
check(node.props.className.includes("rounded-b-2xl"), "styles attached menus");
check(node.props.className.includes("menu-large-rows"), "styles large rows");
check(
  node.props.style.maxWidth.includes("--container-xs"),
  "caps ChatGPT menu width",
);
equal(node.props.style.minWidth, 240, "merges caller content styles");
equal(node.props.children, "rows", "preserves menu rows");

const clicks = [];
const selections = [];
node = menu.Menu.Item({
  children: "Open",
  href: "/open",
  leftIcon: "L",
  rightIcon: "R",
  keyboardShortcut: "⌘O",
  rightText: "new",
  SubText: "Details",
  isActive: true,
  onClick: () => clicks.push("click"),
  onSelect: () => selections.push("select"),
  "data-id": "open",
});
equal(node.type, "a", "uses an anchor for linked items");
equal(node.props.role, "menuitem", "uses the menuitem role");
equal(node.props.href, "/open", "forwards item links");
equal(node.props["aria-current"], "true", "announces active items");
equal(node.props["data-id"], "open", "forwards safe item element props");
equal("leftIcon" in node.props, false, "does not leak semantic icon props");
equal("SubText" in node.props, false, "does not leak semantic text props");
node.props.onClick({ preventDefault() {} });
node.props.onSelect({ preventDefault() {} });
equal(clicks, ["click"], "runs item click callbacks");
equal(selections, ["select"], "runs item selection callbacks");
const row = node.props.children;
equal(row.props.children[0].props.children, "L", "renders the leading icon");
equal(
  row.props.children[1].props.children[0].props.children,
  "Open",
  "renders the label",
);
equal(
  row.props.children[1].props.children[1].props.children,
  "Details",
  "renders subtext",
);
equal(row.props.children[2].props.children, "⌘O", "renders the shortcut");

let prevented = 0;
node = menu.Menu.Item({ children: "Heading", variant: "display" });
node.props.onClick({ preventDefault: () => (prevented += 1) });
node.props.onSelect({ preventDefault: () => (prevented += 1) });
equal(prevented, 2, "keeps display rows non-interactive");

node = menu.Menu.Item({ children: "Disabled", disabled: true });
equal(node.props.tabIndex, -1, "removes disabled items from tab order");
equal(node.props["aria-disabled"], true, "announces disabled items");

node = menu.Menu.Item({ children: "Help", tooltipText: "More help" });
equal(node.type.name, "Tooltip", "wraps annotated items in a tooltip");
equal(node.props.tooltipContent, "More help", "forwards tooltip content");

const customChild = {
  type: "button",
  props: { className: "custom", href: "/child", children: "Child" },
};
node = menu.Menu.Item({
  asChild: true,
  children: customChild,
  className: "item",
});
equal(node.type, "button", "clones asChild menu items");
equal(node.props.href, "/child", "preserves the child link target");
check(node.props.className.includes("custom"), "preserves child classes");

node = menu.Menu.ItemSlot({ children: "slot" });
equal(node.type, Fragment, "uses a fragment for item slots");
equal(node.props.children, "slot", "preserves slotted content");

prevented = 0;
selections.length = 0;
node = menu.Menu.CheckboxItem({
  children: "Remember",
  checked: true,
  indicator: "switch",
  onSelect: () => selections.push("checkbox"),
});
equal(node.props.role, "menuitemcheckbox", "uses the checkbox item role");
equal(node.props["aria-checked"], true, "announces checkbox state");
node.props.onSelect({ preventDefault: () => (prevented += 1) });
equal(prevented, 1, "keeps local checkboxes open by default");
equal(selections, ["checkbox"], "runs checkbox selection callbacks");
equal(
  node.props.children.props.children[2].props["data-indicator"],
  "switch",
  "uses the requested checkbox indicator",
);
equal(
  node.props.children.props.children[2].props.children,
  "on",
  "renders checked switch state",
);

node = menu.Menu.RadioGroup({ children: "choices" });
equal(node.props.role, "group", "groups radio items");
node = menu.Menu.RadioItem({ children: "Red", variant: "swatch" });
equal(node.props.role, "menuitemradio", "uses the radio item role");
check(node.props.className.includes("size-9"), "uses compact swatch layout");
equal(node.props.children, "Red", "keeps compact radio content");

let stopped = 0;
let selected = 0;
let forwardedKeyDown = 0;
node = menu.Menu.Input({
  placeholder: "Filter",
  onKeyDown: () => (forwardedKeyDown += 1),
});
equal(node.type, "input", "renders the menu text input");
equal(node.props.autoFocus, true, "focuses the menu input");
node.props.onKeyDown({
  key: "a",
  metaKey: true,
  stopPropagation: () => (stopped += 1),
  preventDefault: () => (prevented += 1),
  currentTarget: { select: () => (selected += 1) },
});
equal([stopped, selected], [1, 1], "contains and handles select-all shortcuts");
equal(forwardedKeyDown, 0, "does not forward handled select-all shortcuts");
node.props.onKeyDown({
  key: "x",
  stopPropagation: () => (stopped += 1),
  preventDefault() {},
});
equal(forwardedKeyDown, 1, "forwards unhandled input keys");

node = menu.Menu.SearchInput({
  sticky: true,
  variant: "inset",
  trailingContent: "clear",
  inputClassName: "input-extra",
});
equal(
  node.props.className.includes("sticky"),
  true,
  "supports sticky search rows",
);
const searchRow = node.props.children;
check(
  searchRow.props.className.includes("rounded-lg"),
  "styles inset search rows",
);
equal(searchRow.props.children[2], "clear", "renders trailing search content");
check(
  searchRow.props.children[1].props.className.includes("input-extra"),
  "forwards search input classes",
);

node = menu.Menu.Separator({ variant: "chatgpt" });
equal(node.props.role, "separator", "marks separators semantically");
check(
  node.props.children.props.className.includes("bg-border-subtle"),
  "styles ChatGPT separators",
);
node = menu.Menu.SectionLabel({ children: "General" });
equal(node.props["data-menu-section-label"], true, "marks section labels");
node = menu.Menu.Message({ children: "Failed", tone: "error", centered: true });
check(node.props.className.includes("text-danger"), "styles error messages");
check(
  node.props.className.includes("text-center"),
  "centers requested messages",
);
node = menu.Menu.Title({ children: "Actions" });
equal(node.props.children, "Actions", "renders menu titles");
node = menu.Menu.Group({ children: "group" });
equal(node.props.role, "group", "marks menu groups");
node = menu.Menu.Section({ children: "section" });
equal(node.props.children, "section", "renders plain menu sections");

stateWrites.length = 0;
const openChanges = [];
const trigger = {
  type: "button",
  props: { children: "More", onSelect: () => selections.push("submenu") },
};
node = menu.Menu.SubmenuItem({
  trigger,
  children: "nested",
  isDefaultOpen: true,
  onOpenChange: (open) => openChanges.push(open),
});
equal(node.props["data-state"], "open", "honors default submenu state");
equal(
  node.props.children[1].props.children,
  "nested",
  "renders open submenu content",
);
prevented = 0;
stopped = 0;
node.props.children[0].props.onSelect({
  defaultPrevented: false,
  preventDefault: () => (prevented += 1),
  stopPropagation: () => (stopped += 1),
});
equal(stateWrites, [false], "toggles submenu state");
equal(openChanges, [false], "reports submenu state changes");
equal([prevented, stopped], [1, 1], "contains submenu selection events");

node = menu.Menu.FlyoutSubmenuItem({ children: "Flyout" });
equal(node.props["data-menu-flyout"], true, "marks flyout submenu wrappers");
equal(
  node.props.children.type,
  menu.Menu.Item,
  "builds flyouts from menu items",
);
equal(node.props.children.props.rightIcon, "›", "adds the flyout affordance");

equal(menu.initializeMenu(), undefined, "keeps initialization idempotent");

console.log(
  `app-shared menu behavior: ${assertions}/${assertions} assertions passed`,
);
