import { isAutomatedReviewSource } from "./codex-micro-config";

export type ApprovalPolicy = string | Record<string, unknown>;
export type ApprovalsReviewer = "user" | "auto_review" | "guardian_subagent";
export type SandboxMode =
  "danger-full-access" | "read-only" | "workspace-write";
export type PermissionPreset =
  | "read-only"
  | "auto"
  | "granular"
  | "guardian-approvals"
  | "full-access"
  | "custom";
export type BuiltInPermissionPreset = Exclude<PermissionPreset, "custom">;

export interface ActivePermissionProfile {
  id: string;
  extends: string | null;
}

export interface ReadOnlySandboxPolicy {
  type: "readOnly";
  networkAccess: boolean;
}

export interface WorkspaceWriteSandboxPolicy {
  type: "workspaceWrite";
  writableRoots: string[];
  excludeSlashTmp: boolean;
  excludeTmpdirEnvVar: boolean;
  networkAccess: boolean;
}

export interface DangerFullAccessSandboxPolicy {
  type: "dangerFullAccess";
}

export interface ExternalSandboxPolicy {
  type: "externalSandbox";
}

export type SandboxPolicy =
  | ReadOnlySandboxPolicy
  | WorkspaceWriteSandboxPolicy
  | DangerFullAccessSandboxPolicy
  | ExternalSandboxPolicy;

export interface RuntimePermissionState {
  activePermissionProfile: ActivePermissionProfile | null;
  runtimeWorkspaceRoots?: string[];
  sandboxPolicy: SandboxPolicy;
  approvalPolicy: ApprovalPolicy;
  approvalsReviewer?: ApprovalsReviewer;
}

export interface SandboxWorkspaceWriteConfig {
  writable_roots?: readonly string[];
  exclude_slash_tmp?: boolean;
  exclude_tmpdir_env_var?: boolean;
  network_access?: boolean;
}

export interface PermissionCliConfig extends Record<string, unknown> {
  sandbox_mode?: SandboxMode | null;
  sandbox_workspace_write?: SandboxWorkspaceWriteConfig;
  approval_policy?: ApprovalPolicy | null;
  approvals_reviewer?: ApprovalsReviewer | null;
  features?: Record<string, unknown> | null;
}

export interface PermissionRequirements {
  allowedPermissionProfiles?: Record<string, boolean> | null;
  allowedSandboxModes?: readonly SandboxMode[] | null;
  allowedApprovalPolicies?: readonly ApprovalPolicy[] | null;
  allowedApprovalsReviewers?: readonly ApprovalsReviewer[] | null;
}

export const GUARDIAN_APPROVAL_FEATURE = "guardian_approval";
export const DEFAULT_PERMISSION_PRESET: BuiltInPermissionPreset = "read-only";
export const PERMISSION_PRESETS: readonly PermissionPreset[] = [
  "read-only",
  "auto",
  "granular",
  "guardian-approvals",
  "full-access",
  "custom",
];
export const BUILT_IN_PERMISSION_PRESETS: readonly BuiltInPermissionPreset[] = [
  "read-only",
  "auto",
  "granular",
  "guardian-approvals",
  "full-access",
];

const PREFERRED_PERMISSION_PRESETS: readonly PermissionPreset[] = [
  "custom",
  "auto",
  "granular",
  "guardian-approvals",
  "read-only",
];

export const READ_ONLY_SANDBOX_POLICY: ReadOnlySandboxPolicy = {
  type: "readOnly",
  networkAccess: false,
};

export const GRANULAR_APPROVAL_POLICY = {
  granular: {
    sandbox_approval: false,
    rules: false,
    skill_approval: false,
    request_permissions: true,
    mcp_elicitations: true,
  },
} as const;

interface PermissionProfileDefinition {
  permissionProfileId: string;
  sandboxMode: SandboxMode;
  approvalPolicy: ApprovalPolicy;
  approvalsReviewer: ApprovalsReviewer;
}

const PERMISSION_PROFILE_DEFINITIONS: Record<
  BuiltInPermissionPreset,
  PermissionProfileDefinition
> = {
  "read-only": {
    permissionProfileId: ":read-only",
    sandboxMode: "read-only",
    approvalPolicy: "on-request",
    approvalsReviewer: "user",
  },
  auto: {
    permissionProfileId: ":workspace",
    sandboxMode: "workspace-write",
    approvalPolicy: "on-request",
    approvalsReviewer: "user",
  },
  granular: {
    permissionProfileId: ":workspace",
    sandboxMode: "workspace-write",
    approvalPolicy: GRANULAR_APPROVAL_POLICY,
    approvalsReviewer: "user",
  },
  "guardian-approvals": {
    permissionProfileId: ":workspace",
    sandboxMode: "workspace-write",
    approvalPolicy: "on-request",
    approvalsReviewer: "guardian_subagent",
  },
  "full-access": {
    permissionProfileId: ":danger-full-access",
    sandboxMode: "danger-full-access",
    approvalPolicy: "never",
    approvalsReviewer: "user",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => valuesEqual(value, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        valuesEqual(left[key], right[key]),
    )
  );
}

