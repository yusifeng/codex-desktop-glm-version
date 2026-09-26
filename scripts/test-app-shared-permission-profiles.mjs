import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(
  ROOT,
  "node_modules/.cache/permission-profiles-test.mjs",
);
await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/permission-profiles.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  outfile,
  logLevel: "silent",
});
const permissions = await import(
  `${new URL(`file://${outfile}`).href}?v=${Date.now()}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function identical(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}

equal(
  permissions.getBooleanFeatureFlag(
    { "features.guardian_approval": true },
    "guardian_approval",
  ),
  true,
  "reads flat feature flags",
);
equal(
  permissions.getBooleanFeatureFlag(
    { features: { guardian_approval: false } },
    "guardian_approval",
  ),
  false,
  "reads nested feature flags",
);
equal(
  permissions.getBooleanFeatureFlag(
    {
      "features.guardian_approval": false,
      features: { guardian_approval: true },
    },
    "guardian_approval",
  ),
  false,
  "prefers flat feature flags",
);
let getterReads = 0;
const guardedFeatures = {};
Object.defineProperty(guardedFeatures, "guardian_approval", {
  get() {
    getterReads += 1;
    return true;
  },
});
equal(
  permissions.getBooleanFeatureFlag(
    { features: guardedFeatures },
    "guardian_approval",
  ),
  undefined,
  "does not execute feature getters",
);
equal(getterReads, 0, "leaves feature getters untouched");
equal(
  permissions.isGuardianApprovalEnabled({
    features: { guardian_approval: true },
  }),
  true,
  "exposes the guardian feature flag",
);

equal(
  permissions.resolveApprovalsReviewer(undefined),
  "user",
  "defaults reviewer",
);
equal(
  permissions.resolveApprovalsReviewer({ approvals_reviewer: "auto_review" }),
  "auto_review",
  "preserves auto review",
);
equal(
  permissions.resolveApprovalsReviewer({
    approvals_reviewer: "guardian_subagent",
  }),
  "guardian_subagent",
  "keeps guardian review when the feature is unspecified",
);
equal(
  permissions.resolveApprovalsReviewer({
    approvals_reviewer: "guardian_subagent",
    features: { guardian_approval: false },
  }),
  "user",
  "falls back when guardian review is disabled",
);
equal(
  permissions.resolveApprovalsReviewer({ approvals_reviewer: "invalid" }),
  "user",
  "rejects unknown reviewers",
);

const readOnly = permissions.createReadOnlyPermissionState();
equal(
  readOnly.activePermissionProfile.id,
  ":read-only",
  "uses read-only profile",
);
equal(
  readOnly.sandboxPolicy,
  { type: "readOnly", networkAccess: false },
  "builds read-only sandbox",
);
equal(readOnly.approvalPolicy, "on-request", "defaults read-only approval");
equal(
  permissions.detectPermissionPreset(readOnly),
  "read-only",
  "detects read-only preset",
);

const workspace = permissions.createWorkspaceWritePermissionState(
  ["/repo"],
  { writable_roots: ["/tmp/custom"], network_access: true },
  "never",
  "auto_review",
);
equal(
  workspace.activePermissionProfile,
  null,
  "custom workspace config has no profile",
);
equal(
  workspace.sandboxPolicy.writableRoots,
  ["/repo", "/tmp/custom"],
  "combines runtime and configured roots",
);
equal(
  workspace.sandboxPolicy.networkAccess,
  true,
  "preserves workspace network access",
);
equal(
  workspace.approvalsReviewer,
  "auto_review",
  "preserves workspace reviewer",
);
equal(
  permissions.getRuntimeWorkspaceRoots(workspace),
  ["/repo"],
  "returns runtime roots",
);
equal(
  permissions.getPermissionRuntimeSelector(workspace),
  { sandboxPolicy: workspace.sandboxPolicy },
  "selects an inline sandbox policy",
);

const auto = permissions.createWorkspaceWritePermissionState(["/repo"]);
equal(
  auto.activePermissionProfile.id,
  ":workspace",
  "uses workspace profile by default",
);
const identityRoots = ["/identity"];
identical(
  permissions.createWorkspaceWritePermissionState(identityRoots)
    .runtimeWorkspaceRoots,
  identityRoots,
  "preserves runtime root identity",
);
equal(
  permissions.detectPermissionPreset(auto),
  "auto",
  "detects automatic preset",
);
equal(
  permissions.getPermissionRuntimeSelector(auto),
  { permissions: ":workspace" },
  "selects the active profile id",
);
equal(
  permissions.detectPermissionPreset(
    permissions.createPermissionStateForPreset("granular", ["/repo"]),
  ),
  "granular",
  "detects structurally equal granular policy",
);
equal(
  permissions.detectPermissionPreset(
    permissions.createPermissionStateForPreset("guardian-approvals", ["/repo"]),
  ),
  "guardian-approvals",
  "detects guardian approval preset",
);
equal(
  permissions.detectPermissionPreset(
    permissions.createPermissionStateForPreset("full-access", ["/repo"]),
  ),
  "full-access",
  "detects full access preset",
);
equal(
  permissions.detectPermissionPreset(workspace),
  "custom",
  "classifies nonstandard runtime state as custom",
);

const guardianReadOnly = permissions.createPermissionStateForPreset(
  "guardian-approvals",
  ["/repo"],
  { sandbox_mode: "read-only" },
);
equal(
  guardianReadOnly.sandboxPolicy.type,
  "readOnly",
  "guardian honors read-only CLI mode",
);
equal(
  guardianReadOnly.runtimeWorkspaceRoots,
  ["/repo"],
  "guardian retains roots",
);
equal(
  guardianReadOnly.approvalsReviewer,
  "guardian_subagent",
  "guardian uses automated reviewer",
);
const guardianWorkspace = permissions.createPermissionStateForPreset(
  "guardian-approvals",
  ["/repo"],
  {
    sandbox_mode: "workspace-write",
    sandbox_workspace_write: { network_access: true },
  },
);
equal(
  guardianWorkspace.sandboxPolicy.networkAccess,
  true,
  "guardian honors workspace options",
);
equal(
  guardianWorkspace.activePermissionProfile,
  null,
  "guardian custom workspace has no profile",
);

equal(
  permissions.inferPermissionPresetFromConfig(undefined),
  "auto",
  "infers the default preset without overrides",
);
equal(
  permissions.inferPermissionPresetFromConfig(undefined, "guardian-approvals"),
  "guardian-approvals",
  "accepts a caller default",
);
equal(
  permissions.inferPermissionPresetFromConfig({ sandbox_mode: "read-only" }),
  "read-only",
  "infers read-only config",
);
equal(
  permissions.inferPermissionPresetFromConfig({
    sandbox_mode: "workspace-write",
    approval_policy: permissions.GRANULAR_APPROVAL_POLICY,
  }),
  "granular",
  "infers granular config",
);
equal(
  permissions.inferPermissionPresetFromConfig(
    { sandbox_mode: "workspace-write", approval_policy: "on-request" },
    "guardian-approvals",
  ),
  "guardian-approvals",
  "preserves an explicit guardian default",
);
equal(
  permissions.inferPermissionPresetFromConfig({
    sandbox_mode: "workspace-write",
    sandbox_workspace_write: { network_access: true },
  }),
  null,
  "rejects nondefault workspace options",
);
equal(
  permissions.inferPermissionPresetFromConfig({
    sandbox_mode: "danger-full-access",
    approval_policy: "never",
  }),
  "full-access",
  "infers full access config",
);

equal(
  permissions.listAllowedPermissionPresets(undefined),
  ["read-only", "auto", "granular", "guardian-approvals", "full-access"],
  "allows every built-in preset without requirements",
);
equal(
  permissions.listAllowedPermissionPresets({
    allowedPermissionProfiles: { ":workspace": true },
  }),
  ["auto", "granular", "guardian-approvals"],
  "filters by profile id",
);
equal(
  permissions.listAllowedPermissionPresets({
    allowedSandboxModes: ["read-only"],
  }),
  ["read-only"],
  "filters by sandbox mode",
);
equal(
  permissions.listAllowedPermissionPresets({
    allowedApprovalPolicies: [permissions.GRANULAR_APPROVAL_POLICY],
  }),
  ["granular"],
  "filters approval policies by structure",
);
equal(
  permissions.isPermissionPresetAllowed("guardian-approvals", {
    allowedApprovalsReviewers: ["auto_review"],
  }),
  true,
  "treats automated reviewers as equivalent",
);
equal(
  permissions.isPermissionPresetAllowed("auto", {
    allowedApprovalsReviewers: ["guardian_subagent"],
  }),
  false,
  "does not equate user and automated reviewers",
);

equal(
  permissions
    .getAvailablePermissionPresets(undefined, {
      sandbox_mode: "workspace-write",
      sandbox_workspace_write: { network_access: true },
    })
    .at(-1),
  "custom",
  "adds custom for explicit CLI overrides",
);
equal(
  permissions
    .getAvailablePermissionPresets(
      { allowedPermissionProfiles: { ":workspace": true } },
      { sandbox_mode: "workspace-write" },
    )
    .includes("custom"),
  false,
  "omits custom when profiles are managed",
);
equal(
  permissions
    .getAvailablePermissionPresets(
      { allowedSandboxModes: ["read-only"] },
      { sandbox_mode: "workspace-write" },
    )
    .includes("custom"),
  false,
  "omits custom when its sandbox is disallowed",
);
equal(
  permissions.selectPreferredPermissionPreset(["read-only", "granular"]),
  "granular",
  "selects by product priority",
);
equal(
  permissions.selectPreferredPermissionPreset([]),
  "read-only",
  "falls back to read-only",
);
equal(
  permissions.initializePermissionProfiles(),
  undefined,
  "keeps initialization idempotent",
);

console.log(
  `app-shared permission profile behavior: ${assertions}/${assertions} assertions passed`,
);
