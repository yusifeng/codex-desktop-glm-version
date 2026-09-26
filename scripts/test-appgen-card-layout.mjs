import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenCardLayoutTest = {
  initialized: [],
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-card-layout/index.ts")],
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
            const state = globalThis.__appgenCardLayoutTest; const init = (name) => state.initialized.push(name);
            export const I3 = () => { init("I3"); return state.jsx; }; export const m4 = (...values) => values.filter(Boolean).join(" ");
            export const $3 = () => init("$3"); export const h4 = () => init("h4"); export const Zh = () => init("Zh"); export const C_ = () => init("C_"); export const c_ = () => init("c_");
          `,
            loader: "js",
          }),
        );
      },
    },
  ],
});
const layout = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
layout.a();
check(
  state.initialized.length === 6,
  "initializes all card layout dependencies",
);

let node = layout.n({
  aspectRatio: "landscape",
  viewMode: "grid",
  className: "custom",
  "data-id": "thumbnail",
  children: "preview",
});
check(
  node.type === "div" && node.props.children === "preview",
  "renders thumbnail content",
);
check(
  node.props.className.includes("w-full") &&
    node.props.className.includes("aspect-230/150"),
  "uses landscape grid geometry",
);
check(
  node.props.className.includes("custom") &&
    node.props["data-id"] === "thumbnail",
  "merges class names and forwards props",
);

node = layout.n({ viewMode: "list" });
check(
  node.props.className.includes("h-[50px] w-20") &&
    !node.props.className.includes("aspect-square"),
  "uses fixed list geometry",
);
node = layout.n({ viewMode: "grid" });
check(
  node.props.className.includes("aspect-square"),
  "defaults grid thumbnails to square",
);

node = layout.r({ viewMode: "list", className: "title", children: "Name" });
check(
  node.props.className.includes("text-sm leading-5") &&
    node.props.children === "Name",
  "uses list title typography",
);
node = layout.r({ viewMode: "grid" });
check(
  node.props.className.includes("text-xs leading-[18px]"),
  "uses grid title typography",
);

node = layout.t({ className: "description", children: "Details" });
check(
  node.props.className.includes("text-secondary") &&
    node.props.className.includes("description"),
  "renders card descriptions",
);
node = layout.i({ className: "actions", children: "Buttons" });
check(
  node.props.className.includes("pointer-events-auto") &&
    node.props.className.includes("actions"),
  "renders the responsive action rail",
);

console.log(`${assertions} Appgen card-layout assertions passed`);
