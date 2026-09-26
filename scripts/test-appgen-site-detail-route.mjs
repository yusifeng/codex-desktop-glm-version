import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__siteDetailRouteTest = {
  pathname: "/sites/project-1",
  projectId: "project-1",
  prefetched: [],
  initialized: 0,
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/appgen-site-detail-route/index.ts"),
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
                "app-shared": `export const I3 = () => globalThis.__siteDetailRouteTest.jsx; export const $3 = () => globalThis.__siteDetailRouteTest.initialized++;`,
                "app-initial": `
                  export const i_n = () => ({ pathname: globalThis.__siteDetailRouteTest.pathname });
                  export const l_n = () => ({ projectId: globalThis.__siteDetailRouteTest.projectId });
                  export const $gn = (pattern, pathname) => pathname === pattern.replace(":projectId", globalThis.__siteDetailRouteTest.projectId) ? {} : null;
                  export const Ygn = "Navigate"; export const Xgn = "Outlet";
                  const route = (name) => ({ prefetch: () => globalThis.__siteDetailRouteTest.prefetched.push(name) });
                  export const WT = route("analytics"); export const KT = route("database"); export const GT = route("automations"); export const qT = route("settings");
                  export const Qgn = () => globalThis.__siteDetailRouteTest.initialized++;
                  export const JT = () => globalThis.__siteDetailRouteTest.initialized++;
                  export const lnn = () => globalThis.__siteDetailRouteTest.initialized++;
                `,
                "appgen-site-detail-layout": `export const n = () => globalThis.__siteDetailRouteTest.initialized++; export const t = "SiteDetailLayout";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const route = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
check(state.initialized === 5, "initializes route dependencies");
let node = route.AppgenSiteDetailRoute();
check(node.type === "SiteDetailLayout", "renders the detail layout");
check(
  node.props.projectId === "project-1" &&
    node.props.selectedTab === "analytics",
  "defaults the root detail route to analytics",
);
const outlet = node.props.children();
check(outlet.type === "Outlet", "renders nested route content");

for (const tab of ["settings", "automations", "database"]) {
  state.pathname = `/sites/project-1/${tab}`;
  node = route.AppgenSiteDetailRoute();
  check(
    node.props.selectedTab === tab,
    `selects the ${tab} tab from the pathname`,
  );
}

for (const tab of ["analytics", "database", "automations", "settings"]) {
  node.props.prefetchTab(tab);
}
check(
  state.prefetched.join(",") === "analytics,database,automations,settings",
  "prefetches every detail tab through its route object",
);

state.projectId = null;
state.pathname = "/sites";
node = route.AppgenSiteDetailRoute();
check(node.type === "Navigate", "redirects when the project id is missing");
check(
  node.props.replace === true && node.props.to === "/sites",
  "replaces history with the Sites route",
);

console.log(`${assertions} Appgen site-detail route assertions passed`);
