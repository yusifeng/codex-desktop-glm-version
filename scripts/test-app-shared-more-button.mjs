import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/ui/more-button.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react", "react/jsx-runtime"],
  write: false,
  logLevel: "silent",
});

globalThis.__RENDERER_JSX_RUNTIME__ = {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
};

const more = await import(
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

let clicked = 0;
let stopped = 0;
let node = more.MoreButton({
  label: "More actions",
  onClick: () => (clicked += 1),
  className: "menu-trigger",
  disabled: true,
});
equal(node.type.name, "Button", "renders the shared Button primitive");
equal(node.props.color, "ghost", "uses the ghost button color");
equal(node.props.size, "toolbar", "uses toolbar sizing by default");
equal(node.props.uniform, true, "uses uniform dimensions by default");
equal(node.props["aria-label"], "More actions", "provides an accessible label");
equal(node.props.className, "menu-trigger", "forwards button props");
equal(node.props.disabled, true, "forwards disabled state");
equal(
  node.props.children.type.name,
  "EllipsisIcon",
  "renders the ellipsis icon",
);
equal(
  node.props.children.props.className,
  "icon-xs",
  "uses the default icon size",
);

const event = { stopPropagation: () => (stopped += 1) };
node.props.onClick(event);
equal(stopped, 1, "stops click propagation");
equal(clicked, 1, "runs the supplied click callback");

node = more.MoreButton({
  label: "Options",
  size: "iconSm",
  iconClassName: "icon-sm",
  uniform: false,
});
equal(node.props.size, "iconSm", "supports explicit button sizes");
equal(node.props.uniform, false, "supports non-uniform layout");
equal(
  node.props.children.props.className,
  "icon-sm",
  "supports custom icon sizing",
);
node.props.onClick(event);
equal(stopped, 2, "stops propagation without a callback");

const icon = node.props.children.type(node.props.children.props);
equal(icon.type, "svg", "renders an SVG icon");
equal(icon.props.width, 21, "preserves the source icon width");
equal(icon.props.height, 21, "preserves the source icon height");
equal(icon.props.children.length, 3, "renders all three ellipsis dots");
check(
  icon.props.children.every(
    (pathNode) => pathNode.props.fill === "currentColor",
  ),
  "inherits the current text color",
);

equal(
  more.initializeMoreButton(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared more button behavior: ${assertions}/${assertions} assertions passed`,
);
