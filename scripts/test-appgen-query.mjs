import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__appgenQueryTest = { initialized: 0 };
const aliasMap = {
  APPGEN_ACCESS_GROUPS_QUERY_KEY: "Bin",
  APPGEN_CUSTOM_DOMAINS_QUERY_KEY: "Vin",
  APPGEN_DATABASE_OVERVIEW_QUERY_KEY: "Hin",
  APPGEN_DATABASE_TABLE_ROWS_QUERY_KEY: "Uin",
  APPGEN_EDITABLE_PROJECTS_QUERY_KEY: "Win",
  APPGEN_ENVIRONMENT_QUERY_KEY: "Gin",
  APPGEN_PENDING_SLUG_CHANGE_QUERY_KEY: "Kin",
  APPGEN_PROJECTS_QUERY_KEY: "qin",
  APPGEN_PROJECT_QUERY_KEY: "Jin",
  APPGEN_SCREENSHOT_QUERY_KEY: "Yin",
  APPGEN_SLUG_AVAILABILITY_QUERY_KEY: "Xin",
  APPGEN_TOOL_AVAILABILITY_QUERY_KEY: "Zin",
  appgenAccessGroupsQuery$: "Qin",
  appgenAddCustomDomainMutation$: "$in",
  appgenChangeSlugMutation$: "ean",
  appgenCustomDomainsQuery$: "tan",
  appgenDeleteProjectMutation$: "nan",
  appgenEnvironmentQuery$: "ran",
  appgenLatestEditContextSchema: "ian",
  appgenProjectQuery$: "aan",
  appgenRefreshCustomDomainMutation$: "oan",
  appgenRemoveCustomDomainMutation$: "san",
  appgenToolAvailabilityQuery$: "can",
  appgenUpdateAccessMutation$: "lan",
  appgenUpdateEnvironmentMutation$: "uan",
  appgenUpdateProjectTitleMutation$: "dan",
  callSitesTool: "fan",
  checkAppgenSlugAvailability: "pan",
  discardQueuedAppgenAccessUpdate: "man",
  fetchAppgenProject: "han",
  getNextAppgenDatabaseTableRowsOffset: "gan",
  invalidateAppgenProjectQueries: "van",
  isIncrementalAppgenUserAccessUpdate: "yan",
  useAppgenDatabaseOverview: "ban",
  useAppgenDatabaseRefresh: "xan",
  useAppgenDatabaseTableRows: "San",
  useAppgenProjects: "Can",
  useAppgenScreenshotSrc: "wan",
};
const appInitialExports = [...new Set(Object.values(aliasMap))]
  .map((alias) =>
    alias === "$in"
      ? `export const $in = "$in";`
      : `export const ${alias} = "${alias}";`,
  )
  .join("\n");

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-query/index.ts")],
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
              importPath === "app-initial"
                ? `${appInitialExports}\nexport const _an = () => globalThis.__appgenQueryTest.initialized++;`
                : "export const sideEffect = true;",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const query = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.equal(globalThis.__appgenQueryTest.initialized, 1);
let assertions = 1;
for (const [semanticName, compressedAlias] of Object.entries(aliasMap)) {
  assert.equal(query[semanticName], compressedAlias, semanticName);
  assertions += 1;
}
assert.deepEqual(Object.keys(query).sort(), Object.keys(aliasMap).sort());
assertions += 1;
console.log(`${assertions} Appgen query facade assertions passed`);
