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

globalThis.__location = {
  hash: "",
  key: "route-1",
  pathname: "/settings/cloud-environments",
  search: "",
  state: null,
};
globalThis.__navigations = [];
globalThis.__hostId = "local";
globalThis.__environmentPages = [];
globalThis.__environmentDetail = null;
globalThis.__mutations = Object.create(null);

const React = {
  Fragment: jsx.Fragment,
  useState: (initialValue) => [
    typeof initialValue === "function" ? initialValue() : initialValue,
    () => {},
  ],
};

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
          build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: modulePath }) => {
            if (modulePath === "app-shared") {
              return {
                loader: "js",
                contents: [
                  "export const I3=()=>globalThis.__jsx;",
                  "export const e6=()=>globalThis.__React;",
                  "export const $I=()=>({data:{pages:globalThis.__environmentPages},hasNextPage:false});",
                  "export const BX=()=>globalThis.__environmentDetail;",
                  "export const HX=(signal)=>globalThis.__mutations[signal.kind];",
                ].join(""),
              };
            }
            if (modulePath === "app-initial") {
              return {
                loader: "js",
                contents: [
                  "export const i_n=()=>globalThis.__location;",
                  "export const o_n=()=>((path,options)=>globalThis.__navigations.push({path,options}));",
                  "export const Gv=()=>({selectedHostId:globalThis.__hostId});",
                ].join(""),
              };
            }
            if (modulePath === "cloud-environment-queries") {
              return {
                loader: "js",
                contents: [
                  "export const i=(query)=>({query});",
                  "export const t={kind:'details'};",
                  "export const l={kind:'create'};export const p={kind:'update'};",
                  "export const u={kind:'delete'};export const f={kind:'reset'};",
                  "export const x=(environment)=>({label:environment?.label??'',description:'',machineId:'machine',repositoryId:'repo',setupCommands:'',maintenanceSetupCommands:''});",
                  "export const w=(form)=>form.label.trim()?{}:{label:'required'};",
                  "export const v=(form)=>form.label.trim().length>0;",
                  "export const y=(form)=>({label:form.label});",
                ].join(""),
              };
            }
            if (modulePath === "cloud-preferences")
              return { loader: "js", contents: "export const a=()=>({});" };
            if (modulePath === "toolbar-breadcrumb")
              return {
                loader: "js",
                contents: "export const t=(props)=>globalThis.__jsx.jsx('breadcrumb',props);",
              };
            if (modulePath === "security-tabs")
              return {
                loader: "js",
                contents: "export const t=(props)=>globalThis.__jsx.jsx('tabs',props);",
              };
            if (modulePath === "local-environment-editor")
              return {
                loader: "js",
                contents: "export const t=(props)=>globalThis.__jsx.jsx('local-editor',props);",
              };
            return { loader: "js", contents: "export default {};" };
          });
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${name}`
  );
}

globalThis.__jsx = jsx;
globalThis.__React = React;
globalThis.__mutations = {
  create: { isPending: false, mutate() {} },
  update: { isPending: false, mutate() {} },
  delete: { isPending: false, mutate() {} },
  reset: { isPending: false, mutate() {} },
};

const cloudPage = await load("cloud-environments-settings-page");
const cloudRoot = cloudPage.CloudEnvironmentsSettingsPage();
assert.equal(typeof cloudRoot.type, "function");
globalThis.__environmentPages = [
  {
    items: [
      {
        id: "env-1",
        label: "Codex",
        permissions: { can_write: true },
        repos: [],
      },
    ],
  },
];
const cloudList = cloudRoot.type(cloudRoot.props);
assert.equal(cloudList.props.children[0].props.children[0].props.children, "Cloud environments");
const environmentRow = cloudList.props.children[3].props.children[0];
environmentRow.props.children[0].props.onClick();
assert.equal(globalThis.__navigations.at(-1).path, "/settings/cloud-environments/env-1");

globalThis.__location = {
  ...globalThis.__location,
  pathname: "/settings/cloud-environments/new",
};
const createRoute = cloudPage.CloudEnvironmentsSettingsPage();
assert.equal(createRoute.type, "main");
assert.equal(createRoute.props.children[0].type, "breadcrumb");
assert.equal(typeof createRoute.props.children[1].type, "function");

globalThis.__location = {
  ...globalThis.__location,
  pathname: "/settings/cloud-environments/env-1/edit",
};
globalThis.__environmentDetail = {
  data: {
    id: "env-1",
    label: "Codex",
    permissions: { can_delete: true, can_write: true },
    repos: [],
  },
};
const editRoute = cloudPage.CloudEnvironmentsSettingsPage();
const editPage = editRoute.type(editRoute.props);
assert.equal(editPage.type, "main");
assert.equal(editPage.props.children[0].props.current, "Edit environment");

globalThis.__location = {
  ...globalThis.__location,
  pathname: "/settings/cloud-environments/bad/path/extra",
};
assert.equal(cloudPage.CloudEnvironmentsSettingsPage(), null);
assert.deepEqual(globalThis.__navigations.at(-1), {
  path: "/settings/cloud-environments",
  options: { replace: true },
});

const localPage = await load("local-environments-settings-page");
globalThis.__location = {
  ...globalThis.__location,
  pathname: "/settings/local-environments",
  search: "",
};
const localRoot = localPage.LocalEnvironmentsSettings();
assert.equal(typeof localRoot.type, "function");
const locationCatalog = localRoot.type(localRoot.props);
assert.equal(locationCatalog.props.children[0].type, "tabs");
locationCatalog.props.children[3].props.onClick();
assert.equal(
  globalThis.__navigations.at(-1).path,
  "/settings/local-environments?tab=local",
);

globalThis.__location = { ...globalThis.__location, search: "?tab=local" };
const localTabRoute = localPage.LocalEnvironmentsSettings();
const localCatalogElement = localTabRoute.type(localTabRoute.props);
assert.equal(typeof localCatalogElement.type, "function");
const localCatalog = localCatalogElement.type(localCatalogElement.props);
assert.equal(localCatalog.props["data-host-id"], "local");
assert.equal(localCatalog.props.children[1].props.children[0].props.children, "Local environments");

globalThis.__hostId = "remote-1";
const remoteCatalog = localPage.LocalEnvironmentsSettings();
assert.equal(remoteCatalog.props.hostId, "remote-1");
assert.equal(remoteCatalog.key, "remote-1:route-1");

console.log("environment settings pages cluster complete");
