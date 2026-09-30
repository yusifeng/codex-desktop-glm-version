// turn 派发核心（原版 48,423-49,333 区段）。
//
// 职责：
//   - resolveTurnPermissionsAndWorkspace（Vxe）：startTurn 前的权限/工作区
//     大推导——environment/pending workspace/projectless 三路 workspace 归并、
//     approvalPolicy/sandboxPolicy/permissions 的请求→线程设置→当前权限→
//     默认四级回退、model/effort/summary/personality/serviceTier 解析；
//   - prepareTurnDispatch（qxe）：包装 dispatch 所需的 resume roots、
//     prepare 回调、follower 中止口与 didStart（首 turn 标题请求）；
//   - createExecuteTurnStart（Zxe）：executeTurnStart 工厂——空请求复用
//     in-flight promise（按会话去重），非空请求走 executeTurnStartCore；
//   - executeTurnStartCore（Qxe）：owner 校验 → follower 委托（R3 ny）→
//     状态更新（追加 inProgress turn）→ thread/inject_items → turn/start →
//     失败回滚（含 outcome-unknown 缓冲）→ 接受后 workspace 提交。
//
// 原压缩名对照：Vxe→resolveTurnPermissionsAndWorkspace、Hxe→
// resolveActivePermissionProfile、Uxe→resolveSandboxPolicyFromPermissions、
// Wxe→loadThreadWritableRootsSafe、uC→ensureWritableRoot、Gxe→
// isProjectlessConversationSafe、Kxe→resolveProjectlessWorkspace、qxe→
// prepareTurnDispatch、Jxe→buildTurnCapabilities、Yxe→prepareTurnRequest、
// Xxe→lastTurnUsedAppServerPermissionDefault、dC→findTurnByClientUserMessageId、
// fC→assertNoUnconfirmedSubmission、pC→recordUnconfirmedSubmission、mC→
// clearUnconfirmedSubmission、Zxe→createExecuteTurnStart、hC→
// runTurnStartWithObservation、Qxe→executeTurnStartCore。

import {
  $u as normalizeThreadId,
  Cs as isDurableHost,
  Gn as isWriterConflictError,
  kd as defaultSandboxConfig,
  Od as defaultSandboxPolicy,
  mr as DeliveryError,
  Zo as errorToString,
  Wu as versionSupportsFeature,
  Zi as stripTurnRequestForVersion,
  _l as normalizePath,
  gl as isSamePath,
} from "@chunk/shared";
// R3 canonical-history（turn 视图与追加/定位/修改）。
import {
  mergedConversationTurns,
  lastTurnWithTurnId,
  lastIncompleteTurn,
  latestTurn,
  lastTurn,
  findDraftTurn,
  removeTurn,
} from "../turns/canonical-history";
// T_（31,567）= 会话追加单 turn——R3 turns/canonical-history 尚未导出该
// 符号（appendConversationTurn），落地后改为命名导出（缺导出已记录）。
import * as canonicalHistoryModule from "../turns/canonical-history";
const appendConversationTurn: (conversation: any, turn: any, createId: () => string) => any =
  (canonicalHistoryModule as any).appendConversationTurn;
// R3 threads/operations（沙箱/根集合运算，原 Nx/Ox/kx/Ax/Px）。
import {
  mergeUnique,
  expandSandboxWritableRoots,
  sandboxMissingRoots,
  filterCompatibleRoots,
  isWriterConflictError as isWriterConflict,
} from "../threads/operations";
// R3 workspace/config（cwd/沙箱/配置读取，原 nx/pye/rx/ix/ax/yx/_x）。
import {
  extractProjectlessRoot,
  findProjectlessRootFromRoots,
  resolveThreadCwd,
  firstWritableRoot,
  resolveWorkspaceSandboxPolicy,
  readThreadCodexConfigSafe,
} from "../workspace/config";
// R3 threads/start-config（service tier 解析，原 mx）。
import { resolveServiceTier } from "../threads/start-config";
// R3 files/open-file-watches 的 follower 委托（原 ny）。
import { delegateTurnStartToFollower } from "../files/follower-delegation";
// R3 超时常量（ym=30s）与 owner 窗口错误文案（xm）——经 start-config 模块。
import { TURN_START_TIMEOUT_MS, OWNER_WINDOW_ERROR } from "../threads/start-config";
import { extractWritingBlockContext } from "../markdown/writing-blocks";
import {
  MULTI_AGENT_MODE_EXPLICIT_REQUEST_ONLY,
  resolveWorkspaceView,
  resolveWorkspaceKind,
  shouldUseProjectlessWorkspace,
  collectWorkspaceRoots,
  applyPendingWorkspaceToSandbox,
  subtractWritableRoots,
  isNewerRuntimeModel,
} from "./workspace-resolution";

// ---------------------------------------------------------------------------
// 权限/工作区推导（Vxe 及其辅助）
// ---------------------------------------------------------------------------

/** 按权限 profile id 或 `:danger-full-access`/`:workspace` 快捷值解析沙箱。 */
function resolveSandboxPolicyFromPermissions(permissions: string | null | undefined, runtimeWorkspaceRoots: string[] | null | undefined) {
  return permissions === `:danger-full-access`
    ? { type: `dangerFullAccess` }
    : permissions === `:workspace` && runtimeWorkspaceRoots != null
      ? defaultSandboxConfig(runtimeWorkspaceRoots).sandboxPolicy
      : null;
}

/** 读线程可写根（失败告警回退空表）。 */
async function loadThreadWritableRootsSafe(manager: any, conversationId: string) {
  try {
    return await manager.getThreadWritableRoots(conversationId);
  } catch (error) {
    manager.logger.warning(`Failed to load thread writable roots`, {
      safe: { conversationId },
      sensitive: { error },
    });
    return [];
  }
}

/** workspaceWrite 沙箱确保包含 root（已含则原样返回）。 */
function ensureWritableRoot(sandboxPolicy: any, root: string) {
  return sandboxPolicy.type !== `workspaceWrite` || sandboxPolicy.writableRoots.includes(root)
    ? sandboxPolicy
    : { ...sandboxPolicy, writableRoots: [...sandboxPolicy.writableRoots, root] };
}

/** 判定会话是否 projectless（失败告警回退 false）。 */
async function isProjectlessConversationSafe(manager: any, conversationId: string) {
  try {
    return await manager.isProjectlessConversation(conversationId);
  } catch (error) {
    manager.logger.warning(`Failed to load projectless conversation membership`, {
      safe: { conversationId },
      sensitive: { error },
    });
    return false;
  }
}

/**
 * 解析 projectless workspace：cwd 已在 Documents/Codex 下则直接用；
 * 否则从保留根里找 projectless 根；再否则按 workspaceBrowserRoot 推导；
 * 最后才让 manager 生成全新 projectless 工作区（标题取输入文本）。
 */
