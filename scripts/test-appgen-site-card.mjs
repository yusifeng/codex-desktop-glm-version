import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenSiteCardTest = {
  initialized: [],
  opened: 0,
  formatted: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-site-card/index.ts")],
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
              {
                "app-shared": `
                  export const I3 = () => globalThis.__appgenSiteCardTest.jsx;
                  export const n4 = () => ({ formatMessage: (descriptor) => { globalThis.__appgenSiteCardTest.formatted.push(descriptor); return descriptor.defaultMessage; } });
                  export const Y2 = "FormattedMessage"; export const o_ = "Tooltip"; export const Xh = "LinkButton";
                  export const S_ = "AssetIcon"; export const bE = "GearAsset";
                  export const $3 = () => globalThis.__appgenSiteCardTest.initialized.push("$3");
                  export const xE = () => globalThis.__appgenSiteCardTest.initialized.push("xE");
                  export const K2 = () => globalThis.__appgenSiteCardTest.initialized.push("K2");
                  export const Zh = () => globalThis.__appgenSiteCardTest.initialized.push("Zh");
                  export const C_ = () => globalThis.__appgenSiteCardTest.initialized.push("C_");
                  export const c_ = () => globalThis.__appgenSiteCardTest.initialized.push("c_");
                `,
                "app-initial": `export const i3t = "SiteIcon"; export const a3t = () => globalThis.__appgenSiteCardTest.initialized.push("a3t");`,
                "app-primary": `
                  export const xf = (url) => url == null ? null : new URL(url).host;
                  export const Sf = () => globalThis.__appgenSiteCardTest.initialized.push("Sf");
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const card = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
card.n();
check(state.initialized.length === 8, "initializes all card dependencies");
let node = card.t({
  liveUrl: "https://example.com/path",
  title: "Launch Site",
  settingsHref: "/sites/project-1/settings",
  onOpenSettings: () => state.opened++,
});
check(
  node.type === "div" && node.props.children.length === 3,
  "renders the three-part site card",
);
const [icon, details, settings] = node.props.children;
check(icon.props.children.type === "SiteIcon", "renders the Site icon");
check(
  details.props.children[0].props.children === "Launch Site",
  "renders the Site title",
);
check(
  details.props.children[1].props.children === "example.com",
  "formats the published URL",
);
check(settings.type === "Tooltip", "wraps settings in a tooltip");
const settingsButton = settings.props.children;
check(
  settingsButton.type === "LinkButton" &&
    settingsButton.props.href === "/sites/project-1/settings",
  "links to Site settings",
);
check(
  settingsButton.props["aria-label"] === "Open site settings" &&
    settings.props.tooltipContent === "Open site settings",
  "uses one accessible settings label",
);
check(
  settingsButton.props.rel === "noopener noreferrer" &&
    settingsButton.props.target === undefined,
  "preserves safe same-window navigation semantics",
);
check(
  settingsButton.props.children.props.asset === "GearAsset",
  "renders the settings gear asset",
);
settingsButton.props.onClick();
check(state.opened === 1, "runs the settings callback");

node = card.t({ liveUrl: null, title: "Draft Site", settingsHref: null });
check(
  node.props.children[1].props.children[1].props.children.props
    .defaultMessage === "Not published yet",
  "renders the unpublished fallback",
);
check(node.props.children[2] === null, "omits settings without a destination");

console.log(`${assertions} Appgen site card assertions passed`);
