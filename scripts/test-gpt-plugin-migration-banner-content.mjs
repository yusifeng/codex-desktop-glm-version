import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__migrationContentTest = {
  resource: {
    gizmo: {
      gizmo_type: "gpt",
      migrated_plugin_id: "plugin-1",
      display: { name: "My GPT" },
      live_version: 1,
    },
  },
  account: { id: "account-1", structure: "personal" },
  access: { data: true },
  workspaceExperiment: false,
  workspaceGate: false,
  retirement: false,
  canMigrateAccount: false,
  canMigrateResource: false,
  navigated: null,
  openedPlugin: null,
  dialog: null,
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
});

const result = await esbuild.build({
  entryPoints: [
    path.join(
      ROOT,
      "src/renderer/gpt-plugin-migration-banner-content/index.ts",
    ),
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
                  const keyOf = value => JSON.stringify(value);
                  const read = (source, parameter) => {
                    const s = globalThis.__migrationContentTest;
                    if (source === "resource") return { data: s.resource, isError: false };
                    if (source === "access") return s.access;
                    if (source === "permissions") return { data: { permissions: ["manage"] }, isPending: false, isError: false };
                    if (source === "experiment-signal") return true;
                    if (source === "account-id") return "account-1";
                    if (source === "user-id") return "user-1";
                    if (source?.kind === "state-family") {
                      const key = source.key(parameter);
                      if (!source.values.has(key)) source.values.set(key, source.initial(parameter));
                      return source.values.get(key);
                    }
                    if (source?.kind === "derived-family") return source.derive(parameter, { get: read });
                    return undefined;
                  };
                  export const I3 = () => globalThis.__migrationContentTest.jsx;
                  export const ZI = Symbol("scope");
                  export const LX = () => ({
                    get: read,
                    set(source, parameter, update) {
                      const key = source.key(parameter);
                      const current = read(source, parameter);
                      source.values.set(key, typeof update === "function" ? update(current) : update);
                    },
                  });
                  export const BX = read;
                  export const oZ = (_scope, initial, _valueOptions, options) => {
                    const family = { kind: "state-family", initial, key: value => keyOf(options?.key?.(value) ?? value), values: new Map() };
                    globalThis.__migrationContentTest.visitFamily = family;
                    return family;
                  };
                  export const rZ = (_scope, derive) => ({ kind: "derived-family", derive });
                  export const Jm = loader => {
                    globalThis.__migrationContentTest.lazyLoader = loader;
                    return "LazyMigrationDialog";
                  };
                  export const $3 = () => {}; export const FX = () => {}; export const QI = () => {};
                  export const qm = () => {}; export const H3 = () => {};
                `,
                "app-initial": `
                  export const fN = "resource"; export const Dln = "permissions";
                  export const mfn = "experiment-signal"; export const mun = "account-id"; export const _un = "user-id";
                  export const N6t = () => ({ accountId: "account-1", userId: "user-1" });
                  export const uht = () => ({ data: globalThis.__migrationContentTest.account });
                  export const afn = () => ({ get: () => globalThis.__migrationContentTest.workspaceExperiment });
                  export const ofn = () => globalThis.__migrationContentTest.workspaceGate;
                  export const i_n = () => ({ pathname: "/g/gizmo-1" });
                  export const o_n = () => path => { globalThis.__migrationContentTest.navigated = path; };
                  export const u1 = (pluginId) => { globalThis.__migrationContentTest.openedPlugin = pluginId; };
                  export const Uzt = (_scope, dialog, input) => { globalThis.__migrationContentTest.dialog = { dialog, input }; };
                  export const Qgn = () => {}; export const Oln = () => {}; export const M6t = () => {};
                  export const rht = () => {}; export const Vzt = () => {}; export const ifn = () => {};
                  export const mN = () => {}; export const l1 = () => {};
                `,
                "chat-choice-view": `export const n = () => {}; export const t = "ChoiceView";`,
                "migrated-plugin-access": `
                  export const n = "access";
                  export const o = () => globalThis.__migrationContentTest.retirement;
                  export const i = () => globalThis.__migrationContentTest.canMigrateAccount;
                  export const r = () => globalThis.__migrationContentTest.canMigrateResource;
                  export const t = () => {};
                `,
                "gpt-plugin-migration-notices": `
                  export const n = "MigrationNotice"; export const r = "ExploreNotice";
                  export const t = "RetirementNotice"; export const i = () => {};
                `,
                "migrated-plugin-notice": `export const t = "MigratedPluginNotice"; export const r = () => {};`,
                "gpt-plugin-migration-dialog": `export const GptPluginMigrationDialog = "MigrationDialog";`,
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

check(
  (await state.lazyLoader()) === "MigrationDialog",
  "loads the migration dialog component through the shared lazy wrapper",
);

let node = migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" });
check(
  typeof node.type === "function",
  "projects an eligible migrated GPT through the visit-state owner",
);
let choice = node.type(node.props);
check(
  choice.type === "ChoiceView" && choice.props.accessState === "allowed",
  "reports allowed plugin access",
);
choice.props.onUsePlugin();
check(state.openedPlugin === "plugin-1", "opens an allowed migrated plugin");
state.access = { isError: true, refetch: () => (state.retried = true) };
choice = node.type(node.props);
check(choice.props.accessState === "error", "reports plugin access failures");
choice.props.onRetry();
check(state.retried, "retries a failed plugin access query");
choice.props.onUsePlugin();
check(
  state.navigated === "/plugins",
  "falls back to plugin discovery when access fails",
);

choice.props.onKeepUsingGpt();
node = migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" });
check(
  node.type === "MigratedPluginNotice",
  "keeps the GPT by atomically marking the account-scoped visit continued",
);
state.visitFamily.values.clear();

state.workspaceExperiment = true;
state.workspaceGate = true;
state.account.structure = "workspace";
state.retirement = true;
node = migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" });
check(
  node.props.children.type === "RetirementNotice" &&
    node.props.children.props.surface === "migrated",
  "renders the workspace retirement notice",
);

state.resource.gizmo.migrated_plugin_id = null;
state.retirement = false;
state.canMigrateAccount = true;
state.canMigrateResource = true;
node = migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" });
check(
  node.props.children.type === "MigrationNotice",
  "offers migration for an eligible GPT",
);
node.props.children.props.onDismiss();
node.props.children.props.onMigrate();
check(
  migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" }) === null,
  "dismisses the migration notice in the account-scoped visit state",
);
state.visitFamily.values.clear();
check(
  state.dialog.dialog === "LazyMigrationDialog" &&
    state.dialog.input.resource === state.resource,
  "opens the migration dialog with the GPT resource",
);

state.canMigrateResource = false;
node = migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" });
check(
  node.props.children.type === "ExploreNotice",
  "offers plugin discovery when migration is unavailable",
);
node.props.children.props.onExplore();
check(
  state.navigated === "/plugins",
  "opens plugin discovery from the fallback notice",
);

state.resource.gizmo.gizmo_type = "connector";
check(
  migration.GptPluginMigrationBannerContent({ gizmoId: "gizmo-1" }) === null,
  "ignores non-GPT resources",
);

assert.equal(assertions, 15);
console.log(
  `${assertions} GPT plugin migration banner-content assertions passed`,
);