async function resolveProjectlessWorkspace({
  manager,
  conversationState,
  retainedWritableRoots,
  input,
}: {
  manager: any;
  conversationState: any;
  retainedWritableRoots: string[];
  input: any[];
}) {
  let cwd = conversationState.cwd;
  let cwdProjectlessRoot = extractProjectlessRoot(cwd);
  if (cwd != null && cwdProjectlessRoot != null) return { cwd, workspaceRoot: cwdProjectlessRoot };
  let fromRoots = findProjectlessRootFromRoots(retainedWritableRoots);
  if (fromRoots != null) return fromRoots;
  if (
    conversationState.workspaceKind === `projectless` &&
    conversationState.workspaceBrowserRoot != null &&
    conversationState.workspaceBrowserRoot !== `~`
  ) {
    let resolvedCwd = resolveThreadCwd({
      cwd: conversationState.cwd,
      fallbackCwd: conversationState.workspaceBrowserRoot,
      workspaceBrowserRoot: conversationState.workspaceBrowserRoot,
      workspaceKind: conversationState.workspaceKind,
    });
    if (resolvedCwd != null) return { cwd: resolvedCwd, workspaceRoot: conversationState.workspaceBrowserRoot };
  }
  return manager.createProjectlessThreadWorkspace(
    input
      .filter((item: any) => item.type === `text`)
      .map((item: any) => item.text)
      .join(``)
      .trim() || null,
  );
}

/**
 * startTurn 前的权限/工作区大推导（原 Vxe，~330 行）。
 * 返回 { request, params, useAppServerPermissionDefault, permissions, model,
 * reasoningEffort, shouldUpdateReasoningEffort, collaborationMode,
 * pendingWorkspace, projectlessWorkspace, environments, shouldShowModelChange,
 * workspaceCommit }。
 */
