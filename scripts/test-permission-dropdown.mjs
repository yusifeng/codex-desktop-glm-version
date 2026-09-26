import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__permissionDropdownTest = {
  changes: [],
  initialized: 0,
  removed: 0,
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/permission-dropdown/index.ts")],
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
          ({ path: importPath }) => ({
            contents:
              importPath === "app-shared"
                ? `
                  export const I3 = () => globalThis.__permissionDropdownTest.jsx;
                  export const cy = "Chevron"; export const iy = "CheckIcon";
                  export const jf = { Item: "MenuItem", Separator: "Separator" };
                  export const kf = "Menu";
                  export const $3 = () => globalThis.__permissionDropdownTest.initialized++;
                  export const If = () => globalThis.__permissionDropdownTest.initialized++;
                  export const lw = () => globalThis.__permissionDropdownTest.initialized++;
                `
                : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const dropdown = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const options = [
  {
    value: "viewer",
    description: "Can view",
    ariaLabel: "Viewer",
    tooltipText: "Read-only access",
  },
  { value: "editor", description: null, disabled: true },
];
function render(overrides = {}) {
  return dropdown.t({
    options,
    value: "viewer",
    renderLabel: (value) => `label:${value}`,
    onChange: (value) => state.changes.push(value),
    ...overrides,
  });
}

dropdown.n();
check(state.initialized === 3, "initializes menu dependencies");
let node = render();
check(
  node.type === "Menu" &&
    node.props.align === "end" &&
    node.props.contentWidth === "xs",
  "renders a compact end-aligned menu",
);
const trigger = node.props.triggerButton;
check(
  trigger.type === "button" && trigger.props.type === "button",
  "renders a button trigger",
);
check(
  trigger.props.children[0] === "label:viewer",
  "renders the current label",
);
check(
  trigger.props.children[1].type === "Chevron",
  "renders the dropdown chevron",
);

let [items, removeItem] = node.props.children;
check(items.length === 2, "renders every permission option");
check(
  items[0].key === "viewer" && items[0].props.RightIcon === "CheckIcon",
  "marks the selected permission",
);
check(
  items[0].props.SubText.props.children === "Can view" &&
    items[0].props.tooltipText === "Read-only access",
  "forwards option description and tooltip",
);
check(items[1].props.disabled === true, "respects option-level disabling");
items[0].props.onSelect();
check(state.changes.join(",") === "viewer", "reports the selected value");
check(removeItem === null, "omits removal when no callback is provided");

node = render({
  variant: "inline",
  onRemoveAccess: () => state.removed++,
  removeLabel: "Remove access",
});
check(
  node.props.triggerButton.props.className.includes("text-base") &&
    !node.props.triggerButton.props.className.includes("border-default"),
  "uses the inline trigger style",
);
removeItem = node.props.children[1];
check(
  removeItem.props.children[0].type === "Separator",
  "separates the destructive action",
);
const removeAction = removeItem.props.children[1];
check(
  removeAction.props.children.props.className === "text-danger" &&
    removeAction.props.children.props.children === "Remove access",
  "renders a dangerous remove-access label",
);
removeAction.props.onSelect();
check(state.removed === 1, "invokes the removal callback");

node = render({ disabled: true, onRemoveAccess: () => state.removed++ });
[items, removeItem] = node.props.children;
check(
  node.props.disabled && node.props.triggerButton.props.disabled,
  "disables the menu and trigger globally",
);
check(
  items.every((item) => item.props.disabled) &&
    removeItem.props.children[1].props.disabled,
  "disables all option and removal actions globally",
);

console.log(`${assertions} permission dropdown assertions passed`);
