import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__startAppgenConversationTest = {
  initialized: [],
  formatted: [],
  pluginPrompts: [],
  navigations: [],
});
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/start-appgen-conversation/index.ts"),
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
                "app-shared": `export const wL = () => globalThis.__startAppgenConversationTest.initialized.push("wL");`,
                "app-initial": `
                  const state = globalThis.__startAppgenConversationTest;
                  export const mpn = "intl"; export const mun = "account"; export const _un = "user"; export const jan = "sites-plugin";
                  export const snn = (id) => "conversation:" + id; export const HWt = ({ projectId, title }) => "@site[" + title + ":" + projectId + "]";
                  export const _pn = (scope, route, options) => state.navigations.push({ scope, route, options });
                  export const gpn = () => state.initialized.push("gpn"); export const Sun = () => state.initialized.push("Sun");
                  export const GWt = () => state.initialized.push("GWt"); export const Dft = () => state.initialized.push("Dft");
                  export const ppn = () => state.initialized.push("ppn"); export const Man = () => state.initialized.push("Man");
                  export const lnn = () => state.initialized.push("lnn");
                `,
                "app-primary": `
                  const state = globalThis.__startAppgenConversationTest;
                  export const Bh = {
                    document: { artifact: { label: "Document", pluginId: "document-plugin" } },
                    spreadsheet: { artifact: { label: "Spreadsheet", pluginId: "spreadsheet-plugin" } },
                    presentation: { artifact: { label: "Presentation", pluginId: "presentation-plugin" } },
                  };
                  export const Rf = (options) => { state.pluginPrompts.push(options); return "prompt:" + options.pluginDisplayName + ":" + (options.defaultPrompt ?? "none"); };
                  export const Hh = () => state.initialized.push("Hh"); export const Bf = () => state.initialized.push("Bf");
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const conversation = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
const intl = {
  formatMessage(descriptor, values) {
    state.formatted.push({ descriptor, values });
    return values?.siteMention
      ? `${values.siteMention} publish this site`
      : descriptor.defaultMessage;
  },
};
const values = { intl, account: "account-1", user: "user-1" };
const scope = { get: (key) => values[key] };
let starts = [];
const start = (options) => starts.push(options);

conversation.t();
check(
  state.initialized.length === 10,
  "initializes all conversation dependencies",
);

conversation.n(scope, start, { type: "create" }, { source: "sites" });
let options = starts.at(-1);
check(
  options.source === "sites" && options.activeProject === null,
  "preserves launch options and clears the active project",
);
check(
  options.startInSidebar === true,
  "starts new Site conversations in the sidebar",
);
check(
  options.prefillPrompt.includes("Create a website that"),
  "builds the Site creation prompt",
);
check(
  state.pluginPrompts.at(-1).pluginId === "sites-plugin",
  "uses the Sites plugin",
);

conversation.n(
  scope,
  start,
  { type: "create-asset", assetType: "document", cloudLibraryEnabled: true },
  {},
);
options = starts.at(-1);
check(
  options.libraryFileCreation === true,
  "enables cloud library document creation",
);
check(
  options.prefillPrompt.startsWith("prompt:Document"),
  "uses document artifact metadata",
);

conversation.n(
  scope,
  start,
  { type: "create-asset", assetType: "pdf", cloudLibraryEnabled: false },
  {},
);
options = starts.at(-1);
check(
  options.libraryFileCreation === undefined,
  "does not enable disabled cloud library creation",
);
check(
  state.pluginPrompts.at(-1).pluginId === "pdf@openai-primary-runtime" &&
    state.pluginPrompts.at(-1).pluginDisplayName === "PDF",
  "uses the dedicated PDF runtime plugin",
);

conversation.n(
  scope,
  start,
  { type: "create-asset", assetType: "image", cloudLibraryEnabled: true },
  {},
);
options = starts.at(-1);
check(
  options.prefillPrompt === "Create an image of …",
  "uses the localized image prompt",
);
check(
  options.libraryFileCreation === undefined,
  "keeps image creation out of the cloud library flow",
);

const beforeEditStarts = starts.length;
conversation.n(
  scope,
  start,
  {
    type: "edit",
    projectId: "site-1",
    projectTitle: "My Site",
    liveUrl: "https://example.com",
    latestEditContext: { turnId: "turn-1" },
  },
  { source: "card" },
);
check(
  starts.length === beforeEditStarts,
  "routes edits without starting a new conversation",
);
const navigation = state.navigations.at(-1);
check(
  navigation.route === "conversation:site-1",
  "opens the Site conversation route",
);
check(
  navigation.options.state.source === "card" &&
    navigation.options.state.siteEditLiveUrl === "https://example.com",
  "preserves edit launch state",
);
check(
  navigation.options.state.siteEditContext.accountId === "account-1" &&
    navigation.options.state.siteEditContext.userId === "user-1" &&
    navigation.options.state.siteEditContext.projectId === "site-1",
  "builds the Site edit context",
);
check(
  navigation.options.state.siteEditContext.latestEditContext.turnId ===
    "turn-1",
  "preserves the latest edit context",
);

conversation.n(
  scope,
  start,
  { type: "publish", projectId: "site-2", projectTitle: "Launch" },
  {},
);
options = starts.at(-1);
check(
  options.prefillPrompt.includes("@site[Launch:site-2]"),
  "mentions the Site in the publish prompt",
);
check(
  options.prefillPrompt.endsWith(" "),
  "keeps the publish prompt trailing space",
);
check(
  state.formatted.at(-1).descriptor.id === "appgenConversation.publishPrompt",
  "uses the publish localization descriptor",
);

console.log(`${assertions} start-appgen-conversation assertions passed`);