async function resolveTurnPermissionsAndWorkspace(
  manager: any,
  conversationId: string,
  operation: any,
  clientUserMessageId: string,
  additionalContext: Record<string, unknown> | undefined,
  conversationState: any,
  capabilities: any,
) {
  let request = operation.request;
  let {
    inheritThreadSettings: inheritSettings = true,
    useAppServerPermissionDefault,
    usePermissionSelection = false,
  } = operation.context ?? {};
  let environment = conversationState.environments?.[0];
  let environmentCwd = environment?.cwd;
  let hasEnvironment = environment != null;
  let environmentRoots = hasEnvironment ? environment.runtimeWorkspaceRoots : undefined;
  let fallbackCwd = environmentCwd ?? conversationState.cwd;
  let workspaceState = manager.getThreadWorkspaceState(conversationId);
  let retainedWritableRoots = hasEnvironment
    ? (environmentRoots ?? [environment.cwd])
    : await loadThreadWritableRootsSafe(manager, conversationId);
  let { applied, pendingRevision, workspace: pendingWorkspace } = resolveWorkspaceView({
    conversationCwd: conversationState.cwd,
    environment: hasEnvironment ? environment : undefined,
    runtimeWorkspaceRoots: conversationState.currentPermissions?.runtimeWorkspaceRoots,
    state: workspaceState,
  });
  let effectivePendingWorkspace =
    pendingWorkspace == null || environmentCwd == null ? pendingWorkspace : { ...pendingWorkspace, cwd: environmentCwd };
  let appliedRoots = collectWorkspaceRoots(applied, fallbackCwd).filter(
    (root: unknown): root is string => typeof root === `string`,
  );
  let projectlessWorkspace =
    capabilities.canUseProjectlessWorkspace &&
    (await shouldUseProjectlessWorkspace({
      environmentCwd,
      hasPendingWorkspace: effectivePendingWorkspace != null,
      state: workspaceState,
      isProjectlessConversation: () => isProjectlessConversationSafe(manager, conversationId),
      workspaceKind: conversationState.workspaceKind,
    }))
      ? await resolveProjectlessWorkspace({
          manager,
          conversationState,
          retainedWritableRoots,
          input: request.input,
        })
      : null;
  let workspaceKind = resolveWorkspaceKind({
    currentWorkspaceKind: conversationState.workspaceKind,
    hasPendingWorkspace: effectivePendingWorkspace != null,
    hasProjectlessWorkspace: projectlessWorkspace != null,
    state: workspaceState,
  });
  let workspaceBrowserRoot =
    workspaceKind === `projectless`
      ? (projectlessWorkspace?.workspaceRoot ?? conversationState.workspaceBrowserRoot ?? null)
      : null;
  let threadSettings = inheritSettings ? conversationState.latestThreadSettings : null;
  let inheritedCollaborationMode =
    threadSettings?.collaborationMode ?? (inheritSettings ? conversationState.latestCollaborationMode : null);
  let requestedCollaborationMode = request.collaborationMode ?? inheritedCollaborationMode;
  let collaborationMode = capabilities.getRequestCollaborationMode(requestedCollaborationMode);
  let hasRequestCollaborationMode = request.collaborationMode != null;
  let inheritedModel = threadSettings?.model ?? (inheritSettings ? conversationState.latestModel : null);
  let inheritedEffort =
    threadSettings?.effort === undefined
      ? inheritSettings
        ? conversationState.latestReasoningEffort
        : null
      : threadSettings.effort;
  let requestedModel = hasRequestCollaborationMode ? null : (request.model ?? inheritedModel)?.trim() || null;
  let model = capabilities.getRequestModel(requestedModel);
  let reasoningEffort = hasRequestCollaborationMode
    ? null
    : request.effort === undefined
      ? inheritedEffort
      : request.effort;
  let latestTurn = lastTurnWithTurnId(conversationState);
  let latestTurnParams = inheritSettings ? (latestTurn?.params ?? null) : null;
  let requestHasPermissionOverrides =
    request.approvalPolicy != null ||
    request.approvalsReviewer != null ||
    request.sandboxPolicy != null ||
    request.permissions !== undefined;
  let useServerDefaultPermissions =
    usePermissionSelection ||
    (useAppServerPermissionDefault ?? (!requestHasPermissionOverrides && capabilities.latestUseAppServerPermissionDefault));
  let defaultPermissions = defaultSandboxConfig(
    workspaceKind === `projectless` && workspaceBrowserRoot != null && workspaceBrowserRoot !== `~`
      ? [workspaceBrowserRoot]
      : [],
  );
  let approvalPolicy =
    request.approvalPolicy ??
    threadSettings?.approvalPolicy ??
    latestTurn?.params.approvalPolicy ??
    conversationState.currentPermissions?.approvalPolicy ??
    defaultPermissions.approvalPolicy;
  let requestedSandboxPolicy = resolveSandboxPolicyFromPermissions(
    request.permissions ??
      threadSettings?.activePermissionProfile?.id ??
      threadSettings?.permissions ??
      conversationState.currentPermissions?.activePermissionProfile?.id ??
      latestTurnParams?.permissions,
    environmentRoots ??
      request.runtimeWorkspaceRoots ??
      conversationState.currentPermissions?.runtimeWorkspaceRoots ??
      latestTurnParams?.runtimeWorkspaceRoots,
  );
  let sandboxPolicy =
    request.sandboxPolicy ??
    requestedSandboxPolicy ??
    threadSettings?.sandboxPolicy ??
    latestTurn?.params.sandboxPolicy ??
    conversationState.currentPermissions?.sandboxPolicy ??
    defaultPermissions.sandboxPolicy;
  let sandboxWithRetainedRoots = expandSandboxWritableRoots(sandboxPolicy, retainedWritableRoots);
  let sandboxWithWorkspace =
    workspaceState == null || effectivePendingWorkspace == null
      ? sandboxWithRetainedRoots
      : applyPendingWorkspaceToSandbox(
          sandboxWithRetainedRoots,
          appliedRoots,
          effectivePendingWorkspace.runtimeWorkspaceRoots,
        );
  let sandboxWithProjectless =
    projectlessWorkspace == null ? sandboxWithWorkspace : ensureWritableRoot(sandboxWithWorkspace, projectlessWorkspace.workspaceRoot);
  let approvalsReviewer =
    request.approvalsReviewer ??
    threadSettings?.approvalsReviewer ??
    latestTurn?.params.approvalsReviewer ??
    conversationState.currentPermissions?.approvalsReviewer ??
    defaultPermissions.approvalsReviewer;
  let sandboxFallbackCwd = firstWritableRoot(sandboxWithProjectless);
  let effectiveCwd =
    environmentCwd ??
    effectivePendingWorkspace?.cwd ??
    projectlessWorkspace?.cwd ??
    resolveThreadCwd({
      cwd: request.cwd ?? conversationState.cwd ?? workspaceState?.applied?.cwd,
      fallbackCwd: sandboxFallbackCwd,
      workspaceBrowserRoot,
      workspaceKind,
    });
  let workspaceSandbox = resolveWorkspaceSandboxPolicy({ sandboxPolicy: sandboxWithProjectless, workspaceKind });
  let environmentId = conversationState.environments?.[0]?.environmentId;
  let [codexHome, workspacesRoot] =
    capabilities.canMaterializeHostRoots && (workspaceSandbox.type === `workspaceWrite` || workspaceSandbox.type === `dangerFullAccess`)
      ? await Promise.all([manager.getCodexHome(), manager.getWorkspacesRoot()])
      : [null, null];
  let additionalWritableRoots = capabilities.getAdditionalWritableRoots(codexHome, workspacesRoot);
  await Promise.all(additionalWritableRoots.map((root: string) => manager.ensureDirectory(root, environmentId)));
  let sandboxWithAdditionalRoots = additionalWritableRoots.reduce(ensureWritableRoot, workspaceSandbox);
  let finalSandbox =
    sandboxWithAdditionalRoots.type === `workspaceWrite`
      ? {
          ...sandboxWithAdditionalRoots,
          writableRoots: filterCompatibleRoots(effectiveCwd, sandboxWithAdditionalRoots.writableRoots),
        }
      : sandboxWithAdditionalRoots;
  let workspaceCommitRoots;
  workspaceCommitRoots =
    workspaceState != null && effectivePendingWorkspace != null
      ? subtractWritableRoots(
          sandboxWithProjectless.type === `workspaceWrite` ? sandboxWithProjectless.writableRoots : retainedWritableRoots,
          appliedRoots,
          effectivePendingWorkspace.runtimeWorkspaceRoots,
        )
      : sandboxWithProjectless.type === `workspaceWrite`
        ? mergeUnique(
            sandboxWithProjectless.writableRoots,
            [fallbackCwd, effectiveCwd].filter((root: string) => root != null && root !== `~`),
          )
        : [];
  let shouldSendSandboxPolicy =
    !usePermissionSelection &&
    (workspaceKind === `projectless` ||
      effectivePendingWorkspace != null ||
      ((!useServerDefaultPermissions || capabilities.preserveWorkspaceSandboxPolicyWithDefault) &&
        (sandboxWithAdditionalRoots !== workspaceSandbox || sandboxMissingRoots(sandboxPolicy, retainedWritableRoots))));
  let shouldSendApprovalPolicy = false;
  let shouldSendThreadSettings = false;
  let requestedPermissions: unknown = null;
  if (!useServerDefaultPermissions) {
    shouldSendApprovalPolicy = shouldSendSandboxPolicy || request.approvalPolicy != null || request.sandboxPolicy != null;
    shouldSendThreadSettings = threadSettings != null || latestTurnParams != null;
    requestedPermissions =
      request.permissions === undefined
        ? request.sandboxPolicy == null
          ? threadSettings?.activePermissionProfile === undefined
            ? threadSettings?.permissions === undefined
              ? (conversationState.currentPermissions?.activePermissionProfile?.id ?? latestTurnParams?.permissions ?? null)
              : threadSettings.permissions
            : (threadSettings.activePermissionProfile?.id ?? null)
          : null
        : request.permissions;
  }
  let currentProfile = conversationState.currentPermissions?.activePermissionProfile;
  let activePermissionProfileId = requestedPermissions ?? (useServerDefaultPermissions ? currentProfile?.id : null);
  let currentSandbox = conversationState.currentPermissions?.sandboxPolicy;
  let retainedRootsMinusCurrent =
    activePermissionProfileId != null &&
    activePermissionProfileId === currentProfile?.id &&
    currentSandbox?.type === `workspaceWrite`
      ? retainedWritableRoots.filter(
          (root: string) => !currentSandbox.writableRoots.some((candidate: string) => capabilities.isSamePath(candidate, root)),
        )
      : retainedWritableRoots;
  if (usePermissionSelection && effectivePendingWorkspace != null)
    retainedRootsMinusCurrent = subtractWritableRoots(
      retainedWritableRoots,
      appliedRoots,
      effectivePendingWorkspace.runtimeWorkspaceRoots,
    );
  if (activePermissionProfileId != null) {
    let allowedRoots = mergeUnique(
      retainedRootsMinusCurrent,
      effectivePendingWorkspace?.runtimeWorkspaceRoots ??
        mergeUnique(
          appliedRoots,
          [fallbackCwd, effectiveCwd].filter((root: string) => root != null && root !== `~`),
        ),
    );
    workspaceCommitRoots = workspaceCommitRoots.filter((root: string) =>
      allowedRoots.some((candidate: string) => capabilities.isSamePath(candidate, root)),
    );
  }
  let shouldSendPermissions = shouldSendSandboxPolicy || (!useServerDefaultPermissions && (shouldSendThreadSettings || shouldSendApprovalPolicy));
  let shouldSendRuntimeRoots =
    (capabilities.carryProjectlessRuntimeRoots && workspaceKind === `projectless`) ||
    requestedPermissions != null ||
    (useServerDefaultPermissions && (additionalWritableRoots.length > 0 || retainedWritableRoots.length > 0)) ||
    (sandboxWithAdditionalRoots.type !== `workspaceWrite` && additionalWritableRoots.length > 0);
  let runtimeWorkspaceRoots: string[] | null = null;
  if (effectivePendingWorkspace == null) {
    if (shouldSendRuntimeRoots) {
      runtimeWorkspaceRoots = mergeUnique(
        mergeUnique(
          environmentRoots ??
            request.runtimeWorkspaceRoots ??
            conversationState.currentPermissions?.runtimeWorkspaceRoots ??
            latestTurnParams?.runtimeWorkspaceRoots ??
            appliedRoots,
          retainedRootsMinusCurrent,
        ),
        [fallbackCwd, effectiveCwd].filter((root: string) => root != null && root !== `~`),
      );
    }
  } else {
    runtimeWorkspaceRoots = usePermissionSelection
      ? mergeUnique(effectivePendingWorkspace.runtimeWorkspaceRoots, retainedRootsMinusCurrent)
      : effectivePendingWorkspace.runtimeWorkspaceRoots;
  }
  if (shouldSendRuntimeRoots && runtimeWorkspaceRoots != null && additionalWritableRoots.length > 0)
    runtimeWorkspaceRoots = mergeUnique(runtimeWorkspaceRoots, additionalWritableRoots);
  if (runtimeWorkspaceRoots != null)
    runtimeWorkspaceRoots = filterCompatibleRoots(effectiveCwd, runtimeWorkspaceRoots);
  let environments = conversationState.environments?.map((entry: any, index: number) =>
    index === 0 && runtimeWorkspaceRoots != null ? { ...entry, runtimeWorkspaceRoots } : entry,
  );
  let hasEnvironments = (environments?.length ?? 0) > 0;
  let inheritedServiceTier =
    threadSettings?.serviceTier === undefined
      ? latestTurnParams?.serviceTier === undefined
        ? null
        : latestTurnParams.serviceTier
      : threadSettings.serviceTier;
  let requestedServiceTier = request.serviceTier === undefined ? inheritedServiceTier : request.serviceTier;
  let [threadConfig, serviceTier] = await Promise.all([
    request.summary === undefined ? readThreadCodexConfigSafe(manager.requestClient, effectiveCwd) : undefined,
    resolveServiceTier(requestedServiceTier, manager.logger, () =>
      manager.sendRequest(`configRequirements/read`, undefined, { priority: `critical`, timeoutMs: TURN_START_TIMEOUT_MS }),
    ),
  ]);
  let personality =
    request.personality === undefined
      ? threadSettings?.personality === undefined
        ? (latestTurnParams?.personality ?? (await manager.readDefaultPersonality(effectiveCwd, threadConfig)))
        : threadSettings.personality
      : request.personality;
  let summary = latestTurnParams?.summary ?? `none`;
  threadSettings?.summary !== undefined && (summary = threadSettings.summary);
  capabilities.reasoningSummaryOverride != null && (summary = capabilities.reasoningSummaryOverride);
  summary = threadConfig == null ? null : (threadConfig.model_reasoning_summary ?? summary);
  request.summary !== undefined && (summary = request.summary);
  let turnRequest = {
    threadId: conversationId,
    turnTrigger: request.turnTrigger,
    clientUserMessageId,
    additionalContext,
    input: request.input,
    toolOutput: request.toolOutput,
    environments,
    cwd: hasEnvironments ? null : effectiveCwd,
    approvalPolicy: shouldSendThreadSettings || shouldSendApprovalPolicy ? approvalPolicy : null,
    approvalsReviewer: useServerDefaultPermissions ? null : approvalsReviewer,
    sandboxPolicy: requestedPermissions == null && shouldSendPermissions ? finalSandbox : null,
    permissions: requestedPermissions,
    runtimeWorkspaceRoots: hasEnvironments ? null : runtimeWorkspaceRoots,
    model,
    cyberAccessProgram: request.cyberAccessProgram,
    serviceTier,
    effort: reasoningEffort,
    multiAgentMode: MULTI_AGENT_MODE_EXPLICIT_REQUEST_ONLY,
    summary,
    personality,
    responsesapiClientMetadata: { ...request.responsesapiClientMetadata, workspace_kind: workspaceKind ?? `project` },
    outputSchema: request.outputSchema ?? null,
    collaborationMode: collaborationMode ?? null,
  };
  manager.logger.info(`Reasoning summary turn-start config resolved`, {
    safe: { reasoningSummaryOverride: capabilities.reasoningSummaryOverride, summary },
    sensitive: {
      conversationId,
      useAppServerPermissionDefault: useServerDefaultPermissions,
      resolvedApprovalPolicy: approvalPolicy,
      resolvedApprovalsReviewer: approvalsReviewer,
      requestApprovalPolicy: turnRequest.approvalPolicy,
      requestApprovalsReviewer: turnRequest.approvalsReviewer,
      requestSandboxPolicyType: turnRequest.sandboxPolicy?.type ?? null,
      requestSandboxWritableRootCount:
        turnRequest.sandboxPolicy?.type === `workspaceWrite` ? turnRequest.sandboxPolicy.writableRoots.length : 0,
      requestRuntimeWorkspaceRootCount: turnRequest.runtimeWorkspaceRoots?.length ?? 0,
      requestPermissionProfile: turnRequest.permissions,
    },
  });
  let params = {
    ...request,
    clientUserMessageId,
    input: request.input,
    cwd: effectiveCwd,
    approvalPolicy,
    approvalsReviewer,
    sandboxPolicy: finalSandbox,
    permissions: requestedPermissions,
    runtimeWorkspaceRoots,
    model: model ?? null,
    serviceTier,
    effort: reasoningEffort ?? null,
    multiAgentMode: MULTI_AGENT_MODE_EXPLICIT_REQUEST_ONLY,
    summary,
    personality,
    outputSchema: request.outputSchema ?? null,
    collaborationMode: collaborationMode ?? null,
  };
  let permissions;
  if (usePermissionSelection && threadSettings?.approvalPolicy != null && threadSettings.approvalsReviewer != null && threadSettings.sandboxPolicy != null) {
    permissions = {
      activePermissionProfile: threadSettings.activePermissionProfile,
      approvalPolicy: threadSettings.approvalPolicy,
      approvalsReviewer: threadSettings.approvalsReviewer,
      runtimeWorkspaceRoots: runtimeWorkspaceRoots ?? conversationState.currentPermissions?.runtimeWorkspaceRoots,
      sandboxPolicy: threadSettings.sandboxPolicy,
    };
  } else if (useServerDefaultPermissions && conversationState.currentPermissions != null) {
    permissions = {
      ...conversationState.currentPermissions,
      runtimeWorkspaceRoots: runtimeWorkspaceRoots ?? conversationState.currentPermissions.runtimeWorkspaceRoots,
    };
  } else if (usePermissionSelection) {
    throw Error(`Missing permission settings for the next turn`);
  } else {
    permissions = {
      activePermissionProfile: resolveActivePermissionProfile(
        requestedPermissions,
        threadSettings?.activePermissionProfile,
        conversationState.currentPermissions?.activePermissionProfile,
      ),
      approvalPolicy,
      approvalsReviewer,
      runtimeWorkspaceRoots: runtimeWorkspaceRoots ?? conversationState.currentPermissions?.runtimeWorkspaceRoots,
      sandboxPolicy: finalSandbox,
    };
  }
  let workspaceCommitRootsOp: { kind: string; roots: string[] } | null = null;
  if (workspaceState != null && effectivePendingWorkspace != null) {
    workspaceCommitRootsOp = { kind: `replace`, roots: workspaceCommitRoots };
  } else if (
    workspaceState == null &&
    workspaceCommitRoots.length > 0 &&
    (retainedWritableRoots.length > 0 || effectiveCwd !== conversationState.cwd)
  ) {
    workspaceCommitRootsOp = { kind: `merge`, roots: workspaceCommitRoots };
  }
  return {
    request: turnRequest,
    params,
    useAppServerPermissionDefault: useServerDefaultPermissions,
    permissions,
    model,
    reasoningEffort,
    shouldUpdateReasoningEffort: request.effort !== undefined || threadSettings != null,
    collaborationMode,
    pendingWorkspace: effectivePendingWorkspace,
    projectlessWorkspace,
    environments,
    shouldShowModelChange: capabilities.shouldShowModelChange,
    workspaceCommit: {
      writableRoots: workspaceCommitRootsOp,
      revision: pendingRevision,
      hadWorkspaceState: workspaceState != null,
    },
  };
}

