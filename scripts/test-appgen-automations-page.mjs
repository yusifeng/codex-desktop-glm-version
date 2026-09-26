import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__appgenAutomationsPageTest = {
  projectId: null,
  isCapable: true,
  attachments: {},
  cloud: {},
  navigations: [],
  panelRequests: [],
  initialized: [],
  scope: { id: "scope" },
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-automations-page/index.ts"),
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
                  const state = globalThis.__appgenAutomationsPageTest;
                  export const I3 = () => state.jsx;
                  export const LX = () => state.scope;
                  export const BX = (query) => query === "capability-query" ? { isCapable: state.isCapable } : state.attachments;
                  export const HX = () => state.cloud;
                  export const Qh = "Loading"; export const Y2 = "FormattedMessage"; export const Yh = "Button";
                  export const Zc = "Rows"; export const rl = "Row"; export const wy = "FallbackIcon";
                  export const $3 = () => state.initialized.push("$3"); export const FX = () => state.initialized.push("FX");
                  export const K2 = () => state.initialized.push("K2"); export const Zh = () => state.initialized.push("Zh");
                  export const lw = () => state.initialized.push("lw"); export const $h = () => state.initialized.push("$h");
                  export const al = () => state.initialized.push("al"); export const Qc = () => state.initialized.push("Qc");
                `,
                "app-initial": `
                  const state = globalThis.__appgenAutomationsPageTest;
                  export const $en = "scope-atom"; export const Xet = "capability-query"; export const itt = "cloud-query";
                  export const l_n = () => ({ projectId: state.projectId }); export const Ygn = "Navigate";
                  export const o_n = () => (url) => state.navigations.push(url); export const VT = () => "/scheduled";
                  export const n7 = "ErrorState"; export const nnt = { recurring: { id: "recurring" }, once: { id: "once" } };
                  export const wtt = (automation) => automation.kind; export const aa = { Header: "Header" }; export const au = "PageBody";
                  export const Qgn = () => state.initialized.push("Qgn"); export const Zet = () => state.initialized.push("Zet");
                  export const rnt = () => state.initialized.push("rnt"); export const Dtt = () => state.initialized.push("Dtt");
                  export const stt = () => state.initialized.push("stt"); export const r7 = () => state.initialized.push("r7");
                  export const itn = () => state.initialized.push("itn"); export const su = () => state.initialized.push("su");
                  export const oa = () => state.initialized.push("oa");
                `,
                "appgen-site-detail-layout": `export const n = () => globalThis.__appgenAutomationsPageTest.initialized.push("layout"); export const t = "SiteDetailLayout";`,
                "open-automation-side-panel-tab": `export const t = () => globalThis.__appgenAutomationsPageTest.initialized.push("panel"); export const i = (request) => globalThis.__appgenAutomationsPageTest.panelRequests.push(request);`,
                "appgen-automations-state": `export const r = () => globalThis.__appgenAutomationsPageTest.initialized.push("state"); export const t = "attachments-query";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const page = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function renderContent(site) {
  state.projectId = site.id;
  const route = page.AppgenAutomationsPage();
  return route.props.children(site).type(route.props.children(site).props);
}

check(state.initialized.length === 20, "initializes all page dependencies");
let node = page.AppgenAutomationsPage();
check(
  node.type === "Navigate" && node.props.replace && node.props.to === "/sites",
  "redirects when no project is selected",
);

state.projectId = "site-1";
node = page.AppgenAutomationsPage();
check(
  node.type === "SiteDetailLayout" &&
    node.props.projectId === "site-1" &&
    node.props.selectedTab === "automations",
  "renders the automations detail tab",
);

const site = { id: "site-1", title: "My Site", status: "active" };
state.attachments = { isLoading: true };
state.cloud = { data: { isAvailable: true, items: [] } };
node = renderContent(site);
check(
  node.props.children.props.children[1].type === "Loading",
  "shows loading state",
);

let retriedAttachments = 0;
let retriedCloud = 0;
state.attachments = {
  isError: true,
  refetch: () => retriedAttachments++,
};
state.cloud = {
  data: { isAvailable: true, items: [] },
  refetch: () => retriedCloud++,
};
node = renderContent(site);
let content = node.props.children.props.children[1];
check(
  content.type === "ErrorState" &&
    content.props.content.props.defaultMessage ===
      "Couldn’t load schedules. Try again.",
  "shows the schedule loading error",
);
content.props.onPrimaryCtaClick();
check(
  retriedAttachments === 1 && retriedCloud === 1,
  "retries both schedule queries",
);

state.attachments = { data: [{ automation_ids: [] }] };
state.cloud = { data: { isAvailable: false, items: [] } };
node = renderContent(site);
check(
  node.props.children.props.children[1].type === "ErrorState",
  "treats unavailable cloud schedules as an error",
);

state.cloud = { data: { isAvailable: true, items: [] } };
node = renderContent(site);
content = node.props.children.props.children[1];
check(
  content.type === "Rows" &&
    content.props.children.type === "Row" &&
    content.props.children.props.label.props.defaultMessage ===
      "No schedules yet",
  "renders the empty state",
);

state.attachments = { data: [{ automation_ids: ["keep / 1"] }] };
state.cloud = {
  data: {
    isAvailable: true,
    items: [
      {
        automation: {
          id: "keep / 1",
          title: "Keep me",
          kind: "recurring",
          display_emoji: "⏰",
        },
      },
      { automation: { id: "drop", title: "Drop me", kind: "once" } },
    ],
  },
};
node = renderContent(site);
const [header, rows] = node.props.children.props.children;
const row = rows.props.children[0];
check(
  rows.props.children.length === 1 && row.props.label === "Keep me",
  "filters schedules using attachment IDs",
);
check(
  row.props.icon === "⏰" && row.props.description.props.id === "recurring",
  "renders schedule metadata",
);
row.props.control.props.onClick();
check(
  state.navigations.at(-1) ===
    "/scheduled?automationId=keep%20%2F%201&automationSource=cloud",
  "opens the encoded cloud schedule route",
);
check(
  header.type === "Header" &&
    header.props.title.props.defaultMessage === "Automations",
  "renders the Site automations header",
);
header.props.actions.props.onClick();
check(
  state.panelRequests.at(-1).scope === state.scope &&
    state.panelRequests.at(-1).projectId === "site-1" &&
    state.panelRequests.at(-1).title === "My Site" &&
    state.panelRequests.at(-1).prompt === "",
  "opens a seeded Site schedule panel",
);
check(
  header.props.actions.props.disabled === false,
  "enables creation for active capable Sites",
);

state.isCapable = false;
node = renderContent(site);
check(
  node.props.children.props.children[0].props.actions.props.disabled === true,
  "disables creation without cloud automation capability",
);
state.isCapable = true;
node = renderContent({ ...site, status: "suspended" });
check(
  node.props.children.props.children[0].props.actions.props.disabled === true,
  "disables creation for inactive Sites",
);

state.attachments = { data: [{ automation_ids: ["fallback"] }] };
state.cloud = {
  data: {
    isAvailable: true,
    items: [
      { automation: { id: "fallback", title: "Fallback", kind: "once" } },
    ],
  },
};
node = renderContent(site);
check(
  node.props.children.props.children[1].props.children[0].props.icon.type ===
    "FallbackIcon",
  "uses the fallback automation icon",
);

console.log(`${assertions} Appgen automations-page assertions passed`);
