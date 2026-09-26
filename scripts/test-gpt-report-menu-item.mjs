import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__gptReportMenuItemTest = {
  accountId: "account-1",
  opened: [],
  preload: null,
  selected: 0,
  scope: { id: "scope" },
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/gpt-report-menu-item/index.ts")],
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
                  export const I3 = () => globalThis.__gptReportMenuItemTest.jsx;
                  export const LX = () => globalThis.__gptReportMenuItemTest.scope;
                  export const ZI = "scope-token";
                  export const HX = () => globalThis.__gptReportMenuItemTest.accountId;
                  export const jf = { Item: "MenuItem", ItemIcon: "MenuItemIcon" };
                  export const mb = "ReportIcon"; export const Y2 = "FormattedMessage";
                  export const Jm = (loader) => { globalThis.__gptReportMenuItemTest.lazyLoader = loader; return "LazyGptReportDialog"; };
                  export const V3 = async (loader, dependencies, url) => { globalThis.__gptReportMenuItemTest.preload = { dependencies, url }; return loader(); };
                  export const $3 = () => {}; export const FX = () => {}; export const K2 = () => {};
                  export const If = () => {}; export const lw = () => {}; export const qm = () => {};
                  export const QI = () => {}; export const H3 = () => {};
                `,
                "app-initial": `
                  export const mun = "active-account";
                  export const Uzt = (...args) => globalThis.__gptReportMenuItemTest.opened.push(args);
                  export const Sun = () => {}; export const Vzt = () => {};
                `,
                "gpt-report-dialog": `export const GptReportDialog = "GptReportDialog";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const menu = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function resource(overrides = {}) {
  return {
    gizmo: {
      id: "gizmo-1",
      tags: [],
      share_recipient: "marketplace",
      ...overrides,
    },
  };
}

let node = menu.t({
  resource: resource(),
  onSelect: () => state.selected++,
});
check(node.type === "MenuItem", "renders a menu item for an eligible GPT");
check(
  node.props.children[0].type === "MenuItemIcon",
  "renders the item icon slot",
);
check(
  node.props.children[0].props.children.type === "ReportIcon",
  "renders the report icon",
);
check(
  node.props.children[1].props.defaultMessage === "Report GPT",
  "renders the report action label",
);

node.props.onSelect();
check(state.selected === 1, "runs the parent selection callback first");
check(state.opened.length === 1, "opens the report dialog");
check(
  state.opened[0][0] === state.scope &&
    state.opened[0][1] === "LazyGptReportDialog",
  "opens the lazy dialog in the current scope",
);
check(
  state.opened[0][2].accountId === "account-1" &&
    state.opened[0][2].resource.gizmo.id === "gizmo-1",
  "passes account and GPT context to the dialog",
);

const lazyComponent = await state.lazyLoader();
check(
  lazyComponent === "GptReportDialog",
  "loads the GPT report dialog export",
);
check(
  state.preload.dependencies.includes("./report-dialog-75a130d615ed.js") &&
    state.preload.dependencies.includes("./app-initial-e8ceb32eb626.css"),
  "preloads the dialog dependency graph",
);

state.accountId = null;
check(
  menu.t({ resource: resource() }) === null,
  "hides the action when signed out",
);
state.accountId = "account-1";
check(
  menu.t({ resource: resource({ tags: ["first_party"] }) }) === null,
  "hides the action for first-party GPTs",
);
check(
  menu.t({ resource: resource({ share_recipient: "private" }) }) === null,
  "hides the action for privately shared GPTs",
);
check(
  menu.t({ resource: resource({ share_recipient: "link" }) })?.type ===
    "MenuItem",
  "allows link-shared GPTs",
);

console.log(`${assertions} GPT report menu item assertions passed`);
