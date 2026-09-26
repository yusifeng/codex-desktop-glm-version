import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/tooltip.ts")],
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
  Fragment,
  useId: () => ":tooltip-test:",
  useState: (initialValue) => [
    initialValue,
    (value) => stateWrites.push(value),
  ],
  isValidElement: (value) =>
    value != null &&
    typeof value === "object" &&
    "type" in value &&
    "props" in value,
  cloneElement: (element, props) => ({
    ...element,
    props: { ...element.props, ...props },
  }),
};

const tooltip = await import(
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

let node = tooltip.Tooltip({
  children: "plain",
  disabled: true,
  tooltipContent: "tip",
});
equal(node.type, Fragment, "disabled tooltip renders a fragment");
equal(node.props.children, "plain", "disabled tooltip preserves children");
node = tooltip.Tooltip({ children: "plain" });
equal(node.props.children, "plain", "missing content bypasses the tooltip");

const child = {
  type: "button",
  props: {
    className: "child",
    "aria-describedby": "existing",
    children: "Run",
  },
};
node = tooltip.Tooltip({
  children: child,
  tooltipContent: "Run task",
  className: "trigger-extra",
  defaultOpen: true,
  shortcut: "⌘R",
  side: "right",
});
const [trigger, content] = node.props.children;
equal(trigger.type, "button", "clones a custom trigger");
equal(
  trigger.props["aria-describedby"],
  "existing :tooltip-test:",
  "merges descriptions",
);
equal(trigger.props.className, "child trigger-extra", "merges trigger classes");
equal(trigger.props["data-state"], "delayed-open", "marks an open trigger");
equal(content.props.id, ":tooltip-test:", "uses a stable tooltip id");
equal(content.props["data-side"], "right", "uses the requested side");
equal(content.props.role, "tooltip", "uses tooltip accessibility role");
const [body, shortcut] = content.props.children.props.children;
equal(body.props.children, "Run task", "renders tooltip content");
equal(shortcut.type, "kbd", "renders the shortcut");
equal(shortcut.props.children, "⌘R", "preserves the shortcut label");

stateWrites.length = 0;
trigger.props.onBlur({});
trigger.props.onContextMenu({});
trigger.props.onKeyDown({ key: "Escape" });
equal(
  stateWrites,
  [false, false, false],
  "closes on blur, context menu, and Escape",
);

stateWrites.length = 0;
trigger.props.onPointerEnter({ pointerType: "mouse", currentTarget: null });
equal(stateWrites, [true], "opens on mouse hover");
trigger.props.onPointerLeave({});
equal(stateWrites, [true, false], "closes on pointer leave");

const closed = tooltip.Tooltip({
  children: "Text",
  tooltipContent: "Hidden",
  triggerAsChild: false,
});
equal(closed.props.children[0].type, "button", "creates a native trigger");
equal(
  closed.props.children[0].props.type,
  "button",
  "sets the native button type",
);
equal(closed.props.children[1], null, "does not mount closed content");

const forced = tooltip.Tooltip({
  children: "Text",
  tooltipContent: "Forced",
  triggerAsChild: false,
  forceMount: true,
  color: "surface",
  tooltipMaxWidth: 320,
});
const forcedContent = forced.props.children[1];
equal(forcedContent.props.hidden, true, "hides force-mounted closed content");
equal(
  forcedContent.props["aria-hidden"],
  "true",
  "hides closed content from accessibility",
);
check(
  forcedContent.props.className.includes("bg-surface-elevated-secondary"),
  "styles surface tooltips",
);
equal(forcedContent.props.style.maxWidth, 320, "uses a custom maximum width");

let controlledChanges = [];
const controlled = tooltip.Tooltip({
  children: child,
  tooltipContent: "Controlled",
  open: true,
  onOpenChange: (open) => controlledChanges.push(open),
  closeOnTriggerClick: true,
});
controlled.props.children[0].props.onClick({ defaultPrevented: false });
equal(controlledChanges, [false], "notifies controlled close changes");
equal(
  tooltip.initializeTooltip(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared tooltip behavior: ${assertions}/${assertions} assertions passed`,
);
