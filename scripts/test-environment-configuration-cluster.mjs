import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.__jsx = jsx;
globalThis.__requests = [];
globalThis.__queryData = null;
globalThis.__scopedValues = Object.create(null);

async function load(name) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, `src/renderer/${name}/index.ts`)],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: modulePath }) => ({
            path: modulePath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: modulePath }) => {
              if (modulePath === "app-shared")
                return {
                  loader: "js",
                  contents:
                    "export const I3=()=>globalThis.__jsx;export const $O={FIVE_MINUTES:300000};export const CL=()=>({setQueryData:(key,value)=>globalThis.__queryData={key,value}});export const SL=()=>{};export const _L=(options)=>({kind:'query',options});export const ek=()=>{};export const gL=()=>{};export const iL=(options)=>({kind:'mutation',options});export const rL=()=>{};export const BX=(signal)=>globalThis.__scopedValues[signal.kind];export const HX=(signal)=>globalThis.__scopedValues[signal.kind];",
                };
              if (modulePath === "app-initial")
                return {
                  loader: "js",
                  contents:
                    "export const pdn=()=>{};export const udn={safeGet:(path)=>{globalThis.__requests.push({method:'GET',path});return Promise.resolve({path})},safePatch:(path,options)=>{globalThis.__requests.push({method:'PATCH',path,options});return Promise.resolve(options.requestBody)}};export const $m={kind:'review'};export const Bm={kind:'save'};export const Fm={kind:'publish'};export const Gm={kind:'draftSave'};export const Jpt={kind:'operation'};export const Km={kind:'queryConfig'};export const Kpt={kind:'setup'};export const Ypt={kind:'configuration'};export const pmt={kind:'task'};",
                };
              if (modulePath === "side-panel")
                return {
                  loader: "js",
                  contents: "export const r={kind:'panel'};",
                };
              if (modulePath === "allowed-domains-input")
                return {
                  loader: "js",
                  contents:
                    "export const t=(props)=>globalThis.__jsx.jsx('allowed-domains',props);export const r=({issue})=>globalThis.__jsx.jsx('issue',{children:issue.message??issue.code});",
                };
              return { loader: "js", contents: "export default {};" };
            },
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}

const preferences = await load("cloud-preferences");
preferences.r();
const variables = [
  { value: "{project}", example: "codex", char_count: 12 },
  { value: "{branch}", example: "main", char_count: 20 },
];
assert.equal(preferences.n("project", 100, variables), "missing-pattern");
assert.equal(preferences.n("{project", 100, variables), "bracket-mismatch");
assert.equal(preferences.n("{unknown}", 100, variables), "invalid-pattern");
assert.equal(preferences.n("/{project}", 100, variables), "leading-slash");
assert.equal(
  preferences.n("{project} folder", 100, variables),
  "invalid-characters",
);
assert.equal(preferences.n("{project}/{branch}", 10, variables), "too-long");
assert.equal(preferences.n("{project}/{branch}", 100, variables), null);
assert.equal(
  preferences.t("repos/{project}/{branch}", variables),
  "repos/codex/main",
);
const userQuery = preferences.a();
assert.deepEqual(userQuery.options.queryKey, ["cloud-user-preferences"]);
await userQuery.options.queryFn();
assert.equal(globalThis.__requests.at(-1).path, "/wham/settings/user");
const configQuery = preferences.i();
await configQuery.options.queryFn();
assert.equal(
  globalThis.__requests.at(-1).path,
  "/wham/settings/configs/user-preferences",
);
const mutation = preferences.o();
const updated = await mutation.options.mutationFn({ path: "repos/{project}" });
mutation.options.onSuccess(updated);
assert.equal(globalThis.__requests.at(-1).method, "PATCH");
assert.deepEqual(globalThis.__queryData.value, { path: "repos/{project}" });

const disclosure = await load("settings-row-disclosure");
disclosure.n();
const collapsed = disclosure.t({
  children: "row",
  content: "details",
  contentId: "details",
  expanded: false,
});
assert.equal(collapsed.props.children[0], "row");
assert.equal(collapsed.props.children[1], null);
const expanded = disclosure.t({
  children: "row",
  content: "details",
  contentId: "details",
  expanded: true,
});
assert.equal(expanded.props.children[1].props.id, "details");
assert.equal(expanded.props.children[1].props.children, "details");

const fields = await load("environment-configuration-fields");
fields.n();
fields.i();
let domainChanges = null;
const domainField = fields.r({
  domains: ["api.example.com"],
  issues: [{ code: "invalid", field: "network-0", message: "Invalid domain" }],
  onChange: (domains) => {
    domainChanges = domains;
  },
});
assert.equal(domainField.props["data-environment-invalid"], true);
const domainEditor = domainField.props.children[1].type(
  domainField.props.children[1].props,
);
assert.equal(domainEditor.type, "allowed-domains");
domainField.props.children[1].props.onChange(["openai.com"]);
assert.deepEqual(domainChanges, ["openai.com"]);
const domainIssue = domainField.props.children[2].type(
  domainField.props.children[2].props,
);
assert.equal(domainIssue.props.children, "Invalid domain");