/** 权限 profile id → 已知 profile 对象（未知 id 构造 extends:null）。 */
function resolveActivePermissionProfile(profileId: unknown, fromSettings: any, fromCurrent: any) {
  return profileId == null
    ? null
    : fromSettings?.id === profileId
      ? fromSettings
      : fromCurrent?.id === profileId
        ? fromCurrent
        : { id: profileId, extends: null };
}

// ---------------------------------------------------------------------------
// dispatch 准备（qxe/Jxe/Yxe/Xxe）
// ---------------------------------------------------------------------------

/**
 * 组装 turn 派发所需的准备面：writing-block 上下文注入、resume roots、
 * prepare（权限推导 + runtime 钩子）、follower 中止口与 didStart（首 turn
 * 的 initial title 请求）。
 */
function prepareTurnDispatch(
  manager: any,
  conversationId: string,
  operation: any,
  clientUserMessageId: string,
  origin: string,
  capabilities: any,
  onInitialTitleRequested: any,
  readPersistedValue: (key: string) => unknown,
) {
  let request = operation.request;
  let conversation = manager.getConversation(conversationId);
  let additionalContext =
    conversation == null || operation.context?.writingBlockContextPrepared === true
      ? request.additionalContext
      : extractWritingBlockContext(
          conversationId,
          mergedConversationTurns(conversation, undefined).map((turn: any) => ({
            turnId: turn.turnId,
            messages: turn.items.flatMap((item: any) =>
              item.type === `agentMessage` && `text` in item && typeof item.text == `string` ? [item.text] : [],
            ),
          })),
          readPersistedValue,
          request.additionalContext,
        );
  let environmentCwd = conversation?.environments?.[0]?.cwd;
  let projectlessFallbackCwd =
    conversation?.workspaceKind === `projectless`
      ? firstWritableRoot(
          conversation.latestThreadSettings?.sandboxPolicy ?? lastTurnWithTurnId(conversation)?.params.sandboxPolicy,
        )
      : null;
  let effectiveCwd =
    environmentCwd ??
    resolveThreadCwd({
      cwd: request.cwd ?? conversation?.cwd,
      fallbackCwd: projectlessFallbackCwd,
      workspaceBrowserRoot: conversation?.workspaceBrowserRoot,
      workspaceKind: conversation?.workspaceKind,
    }) ??
    (conversation?.workspaceKind === `projectless` ? null : manager.getConversationCwd(conversationId));
  return {
    request: { ...request, clientUserMessageId, additionalContext },
    resumeWorkspaceRoots:
      conversation?.workspaceKind === `projectless` && effectiveCwd == null ? [] : [effectiveCwd ?? `/`],
    prepare: async (conversationState: any) => {
      await capabilities.prepareSession?.(conversationState.sessionId);
      let prepared = await prepareTurnRequest(
        manager,
        conversationId,
        operation,
        clientUserMessageId,
        additionalContext,
        conversationState,
        capabilities,
      );
      return capabilities.prepareRequest == null
        ? prepared
        : { ...prepared, request: await capabilities.prepareRequest(prepared.request) };
    },
    abortFollower: () => capabilities.abortFollower?.(),
    markRequestDispatched: (trace: unknown) => capabilities.markRequestDispatched?.(trace),
    didStart() {
      if (origin !== `direct`) return;
      let current = manager.getConversation(conversationId);
      manager.getStreamRole(conversationId)?.role === `owner` &&
        current?.title == null &&
        operation.context?.threadStartKind != null &&
        onInitialTitleRequested({
          conversationId,
          input: operation.request.input,
          cwd: operation.request.cwd ?? null,
          attachments: operation.context?.attachments,
        });
    },
  };
}