function isGranularApprovalPolicy(policy: unknown): boolean {
  return valuesEqual(policy, GRANULAR_APPROVAL_POLICY);
}

function isStrictReadOnlyPolicy(
  policy: SandboxPolicy,
): policy is ReadOnlySandboxPolicy {
  return policy.type === "readOnly" && policy.networkAccess === false;
}

function isStrictWorkspaceWritePolicy(
  policy: SandboxPolicy,
): policy is WorkspaceWriteSandboxPolicy {
  return (
    policy.type === "workspaceWrite" &&
    policy.excludeSlashTmp === false &&
    policy.excludeTmpdirEnvVar === false &&
    policy.networkAccess === false
  );
}

function toSandboxMode(policy: SandboxPolicy): SandboxMode | null {
  switch (policy.type) {
    case "dangerFullAccess":
      return "danger-full-access";
    case "readOnly":
      return "read-only";
    case "workspaceWrite":
      return "workspace-write";
    case "externalSandbox":
      return null;
  }
}

function detectBuiltInPermissionPreset(
  state: RuntimePermissionState,
): BuiltInPermissionPreset | null {
  const { approvalPolicy, approvalsReviewer, sandboxPolicy } = state;
  if (approvalPolicy == null || sandboxPolicy == null) return null;
  if (
    isStrictReadOnlyPolicy(sandboxPolicy) &&
    approvalPolicy === "on-request"
  ) {
    return "read-only";
  }
  if (isStrictWorkspaceWritePolicy(sandboxPolicy)) {
    if (
      isGranularApprovalPolicy(approvalPolicy) &&
      approvalsReviewer === "user"
    ) {
      return "granular";
    }
    if (approvalPolicy === "on-request") {
      return isAutomatedReviewSource(approvalsReviewer)
        ? "guardian-approvals"
        : "auto";
    }
  }
  return sandboxPolicy.type === "dangerFullAccess" && approvalPolicy === "never"
    ? "full-access"
    : null;
}

/** 原 `LMe` / 压缩导出 `nX`。 */
export function detectPermissionPreset(
  state: RuntimePermissionState,
): PermissionPreset | null {
  return (
    detectBuiltInPermissionPreset(state) ??
    (state.approvalPolicy != null && state.sandboxPolicy != null
      ? "custom"
      : null)
  );
}

/** 原 `RMe` / 压缩导出 `dX`。 */
export function getBooleanFeatureFlag(
  config: PermissionCliConfig | null | undefined,
  feature: string,
): boolean | undefined {
  const flatValue = config?.[`features.${feature}`];
  if (typeof flatValue === "boolean") return flatValue;
  const features = config?.features;
  if (!isRecord(features)) return undefined;
  const value = Object.getOwnPropertyDescriptor(features, feature)?.value;
  return typeof value === "boolean" ? value : undefined;
}

/** 原 `VMe` / 压缩导出 `oX`。 */
export function getPermissionRuntimeSelector(
  state: RuntimePermissionState,
): { sandboxPolicy: SandboxPolicy } | { permissions: string } {
  return state.activePermissionProfile == null
    ? { sandboxPolicy: state.sandboxPolicy }
    : { permissions: state.activePermissionProfile.id };
}

/** 原 `HMe` / 压缩导出 `aX`。 */
export function getRuntimeWorkspaceRoots(
  state: RuntimePermissionState,
): string[] {
  return state.runtimeWorkspaceRoots ?? [];
}

function meetsPermissionRequirements(
  requirements: PermissionRequirements | null | undefined,
  sandboxMode: SandboxMode | null,
  approvalPolicy: ApprovalPolicy | null | undefined,
  approvalsReviewer: ApprovalsReviewer | undefined,
): boolean {
  if (requirements == null) return true;
  if (
    requirements.allowedSandboxModes != null &&
    sandboxMode != null &&
    !requirements.allowedSandboxModes.includes(sandboxMode)
  ) {
    return false;
  }
  if (
    requirements.allowedApprovalPolicies != null &&
    approvalPolicy != null &&
    !requirements.allowedApprovalPolicies.some((allowed) =>
      valuesEqual(allowed, approvalPolicy),
    )
  ) {
    return false;
  }
  const allowedReviewers = requirements.allowedApprovalsReviewers;
  const permitsAutomatedReviewer =
    allowedReviewers?.some(isAutomatedReviewSource) === true;
  return !(
    allowedReviewers != null &&
    approvalsReviewer != null &&
    !allowedReviewers.includes(approvalsReviewer) &&
    !(isAutomatedReviewSource(approvalsReviewer) && permitsAutomatedReviewer)
  );
}

