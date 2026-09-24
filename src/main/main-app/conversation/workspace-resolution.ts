// runtime 家族比较 + workspace state 推导（原版 48,307-48,422 区段）。
//
// 职责：
//   - 运行时（runtime）版本与家族比较：`luna`/`terra`/`sol` 家族序是产品
//     钉死的兼容分界（同 R1+R2 §7.10），逐字保留；
//   - thread workspace state 的 zod schema 与「applied/pending」视图推导；
//   - sandbox writableRoots 与 workspace roots 的集合运算（去重合并/差集）。
//
// 消费方：turn-dispatch（resolveTurnPermissionsAndWorkspace）、
// app-server-manager 的 workspace 方法组。

import {
  wf as zObject,
  hf as zArray,
  Of as zString,
  la as zUnknownSchema,
  _l as normalizePath,
} from "@chunk/shared";
// R3 threads/operations 的路径/沙箱集合运算（原 Nx/Ox/kx/Ax）。
import {
  mergeUnique as mergeUniqueRoots,
  expandSandboxWritableRoots,
  sandboxMissingRoots,
  filterCompatibleRoots,
} from "../threads/operations";

// ---------------------------------------------------------------------------
// runtime 家族与版本比较
// ---------------------------------------------------------------------------

/**
 * runtime 家族序（原 rC）。有意钉死的兼容分界——家族名与顺序逐字保留，
 * 勿「规范化」。
 */
export const RUNTIME_FAMILY_ORDER = [`luna`, `terra`, `sol`] as const;

/** runtime 版本串解析：`<family>-<version>[-…]`（大小写不敏感）。 */
const RUNTIME_VERSION_PATTERN = /^(?<family>[a-z][a-z0-9-]*?)-(?<version>\d+(?:\.\d+)*)(?:-|$)/iu;

/**
 * 比较两个 runtime 版本串：同 family 按版本号比较（正数 = e 新），不同
 * family 或不可解析返回 null；相等返回 0。
 */
export function compareRuntimeVersions(left: string, right: string): number | null {
  if (left === right) return 0;
  let parsedLeft = parseRuntimeVersion(left);
  let parsedRight = parseRuntimeVersion(right);
  if (parsedLeft == null || parsedRight == null || parsedLeft.family !== parsedRight.family) return null;
  return compareVersionParts(parsedLeft.parts, parsedRight.parts);
}

/**
 * 判定 left 是否比 right「更新」：同 family 按版本号；否则按家族序
 * （luna < terra < sol，序外家族视为最旧）。
 */
export function isNewerRuntimeModel(left: string, right: string): boolean {
  if (left === right) return false;
  let comparison = compareRuntimeVersions(right, left);
  if (comparison != null && comparison !== 0) return comparison > 0;
  let leftFamily = detectRuntimeFamily(left);
  let rightFamily = detectRuntimeFamily(right);
  return (
    leftFamily != null &&
    rightFamily != null &&
    (RUNTIME_FAMILY_ORDER as readonly string[]).indexOf(rightFamily) >
      (RUNTIME_FAMILY_ORDER as readonly string[]).indexOf(leftFamily)
  );
}

/** 解析 `<family>-<major.minor…>` 形态的 runtime 版本串。 */
function parseRuntimeVersion(value: string) {
  let match = RUNTIME_VERSION_PATTERN.exec(value);
  let family = match?.groups?.family;
  let version = match?.groups?.version;
  return family == null || version == null
    ? null
    : { family: family.toLowerCase(), parts: version.split(`.`).map(Number) };
}