/** runtime/filesystem/tracing → turn 派发能力面（原 Jxe）。 */
function buildTurnCapabilities({
  runtime,
  filesystem,
  tracing,
  conversationId,
  clientUserMessageId,
}: {
  runtime: any;
  filesystem: any;
  tracing: any;
  conversationId: string;
  clientUserMessageId: string;
}) {
  return {
    prepareSession: runtime.prepareTurnSession?.bind(runtime, conversationId),
    prepareRequest: runtime.prepareTurnRequest?.bind(runtime, conversationId),
    hasDesktopRuntime: runtime.hasDesktopRuntime,
    preserveWorkspaceSandboxPolicy: runtime.preserveWorkspaceSandboxPolicy,
    getVisualizationRoot: (codexHome: string, workspacesRoot: string) =>
      filesystem.getVisualizationRoot(codexHome, conversationId, workspacesRoot),
    getRestrictedTaskRoot:
      filesystem.getRestrictedTaskRoot == null
        ? undefined
        : (root: string) => filesystem.getRestrictedTaskRoot?.(root, conversationId) ?? null,
    abortFollower: tracing.abortTurnFollower == null ? undefined : () => tracing.abortTurnFollower?.(clientUserMessageId),
    markRequestDispatched:
      tracing.markTurnDispatched == null
        ? undefined
        : (trace: unknown) => tracing.markTurnDispatched?.(clientUserMessageId, trace),
  };
}

/** 权限推导入口（原 Yxe）：组装 capabilities 后调 resolveTurnPermissionsAndWorkspace。 */
async function prepareTurnRequest(
  manager: any,
  conversationId: string,
  operation: any,
  clientUserMessageId: string,
  additionalContext: Record<string, unknown> | undefined,
  conversationState: any,
  capabilities: any,
) {
  operation.context?.threadStartKind;
  let { useAppServerPermissionDefault, ...rest } = await resolveTurnPermissionsAndWorkspace(
    manager,
    conversationId,
    operation,
    clientUserMessageId,
    additionalContext,
    conversationState,
    {
      canUseProjectlessWorkspace: !isDurableHost(manager.getHostId()),
      canMaterializeHostRoots: !isDurableHost(manager.getHostId()) && true,
      preserveWorkspaceSandboxPolicyWithDefault:
        capabilities.preserveWorkspaceSandboxPolicy || isDurableHost(manager.getHostId()),
      carryProjectlessRuntimeRoots: capabilities.hasDesktopRuntime && !isDurableHost(manager.getHostId()),
      latestUseAppServerPermissionDefault:
        operation.context?.inheritThreadSettings !== false && lastTurnUsedAppServerPermissionDefault(conversationState),
      reasoningSummaryOverride:
        manager.getDefaultFeatureOverride(`concurrent_reasoning_summaries`) === true ? `detailed` : null,
      getRequestModel: (model: string | null) => model,
      getRequestCollaborationMode(mode: unknown) {
        return mode;
      },
      getAdditionalWritableRoots(codexHome: string | null, workspacesRoot: string | null) {
        return [capabilities.hasDesktopRuntime ? capabilities.getVisualizationRoot(workspacesRoot, codexHome) : null, null].filter(
          (root: string) => root != null,
        );
      },
      isSamePath,
      shouldShowModelChange: (fromModel: string, toModel: string) => !isNewerRuntimeModel(fromModel, toModel),
    },
  );
  return {
    ...rest,
    params: Object.assign(rest.params, {
      attachments: operation.context?.attachments,
      commentAttachments: operation.context?.commentAttachments,
      useAppServerPermissionDefault,
    }),
  };
}

