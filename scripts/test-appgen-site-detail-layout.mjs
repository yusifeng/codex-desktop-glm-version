import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenSiteDetailLayoutTest = {
  initialized: [],
  siteQuery: {},
  databaseQuery: { data: { database: true } },
  automationAvailabilityLoading: false,
  flags: { 282477705: true, 262557526: true, 1912312436: true },
  flagLoading: false,
  canManage: true,
  mounted: true,
  screenshot: null,
  navigations: [],
  telemetry: [],
  conversations: [],
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-site-detail-layout/index.ts"),
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
                  const state = globalThis.__appgenSiteDetailLayoutTest;
                  const init = (name) => state.initialized.push(name);
                  export const e6 = () => { init("e6"); return {
                    createContext: (value) => ({ value, Provider: "SiteProvider" }), useContext: (context) => context.value,
                    useRef: (value) => ({ current: value }), useEffectEvent: (fn) => fn, useEffect: (fn) => fn(),
                  }; };
                  export const I3 = () => { init("I3"); return state.jsx; };
                  export const LX = () => state.scope; export const ZI = "scopeAtom";
                  export const n4 = () => ({ formatMessage: (descriptor, values) => values?.siteMention ? descriptor.defaultMessage.replace("{siteMention}", values.siteMention) : descriptor.defaultMessage });
                  const ifFn = () => () => state.mounted; export { ifFn as if };
                  export const HX = (query) => query === "automationAvailability" ? state.automationAvailabilityLoading : state.databaseQuery;
                  export const BX = () => state.siteQuery;
                  export const Vk = { CODEX_APPGEN_INTERACTION_PAGE_ANALYTICS: "analytics-page", CODEX_APPGEN_INTERACTION_PAGE_DATABASE: "database-page", CODEX_APPGEN_INTERACTION_PAGE_SETTINGS: "settings-page" };
                  export const Bk = { CODEX_APPGEN_INTERACTION_ACTION_PAGE_VIEWED: "page-viewed", CODEX_APPGEN_INTERACTION_ACTION_EDIT_WITH_CHAT_CLICKED: "edit-clicked" };
                  export const Hk = { CODEX_APPGEN_INTERACTION_SOURCE_SITE_DETAILS: "site-details" };
                  export const Y2 = "FormattedMessage"; export const Qh = "Loading"; export const Yh = "Button";
                  export const S_ = "AssetIcon"; export const jT = "EditAsset"; export const o_ = "Tooltip";
                  export const $3 = () => init("$3"); export const AT = () => init("AT"); export const FX = () => init("FX");
                  export const K2 = () => init("K2"); export const Zh = () => init("Zh"); export const C_ = () => init("C_");
                  export const $h = () => init("$h"); export const c_ = () => init("c_"); export const QI = () => init("QI"); export const rf = () => init("rf");
                `,
                "app-initial": `
                  const state = globalThis.__appgenSiteDetailLayoutTest; const init = (name) => state.initialized.push(name);
                  export const o_n = () => (url) => state.navigations.push(url); export const h2 = () => "startConversation";
                  export const ofn = (key) => state.flags[key]; export const sfn = () => state.flagLoading;
                  export const vfn = "automationAvailability"; export const can = "databaseAvailability"; export const aan = "siteQuery";
                  export const wan = () => ({ data: state.screenshot }); export const enn = "/sites-default"; export const Ygn = "Navigate";
                  export const cnn = (id) => "/sites/" + id + "/settings"; export const ann = (id) => "/sites/" + id + "/automations";
                  export const inn = (id) => "/sites/" + id + "/analytics"; export const onn = (id) => "/sites/" + id + "/database";
                  export const Pan = (scope, event) => state.telemetry.push({ scope, event });
                  export const m7 = "HeaderBoundary"; export const B9 = "Header"; export const i3t = "SiteIcon"; export const ket = "ErrorState";
                  export const Qgn = () => init("Qgn"); export const h7 = () => init("h7"); export const V9 = () => init("V9");
                  export const Aet = () => init("Aet"); export const d2 = () => init("d2"); export const a3t = () => init("a3t");
                  export const ifn = () => init("ifn"); export const pfn = () => init("pfn"); export const Nan = () => init("Nan");
                  export const _an = () => init("_an"); export const lnn = () => init("lnn");
                `,
                "app-primary": `export const xf = (url) => url == null ? null : new URL(url).host; export const Sf = () => globalThis.__appgenSiteDetailLayoutTest.initialized.push("Sf");`,
                "security-tabs": `export const n = () => globalThis.__appgenSiteDetailLayoutTest.initialized.push("tabs"); export const t = "Tabs";`,
                "toolbar-breadcrumb": `export const n = () => globalThis.__appgenSiteDetailLayoutTest.initialized.push("breadcrumb"); export const t = "Breadcrumb";`,
                "appgen-access": `export const s = () => globalThis.__appgenSiteDetailLayoutTest.initialized.push("access"); export const t = () => globalThis.__appgenSiteDetailLayoutTest.canManage;`,
                "appgen-disabled-tooltip": `export const n = () => globalThis.__appgenSiteDetailLayoutTest.initialized.push("disabled"); export const t = "DisabledTooltip";`,
                "start-appgen-conversation": `export const t = () => globalThis.__appgenSiteDetailLayoutTest.initialized.push("start"); export const n = (...args) => globalThis.__appgenSiteDetailLayoutTest.conversations.push(args);`,
              }[importPath] ?? "export {};",
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
function render(props = {}) {
  const outer = layout.t({
    projectId: "site-1",
    selectedTab: "settings",
    children: (site) => ({ type: "Child", props: { site } }),
    ...props,
  });
  return outer.type(outer.props);
}
function mainContent(root) {
  return root.props.children[2].props.children.props.children;
}
function successParts(root) {
  return mainContent(root).props.children;
}
function renderHeader(root) {
  const headerNode = root.props.children[1].props.children.props.children;
  return headerNode.type(headerNode.props);
}

state.scope = { id: "scope" };
layout.n();
check(
  state.initialized.length === 29,
  "initializes the complete layout dependency chain",
);

const site = {
  id: "site-1",
  title: "My Site",
  slug: "my-site",
  current_live_url: "https://example.com/path",
  screenshot_url: "shot.png",
  status: "active",
  latest_edit_context: { turnId: "turn-1" },
};
state.siteQuery = { data: site };
let root = render();
check(
  root.type === "div" && root.props.children.length === 3,
  "renders the full detail layout",
);
let [summary, tabNavigation, panel] = successParts(root);
check(
  panel.props.id === "appgen-site-detail-settings" &&
    panel.props.role === "tabpanel",
  "labels the selected settings panel",
);
check(
  panel.props.children.type === "SiteProvider" &&
    panel.props.children.props.value === site,
  "provides the loaded Site to nested pages",
);
check(summary.type instanceof Function, "renders the Site summary component");
let summaryView = summary.type(summary.props);
check(
  summaryView.props.children[0].props.children[1].props.children ===
    "example.com/path",
  "formats the live Site host and path",
);
check(
  summaryView.props.children[1].props.children[0].type === "SiteIcon",
  "falls back to the Site icon without a screenshot",
);

state.screenshot = "blob:screenshot";
root = render();
summaryView = successParts(root)[0].type(successParts(root)[0].props);
check(
  summaryView.props.children[1].props.children[0].props.src ===
    "blob:screenshot",
  "renders the resolved screenshot",
);

const tabProps = tabNavigation.props.children.props;
check(
  tabProps.tabs.map((tab) => tab.key).join(",") ===
    "settings,analytics,database,automations",
  "shows all available Site tabs",
);
tabProps.onSelect("database");
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  state.navigations.at(-1) === "/sites/site-1/database",
  "navigates to the selected Site tab",
);

const prefetched = [];
root = render({
  prefetchTab: async (tab) => {
    prefetched.push(tab);
    throw new Error("ignored prefetch failure");
  },
});
successParts(root)[1].props.children.props.onSelect("analytics");
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  prefetched[0] === "analytics" &&
    state.navigations.at(-1).endsWith("/analytics"),
  "navigates even when tab prefetch fails",
);

let header = renderHeader(root);
const breadcrumbs = header.props.children[0];
check(
  breadcrumbs.props.current === "My Site",
  "renders the current Site breadcrumb",
);
breadcrumbs.props.ancestors[0].onClick();
check(state.navigations.at(-1) === "/sites", "returns to the Sites index");
let editNode = header.props.children[1];
let editButton = editNode.type(editNode.props);
editButton.props.onClick();
check(
  state.telemetry.at(-1).event.action === "edit-clicked",
  "tracks edit-with-chat interaction",
);
check(
  state.conversations.at(-1)[2].type === "edit" &&
    state.conversations.at(-1)[2].liveUrl === "https://example.com/path",
  "starts Site editing with the live URL",
);

state.siteQuery = { isLoading: true };
root = render();
let statusNode = mainContent(root);
check(
  statusNode.type instanceof Function &&
    statusNode.type(statusNode.props).props.children.type === "Loading",
  "renders the Site loading state",
);

state.siteQuery = { isError: true };
root = render();
statusNode = mainContent(root);
check(
  statusNode.type(statusNode.props).type === "ErrorState",
  "renders the Site load error state",
);

state.siteQuery = { data: site };
state.canManage = false;
root = render();
check(
  root.type === "Navigate" && root.props.to === "/sites-default",
  "redirects inaccessible settings",
);

state.flagLoading = true;
root = render({ selectedTab: "automations" });
check(root.type === "Loading", "waits for the automations feature flag");
state.flagLoading = false;
state.flags["282477705"] = false;
root = render({ selectedTab: "automations" });
check(
  root.type === "Navigate" && root.props.to.endsWith("/settings"),
  "redirects unavailable automations to settings",
);

state.flags["282477705"] = true;
state.canManage = true;
state.siteQuery = {
  data: { ...site, status: "suspended", disabled_by: "openai" },
};
root = render();
header = renderHeader(root);
editNode = header.props.children[1];
editButton = editNode.type(editNode.props);
check(
  editButton.type === "Tooltip" && editButton.props.interactive === true,
  "wraps suspended OpenAI-disabled Sites in an interactive tooltip",
);
check(
  editButton.props.children.props.disabled === true,
  "disables editing for suspended Sites",
);

state.siteQuery = { data: site };
state.telemetry.length = 0;
render({ selectedTab: "automations" });
check(
  state.telemetry.length === 0,
  "does not double-track the automations page",
);
render({ selectedTab: "analytics" });
check(
  state.telemetry.at(-1).event.page === "analytics-page",
  "tracks eligible Site detail page views",
);

console.log(`${assertions} Appgen site-detail layout assertions passed`);
