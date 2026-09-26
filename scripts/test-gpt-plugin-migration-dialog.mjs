import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__migrationDialogTest = {
  requests: [],
  updates: [],
  closed: 0,
  migrated: null,
  migrating: [],
  latest: {
    gizmo: {
      id: "gizmo-1",
      gizmo_config_id: "config-1",
      gizmo_type: "gpt",
      migrated_plugin_id: null,
      live_version: 1,
      workspace_id: null,
      display: { name: "Research GPT" },
      author: { user_id: "user-1" },
      current_user_permission: {
        can_view_config: true,
        can_write: true,
      },
    },
    tools: [
      {
        type: "connector",
        settings: { action_ids: ["connector_drive"] },
      },
    ],
    files: [],
  },
  queryResult: null,
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
});
state.queryResult = {
  data: {
    resource: state.latest,
    apps: { unavailable: [], disabledByAdmin: [] },
  },
  isFetching: false,
  isError: false,
  refetch: () => (state.refetched = true),
};

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/gpt-plugin-migration-dialog/index.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__migrationDialogTest.jsx;
                  export const e6 = () => ({
                    useState: initial => [initial, value => globalThis.__migrationDialogTest.updates.push(value)],
                    useRef: initial => ({ current: initial })
                  });
                  export const ZI = "scope";
                  export const LX = () => ({
                    queryClient: {
                      fetchQuery: async () => globalThis.__migrationDialogTest.queryResult.data,
                      invalidateQueries: value => { globalThis.__migrationDialogTest.invalidated = value; }
                    },
                    get: () => null
                  });
                  export const BX = (source, key) => source === "dynamic" ? ({ get: field => field === "enabled" ? true : false }) : source === "permissions" ? ({ data: { permissions: [] } }) : undefined;
                  export const pL = value => { globalThis.__migrationDialogTest.query = value; return value; };
                  export const _L = () => globalThis.__migrationDialogTest.queryResult;
                  export const Y2 = "FormattedMessage"; export const Yh = "Button";
                  export const Rh = "DialogTitle"; export const Lh = "DialogDescription";
                  export const Oh = "DialogContent"; export const Ih = "Dialog"; export const zh = "DialogFooter";
                  export const $3 = () => {}; export const gL = () => {}; export const FX = () => {};
                  export const K2 = () => {}; export const Zh = () => {}; export const QI = () => {};
                  export const D = () => {}; export const I = () => {}; export const Ph = () => {};
                `,
                "app-initial": `
                  export const m0t = "dynamic"; export const Dln = "permissions";
                  export const N6t = () => ({ accountId: "account-1", userId: "user-1" });
                  export const uht = () => ({ data: { id: "account-1", structure: "personal" } });
                  export const ofn = () => true; export const o_n = () => path => { globalThis.__migrationDialogTest.navigated = path; };
                  export const lfn = () => ({}); export const q6t = value => value;
                  export const rJt = {
                    safeGet: async () => globalThis.__migrationDialogTest.latest,
                    safePost: async (url, input) => {
                      globalThis.__migrationDialogTest.requests.push({ url, input });
                      if (url === "/aip/connectors/batch") return { connectors: [{ id: "connector_drive", status: "ENABLED" }] };
                      return { plugin_id: "plugin-1", failed_files: [] };
                    }
                  };
                  export const Oft = input => { globalThis.__migrationDialogTest.opened = input; };
                  export const u1 = id => { globalThis.__migrationDialogTest.pluginOpened = id; };
                  export const Qgn = () => {}; export const Sun = () => {}; export const Oln = () => {};
                  export const M6t = () => {}; export const rht = () => {}; export const Dft = () => {};
                  export const l1 = () => {}; export const ifn = () => {}; export const p0t = () => {}; export const cJt = () => {};
                `,
                "migrated-plugin-access": `export const r = () => true; export const i = () => true;`,
                "gpt-management-url": `export const t = path => "https://chatgpt.com" + path; export const n = () => {};`,
                "migrated-plugin-notice": `export const n = "OpenPluginButton"; export const r = () => {};`,
                "gpt-plugin-migration-failure": `export const i = "failure-state"; export const t = "FailureDetails"; export const r = () => {}; export const n = () => {};`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const migration = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

let node = migration.GptPluginMigrationDialog({
  resource: state.latest,
  onClose: () => state.closed++,
  onMigratingChange: (value) => state.migrating.push(value),
  onMigrated: (pluginId) => (state.migrated = pluginId),
});
check(
  typeof node.type === "function",
  "routes dialog state through the semantic view",
);
check(
  node.props.canMigrate && node.props.appCheck.status === "ready",
  "reports a ready eligible GPT",
);
check(
  node.props.resource === state.latest && node.props.pluginId == null,
  "uses the latest published GPT preview",
);
let dialog = node.type(node.props);
check(
  dialog.type === "Dialog" && dialog.props.showDialogClose,
  "renders a dismissible promotional dialog",
);
const form = dialog.props.children;
check(
  form.type === "DialogContent" && form.props.as === "form",
  "uses a form-backed dialog surface",
);
const body = form.props.children;
check(
  body.props.children[0].props.children[0].type === "DialogTitle",
  "renders the migration heading",
);
check(
  body.props.children[1].type !== null,
  "renders the readiness checklist before migration",
);

await state.query.queryFn({ signal: { throwIfAborted() {} } });
check(
  state.requests[0].url === "/aip/connectors/batch",
  "checks required connector availability",
);
check(
  state.requests[0].input.requestBody.connector_ids[0] === "connector_drive",
  "queries the published GPT connector IDs",
);

form.props.onSubmit({ preventDefault() {} });
await new Promise((resolve) => setTimeout(resolve, 0));
check(
  state.requests.some(
    (request) => request.url === "/gizmos/{gizmo_id}/migrate/plugin",
  ),
  "posts the published configuration to the migration endpoint",
);
const migrateRequest = state.requests.find((request) =>
  request.url.includes("migrate/plugin"),
);
check(
  migrateRequest.input.requestBody.gizmo_config_id === "config-1",
  "pins migration to the published configuration",
);
check(
  state.migrating[0] === true && state.migrating.at(-1) === false,
  "reports migration lifecycle changes",
);
check(state.migrated === "plugin-1", "returns the created plugin ID");
check(state.closed === 1, "closes after a successful migration");
check(
  state.invalidated.queryKey[0] === "chatgpt-gizmos",
  "invalidates GPT queries after migration",
);

node.props.onEdit?.("event");
check(
  state.opened == null || state.opened.href.includes("/gpts/editor/gizmo-1"),
  "uses the external GPT editor URL when editing is available",
);

assert.equal(assertions, 16);
console.log(`${assertions} GPT plugin migration dialog assertions passed`);