/** 上一 turn 是否显式要求 app-server 权限默认（原 Xxe）。 */
function lastTurnUsedAppServerPermissionDefault(conversationState: any) {
  let params = lastTurnWithTurnId(conversationState)?.params;
  return params != null && `useAppServerPermissionDefault` in params && params.useAppServerPermissionDefault === true;
}

// ---------------------------------------------------------------------------
// unconfirmed submission 簿记（dC/fC/pC/mC）
// ---------------------------------------------------------------------------

/** 按 clientUserMessageId（或 inProgress 无 turnId 的 turn）定位 turn。 */
function findTurnByClientUserMessageId(conversation: any, clientUserMessageId: string, turnId: string | null) {
  return (
    (turnId == null ? null : findDraftTurn(conversation, (turn: any) => turn.turnId === turnId)) ??
    findDraftTurn(
      conversation,
      (turn: any) => turn.turnId == null && turn.params.clientUserMessageId === clientUserMessageId && turn.status === `inProgress`,
    )
  );
}

/** 有未确认提交时抛错（防并发 turn/start）。 */
export function assertNoUnconfirmedSubmission(conversation: any) {
  if (conversation?.unconfirmedTurnSubmissions?.[0] != null)
    throw Error(`An earlier turn submission is not yet confirmed`);
}

/** 记录未确认提交（按 requestId 去重）。 */
export function recordUnconfirmedSubmission(conversation: any, submission: any, clientUserMessageId: string) {
  let submissions = (conversation.unconfirmedTurnSubmissions ??= []);
  submissions.some((entry: any) => entry.requestId === submission.requestId) ||
    submissions.push({ ...submission, clientUserMessageId });
}

/** 清除未确认提交（清空后删除键）。 */
export function clearUnconfirmedSubmission(conversation: any, requestId: string | null) {
  requestId != null &&
    conversation.unconfirmedTurnSubmissions != null &&
    ((conversation.unconfirmedTurnSubmissions = conversation.unconfirmedTurnSubmissions.filter(
      (entry: any) => entry.requestId !== requestId,
    )),
    conversation.unconfirmedTurnSubmissions.length === 0 && delete conversation.unconfirmedTurnSubmissions);
}

// ---------------------------------------------------------------------------
// executeTurnStart 工厂与核心（Zxe/hC/Qxe）
// ---------------------------------------------------------------------------

/**
 * executeTurnStart 工厂（原 Zxe）：空请求（无 input/effort/permissions/…）
 * 复用同会话 in-flight 的「空 turn」promise；非空请求走核心流程并登记
 * turnStarts 去重表。onCleanup 在复用/新建两条路径都保证调用。
 */
export function createExecuteTurnStart(
  manager: any,
  { runtime, filesystem, tracing = {}, storage }: { runtime: any; filesystem: any; tracing?: any; storage: any },
  turnStartObservations: any,
  assertActive: () => void,
  isAlive: () => boolean,
  createId: () => string,
  onInitialTitleRequested: (request: unknown) => void,
) {
  let turnStarts = new Map<string, Promise<any>>();
  return (conversationId: string, operation: any, origin = `nested`, onOutcomeUnknown: any, onMessageAdded: any) => {
    assertActive();
    let clientUserMessageId = operation.request.clientUserMessageId ?? createId();
    let context = {
      manager,
      conversationId,
      operation,
      turnStarts,
      origin,
      createId,
      onOutcomeUnknown,
      onMessageAdded,
      onInitialTitleRequested,
      readPersistedValue: storage.readValue.bind(storage),
      clientUserMessageId,
      capabilities: buildTurnCapabilities({
        conversationId,
        clientUserMessageId,
        runtime,
        filesystem,
        tracing,
      }),
      ownerWindowError: OWNER_WINDOW_ERROR,
      observeRequest: () => {
        let initialRole = manager.getStreamRole(conversationId);
        return turnStartObservations.begin(conversationId, (allowUnloaded: boolean) => {
          let currentRole = manager.getStreamRole(conversationId);
          return isAlive() && initialRole?.role === `owner` && (currentRole === initialRole || (allowUnloaded && currentRole == null));
        });
      },
    };
    if (
      operation.request.input.length !== 0 ||
      operation.request.effort !== undefined ||
      operation.request.permissions !== undefined ||
      operation.request.personality !== undefined ||
      operation.request.summary !== undefined ||
      operation.request.serviceTier !== undefined ||
      Object.entries(operation.request).some(
        ([key, value]) => key !== `threadId` && key !== `input` && key !== `turnTrigger` && value != null,
      ) ||
      Object.values(operation.context ?? {}).some((value) => (Array.isArray(value) ? value.length !== 0 : value != null))
    )
      return runTurnStartWithObservation(context);
    let inFlight = turnStarts.get(conversationId);
    if (inFlight != null) {
      try {
        assertNoUnconfirmedSubmission(manager.getConversation(conversationId));
      } catch (error) {
        return Promise.reject(error instanceof Error ? error : Error(String(error)));
      }
      return inFlight;
    }
    let promise = runTurnStartWithObservation(context, () => {
      turnStarts.delete(conversationId);
    });
    turnStarts.set(conversationId, promise);
    let cleanup = () => {
      if (turnStarts.get(conversationId) === promise) turnStarts.delete(conversationId);
    };
    promise.then(cleanup, cleanup);
    return promise;
  };
}

/** 观察请求生命周期并跑核心流程（异常时取消观察）。 */
async function runTurnStartWithObservation(context: any, onSettled?: () => void) {
  let observation = context.observeRequest();
  try {
    return await executeTurnStartCore(context, observation, onSettled);
  } catch (error) {
    observation.cancel();
    throw error;
  }
}

/**
 * turn 派发核心（原 Qxe，~300 行）：owner 校验 → follower 委托 →
 * updateConversationState 追加 inProgress turn → thread/inject_items（响应
 * 项/被动上下文）→ turn/start → 失败时回滚（outcome-unknown 保留缓冲）→
 * 接受后提交 workspace 变更（replace/merge roots + pending revision）。
 */
