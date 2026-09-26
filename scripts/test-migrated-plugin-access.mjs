import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__migratedAccessTest = {
  results: [],
  request: null,
};
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/migrated-plugin-access/index.ts"),
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
                  export const ZI = "scope";
                  export const QX = (_scope, factory) => factory;
                  export const FX = () => {}; export const QI = () => {};
                `,
                "app-initial": `
                  export const K6t = "account-id"; export const _un = "user-id";
                  export const G3t = product => ({ product }); export const f4t = signal => signal;
                  export const udn = { safePost: async (url, input) => {
                    globalThis.__migratedAccessTest.request = { url, input };
                    return { results: globalThis.__migratedAccessTest.results };
                  }};
                  export const G6t = () => {}; export const Sun = () => {}; export const K3t = () => {};
                  export const p4t = () => {}; export const pdn = () => {};
                `,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const access = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

const personal = { id: "account-1", structure: "personal" };
const resource = {
  gizmo: {
    gizmo_type: "gpt",
    live_version: 2,
    migrated_plugin_id: null,
    workspace_id: null,
    author: { user_id: "user-1" },
    current_user_permission: { can_view_config: true, can_write: true },
  },
};
check(
  access.r({
    resource,
    account: personal,
    accountId: "account-1",
    userId: "user-1",
    enabled: true,
  }),
  "allows a personal GPT owner with config access",
);
resource.gizmo.current_user_permission.can_write = false;
check(
  !access.r({
    resource,
    account: personal,
    accountId: "account-1",
    userId: "user-1",
    enabled: true,
  }),
  "requires write access for the GPT owner",
);
resource.gizmo.current_user_permission.can_write = true;
resource.gizmo.migrated_plugin_id = "plugin-1";
check(
  !access.r({
    resource,
    account: personal,
    accountId: "account-1",
    userId: "user-1",
    enabled: true,
  }) &&
    access.r({
      resource,
      account: personal,
      accountId: "account-1",
      userId: "user-1",
      enabled: true,
      allowMigrated: true,
    }),
  "only includes migrated GPTs when explicitly allowed",
);

const workspace = {
  id: "workspace-1",
  structure: "workspace",
  account_user_id: "member-1",
  account_user_role: "account-admin",
};
resource.gizmo.migrated_plugin_id = null;
resource.gizmo.workspace_id = "workspace-1";
resource.gizmo.author.user_id = "another-user";
resource.gizmo.share_recipient = "workspace";
resource.gizmo.current_user_permission = { can_read: true };
check(
  access.r({
    resource,
    account: workspace,
    accountId: "workspace-1",
    userId: "user-1",
    enabled: true,
  }),
  "allows a workspace admin to migrate a shared readable GPT",
);
resource.gizmo.share_recipient = "private";
check(
  !access.r({
    resource,
    account: workspace,
    accountId: "workspace-1",
    userId: "user-1",
    enabled: true,
  }),
  "rejects another user's private workspace GPT",
);

check(access.i(personal, true, []), "personal accounts can use plugins");
check(
  access.i(workspace, false, []),
  "a disabled workspace gate bypasses permission checks",
);
check(
  !access.i(workspace, true, []) &&
    access.i(workspace, true, ["chatgpt.workspace_plugins.use"]),
  "enforces the workspace plugin permission behind the gate",
);

resource.gizmo.share_recipient = "workspace";
resource.gizmo.author.user_id = "member-1";
resource.gizmo.current_user_permission = { can_read: true };
check(
  access.o({
    resource,
    account: workspace,
    accountId: "workspace-1",
    permissions: [],
  }),
  "shows retirement when an owned workspace GPT cannot use plugins",
);
check(
  !access.o({
    resource,
    account: workspace,
    accountId: "workspace-1",
    permissions: ["chatgpt.workspace_plugins.use"],
  }),
  "hides retirement when workspace plugins are permitted",
);

const query = access.n("plugin-1", {
  get: (atom) =>
    atom === "account-id" ? "account-1" : atom === "user-id" ? "user-1" : null,
});
check(
  query.enabled && query.queryKey.at(-1) === "user-1",
  "scopes plugin access queries to account and user",
);
globalThis.__migratedAccessTest.results = [
  {
    plugin: {
      id: "plugin-1",
      status: "ENABLED",
      installation_policy: "ALLOWED",
    },
  },
];
check(
  await query.queryFn({ signal: "signal" }),
  "accepts an enabled available plugin",
);
check(
  globalThis.__migratedAccessTest.request.url === "/ps/plugins/batch" &&
    globalThis.__migratedAccessTest.request.input.requestBody.plugin_ids[0] ===
      "plugin-1",
  "requests only the migrated plugin from the plugin service",
);
globalThis.__migratedAccessTest.results[0].plugin.installation_policy =
  "NOT_AVAILABLE";
check(
  !(await query.queryFn({ signal: "signal" })),
  "rejects an unavailable plugin installation policy",
);
const disabledQuery = access.n("plugin-1", { get: () => null });
check(
  !disabledQuery.enabled,
  "disables plugin access queries without identity state",
);

assert.equal(assertions, 15);
console.log(`${assertions} migrated plugin access assertions passed`);
