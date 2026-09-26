import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__RENDERER_JSX_RUNTIME__ = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};
globalThis.__RENDERER_REACT__ = {
  useState: (initial) => [
    typeof initial === "function" ? initial() : initial,
    () => {},
  ],
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/button.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});
const buttons = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let node = buttons.Button({ children: "Save" });
check(node.type === "button", "renders a native button by default");
check(node.props.type === "button", "defaults the native button type");
check(node.props.disabled === false, "keeps the default button enabled");
check(
  node.props.className.includes("bg-primary-solid"),
  "uses the primary color treatment",
);
check(
  node.props.className.includes("rounded-full"),
  "uses the default radius for the default size",
);
check(
  node.props.children.props.children[1] === "Save",
  "preserves button content",
);

node = buttons.Button({
  children: "Run",
  color: "composerSurface",
  size: "toolbar",
  uniform: true,
  allowShrink: true,
  contentLayout: "balanced",
  className: "custom-button",
});
check(
  node.props.className.includes("bg-(--color-background-primary-soft)/90"),
  "selects composer surface colors",
);
check(
  node.props.className.includes("rounded-lg"),
  "uniform toolbar buttons override their radius",
);
check(
  node.props.className.includes("aspect-square"),
  "uniform buttons use square geometry",
);
check(
  node.props.className.includes("grid-cols-[1fr_auto_1fr]"),
  "supports balanced content layout",
);
check(
  node.props.className.includes("min-w-0") &&
    node.props.className.endsWith("custom-button"),
  "supports shrinking and caller classes",
);

node = buttons.Button({
  children: "Loading",
  loading: true,
  spinnerVariant: "rays",
});
check(node.props.disabled === true, "loading disables a native button");
const loadingChildren = node.props.children.props.children;
check(
  typeof loadingChildren[0].type === "function",
  "prepends the loading spinner component",
);
check(
  loadingChildren[0].props.variant === "rays",
  "forwards the rays spinner variant",
);

let prevented = 0;
let clicked = 0;
node = buttons.LinkButton({
  children: "Open",
  disabled: true,
  href: "https://example.test",
  onClick: () => {
    clicked += 1;
  },
});
check(
  node.type === "a" && node.props.href === undefined,
  "removes href from disabled links",
);
check(
  node.props.role === "link" && node.props["aria-disabled"] === true,
  "preserves disabled link semantics",
);
check(node.props.tabIndex === -1, "removes disabled links from tab order");
node.props.onClick({
  preventDefault: () => {
    prevented += 1;
  },
});
check(prevented === 1 && clicked === 0, "blocks disabled link activation");
node.props.onKeyDown({
  key: "Enter",
  preventDefault: () => {
    prevented += 1;
  },
});
check(prevented === 2, "blocks keyboard activation for disabled links");

node = buttons.LinkButton({
  children: "Open",
  href: "https://example.test",
  onClick: () => {
    clicked += 1;
  },
});
node.props.onClick({
  preventDefault: () => {
    prevented += 1;
  },
});
check(
  node.props.href === "https://example.test",
  "keeps href on enabled links",
);
check(clicked === 1 && prevented === 2, "dispatches enabled link activation");

const spinner = buttons.LoadingSpinner({
  animationDurationMs: 750,
  containerClassName: "spinner-box",
});
check(spinner.type === "div", "renders the spinner container");
check(
  spinner.props.className.endsWith("spinner-box"),
  "merges spinner container classes",
);
check(
  spinner.props.style.animationDuration === "750ms",
  "normalizes spinner animation duration",
);
check(
  /^-[0-9]{1,3}ms$/.test(spinner.props.style.animationDelay),
  "stabilizes a negative animation delay",
);

const raysSpinner = buttons.LoadingSpinner({ variant: "rays" });
const raysIcon = raysSpinner.props.children.type(
  raysSpinner.props.children.props,
);
check(
  raysIcon.type === "svg" && raysIcon.props.viewBox === "0 0 20 20",
  "renders the original graded rays asset",
);
check(
  raysIcon.props.dangerouslySetInnerHTML.__html.includes("fill-opacity"),
  "preserves the multicolor rays artwork",
);
check(
  buttons.initializeButton() === undefined,
  "keeps button initialization idempotent",
);

console.log(`${assertions} app-shared button assertions passed`);