async function executeTurnStartCore(
  {
    manager,
    conversationId,
    operation,
    capabilities,
    origin,
    clientUserMessageId,
    createId,
    ownerWindowError,
    onOutcomeUnknown,
    onMessageAdded,
    onInitialTitleRequested,
    readPersistedValue,
  }: any,
  observation: any,
  onSettled?: () => void,
) {
  let request = operation.request;
  let {
    localTurnMetadata,
    attachments,
    commentAttachments,
    beforeSendRequest,
    inheritThreadSettings = true,
    threadStartKind,
    useAppServerPermissionDefault,
    mcpAppModelContextAttachments,
    responseItems,
    passiveContext,
  } = operation.context ?? {};
  manager.getConversation(conversationId);
  let messageThreadId = operation.context?.messageThreadId ?? undefined;
  if (messageThreadId != null) operation.context = { ...operation.context, messageThreadId };
  if (request.threadId !== conversationId) throw Error(`Turn request thread does not match the conversation`);
  await manager.waitForPendingThreadSettingsUpdate(conversationId);
  assertNoUnconfirmedSubmission(manager.getConversation(conversationId));
  let dispatch = prepareTurnDispatch(
    manager,
    conversationId,
    operation,
    clientUserMessageId,
    origin,
    capabilities,
    onInitialTitleRequested,
    readPersistedValue,
  );
  let followerResult = await delegateTurnStartToFollower({
    conversationId,
    getStreamRole: (id: string) => manager.getStreamRole(id),
    markConversationNeedsResumeForUnavailableOwner: (id: string, ownerClientId: string) => {
      manager.markConversationNeedsResumeForUnavailableOwner(id, ownerClientId);
    },
    resumeConversationForUnavailableOwner: (id: string) => manager.resumeConversationForUnavailableOwner(id),
    workspaceRoots: dispatch.resumeWorkspaceRoots,
    collaborationMode: request.collaborationMode ?? null,
    reasoningEffort: request.effort ?? null,
    serviceTier: request.serviceTier,
    useAppServerPermissionDefault: operation.context?.usePermissionSelection,
    sendRequest: (followerRequest: any) =>
      manager.sendThreadFollowerRequest(followerRequest, `thread-follower-start-turn`, {
        conversationId,
        turnStart: {
          request: dispatch.request,
          context: {
            localTurnMetadata,
            messageThreadId,
            attachments,
            commentAttachments,
            useAppServerPermissionDefault,
            usePermissionSelection: operation.context?.usePermissionSelection,
            inheritThreadSettings,
            writingBlockContextPrepared: operation.context?.writingBlockContextPrepared,
            threadStartKind,
            mcpAppModelContextAttachments,
            responseItems,
            passiveContext,
          },
        },
      }),
  });
  if (followerResult) {
    observation.cancel();
    dispatch.abortFollower?.();
    return followerResult.result;
  }
  if (manager.getStreamRole(conversationId)?.role !== `owner`) throw Error(ownerWindowError);
  if (!manager.isConversationStreaming(conversationId))
    throw (
      manager.logger.error(`Conversation is not being streamed.`, {
        safe: { conversationId },
        sensitive: {},
      }),
      Error(`Conversation ${conversationId} is not being streamed.`)
    );
  await manager.waitForPendingThreadSettingsUpdate(conversationId);
  let conversationState = manager.getConversation(conversationId);
  if (conversationState == null)
    throw (
      manager.logger.error(`Conversation state not found`, {
        safe: { conversationId },
        sensitive: {},
      }),
      Error(`Conversation state for ${conversationId} not found`)
    );
  let prepared = await dispatch.prepare(conversationState);
  let latest = manager.getConversation(conversationId);
  let threadWasIdle = latest != null && latestTurn(latest)?.status !== `inProgress` && latest.threadRuntimeStatus?.type !== `active`;
  if ((responseItems?.length ?? 0) > 0 && !threadWasIdle)
    throw Error(`App context must wait until the current turn finishes`);
  let previousPermissions = conversationState.currentPermissions;
  let isLatestTurnStart = () => manager.getConversation(conversationId)?.latestTurnStartMessageId === clientUserMessageId;
  let runtimeStatusBefore = manager.getConversation(conversationId)?.threadRuntimeStatus;
  let activeRuntimeStatus = { type: `active`, activeFlags: [] };
  // 原版为单条逗号表达式语句（无 if）：projectless 工作区字段提升 + 最新
  // model/effort/collab 写回 + 权限落位（pendingWorkspace 存在时跳过）。
  let applyPreparedState = (state: any) => {
    void (
      prepared.pendingWorkspace == null &&
      prepared.projectlessWorkspace &&
      ((state.workspaceKind = `projectless`),
      (state.workspaceBrowserRoot = prepared.projectlessWorkspace.workspaceRoot),
      (state.cwd = prepared.projectlessWorkspace.cwd)),
      (state.latestModel = prepared.model ?? state.latestModel),
      (state.latestReasoningEffort = prepared.shouldUpdateReasoningEffort
        ? prepared.reasoningEffort
        : (prepared.reasoningEffort ?? state.latestReasoningEffort)),
      (state.latestCollaborationMode = prepared.collaborationMode ?? state.latestCollaborationMode),
      prepared.pendingWorkspace || (state.currentPermissions = prepared.permissions)
    );
  };
  manager.updateConversationState(conversationId, (state: any) => {
    let modelChangedItems: any[] = [];
    let previousTurnModel = state.previousTurnModel;
    if (previousTurnModel != null) {
      let currentModel = state.latestCollaborationMode.settings.model;
      prepared.shouldShowModelChange(previousTurnModel, currentModel) &&
        modelChangedItems.push({ id: createId(), type: `modelChanged`, fromModel: previousTurnModel, toModel: currentModel }),
        (state.previousTurnModel = null);
    }
    appendConversationTurn(
      state,
      {
        params: prepared.params,
        pendingUserMessageAdmission: undefined,
        requestedReasoningEffort:
          (prepared.request.collaborationMode == null
            ? prepared.request.effort
            : prepared.request.collaborationMode.settings.reasoning_effort) ?? undefined,
        localMetadata: localTurnMetadata,
        mcpAppModelContextAttachments,
        turnId: null,
        status: `inProgress`,
        turnStartedAtMs: Date.now(),
        durationMs: null,
        finalAssistantStartedAtMs: null,
        error: null,
        diff: null,
        items: modelChangedItems,
      },
      createId,
    );
    runtimeStatusBefore?.type !== `active` && (state.threadRuntimeStatus = activeRuntimeStatus);
    state.latestTurnStartMessageId = clientUserMessageId;
    applyPreparedState(state);
    let now = Date.now();
    state.updatedAt = now;
    state.recencyAt = now;
  });
  let turnResponse: any;
  let environmentSelectionEvidenceBefore = manager.getConversation(conversationId)?.environmentSelectionEvidence;
  let lastOutcomeUnknownRequestId: string | null = null;
  let recordOutcomeUnknown = (delivery: any) => {
    lastOutcomeUnknownRequestId = delivery.requestId;
    manager.updateConversationState(conversationId, (state: any) => {
      recordUnconfirmedSubmission(state, delivery, clientUserMessageId);
    });
    onOutcomeUnknown?.(delivery);
  };
  try {
    try {
      Promise.resolve(onMessageAdded?.()).catch(() => {});
    } catch {}
    await beforeSendRequest?.();
    assertNoUnconfirmedSubmission(manager.getConversation(conversationId));
    let current = manager.getConversation(conversationId);
    let currentTurn = current == null ? null : latestTurn(current);
    let isFirstTurnOfIdleThread =
      threadWasIdle &&
      currentTurn?.turnId == null &&
      currentTurn?.params.clientUserMessageId === clientUserMessageId &&
      (current?.threadRuntimeStatus === activeRuntimeStatus || current?.threadRuntimeStatus?.type !== `active`);
    if ((responseItems?.length ?? 0) > 0 && !isFirstTurnOfIdleThread)
      throw Error(`App context must wait until the current turn finishes`);
    let shouldInjectPassiveContext =
      isFirstTurnOfIdleThread && passiveContext != null && passiveContext.items.length > 0 && passiveContext.key !== current?.lastInjectedPassiveContextKey;
    let itemsToInject = [...(responseItems ?? []), ...(shouldInjectPassiveContext ? passiveContext.items : [])];
    if (itemsToInject.length > 0) {
      await manager.sendRequest(
        `thread/inject_items`,
        { threadId: conversationId, items: itemsToInject },
        { priority: `critical`, timeoutMs: TURN_START_TIMEOUT_MS, onOutcomeUnknown: recordOutcomeUnknown },
      );
      manager.updateConversationState(conversationId, (state: any) => {
        clearUnconfirmedSubmission(state, lastOutcomeUnknownRequestId);
        shouldInjectPassiveContext && (state.lastInjectedPassiveContextKey = passiveContext.key);
      });
      lastOutcomeUnknownRequestId = null;
      assertNoUnconfirmedSubmission(manager.getConversation(conversationId));
    }
    let trace = dispatch.markRequestDispatched?.(`turn/start`);
    let strippedRequest = stripTurnRequestForVersion(prepared.request, manager.requestClient.getAppServerVersion());
    observation.dispatched();
    environmentSelectionEvidenceBefore = manager.getConversation(conversationId)?.environmentSelectionEvidence;
    let requestOptions = {
      clientUserMessageId,
      priority: `critical`,
      timeoutMs: conversationState.originator === `codex_cloud` ? CLOUD_TURN_START_TIMEOUT_MS : TURN_START_TIMEOUT_MS,
      onOutcomeUnknown: recordOutcomeUnknown,
      ...(trace == null ? {} : { trace }),
    };
    turnResponse = await manager.sendRequest(`turn/start`, strippedRequest, requestOptions);
  } catch (error) {
    let outcomeUnknownFromInject = false;
    if (
      error instanceof DeliveryError &&
      error.delivery.stage === `outcome-unknown` &&
      (manager.updateConversationState(conversationId, (state: any) => {
        recordUnconfirmedSubmission(state, error.delivery, clientUserMessageId);
        if (error.delivery.method === `thread/inject_items`) {
          outcomeUnknownFromInject = true;
          let submission = state.unconfirmedTurnSubmissions?.find(
            ({ requestId }: any) => requestId === error.delivery.requestId,
          );
          submission != null && (submission.terminal = true);
        }
      }),
      !outcomeUnknownFromInject)
    )
      throw error;
    let runtimeStatusWasSynthetic = manager.getConversation(conversationId)?.threadRuntimeStatus === activeRuntimeStatus;
    throw (
      manager.updateConversationState(conversationId, (state: any) => {
        outcomeUnknownFromInject || clearUnconfirmedSubmission(state, lastOutcomeUnknownRequestId);
        let failedTurn = findTurnByClientUserMessageId(state, clientUserMessageId, null);
        if (failedTurn != null && !outcomeUnknownFromInject && failedTurn.turnId == null && failedTurn.items.every((item: any) => item.type === `modelChanged`)) {
          removeTurn(state, failedTurn);
          runtimeStatusWasSynthetic && (state.threadRuntimeStatus = runtimeStatusBefore);
        } else if (failedTurn) {
          delete failedTurn.pendingUserMessageAdmission;
          let message =
            error instanceof Error && error.message.trim().length > 0 ? error.message : `Error submitting message`;
          ((failedTurn.items ||= []),
            failedTurn.items.push({
              type: `error`,
              id: createId(),
              message,
              willRetry: false,
              errorInfo: null,
              additionalDetails: null,
            }),
            (failedTurn.status = `failed`),
            (failedTurn.error = {
              message,
              codexErrorInfo: null,
              additionalDetails: null,
              misalignment: null,
            }),
            runtimeStatusWasSynthetic && (state.threadRuntimeStatus = runtimeStatusBefore));
        }
        isLatestTurnStart() &&
          (previousPermissions == null ? delete state.currentPermissions : (state.currentPermissions = previousPermissions));
      }),
      error
    );
  }
  observation.accepted(turnResponse.turn.id);
  manager.updateConversationState(conversationId, (state: any) => {
    let acceptedTurn = findTurnByClientUserMessageId(state, clientUserMessageId, turnResponse.turn.id);
    acceptedTurn &&
      ((acceptedTurn.turnId = turnResponse.turn.id),
      (acceptedTurn.items ||= []),
      acceptedTurn.status === `inProgress` && (acceptedTurn.status = turnResponse.turn.status));
    isLatestTurnStart() &&
      (prepared.pendingWorkspace != null &&
        ((state.workspaceBrowserRoot = null), (state.cwd = prepared.pendingWorkspace.cwd)),
      prepared.environments != null &&
        (state.environmentSelectionEvidence?.source !== `live` ||
          manager.getConversation(conversationId)?.environmentSelectionEvidence === environmentSelectionEvidenceBefore) &&
        ((state.environments = prepared.environments),
        (state.environmentSelectionEvidence = { source: `live`, updatedAt: state.updatedAt / 1e3 })),
      (state.currentPermissions = prepared.permissions));
  });
  onSettled?.();
  let { writableRoots, revision, hadWorkspaceState } = prepared.workspaceCommit;
  try {
    if (isLatestTurnStart() && writableRoots?.kind === `replace`) {
      await manager.replaceThreadWritableRoots(conversationId, writableRoots.roots);
      revision != null &&
        prepared.pendingWorkspace != null &&
        (await manager.commitThreadWorkspaceTransition(conversationId, revision, prepared.pendingWorkspace));
    } else if (isLatestTurnStart() && writableRoots?.kind === `merge`) {
      await manager.mergeThreadWritableRoots(conversationId, writableRoots.roots);
    }
  } catch (error) {
    manager.logger.warning(`Failed to synchronize accepted turn workspace`, {
      safe: { conversationId, turnId: turnResponse.turn.id },
      sensitive: { error },
    });
  }
  let workspaceState = manager.getThreadWorkspaceState(conversationId);
  let effectiveWorkspace = prepared.pendingWorkspace ?? workspaceState?.applied;
  if (effectiveWorkspace != null && isLatestTurnStart()) {
    let resolvedKind: string | null;
    workspaceState != null && (resolvedKind = workspaceState.project == null ? `projectless` : `project`);
    manager.updateConversationState(conversationId, (state: any) => {
      resolvedKind == null
        ? hadWorkspaceState || (state.workspaceKind = `project`)
        : (state.workspaceKind = resolvedKind);
      state.workspaceBrowserRoot = null;
      state.cwd = effectiveWorkspace.cwd;
    });
  }
  manager.updateConversationState(conversationId, (state: any) => {
    clearUnconfirmedSubmission(state, lastOutcomeUnknownRequestId);
  });
  try {
    await dispatch.didStart();
  } catch (error) {
    manager.logger.warning(`Failed to finish accepted turn presentation`, {
      safe: { conversationId, turnId: turnResponse.turn.id },
      sensitive: { error },
    });
  }
  return turnResponse;
}

/** codex_cloud originator 的 turn/start 超时（原 bm = 12e4）。 */
const CLOUD_TURN_START_TIMEOUT_MS = 120_000;
