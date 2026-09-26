import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/dropdown-menu.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

const effects = [];
const stateWrites = [];
globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
globalThis.__RENDERER_REACT__ = {
  cloneElement: (element, props) => ({
    ...element,
    props: { ...element.props, ...props },
  }),
  useEffect: (effect, dependencies) => effects.push({ effect, dependencies }),
  useState: (value) => [value, (next) => stateWrites.push(next)],
};

const listeners = new Map();
globalThis.window = {
  addEventListener: (type, listener) => listeners.set(type, listener),
  removeEventListener: (type, listener) => {
    if (listeners.get(type) === listener) listeners.delete(type);
  },
};

const dropdown = await import(
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

const trigger = {
  type: "button",
  props: { className: "trigger", children: "Open" },
};
let openChanges = [];
let node = dropdown.DropdownMenu({
  triggerButton: trigger,
  open: true,
  onOpenChange: (open) => openChanges.push(open),
  children: "rows",
  modal: true,
  dir: "rtl",
  align: "end",
  side: "right",
  sideOffset: 6,
  alignOffset: 2,
  contentWidth: "menuWide",
  contentMaxHeight: "tall",
  contentClassName: "content-extra",
  contentStyle: { minHeight: 80 },
  surface: "panel",
  size: "large",
  portalContainer: "portal",
});
equal(node.type, "div", "renders a dropdown root");
equal(node.props.dir, "rtl", "forwards text direction");
equal(node.props["data-state"], "open", "marks open state");
equal(node.props["data-modal"], true, "marks modal menus");
const [clonedTrigger, overlay, content] = node.props.children;
equal(clonedTrigger.type, "button", "clones the trigger element");
equal(
  clonedTrigger.props["aria-haspopup"],
  "menu",
  "announces popup semantics",
);
equal(clonedTrigger.props["aria-expanded"], true, "announces open state");
equal(clonedTrigger.props["data-state"], "open", "marks the trigger state");
equal(overlay.type, "div", "renders a modal interaction shield");
equal(overlay.props["aria-hidden"], true, "hides the modal shield");
equal(
  overlay.props["data-portal-container"],
  "portal",
  "tracks portal ownership",
);
equal(content.type.name, "MenuContent", "uses the semantic menu content");
equal(content.props.side, "right", "forwards content side");
equal(content.props.align, "end", "forwards content alignment");
equal(content.props.sideOffset, 6, "forwards side offset");
equal(content.props.alignOffset, 2, "forwards alignment offset");
equal(content.props.surface, "panel", "forwards content surface");
equal(content.props.size, "large", "forwards row size");
check(content.props.className.includes("w-[240px]"), "applies width presets");
check(
  content.props.className.includes("content-extra"),
  "merges content classes",
);
equal(content.props.style.minHeight, 80, "merges content styles");
equal(
  content.props.style.maxHeight,
  "min(350px, var(--radix-dropdown-menu-content-available-height), calc(100vh - 16px))",
  "caps requested menu height",
);
equal(content.props.children, "rows", "preserves menu rows");

clonedTrigger.props.onClick({ defaultPrevented: false });
equal(openChanges, [false], "toggles controlled menus from the trigger");

let escaped = 0;
content.props.onEscapeKeyDown({
  defaultPrevented: false,
  preventDefault() {},
  stopPropagation() {},
});
equal(openChanges, [false, false], "closes menus on Escape");
content.props.onEscapeKeyDown({
  defaultPrevented: true,
  preventDefault: () => (escaped += 1),
  stopPropagation() {},
});
equal(openChanges, [false, false], "respects prevented Escape events");
equal(escaped, 0, "does not alter prevented events");

equal(effects.length, 1, "registers one lifecycle effect");
const cleanup = effects[0].effect();
equal(listeners.has("blur"), true, "closes open menus on window blur");
listeners.get("blur")();
equal(openChanges.at(-1), false, "reports blur closure");
cleanup();
equal(listeners.has("blur"), false, "cleans up the blur listener");

node = dropdown.DropdownMenu({
  triggerButton: trigger,
  open: true,
  contentVariant: "attached",
  matchTriggerWidth: true,
  children: "attached",
});
const attached = node.props.children[2];
equal(attached.props.side, "bottom", "anchors attached menus below triggers");
equal(attached.props.sideOffset, 0, "removes attached side gaps");
equal(attached.props.avoidCollisions, false, "keeps attached alignment fixed");
equal(
  attached.props.style.width,
  "var(--radix-dropdown-menu-trigger-width)",
  "matches attached trigger width",
);
check(
  attached.props.style.maxHeight.includes("250px"),
  "defaults attached menus to list height",
);

stateWrites.length = 0;
node = dropdown.DropdownMenu({ triggerButton: trigger, children: "closed" });
equal(node.props["data-state"], "closed", "defaults to closed state");
equal(node.props.children[2], null, "does not mount closed content");
node.props.children[0].props.onClick({ defaultPrevented: false });
equal(stateWrites, [true], "opens uncontrolled menus");

stateWrites.length = 0;
openChanges = [];
node = dropdown.DropdownMenu({
  triggerButton: trigger,
  disabled: true,
  onOpenChange: (open) => openChanges.push(open),
});
equal(node.props["data-state"], "closed", "forces disabled menus closed");
equal(node.props.children[0].props.disabled, true, "disables the trigger");
node.props.children[0].props.onClick({ defaultPrevented: false });
equal(stateWrites, [], "does not open disabled menus");
equal(openChanges, [], "does not report disabled opens");

console.log(
  `app-shared dropdown menu behavior: ${assertions}/${assertions} assertions passed`,
);
