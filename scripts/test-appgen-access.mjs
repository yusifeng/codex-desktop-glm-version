import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-access/index.ts")],
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
                ? `export const z2t = () => ({ default: (values) => [...new Set(values)] });`
                : "export {};",
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
access.s();

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

check(access.t({ current_user_role: "owner" }), "recognizes the owner role");
check(
  !access.t(null) && !access.t({ current_user_role: "editor" }),
  "rejects non-owners",
);
equal(
  access.n({
    availableAccessModes: null,
    currentAccessMode: "custom",
    isWorkspaceAccount: true,
  }),
  [
    { disabled: false, value: "workspace_all" },
    { disabled: false, value: "custom" },
  ],
  "uses workspace defaults",
);
equal(
  access.n({
    availableAccessModes: ["public"],
    currentAccessMode: "private",
    isWorkspaceAccount: false,
  }),
  [
    { disabled: false, value: "public" },
    { disabled: true, value: "private" },
  ],
  "preserves an unavailable current mode as disabled",
);

const workspace = { id: "w1", source: "workspace" };
const tenant = { id: "t1", source: "tenant" };
const update = access.i({
  accessGroups: [workspace, tenant],
  allowedUserEmails: ["a@example.com", null, "a@example.com"],
  canManageInvitees: true,
  editorAccountUserIds: ["u1", "u1", "u2"],
  existingGroups: [{ id: "w1" }],
  knownAccessGroups: [],
  removedEditorAccountUserIds: ["u3", "u3"],
  selectedGroups: [tenant],
});
equal(
  update.allowed_user_emails,
  ["a@example.com"],
  "compacts and deduplicates emails",
);
equal(update.allowed_tenant_group_ids, ["t1"], "adds selected tenant groups");
check(
  !("allowed_workspace_group_ids" in update),
  "does not emit an unchanged workspace group category",
);
equal(
  update.editor_changes,
  {
    add_editor_account_user_ids: ["u1", "u2"],
    remove_editor_account_user_ids: ["u3"],
  },
  "deduplicates editor additions and removals",
);
equal(
  access.i({
    accessGroups: [],
    allowedUserEmails: ["hidden@example.com"],
    canManageInvitees: false,
    existingGroups: [],
    knownAccessGroups: [],
    selectedGroups: [],
  }),
  {},
  "omits invitee changes without permission",
);

equal(
  access.r(null),
  { accessMode: "admins_only", groupCount: 0, userCount: 0 },
  "summarizes a missing policy",
);
equal(
  access.r({
    access_mode: "custom",
    allowed_account_user_ids: ["owner", "u1", "u1"],
    allowed_editors: [{ account_user_id: "owner" }, { account_user_id: "u2" }],
    allowed_tenant_group_ids: ["t1"],
    allowed_workspace_group_ids: ["w1", "w2"],
    external_visitor_count: 2,
  }),
  { accessMode: "custom", groupCount: 3, userCount: 4 },
  "deduplicates users and counts groups and external visitors",
);
check(
  access.c({ accessMode: "custom", groupCount: 0, userCount: 0 }),
  "detects an empty custom policy",
);
check(
  !access.c({ accessMode: "workspace_all", groupCount: 0, userCount: 0 }) &&
    !access.c({ accessMode: "admins_only", groupCount: 1, userCount: 0 }),
  "requires both a restricted mode and zero principals",
);

const policy = {
  allowed_users: [
    { account_user_id: "u1", email: "one@example.com" },
    { account_user_id: "u2", email: null },
    { account_user_id: "u3", email: "three@example.com" },
  ],
  allowed_groups: [{ id: "w1" }, { id: "t1" }],
};
equal(
  access.o(policy, "u1"),
  { allowed_user_emails: ["three@example.com"] },
  "builds a remove-user request from remaining valid emails",
);
equal(
  access.a({
    accessGroups: [workspace, tenant],
    accessPolicy: policy,
    group: tenant,
    knownAccessGroups: [],
  }),
  {
    allowed_user_emails: ["one@example.com", "three@example.com"],
    allowed_tenant_group_ids: [],
  },
  "builds a remove-group request for the changed source category",
);

console.log(`${assertions} Appgen access assertions passed`);
