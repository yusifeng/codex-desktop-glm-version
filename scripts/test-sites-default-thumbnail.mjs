import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__sitesDefaultThumbnailTest = {
  initialized: [],
  analyticsEnabled: true,
  edits: [],
  navigations: [],
  telemetry: [],
  shares: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/sites-default-thumbnail/index.ts"),
  ],
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
                  const state = globalThis.__sitesDefaultThumbnailTest; const init = (name) => state.initialized.push(name);
                  export const I3 = () => { init("I3"); return state.jsx; }; export const e6 = () => { init("e6"); return {}; };
                  export const LX = () => state.scope; export const ZI = "scope";
                  export const n4 = () => ({ formatMessage: (descriptor, values) => values ? descriptor.defaultMessage.replace("{siteTitle}", values.siteTitle) : descriptor.defaultMessage });
                  export const Hk = { CODEX_APPGEN_INTERACTION_SOURCE_SITES: "sites-source", CODEX_APPGEN_INTERACTION_SOURCE_LIBRARY: "library-source" };
                  export const Bk = { CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED: "edit-clicked", CODEX_APPGEN_INTERACTION_ACTION_SETTINGS_OPENED: "settings-opened", CODEX_APPGEN_INTERACTION_ACTION_ANALYTICS_OPENED: "analytics-opened" };
                  export const DF = { CODEX_SITES_SHARING_SOURCE_LIBRARY: "share-library", CODEX_SITES_SHARING_SOURCE_SITES: "share-sites" };
                  export const o_ = "Tooltip"; export const Yh = "Button"; export const S_ = "AssetIcon"; export const Y2 = "FormattedMessage";
                  export const gu = "MenuTrigger"; export const kf = "Menu"; export const jf = { Item: "MenuItem" };
                  export const Bs = "PublishAsset"; export const fO = "ShareAsset"; export const gO = "AnalyticsAsset"; export const bE = "SettingsAsset"; export const jT = "EditAsset";
                  export const $3 = () => init("$3"); export const fI = () => init("fI"); export const _O = () => init("_O"); export const Vs = () => init("Vs");
                  export const pO = () => init("pO"); export const xE = () => init("xE"); export const AT = () => init("AT"); export const FX = () => init("FX");
                  export const K2 = () => init("K2"); export const lk = () => init("lk"); export const Zh = () => init("Zh"); export const If = () => init("If");
                  export const C_ = () => init("C_"); export const _u = () => init("_u"); export const c_ = () => init("c_"); export const QI = () => init("QI");
                `,
                "app-initial": `
                  const state = globalThis.__sitesDefaultThumbnailTest;
                  export const o_n = () => (url) => state.navigations.push(url); export const ofn = () => state.analyticsEnabled;
                  export const Pan = (scope, event) => state.telemetry.push({ scope, event }); export const cnn = (id) => "/sites/" + id + "/settings"; export const inn = (id) => "/sites/" + id + "/analytics";
                  export const ifn = () => state.initialized.push("ifn"); export const Nan = () => state.initialized.push("Nan"); export const lnn = () => state.initialized.push("lnn");
                `,
                "appgen-disabled-tooltip": `export const n = () => globalThis.__sitesDefaultThumbnailTest.initialized.push("disabled"); export const t = "DisabledReason";`,
                "appgen-card-layout": `export const a = () => globalThis.__sitesDefaultThumbnailTest.initialized.push("layout"); export const i = "ActionsRail";`,
                "open-appgen-share-dialog": `export const t = () => globalThis.__sitesDefaultThumbnailTest.initialized.push("share-init"); export const n = (...args) => globalThis.__sitesDefaultThumbnailTest.shares.push(args);`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const thumbnail = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function render(overrides = {}) {
  return thumbnail.a({
    projectId: "site-1",
    projectTitle: "My Site",
    surface: "sites",
    viewMode: "grid",
    onEdit: (mode) => state.edits.push(mode),
    ...overrides,
  });
}

state.scope = { id: "scope" };
thumbnail.o();
check(
  state.initialized.length === 23,
  "initializes the complete Site actions dependency chain",
);

let actions = render();
check(actions.type === "Fragment", "renders grid actions without a wrapper");
let [primary, menu, direct] = actions.props.children;
check(
  primary.type === "Tooltip" && primary.props.children.props.color === "ghost",
  "uses share as the published primary action",
);
primary.props.children.props.onClick();
check(
  state.shares.at(-1)[1] === "site-1" &&
    state.shares.at(-1)[2].source === "share-sites",
  "opens Site sharing with the Sites source",
);
check(
  menu.type === "Menu" && direct === null,
  "moves secondary actions into the menu when analytics is enabled",
);
const menuItems = menu.props.children;
check(
  menuItems[2].props.children.props.defaultMessage === "Edit",
  "includes the edit menu item",
);
menuItems[2].props.onSelect();
check(
  state.edits.at(-1) === "edit" &&
    state.telemetry.at(-1).event.action === "edit-clicked",
  "tracks and starts Site editing",
);
menuItems[3].props.onSelect();
check(
  state.navigations.at(-1).endsWith("/analytics") &&
    state.telemetry.at(-1).event.action === "analytics-opened",
  "opens and tracks Site analytics",
);
menuItems[4].props.onSelect();
check(
  state.navigations.at(-1).endsWith("/settings") &&
    state.telemetry.at(-1).event.action === "settings-opened",
  "opens and tracks Site settings",
);

actions = render({ unpublished: true });
primary = actions.props.children[0];
check(
  primary.props.children.props.color === "primary" &&
    primary.props.children.props.children[0].props.defaultMessage === "Publish",
  "uses a primary publish action for unpublished Sites",
);
primary.props.children.props.onClick();
check(state.edits.at(-1) === "publish", "starts the publish conversation flow");

state.analyticsEnabled = false;
actions = render();
[primary, menu, direct] = actions.props.children;
check(
  menu === null && direct.type === "Fragment",
  "shows direct edit and settings actions without overflow needs",
);
check(
  direct.props.children[0].props.children.props.children.props.asset ===
    "EditAsset",
  "orders edit before settings on Sites",
);
actions = render({ surface: "library" });
direct = actions.props.children[2];
check(
  direct.props.children[0].props.children.props.children.props.asset ===
    "SettingsAsset",
  "orders settings before edit in the Library",
);

actions = render({ canManage: false, unpublished: true, viewMode: "list" });
check(
  actions.type === "ActionsRail",
  "wraps list actions in the shared action rail",
);
const nonOwnerActions = actions.props.children.props.children;
check(
  nonOwnerActions[0].type === "Tooltip" &&
    nonOwnerActions[0].props.tooltipContent.includes("Only the owner"),
  "explains owner-only first publication",
);
check(
  nonOwnerActions[1].type === "Tooltip" && nonOwnerActions[2].type === "Menu",
  "keeps edit and compact overflow controls for non-owners",
);
check(
  nonOwnerActions[2].props.children[0].props.disabled === true,
  "disables the publish menu item for non-owners",
);

actions = render({ disabled: true, disabledBy: "openai" });
primary = actions.props.children[0];
check(
  primary.props.interactive === true &&
    primary.props.children.props.disabled === true,
  "uses interactive disabled tooltips for OpenAI-disabled Sites",
);
check(
  primary.props.tooltipContent.type === "DisabledReason",
  "renders the shared disabled reason",
);

actions = render({ surface: "library" });
primary = actions.props.children[0];
primary.props.children.props.onClick();
check(
  state.shares.at(-1)[2].source === "share-library",
  "reports the Library sharing source",
);

const beforeSvgInit = state.initialized.length;
thumbnail.i();
thumbnail.n();
check(
  state.initialized.length === beforeSvgInit + 4,
  "initializes both platform thumbnail renderers",
);
let svg = thumbnail.r({ width: 160, className: "windows" });
check(
  svg.type === "svg" && svg.props.width === 160 && svg.props.height === 50,
  "allows Windows thumbnail SVG props to override defaults",
);
check(
  svg.props.children.length === 9 &&
    svg.props.children.at(-1).props.d.includes("74.1464"),
  "renders Windows chrome controls and Site glyph",
);
svg = thumbnail.t({ className: "mac" });
check(
  svg.props.children.length === 8,
  "renders macOS traffic lights and Site glyph",
);
check(
  svg.props.children[1].props.fill === "#FF5F57" &&
    svg.props.children[3].props.fill === "#28C840",
  "uses the macOS traffic-light colors",
);

console.log(`${assertions} sites-default-thumbnail assertions passed`);