/** 逐段比较版本号数组（缺段按 0）。 */
function compareVersionParts(left: number[], right: number[]): number {
  let length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    let difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** 从版本串的词元里探测唯一命中的家族名（无或多命中返回 null）。 */
function detectRuntimeFamily(value: string) {
  let tokens = value.toLowerCase().split(/[^a-z0-9]+/u);
  let families = (RUNTIME_FAMILY_ORDER as readonly string[]).filter((family) => tokens.includes(family));
  return families.length === 1 ? (families[0] ?? null) : null;
}

// ---------------------------------------------------------------------------
// workspace state schema 与推导
// ---------------------------------------------------------------------------

/** workspace 应用态（projectSources/cwd/runtimeWorkspaceRoots）。 */
const workspaceSchema = zObject({
  projectSources: zArray(zString()),
  cwd: zString(),
  runtimeWorkspaceRoots: zArray(zString()),
});

/** thread workspace state（revision/project/applied/pending）。 */
const threadWorkspaceStateSchema = zObject({
  revision: zString(),
  project: zUnknownSchema.nullable(),
  projectMembership: zUnknownSchema.optional(),
  projectMembershipRevision: zString().optional(),
  applied: workspaceSchema.nullable(),
  pending: workspaceSchema.nullable(),
});

/** 宽松解析 thread workspace state（失败返回原值——safeParse().data 语义）。 */
export function parseThreadWorkspaceState(value: unknown) {
  return threadWorkspaceStateSchema.safeParse(value).data;
}

/** 应用新 revision：pending 提升为 applied（克隆），过期 pending 清空。 */
export function applyWorkspaceRevision(state: any, revision: string, applied: any) {
  if (state != null) return { ...state, applied: cloneWorkspace(applied), pending: state.revision === revision ? null : state.pending };
}

/** 归一 workspace：缺省数组回填 cwd。 */
export function normalizeWorkspace({ cwd, projectSources, runtimeWorkspaceRoots }: {
  cwd: string | null | undefined;
  projectSources?: string[];
  runtimeWorkspaceRoots?: string[];
}) {
  return cwd == null
    ? null
    : {
        projectSources: [...(projectSources ?? [cwd])],
        cwd,
        runtimeWorkspaceRoots: [...(runtimeWorkspaceRoots ?? [cwd])],
      };
}

/** 克隆 workspace（数组字段复制）。 */
function cloneWorkspace(workspace: any) {
  return {
    ...workspace,
    projectSources: [...workspace.projectSources],
    runtimeWorkspaceRoots: [...workspace.runtimeWorkspaceRoots],
  };
}

/**
 * 推导当前生效的 workspace 视图：
 *   - 无 environment：state 的 applied/pending（applied 缺省按 cwd 归一）；
 *   - 有 environment：environment 的 cwd/roots 即 applied，无 pending。
 */
export function resolveWorkspaceView({ conversationCwd, environment, runtimeWorkspaceRoots, state }: {
  conversationCwd: string | null | undefined;
  environment: any;
  runtimeWorkspaceRoots: string[] | null | undefined;
  state: any;
}) {
  return environment == null
    ? {
        applied: state?.applied ?? normalizeWorkspace({ cwd: conversationCwd, runtimeWorkspaceRoots }),
        pendingRevision: state?.pending == null ? null : state.revision,
        workspace: state?.pending ?? null,
      }
    : {
        applied: normalizeWorkspace({
          cwd: environment.cwd,
          runtimeWorkspaceRoots: environment.runtimeWorkspaceRoots ?? undefined,
        }),
        pendingRevision: null,
        workspace: null,
      };
}

/** workspaceWrite 沙箱按 pending workspace 的 roots 收窄。 */
export function applyPendingWorkspaceToSandbox(sandboxPolicy: any, appliedRoots: string[], pendingWorkspace: any) {
  return sandboxPolicy.type === `workspaceWrite`
    ? { ...sandboxPolicy, writableRoots: subtractWritableRoots(sandboxPolicy.writableRoots, appliedRoots, pendingWorkspace.runtimeWorkspaceRoots) }
    : sandboxPolicy;
}

/** writableRoots 中去掉 excluded（按归一化路径比较），再合并 keep。 */
export function subtractWritableRoots(roots: string[], excluded: string[], keep: string[]) {
  let excludedSet = new Set(excluded.map(normalizePath));
  return mergeUniqueRoots(
    roots.filter((root) => !excludedSet.has(normalizePath(root))),
    keep,
  );
}

/** 收集 workspace 相关根（applied 的全部 roots，或仅 fallback）。 */
export function collectWorkspaceRoots(applied: any, fallbackRoot: string | null | undefined) {
  return applied == null ? (fallbackRoot == null ? [] : [fallbackRoot]) : mergeUniqueRoots(applied.runtimeWorkspaceRoots, applied.projectSources);
}

/** 是否应走 projectless workspace（无 cwd/pending 且无 project 归属）。 */
export async function shouldUseProjectlessWorkspace({ environmentCwd, hasPendingWorkspace, state, isProjectlessConversation, workspaceKind }: {
  environmentCwd: string | null | undefined;
  hasPendingWorkspace: boolean;
  state: any;
  isProjectlessConversation: () => Promise<boolean>;
  workspaceKind: string | null | undefined;
}) {
  return environmentCwd != null || hasPendingWorkspace
    ? false
    : state == null
      ? workspaceKind === `projectless` || (await isProjectlessConversation())
      : state.project == null && state.applied == null;
}

/** 推导当前 workspace kind（project / projectless / 沿用当前值）。 */
export function resolveWorkspaceKind({ currentWorkspaceKind, hasPendingWorkspace, hasProjectlessWorkspace, state }: {
  currentWorkspaceKind: string | null | undefined;
  hasPendingWorkspace: boolean;
  hasProjectlessWorkspace: boolean;
  state: any;
}) {
  return hasPendingWorkspace || state?.project != null
    ? `project`
    : hasProjectlessWorkspace || (state != null && state.project == null)
      ? `projectless`
      : currentWorkspaceKind;
}

/** 多 agent 模式的显式请求门（原 lC，钉死常量）。 */
export const MULTI_AGENT_MODE_EXPLICIT_REQUEST_ONLY = `explicitRequestOnly`;