/** 原 `XMe` / 压缩导出 `cX`。 */
export function isPermissionPresetAllowed(
  preset: BuiltInPermissionPreset,
  requirements: PermissionRequirements | null | undefined,
): boolean {
  if (requirements == null) return true;
  const definition = PERMISSION_PROFILE_DEFINITIONS[preset];
  if (
    requirements.allowedPermissionProfiles != null &&
    requirements.allowedPermissionProfiles[definition.permissionProfileId] !==
      true
  ) {
    return false;
  }
  return meetsPermissionRequirements(
    requirements,
    definition.sandboxMode,
    definition.approvalPolicy,
    definition.approvalsReviewer,
  );
}

/** 原 `YMe` / 压缩导出 `pX`。 */
export function listAllowedPermissionPresets(
  requirements: PermissionRequirements | null | undefined,
): BuiltInPermissionPreset[] {
  return BUILT_IN_PERMISSION_PRESETS.filter((preset) =>
    isPermissionPresetAllowed(preset, requirements),
  );
}

function createDangerFullAccessPermissionState(
  approvalPolicy?: ApprovalPolicy | null,
  approvalsReviewer: ApprovalsReviewer = "user",
  activePermissionProfile: ActivePermissionProfile | null = {
    id: ":danger-full-access",
    extends: null,
  },
): RuntimePermissionState {
  return {
    activePermissionProfile,
    sandboxPolicy: { type: "dangerFullAccess" },
    approvalPolicy: approvalPolicy ?? "never",
    approvalsReviewer,
  };
}

/** 原 `LL` / 压缩导出 `tX`。 */
export function createWorkspaceWritePermissionState(
  workspaceRoots: string[],
  config?: SandboxWorkspaceWriteConfig,
  approvalPolicy?: ApprovalPolicy | null,
  approvalsReviewer: ApprovalsReviewer = "user",
  activePermissionProfile: ActivePermissionProfile | null = config == null
    ? { id: ":workspace", extends: null }
    : null,
): RuntimePermissionState {
  return {
    activePermissionProfile,
    runtimeWorkspaceRoots: workspaceRoots,
    sandboxPolicy: {
      type: "workspaceWrite",
      writableRoots: [...workspaceRoots, ...(config?.writable_roots ?? [])],
      excludeSlashTmp: config?.exclude_slash_tmp ?? false,
      excludeTmpdirEnvVar: config?.exclude_tmpdir_env_var ?? false,
      networkAccess: config?.network_access ?? false,
    },
    approvalPolicy: approvalPolicy ?? "on-request",
    approvalsReviewer,
  };
}

/** 原 `RL` / 压缩导出 `eX`。 */
export function createReadOnlyPermissionState(
  approvalPolicy?: ApprovalPolicy | null,
  approvalsReviewer: ApprovalsReviewer = "user",
  activePermissionProfile: ActivePermissionProfile | null = {
    id: ":read-only",
    extends: null,
  },
): RuntimePermissionState {
  return {
    activePermissionProfile,
    sandboxPolicy: READ_ONLY_SANDBOX_POLICY,
    approvalPolicy: approvalPolicy ?? "on-request",
    approvalsReviewer,
  };
}

/** 原 `$Me` / 压缩导出 `rX`。 */
export function resolveApprovalsReviewer(
  config: PermissionCliConfig | null | undefined,
): ApprovalsReviewer {
  const reviewer: unknown = config?.approvals_reviewer;
  return (reviewer !== "user" &&
    reviewer !== "auto_review" &&
    reviewer !== "guardian_subagent") ||
    (reviewer === "guardian_subagent" &&
      isGuardianApprovalEnabled(config) === false)
    ? "user"
    : reviewer;
}

function createPermissionStateFromCliConfig(
  workspaceRoots: string[],
  config: PermissionCliConfig | null | undefined,
): RuntimePermissionState {
  const reviewer = resolveApprovalsReviewer(config);
  switch (config?.sandbox_mode) {
    case "danger-full-access":
      return createDangerFullAccessPermissionState(
        config.approval_policy,
        reviewer,
        null,
      );
    case "read-only":
      return createReadOnlyPermissionState(
        config.approval_policy,
        reviewer,
        null,
      );
    case "workspace-write":
      return createWorkspaceWritePermissionState(
        workspaceRoots,
        config.sandbox_workspace_write,
        config.approval_policy,
        reviewer,
        null,
      );
    case null:
    case undefined:
      return createReadOnlyPermissionState(
        config?.approval_policy,
        reviewer,
        null,
      );
  }
}

