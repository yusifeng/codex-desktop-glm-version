// shared chunk：沙箱权限档（sandbox-permissions 分区，settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L16,345-16,533 区段：
//   - l_ = `guardian_approval` 特性开关名
//   - u_/d_：权限档 id 列表（d_ 不含 custom——可选项；u_ 全量）
//   - f_：read-only 沙箱策略（无网络）
//   - p_：granular 档的审批策略（sandbox_approval/rules/skill_approval
//     关、request_permissions/mcp_elicitations 开）
//   - g_：五档定义表（permissionProfileId + sandboxMode +
//     approvalPolicy + approvalsReviewer）
//   - m_：自动审批者判定（auto_review / guardian_subagent）
//   - h_：config 里的 features.<name> 布尔读取（扁平/嵌套双形态）
//   - __：sandboxPolicy → 沙箱模式字符串（externalSandbox → null）
//   - v_/y_：permissions 序列化（profile 优先，否则 sandbox）
//   - b_：runtimeWorkspaceRoots 提取
//   - x_：可用权限档列表（含条件性 custom——受 config 的
//     approval_policy/sandbox_mode 约束时追加）
//   - S_（Fd）：单档可用性（allowedSandboxModes/allowedApprovalPolicies
//     模糊匹配 c_/allowedApprovalsReviewers + 自动审批者豁免）
//   - C_/w_：d_ 过滤
//   - T_（kd）：workspaceWrite 档构造（writableRoots = roots +
//     config 增量、excludeSlashTmp/excludeTmpdirEnvVar/networkAccess、
//     profile 缺省 :workspace）
//   - E_（Od）：read-only 档构造（profile 缺省 :read-only）
//   - D_：danger-full-access 档构造（profile 缺省 :danger-full-access）
//   - O_：从 config（approval_policy/sandbox_mode/
//     sandbox_workspace_write/approvals_reviewer）构造档
//   - k_（Dd）：档 id + roots → permissions（granular/
//     guardian-approvals 的 config 感知降级）
//   - A_（Ad）：approvals_reviewer 归一（guardian_subagent 需
//     guardian_approval 特性，否则回 user）
//
// 消费方（经 @chunk/shared 别名 import 的已重写模块）：
//   threads/hydration.ts、threads/maybe-resume.ts、
//   threads/archived-preview.ts、turns/history-requests.ts
//   （kd/Od/Nd/jd = permissionsForRoots/defaultPermissions/
//   permissionParamsOf/runtimeWorkspaceRootsOf）。
//
// 兼容导出（17 个压缩名）：Md=__、Pd=m_、Nd=y_、jd=b_、kd=T_、
// Od=E_、Dd=k_、Ad=A_、Fd=S_、Id=x_、Ld=s_。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 沙箱策略。 */
export type SandboxPolicy =
  | { type: "readOnly"; networkAccess: boolean }
  | { type: "workspaceWrite"; writableRoots: string[]; excludeSlashTmp: boolean; excludeTmpdirEnvVar: boolean; networkAccess: boolean }
  | { type: "dangerFullAccess" }
  | { type: "externalSandbox" };

/** 审批策略（字符串或 granular 结构）。 */
export type ApprovalPolicy =
  | string
  | {
      granular: {
        sandbox_approval: boolean;
        rules: boolean;
        skill_approval: boolean;
        request_permissions: boolean;
        mcp_elicitations: boolean;
      };
    };

/** 审批者。 */
export type ApprovalsReviewer = "user" | "auto_review" | "guardian_subagent";

/** 活动权限档。 */
export interface ActivePermissionProfile {
  id: string;
  extends: string | null;
}

/** 权限档（thread start 的 permissions 形态）。 */
export interface PermissionSet {
  activePermissionProfile: ActivePermissionProfile | null;
  sandboxPolicy: SandboxPolicy;
  approvalPolicy: ApprovalPolicy;
  approvalsReviewer: ApprovalsReviewer;
  runtimeWorkspaceRoots?: string[];
}

/** app-server config（沙箱相关字段）。 */
export interface SandboxConfig {
  approval_policy?: string | null;
  sandbox_mode?: string | null;
  sandbox_workspace_write?: {
    writable_roots?: string[];
    exclude_slash_tmp?: boolean;
    exclude_tmpdir_env_var?: boolean;
    network_access?: boolean;
  } | null;
  approvals_reviewer?: string | null;
  [key: string]: unknown;
}

