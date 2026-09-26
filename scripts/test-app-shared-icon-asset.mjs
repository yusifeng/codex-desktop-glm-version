import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__RENDERER_REACT__ = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useId: () => ":icon-test:",
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/ui/icons/icon-preset.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});
const icons = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const monochrome = icons.createIconPreset({
  name: "test-icon",
  canvas: {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    frame: { x: 0, y: 0, width: 20, height: 20 },
    visualBounds: { x: 4, y: 4, width: 10, height: 10 },
  },
  paint: { kind: "monochrome" },
  optical: {
    shape: "non-circular",
    center: { x: 9, y: 10 },
    anchors: {
      frame: { x: 10, y: 10 },
      ink: { x: 8, y: 10 },
      foreground: { x: 9, y: 10 },
    },
  },
  capabilities: ["icon"],
  body: '<path id="shape" fill="url(#paint)"/><use href="#shape"/>',
});
check(Object.isFrozen(monochrome), "freezes icon presets");
check(Object.isFrozen(monochrome.canvas), "freezes icon canvas metadata");

let node = icons.IconAsset({ asset: monochrome, className: "icon-test" });
check(node.type === "svg", "renders an SVG element");
check(
  node.props.width === 20 && node.props.height === 20,
  "uses preset canvas dimensions",
);
check(
  node.props["aria-hidden"] === true && node.props.role === undefined,
  "hides unlabeled icons from accessibility APIs",
);
check(node.props.className === "icon-test", "forwards SVG props");
check(
  node.props.dangerouslySetInnerHTML.__html.includes(
    'id="test-icon-:icon-test:-shape"',
  ),
  "prefixes local SVG ids with a stable generated id",
);
check(
  node.props.dangerouslySetInnerHTML.__html.includes(
    'href="#test-icon-:icon-test:-shape"',
  ),
  "rewrites local SVG href references",
);

node = icons.IconAsset({
  asset: monochrome,
  idPrefix: "explicit",
  label: "Test icon",
  role: "presentation",
});
check(
  node.props["aria-label"] === "Test icon",
  "uses the semantic label as aria-label",
);
check(
  node.props["aria-hidden"] === undefined,
  "exposes labeled icons to accessibility APIs",
);
check(node.props.role === "presentation", "honors an explicit role override");
check(
  node.props.dangerouslySetInnerHTML.__html.includes("explicit-shape"),
  "honors an explicit id prefix",
);

node = icons.IconAsset({ asset: monochrome, alignment: "composite" });
check(
  node.props.dangerouslySetInnerHTML.__html.startsWith(
    '<g transform="translate(2 0)">',
  ),
  "aligns composite icons to their ink anchor",
);
node = icons.IconAsset({ asset: monochrome, alignment: "foreground" });
check(
  node.props.dangerouslySetInnerHTML.__html.startsWith(
    '<g transform="translate(1 0)">',
  ),
  "aligns icons to their foreground anchor",
);

const multicolor = icons.createIconPreset({
  name: "brand-icon",
  canvas: { width: 16, height: 16, viewBox: "0 0 16 16" },
  paint: {
    kind: "multicolor",
    layers: [
      {
        role: "brand",
        color: "#ff0000",
        bounds: { x: 0, y: 0, width: 16, height: 16 },
        wideGamut: "color(display-p3 1 0 0 / 1)",
      },
      {
        role: "foreground",
        color: "currentColor",
        bounds: { x: 2, y: 2, width: 12, height: 12 },
      },
    ],
  },
  capabilities: ["icon"],
  body: '<path fill="#ff0000"/><path fill="currentColor"/>',
});
node = icons.IconAsset({ asset: multicolor, style: { opacity: 0.5 } });
check(
  node.props["data-icon-p3"] === "brand-icon",
  "marks wide-gamut icon assets",
);
check(
  node.props.style.opacity === 0.5,
  "merges caller styles after generated icon styles",
);
check(
  node.props.style["--icon-authored-ff0000"].includes(
    "--icon-p3-authored-ff0000",
  ),
  "emits multicolor CSS variables",
);
check(
  node.props.dangerouslySetInnerHTML.__html.includes(
    "@supports (color:color(display-p3 1 1 1))",
  ),
  "embeds wide-gamut fallback rules",
);
check(
  node.props.dangerouslySetInnerHTML.__html.includes(
    'fill="var(--icon-authored-ff0000, #ff0000)"',
  ),
  "rewrites authored colors to icon variables",
);

const logoOnly = icons.createIconPreset({
  name: "logo-only",
  canvas: { width: 10, height: 10, viewBox: "0 0 10 10" },
  paint: { kind: "monochrome" },
  capabilities: ["logo"],
  body: '<path fill="currentColor"/>',
});
assert.throws(
  () => icons.IconAsset({ asset: logoOnly }),
  /does not support the icon capability/,
);
assertions += 1;

assert.throws(
  () => icons.IconAsset({ asset: monochrome, idPrefix: "not valid" }),
  /icon idPrefix must be a non-empty SVG identifier prefix/,
);
assertions += 1;

check(
  icons.initializeIconAsset() === undefined,
  "keeps icon initialization idempotent",
);

console.log(`${assertions} app-shared IconAsset assertions passed`);
