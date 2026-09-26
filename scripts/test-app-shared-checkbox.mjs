import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/checkbox.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

let state;
const updates = [];
globalThis.__RENDERER_REACT__ = {
  useState(initial) {
    state ??= initial;
    return [state, (value) => {
      state = value;
      updates.push(value);
    }];
  },
};
globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
};

const checkbox = await import(
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

const changes = [];
let node = checkbox.Checkbox({
  checked: false,
  onCheckedChange: (checked) => changes.push(checked),
  className: "custom-checkbox",
  id: "consent",
});
equal(node.type, "button", "renders a native button");
equal(node.props.type, "button", "prevents form submission");
equal(node.props.role, "checkbox", "uses checkbox semantics");
equal(node.props["aria-checked"], false, "announces unchecked state");
equal(node.props["data-state"], "unchecked", "marks unchecked state");
equal(node.props.id, "consent", "forwards button props");
check(node.props.className.includes("icon-2xs"), "uses the default size");
check(node.props.className.includes("custom-checkbox"), "merges caller classes");
node.props.onClick({ defaultPrevented: false });
equal(changes, [true], "toggles controlled unchecked values");
equal(updates, [], "does not update internal state when controlled");

node = checkbox.Checkbox({
  checked: "indeterminate",
  onCheckedChange: (checked) => changes.push(checked),
});
equal(node.props["aria-checked"], "mixed", "announces indeterminate state");
equal(node.props["data-state"], "indeterminate", "marks indeterminate state");
node.props.onClick({ defaultPrevented: false });
equal(changes.at(-1), true, "promotes indeterminate values to checked");

let clicked = 0;
node = checkbox.Checkbox({
  checked: true,
  onCheckedChange: (checked) => changes.push(checked),
  onClick: (event) => {
    clicked += 1;
    event.defaultPrevented = true;
  },
});
node.props.onClick({ defaultPrevented: false });
equal(clicked, 1, "runs caller click handlers");
equal(changes.at(-1), true, "respects prevented click handlers");

node = checkbox.Checkbox({
  checked: true,
  disabled: true,
  onCheckedChange: (checked) => changes.push(checked),
});
equal(node.props.disabled, true, "uses native disabled semantics");
node.props.onClick({ defaultPrevented: false });
equal(changes.at(-1), true, "does not change disabled checkboxes");

for (const [variant, expectedClass] of [
  ["secondary", "size-4"],
  ["overlay", "size-5"],
  ["checklist", "place-items-center"],
]) {
  node = checkbox.Checkbox({ checked: true, variant });
  check(node.props.className.includes(expectedClass), `styles ${variant} checkboxes`);
  equal(node.props.children.props.variant, variant, `forwards ${variant} to its indicator`);
}

state = undefined;
updates.length = 0;
node = checkbox.Checkbox({ defaultChecked: false });
node.props.onClick({ defaultPrevented: false });
equal(updates, [true], "updates uncontrolled state");

equal(checkbox.initializeCheckbox(), undefined, "initializes checkbox dependencies");

console.log(
  `app-shared checkbox behavior: ${assertions}/${assertions} assertions passed`,
);