let draftChange = null;
let secretChanges = null;
let variableChanges = null;
const configuration = fields.t({
  draft: {
    repositories: ["openai/codex"],
    setupScript: "npm install",
    maintenanceSetupScript: "npm update",
    networkEnabled: true,
    networkPreset: "package_managers",
    networkDomains: ["registry.npmjs.org"],
    access: "private",
    outboundIdentityRequirements: [{ id: "github" }],
  },
  secrets: [
    {
      id: 1,
      name: "TOKEN",
      value: "saved",
      injectionTarget: { type: "environment_variable", name: "TOKEN" },
    },
  ],
  environmentVariables: [{ name: "NODE_ENV", value: "test" }],
  issues: [{ code: "invalid", field: "connection-0", message: "Reconnect" }],
  onDraftChange: (change) => {
    draftChange = change;
  },
  setSecrets: (secrets) => {
    secretChanges = secrets;
  },
  setEnvironmentVariables: (variablesList) => {
    variableChanges = variablesList;
  },
});
const [repositories, scripts, network, variableSection, privacy, connections] =
  configuration.props.children;
assert.equal(repositories.props["data-environment-section"], "repositories");
repositories.props.children[1].props.onChange({
  currentTarget: { value: "openai/gpt" },
});
assert.deepEqual(draftChange, { repositories: ["openai/gpt"] });
scripts.props.children[1].props.onChange({
  currentTarget: { value: "pnpm install" },
});
assert.deepEqual(draftChange, { setupScript: "pnpm install" });
assert.equal(network.props["data-environment-section"], "network");
network.props.children[0].props.children[1].props.onChange({
  currentTarget: { checked: false },
});
assert.deepEqual(draftChange, {
  networkEnabled: false,
  networkPreset: "package_managers",
});
network.props.children[1].props.children[1].props.children[2].props.onClick();
assert.deepEqual(secretChanges, []);
variableSection.props.children[1].props.children[1].props.onChange({
  currentTarget: { value: "production" },
});
assert.equal(variableChanges[0].value, "production");
privacy.props.children[1].props.onChange({
  currentTarget: { value: "organization" },
});
assert.deepEqual(draftChange, { access: "organization" });
assert.equal(connections.props.children[1].props.children, "1 connections");
const connectionIssue = connections.props.children[2].type(
  connections.props.children[2].props,
);
assert.equal(connectionIssue.props.children, "Reconnect");

const publishActions = await load("publish-actions");
publishActions.n();
publishActions.i();
const button = publishActions.r({
  children: "Publish",
  disabled: true,
  tooltipContent: "Wait",
});
assert.equal(button.props["aria-disabled"], true);
assert.equal(button.props.children[0].props.disabled, true);
assert.equal(button.props.children[1].props.children, "Wait");

let publishedInput = null;
globalThis.__scopedValues = {
  panel: false,
  setup: { phase: "ready" },
  configuration: {
    configId: "config",
    promotedVersionId: null,
    approval: null,
  },
  queryConfig: {
    data: { id: "config", version_id: "v2", draft: { revision: 1 } },
  },
  publish: {
    isPending: false,
    error: null,
    mutate: (input) => {
      publishedInput = input;
    },
  },
  save: false,
  review: false,
  task: { id: "task", isActive: false },
  operation: null,
  draftSave: { isPending: false },
};
const readyActions = publishActions.t({ conversationId: "conversation" });
assert.equal(
  readyActions.props.children[0].props.children,
  "Your configuration is saved and ready to publish",
);
const readyButtonElement = readyActions.props.children[1].props.children[1];
assert.equal(readyButtonElement.props.children, "Publish");
readyButtonElement.props.onClick();
assert.equal(publishedInput.config.id, "config");

let reviewed = 0;
globalThis.__scopedValues.review = true;
const reviewActions = publishActions.t({
  conversationId: "conversation",
  onReview: () => reviewed++,
});
const reviewButtonElement = reviewActions.props.children[1].props.children[1];
assert.equal(reviewButtonElement.props.children, "Review");
reviewButtonElement.props.onClick();
assert.equal(reviewed, 1);

globalThis.__scopedValues.review = false;
globalThis.__scopedValues.publish = {
  isPending: false,
  error: null,
  mutate() {},
};
globalThis.__scopedValues.queryConfig = {
  data: { id: "config", version_id: "v2", draft: null },
};
globalThis.__scopedValues.configuration = {
  promotedVersionId: "v2",
  approval: null,
};
const published = publishActions.t({
  conversationId: "conversation",
  children: "next",
});
assert.equal(
  published.props.children[0].props.children,
  "Environment published",
);
assert.equal(published.props.children[1], "next");

console.log("environment configuration cluster complete");
