import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenDatabasePageTest = {
  initialized: [],
  projectId: null,
  databaseEnabled: true,
  availability: {},
  overviewQuery: {},
  rowsQuery: {},
  refreshes: [],
  stateUpdates: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-database-page/index.ts")],
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
                  const state = globalThis.__appgenDatabasePageTest; const init = (name) => state.initialized.push(name);
                  export const I3 = () => { init("I3"); return state.jsx; }; export const e6 = () => { init("e6"); return { useState: (initial) => { const value = typeof initial === "function" ? initial() : initial; return [value, (update) => state.stateUpdates.push(update)]; } }; };
                  export const n4 = () => ({ formatMessage: (descriptor) => descriptor.defaultMessage }); export const HX = () => state.availability;
                  export const Y2 = "FormattedMessage"; export const Yh = "Button"; export const S_ = "AssetIcon"; export const mO = "RefreshAsset";
                  export const Zc = "Rows"; export const kf = "Menu"; export const jf = { Item: "MenuItem" }; export const bD = "CheckAsset"; export const bO = "BackAsset"; export const Qh = "Spinner";
                  export const m4 = (...values) => values.filter(Boolean).join(" ");
                  export const $3 = () => init("$3"); export const FX = () => init("FX"); export const xO = () => init("xO"); export const hO = () => init("hO");
                  export const xD = () => init("xD"); export const h4 = () => init("h4"); export const K2 = () => init("K2"); export const Zh = () => init("Zh");
                  export const If = () => init("If"); export const C_ = () => init("C_"); export const $h = () => init("$h"); export const Qc = () => init("Qc");
                `,
                "app-initial": `
                  const state = globalThis.__appgenDatabasePageTest; const init = (name) => state.initialized.push(name);
                  export const l_n = () => ({ projectId: state.projectId }); export const ofn = () => state.databaseEnabled; export const can = "availability";
                  export const Ygn = "Navigate"; export const cnn = (id) => "/sites/" + id + "/settings";
                  export const aa = { Header: "Header", Content: "Content" }; export const ban = () => state.overviewQuery;
                  export const xan = () => (binding) => state.refreshes.push(binding); export const San = (options) => { state.rowsOptions = options; return state.rowsQuery; };
                  export const gan = (rows) => rows.offset + rows.rows.length; export const ql = "SelectTrigger"; export const ru = "LoadingLabel";
                  export const Qgn = () => init("Qgn"); export const ifn = () => init("ifn"); export const oa = () => init("oa"); export const iu = () => init("iu");
                  export const Xl = () => init("Xl"); export const _an = () => init("_an"); export const lnn = () => init("lnn");
                `,
                "appgen-site-detail-layout": `export const n = () => globalThis.__appgenDatabasePageTest.initialized.push("layout"); export const t = "SiteDetailLayout";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const database = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function renderContent(pageNode) {
  const contentNode = pageNode.props.children();
  return contentNode.type(contentNode.props);
}
function overviewState(content) {
  return content.props.children[1].props.children.props.children;
}

check(
  state.initialized.length === 25,
  "initializes the complete database page dependency chain",
);
let node = database.AppgenDatabasePage();
check(
  node.type === "Navigate" && node.props.to === "/sites",
  "redirects without a project id",
);

state.projectId = "site-1";
state.availability = { data: null, isError: false };
check(
  database.AppgenDatabasePage() === null,
  "waits for database availability",
);
state.databaseEnabled = false;
node = database.AppgenDatabasePage();
check(
  node.type === "Navigate" && node.props.to.endsWith("/settings"),
  "redirects when database capability is disabled",
);
state.databaseEnabled = true;
state.availability = { data: { database: true }, isError: false };
node = database.AppgenDatabasePage();
check(
  node.type === "SiteDetailLayout" && node.props.selectedTab === "database",
  "renders the database detail tab",
);

state.overviewQuery = { isLoading: true };
state.rowsQuery = {};
let content = renderContent(node);
check(
  content.type === state.jsx.Fragment.constructor ||
    content.props.children.length === 2,
  "renders database page framing",
);
let stateNode = overviewState(content);
let stateView = stateNode.type(stateNode.props);
check(
  stateView.type instanceof Function &&
    stateView.type(stateView.props).props.children.type === "LoadingLabel",
  "renders database metadata loading state",
);

state.overviewQuery = { isError: true, isFetching: false };
content = renderContent(node);
stateNode = overviewState(content);
stateView = stateNode.type(stateNode.props);
check(
  stateView.props.children.props.children[0].props.children.props
    .defaultMessage === "Unable to load database",
  "renders metadata errors",
);
stateView.props.children.props.children[2].props.children[0].props.onClick();
check(state.refreshes.at(-1) === null, "retries the default binding");

state.overviewQuery = {
  data: { bindings: [], tables: [], selected_binding_name: null },
  isLoading: false,
};
content = renderContent(node);
stateNode = overviewState(content);
stateView = stateNode.type(stateNode.props);
check(
  stateView.props.children.props.children[0].props.children.props
    .defaultMessage === "No database connected",
  "renders the no-database empty state",
);

const overview = {
  bindings: ["main", "backup"],
  tables: ["users", "events"],
  selected_binding_name: "main",
};
const rows = {
  columns: ["id", "value"],
  rows: [
    { id: 1, value: null },
    { id: 2, value: { nested: true } },
  ],
  offset: 0,
  has_more: true,
};
state.overviewQuery = { data: overview, isLoading: false, isFetching: false };
state.rowsQuery = {
  data: rows,
  isLoading: false,
  isFetching: false,
  isPlaceholderData: false,
  refetch: () => state.refreshes.push("rows"),
};
content = renderContent(node);
const [header] = content.props.children;
check(
  header.type === "Header" &&
    header.props.title.props.defaultMessage === "Database",
  "renders the database header",
);
header.props.actions.props.onClick();
check(
  state.refreshes.at(-1) === null,
  "refreshes the selected overview binding",
);
stateNode = overviewState(content);
stateView = stateNode.type(stateNode.props);
const browserNode = stateView.props.children;
const browser = browserNode.type(browserNode.props);
const bindingPicker = browser.props.children[0].props.children[1];
check(
  bindingPicker.props.children[1].type === "Menu",
  "renders a binding picker for multiple databases",
);
const bindingItems = bindingPicker.props.children[1].props.children;
check(
  bindingItems[0].props.rightIconAsset === "CheckAsset",
  "marks the selected binding",
);
bindingItems[1].props.onSelect();
check(
  state.stateUpdates.length >= 3,
  "resets table and pagination when switching bindings",
);

const split = browser.props.children[1];
const tableButtons = split.props.children[0].props.children[1].props.children;
check(
  tableButtons[0].props["aria-pressed"] === true &&
    tableButtons[1].props["aria-pressed"] === false,
  "marks the selected table",
);
tableButtons[1].props.onClick();
check(
  state.stateUpdates.length >= 5,
  "resets pagination when switching tables",
);

const rowsNode = split.props.children[1].props.children;
const rowsView = rowsNode.type(rowsNode.props);
const rowsContent = rowsView.props.children[1];
const tableWrapper = rowsContent.props.children[0];
const table = tableWrapper.props.children;
check(
  table.props.children[0].props.children.props.children.length === 2,
  "renders all database columns",
);
const bodyRows = table.props.children[1].props.children;
check(
  bodyRows.length === 2 && bodyRows[0].key === 0,
  "keys and renders database rows by offset",
);
let cellNode = bodyRows[0].props.children[1].props.children;
let cell = cellNode.type(cellNode.props);
check(
  cell.type === "span" &&
    cell.props.children.props.defaultMessage === "No value",
  "formats null database cells",
);
cellNode = bodyRows[1].props.children[1].props.children;
cell = cellNode.type(cellNode.props);
check(
  cell.props.children === '{"nested":true}',
  "serializes structured database cells",
);

const paginationNode = rowsContent.props.children[1];
const pagination = paginationNode.type(paginationNode.props);
check(
  pagination.props.children[0].props.children.props.values.end === 2,
  "summarizes the visible row range",
);
const [previous, next] = pagination.props.children[1].props.children;
check(
  previous.props.disabled === true && next.props.disabled === false,
  "enables only valid page directions",
);
next.props.onClick();
check(
  typeof state.stateUpdates.at(-1) === "function",
  "queues the next page offset",
);

state.rowsQuery = {
  isError: true,
  isFetching: false,
  refetch: () => state.refreshes.push("rows"),
};
content = renderContent(node);
stateView = overviewState(content).type(overviewState(content).props);
const errorBrowser = stateView.props.children.type(
  stateView.props.children.props,
);
const errorRowsNode =
  errorBrowser.props.children[1].props.children[1].props.children;
const errorRows = errorRowsNode.type(errorRowsNode.props);
check(
  errorRows.props.children[1].type instanceof Function,
  "renders the row error container",
);
const centeredError = errorRows.props.children[1].type(
  errorRows.props.children[1].props,
);
centeredError.props.children.props.children[1].props.children[1].props.onClick();
check(state.refreshes.at(-1) === "rows", "retries failed row requests");

console.log(`${assertions} Appgen database-page assertions passed`);
