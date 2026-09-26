import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__toolbarBreadcrumbTest = {
  initialized: [],
  clicks: 0,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/toolbar-breadcrumb/index.ts")],
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
              const state = globalThis.__toolbarBreadcrumbTest; const init = (name) => state.initialized.push(name);
              export const I3 = () => { init("I3"); return state.jsx; }; export const e6 = () => { init("e6"); return { Fragment: "Fragment" }; };
              export const n4 = () => ({ formatMessage: (descriptor) => descriptor.defaultMessage });
              export const m4 = (...values) => values.filter(Boolean).join(" "); export const S_ = "AssetIcon"; export const Yd = "ChevronAsset"; export const Yh = "Button";
              export const $3 = () => init("$3"); export const Xd = () => init("Xd"); export const h4 = () => init("h4"); export const K2 = () => init("K2"); export const C_ = () => init("C_"); export const Zh = () => init("Zh");
            `,
            loader: "js",
          }),
        );
      },
    },
  ],
});
const breadcrumb = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

breadcrumb.n();
check(
  state.initialized.length === 8,
  "initializes all breadcrumb dependencies",
);
let node = breadcrumb.t({
  ancestors: [
    { id: "sites", label: "Sites", onClick: () => state.clicks++ },
    { id: "custom", content: { type: "Custom", props: {} } },
  ],
  current: "My Site",
  textSm: true,
});
check(
  node.type === "nav" && node.props["aria-label"] === "Breadcrumb",
  "renders an accessible nav landmark",
);
check(
  node.props.className.includes("text-sm"),
  "uses compact text when requested",
);
const ancestorNodes = node.props.children[0];
check(
  ancestorNodes.length === 2 && ancestorNodes[0].key === "sites",
  "keys every ancestor by id",
);
check(
  ancestorNodes[0].props.children[0] === null,
  "omits the leading separator",
);
const firstButton = ancestorNodes[0].props.children[1];
check(
  firstButton.type === "Button" &&
    firstButton.props.children.props.children === "Sites",
  "renders clickable ancestor labels",
);
firstButton.props.onClick();
check(state.clicks === 1, "forwards ancestor click handlers");
check(
  ancestorNodes[1].props.children[0].props.asset === "ChevronAsset",
  "separates later ancestors",
);
check(
  ancestorNodes[1].props.children[1].type === "Custom",
  "renders custom ancestor content unchanged",
);
const current = node.props.children[1];
check(
  current.props.children[0].props.asset === "ChevronAsset",
  "separates the current page",
);
check(
  current.props.children[1].props["aria-current"] === "page" &&
    current.props.children[1].props.children === "My Site",
  "marks the current breadcrumb page",
);

node = breadcrumb.t({ ancestors: [], current: null, textSm: false });
check(node.props.className.includes("text-base"), "uses default text size");
check(node.props.children[1] === null, "omits a missing current page");

console.log(`${assertions} toolbar-breadcrumb assertions passed`);