/** 档约束（host 下发的允许集）。 */
export interface PermissionConstraints {
  allowedPermissionProfiles?: Record<string, boolean> | null;
  allowedSandboxModes?: string[] | null;
  allowedApprovalPolicies?: string[] | null;
  allowedApprovalsReviewers?: string[] | null;
}

// ---------------------------------------------------------------------------
// 常量（原 `l_`/`u_`/`d_`/`f_`/`p_`/`g_`）
// ---------------------------------------------------------------------------

/** guardian 审批特性开关名（原 `l_`）。 */
const GUARDIAN_APPROVAL_FEATURE = "guardian_approval";

/** 全量权限档 id（原 `u_`）。 */
export const PERMISSION_PROFILE_KINDS = ["read-only", "auto", "granular", "guardian-approvals", "full-access", "custom"] as const;

/** 可选权限档 id（原 `d_`，不含 custom）。 */
export const SELECTABLE_PERMISSION_PROFILE_KINDS = ["read-only", "auto", "granular", "guardian-approvals", "full-access"] as const;

/** read-only 沙箱策略（原 `f_`）。 */
const READ_ONLY_POLICY: SandboxPolicy = { type: "readOnly", networkAccess: false };

/** granular 审批策略（原 `p_`）。 */
const GRANULAR_APPROVAL_POLICY: ApprovalPolicy = {
  granular: {
    sandbox_approval: false,
    rules: false,
    skill_approval: false,
    request_permissions: true,
    mcp_elicitations: true,
  },
};