/** 原 `zL` / 压缩导出 `$Y`。 */
export function createPermissionStateForPreset(
  preset: PermissionPreset,
  workspaceRoots: string[],
  config?: PermissionCliConfig | null,
): RuntimePermissionState {
  switch (preset) {
    case "read-only":
      return {
        ...createReadOnlyPermissionState(),
        runtimeWorkspaceRoots: workspaceRoots,
      };
    case "full-access":
      return {
        ...createDangerFullAccessPermissionState(),
        runtimeWorkspaceRoots: workspaceRoots,
      };
    case "auto":
      return createWorkspaceWritePermissionState(workspaceRoots);
    case "granular":
      return createWorkspaceWritePermissionState(
        workspaceRoots,
        undefined,
        GRANULAR_APPROVAL_POLICY,
      );
    case "guardian-approvals":
      if (
        config?.sandbox_mode === "read-only" &&
        (config.approval_policy === "on-request" ||
          config.approval_policy == null)
      ) {
        return {
          ...createReadOnlyPermissionState(undefined, "guardian_subagent"),
          runtimeWorkspaceRoots: workspaceRoots,
        };
      }
      if (
        config?.sandbox_mode === "workspace-write" &&
        (config.approval_policy === "on-request" ||
          config.approval_policy == null)
      ) {
        return createWorkspaceWritePermissionState(
          workspaceRoots,
          config.sandbox_workspace_write,
          undefined,
          "guardian_subagent",
          null,
        );
      }
      return createWorkspaceWritePermissionState(
        workspaceRoots,
        undefined,
        undefined,
        "guardian_subagent",
      );
    case "custom":
      return createPermissionStateFromCliConfig(workspaceRoots, config);
  }
}

/** 原 `KMe` / 压缩导出 `mX`。 */
export function getAvailablePermissionPresets(
  requirements: PermissionRequirements | null | undefined,
  config: PermissionCliConfig | null | undefined,
): PermissionPreset[] {
  const builtIns = listAllowedPermissionPresets(requirements);
  const hasExplicitConfig = Boolean(
    config?.approval_policy || config?.sandbox_mode,
  );
  const customState = hasExplicitConfig
    ? createPermissionStateFromCliConfig([], config)
    : null;
  return requirements?.allowedPermissionProfiles == null &&
    customState != null &&
    meetsPermissionRequirements(
      requirements,
      toSandboxMode(customState.sandboxPolicy),
      customState.approvalPolicy,
      customState.approvalsReviewer,
    )
    ? [...builtIns, "custom"]
    : builtIns;
}

/** 原 `qMe` / 压缩导出 `hX`。 */
export function selectPreferredPermissionPreset(
  presets: readonly PermissionPreset[],
): PermissionPreset {
  for (const preset of PREFERRED_PERMISSION_PRESETS) {
    if (presets.includes(preset)) return preset;
  }
  return DEFAULT_PERMISSION_PRESET;
}

function isDefaultWorkspaceWriteConfig(
  config: SandboxWorkspaceWriteConfig | undefined,
): boolean {
  return (
    config == null ||
    ((config.writable_roots?.length ?? 0) === 0 &&
      (config.network_access ?? false) === false &&
      (config.exclude_slash_tmp ?? false) === false &&
      (config.exclude_tmpdir_env_var ?? false) === false)
  );
}

/** 原 `tNe` / 压缩导出 `iX`。 */
export function inferPermissionPresetFromConfig(
  config: PermissionCliConfig | null | undefined,
  defaultPreset: PermissionPreset = "auto",
): PermissionPreset | null {
  const sandboxMode = config?.sandbox_mode ?? null;
  const approvalPolicy = config?.approval_policy ?? null;
  if (sandboxMode == null && approvalPolicy == null) return defaultPreset;
  const isOnRequest = approvalPolicy === "on-request" || approvalPolicy == null;
  if ((sandboxMode === "read-only" || sandboxMode == null) && isOnRequest) {
    return "read-only";
  }
  if (
    sandboxMode === "workspace-write" &&
    isDefaultWorkspaceWriteConfig(config?.sandbox_workspace_write)
  ) {
    if (isGranularApprovalPolicy(approvalPolicy)) return "granular";
    if (isOnRequest) {
      return approvalPolicy != null && defaultPreset === "guardian-approvals"
        ? "guardian-approvals"
        : "auto";
    }
  }
  return sandboxMode === "danger-full-access" &&
    (approvalPolicy === "never" || approvalPolicy == null)
    ? "full-access"
    : null;
}

/** 原 `BL` / 压缩导出 `fX`。 */
export function isGuardianApprovalEnabled(
  config: PermissionCliConfig | null | undefined,
): boolean | undefined {
  return getBooleanFeatureFlag(config, GUARDIAN_APPROVAL_FEATURE);
}

/** 原 `UL` / 压缩导出 `sX`。 */
export function initializePermissionProfiles(): void {}