/** 档定义表（原 `g_`）。 */
const PERMISSION_PROFILE_TABLE: Record<string, { permissionProfileId: string; sandboxMode: string; approvalPolicy: ApprovalPolicy; approvalsReviewer: ApprovalsReviewer }> = {
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

// ---------------------------------------------------------------------------
// 辅助（原 `m_`/`h_`/`A_`/`Lte`）
// ---------------------------------------------------------------------------

/** 自动审批者判定（原 `m_`，导出 `Pd`）。 */
export function isAutomaticApprovalsReviewer(reviewer: string): boolean {
  return reviewer === "auto_review" || reviewer === "guardian_subagent";
}

/** config 特性读取（原 `h_`：扁平 features.<name> 或嵌套 features.name）。 */
function configFeatureFlag(config: Record<string, unknown> | null | undefined, feature: string): boolean | undefined {
  const flat = config?.[`features.${feature}`];
  if (typeof flat === "boolean") return flat;
  const features = config?.features;
  if (typeof features != "object" || !features || Array.isArray(features)) return undefined;
  const value = Object.getOwnPropertyDescriptor(features, feature)?.value;
  return typeof value === "boolean" ? value : undefined;
}

/** guardian_approval 特性判定（原 `Lte`）。 */
function guardianApprovalEnabled(config: Record<string, unknown> | null | undefined): boolean {
  return configFeatureFlag(config, GUARDIAN_APPROVAL_FEATURE) === true;
}

/** 审批者归一（原 `A_`，导出 `Ad`）。 */
export function normalizeApprovalsReviewer(config: SandboxConfig | null | undefined): ApprovalsReviewer {
  const reviewer = config?.approvals_reviewer;
  return (reviewer !== "user" && reviewer !== "auto_review" && reviewer !== "guardian_subagent") ||
    (reviewer === "guardian_subagent" && guardianApprovalEnabled(config) === false)
    ? "user"
    : reviewer;
}

// ---------------------------------------------------------------------------
// 序列化与提取（原 `__`/`v_`/`y_`/`b_`）
// ---------------------------------------------------------------------------

/** sandboxPolicy → 模式字符串（原 `__`，导出 `Md`；externalSandbox → null）。 */
export function sandboxModeOfPolicy(policy: SandboxPolicy): string | null {
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

/** permissions 参数形态（原 `y_`，导出 `Nd`：profile id 或 sandboxPolicy）。 */
export function permissionParamsOf(permissions: PermissionSet): { permissions?: string; sandboxPolicy?: SandboxPolicy } {
  return permissions.activePermissionProfile == null
    ? { sandboxPolicy: permissions.sandboxPolicy }
    : { permissions: permissions.activePermissionProfile.id };
}

/** runtime roots 提取（原 `b_`，导出 `jd`）。 */
export function runtimeWorkspaceRootsOf(permissions: PermissionSet | null | undefined): string[] {
  return permissions?.runtimeWorkspaceRoots ?? [];
}

// ---------------------------------------------------------------------------
// 档构造（原 `T_`/`E_`/`D_`/`O_`/`k_`）
// ---------------------------------------------------------------------------

/** workspaceWrite 档（原 `T_`，导出 `kd`）。 */
export function workspaceWritePermissions(
  roots: string[],
  workspaceWrite?: SandboxConfig["sandbox_workspace_write"],
  approvalPolicy?: ApprovalPolicy,
  approvalsReviewer: ApprovalsReviewer = "user",
  activePermissionProfile: ActivePermissionProfile | null = workspaceWrite == null ? { id: ":workspace", extends: null } : null,
): PermissionSet {
  return {
    activePermissionProfile,
    runtimeWorkspaceRoots: roots,
    sandboxPolicy: {
      type: "workspaceWrite",
      writableRoots: [...roots, ...(workspaceWrite?.writable_roots ?? [])],
      excludeSlashTmp: workspaceWrite?.exclude_slash_tmp ?? false,
      excludeTmpdirEnvVar: workspaceWrite?.exclude_tmpdir_env_var ?? false,
      networkAccess: workspaceWrite?.network_access ?? false,
    },
    approvalPolicy: approvalPolicy ?? "on-request",
    approvalsReviewer,
  };
}

/** read-only 档（原 `E_`，导出 `Od`）。 */
export function readOnlyPermissions(
  approvalPolicy?: ApprovalPolicy,
  approvalsReviewer: ApprovalsReviewer = "user",
  activePermissionProfile: ActivePermissionProfile | null = { id: ":read-only", extends: null },
): PermissionSet {
  return {
    activePermissionProfile,
    sandboxPolicy: READ_ONLY_POLICY,
    approvalPolicy: approvalPolicy ?? "on-request",
    approvalsReviewer,
  };
}

/** danger-full-access 档（原 `D_`）。 */
export function fullAccessPermissions(
  approvalPolicy?: ApprovalPolicy,
  approvalsReviewer: ApprovalsReviewer = "user",
  activePermissionProfile: ActivePermissionProfile | null = { id: ":danger-full-access", extends: null },
): PermissionSet {
  return {
    activePermissionProfile,
    sandboxPolicy: { type: "dangerFullAccess" },
    approvalPolicy: approvalPolicy ?? "never",
    approvalsReviewer,
  };
}

/** 从 config 构造档（原 `O_`）。 */
export function permissionsFromConfig(roots: string[], config: SandboxConfig | null | undefined): PermissionSet {
  const reviewer = normalizeApprovalsReviewer(config ?? undefined);
  switch (config?.sandbox_mode) {
    case "danger-full-access":
      return fullAccessPermissions(config.approval_policy ?? undefined, reviewer, null);
    case "read-only":
      return readOnlyPermissions(config.approval_policy ?? undefined, reviewer, null);
    case "workspace-write":
      return workspaceWritePermissions(roots, config.sandbox_workspace_write, config.approval_policy ?? undefined, reviewer, null);
    case null:
    case undefined:
      return readOnlyPermissions(config?.approval_policy ?? undefined, reviewer, null);
  }
}

/**
 * 档 id + roots → permissions（原 `k_`，导出 `Dd`）。
 * guardian-approvals 按 config 的 sandbox_mode/approval_policy 降级；
 * custom 直接走 config 构造。
 */
export function permissionsForProfile(
  kind: string,
  roots: string[],
  config?: SandboxConfig | null,
): PermissionSet {
  switch (kind) {
    case "read-only":
      return { ...readOnlyPermissions(), runtimeWorkspaceRoots: roots };
    case "full-access":
      return { ...fullAccessPermissions(), runtimeWorkspaceRoots: roots };
    case "auto":
      return workspaceWritePermissions(roots);
    case "granular":
      return workspaceWritePermissions(roots, undefined, GRANULAR_APPROVAL_POLICY);
    case "guardian-approvals":
      return config?.sandbox_mode === "read-only" && (config.approval_policy === "on-request" || config.approval_policy == null)
        ? { ...readOnlyPermissions(undefined, "guardian_subagent"), runtimeWorkspaceRoots: roots }
        : config?.sandbox_mode === "workspace-write" && (config.approval_policy === "on-request" || config.approval_policy == null)
          ? workspaceWritePermissions(roots, config.sandbox_workspace_write, undefined, "guardian_subagent", null)
          : workspaceWritePermissions(roots, undefined, undefined, "guardian_subagent");
    case "custom":
      return permissionsFromConfig(roots, config);
  }
}

// ---------------------------------------------------------------------------
// 可用性（原 `S_`/`C_`/`w_`/`x_`）
// ---------------------------------------------------------------------------

/** 审批策略等价（原 `c_` 依赖的 lodash isEquivalentWith 简化：深比较）。 */
function approvalPoliciesEquivalent(a: ApprovalPolicy, b: ApprovalPolicy): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 单档可用性（原 `S_`，导出 `Fd`）。 */
export function permissionSetAllowed(
  constraints: PermissionConstraints | null | undefined,
  sandboxMode: string | null,
  approvalPolicy: ApprovalPolicy | null,
  approvalsReviewer: ApprovalsReviewer | null,
): boolean {
  if (constraints == null) return true;
  const allowedSandboxModes = constraints.allowedSandboxModes;
  if (allowedSandboxModes != null && sandboxMode != null && !allowedSandboxModes.includes(sandboxMode)) return false;
  const allowedApprovalPolicies = constraints.allowedApprovalPolicies;
  if (allowedApprovalPolicies != null && approvalPolicy != null && !allowedApprovalPolicies.some((allowed) => approvalPoliciesEquivalent(allowed, approvalPolicy)))
    return false;
  const allowedReviewers = constraints.allowedApprovalsReviewers;
  const hasAutomaticReviewer = allowedReviewers?.some(isAutomaticApprovalsReviewer) === true;
  return !(allowedReviewers != null && approvalsReviewer != null && !allowedReviewers.includes(approvalsReviewer) && !(isAutomaticApprovalsReviewer(approvalsReviewer) && hasAutomaticReviewer));
}

/** 档 id 可用性（原 `w_`）。 */
function profileKindAllowed(kind: string, constraints: PermissionConstraints | null | undefined): boolean {
  if (constraints == null) return true;
  const { permissionProfileId, sandboxMode, approvalPolicy, approvalsReviewer } = PERMISSION_PROFILE_TABLE[kind];
  return constraints.allowedPermissionProfiles != null && constraints.allowedPermissionProfiles[permissionProfileId] !== true
    ? false
    : permissionSetAllowed(constraints, sandboxMode, approvalPolicy, approvalsReviewer);
}

/** 可选档列表（原 `C_`）。 */
function selectableProfileKinds(constraints: PermissionConstraints | null | undefined): string[] {
  return SELECTABLE_PERMISSION_PROFILE_KINDS.filter((kind) => profileKindAllowed(kind, constraints));
}

/**
 * 可用权限档列表（原 `x_`，导出 `Id`）。
 * 无 profile 白名单且 config 定义了自定义沙箱且满足约束时追加 `custom`。
 */
export function availablePermissionProfileKinds(
  constraints: PermissionConstraints | null | undefined,
  config?: SandboxConfig | null,
): string[] {
  const hasCustomConfig = !!config?.approval_policy || !!config?.sandbox_mode;
  const selectable = selectableProfileKinds(constraints);
  const customPermissions = hasCustomConfig ? permissionsFromConfig([], config) : null;
  return constraints?.allowedPermissionProfiles == null &&
    customPermissions &&
    permissionSetAllowed(constraints, sandboxModeOfPolicy(customPermissions.sandboxPolicy), customPermissions.approvalPolicy, customPermissions.approvalsReviewer)
    ? [...selectable, "custom"]
    : selectable;
}

// ---------------------------------------------------------------------------
// lodash isEquals 桩（原 `s_`/`c_`，导出 `Ld`——sparkle-manager 等
// 以 isEqual 语义消费；深比较语义等价）
// ---------------------------------------------------------------------------

/** 深等价（原 `s_`/`c_` 的 lodash isEqual 门面，导出 `Ld`）。 */
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a == null || b == null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEquals(item, b[index]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => key in b && deepEquals((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

// ---------------------------------------------------------------------------
// 兼容导出（sandbox-permissions 分区）
// ---------------------------------------------------------------------------

export {
  sandboxModeOfPolicy as Md,
  isAutomaticApprovalsReviewer as Pd,
  permissionParamsOf as Nd,
  runtimeWorkspaceRootsOf as jd,
  workspaceWritePermissions as kd,
  readOnlyPermissions as Od,
  permissionsForProfile as Dd,
  normalizeApprovalsReviewer as Ad,
  permissionSetAllowed as Fd,
  availablePermissionProfileKinds as Id,
  deepEquals as Ld,
};
