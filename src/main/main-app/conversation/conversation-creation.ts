// 会话创建：参数组装、prewarm 执行器、创建执行器（原版 51,199-52,567 区段
// 的创建半段 + 50,912-51,198 的辅助）。
//
// 内容：
//   - CLOUD_CONVERSATIONS_SCHEMA/ASe + 记录云会话档案（jSe/MSe）；
//   - NSe：realtime voice 线程的可视化根初始化（thread/settings/update）；
//   - PSe→THREAD_SETTING_KEYS：durable 白名单（14 键）；
//   - FSe→filterThreadSettingsForDurable：durable 模式裁剪 config；
//   - ISe→prepareConversationParams：创建参数组装（环境读取、projectless
//     提示词、prewarm 可用性判定）；
//   - LSe→buildThreadStartRequest：thread/start 请求组装；
//   - CC→ConversationParamsBuilder：buildNewConversationParams/
//     buildThreadCodexConfig/prepareConversation/preparePrewarm；
//   - RSe→ConversationCreationExecutor：prewarmConversation + createConversation
//     （VM lifecycle 打点、prewarm 消费、projectless 落盘、git info、
//     权限初始化 NSe）+ saveInitialDaybreak + 历史模式判定。
//
// 原压缩名对照见各 JSDoc。

import {
  $u as normalizeThreadId,
  Cs as isDurableHost,
  mr as DeliveryError,
  Zo as errorToString,
  kd as defaultSandboxConfig,
  Dd as resolveAgentModePermissions,
  Ef as zRecord,
  Of as zString,
  wf as zObject,
  yf as zAny,
  qi as isRealtimeVoiceThread,
} from "@chunk/shared";
import { Fg as lastIncompleteTurn, kg as mergedConversationTurns } from "../turns/canonical-history";
// R3 threads/operations（Nx/Ox/kx：根合并/沙箱扩展/缺根判定）。
import { mergeUnique, expandSandboxWritableRoots, sandboxMissingRoots } from "../threads/operations";
// R3 workspace/config（vt/nx/rx/_x：projectless 提示词、config 读取）。
import { projectlessWorkspaceInstructions, readThreadCodexConfig } from "../workspace/config";
// R3 threads/start-config（mx：service tier 解析；vx：特性覆盖日志）。
import { resolveServiceTier, logFeatureOverrideResolved } from "../threads/start-config";
// R3 threads/projection（Tv/wv/Dv：thread 时间戳/标题截断/环境配置选择）。
import { threadTimestamps, truncateText, environmentSelection } from "../threads/projection";
// q_（33,143 canonicalVoiceHistory 判定）——R3 尚未导出，落地后对齐（缺导出已记录）。
import * as projectionModule from "../threads/projection";
const isCanonicalVoiceHistory: (thread: any) => unknown = (projectionModule as any).isCanonicalVoiceHistory;
// R3 threads/patch-classification（zv/Bv/Vv：model/collab/权限状态更新）。
import { applyModelSettingsUpdate, buildModelSettingsUpdate, permissionSettingsUpdate } from "../threads/patch-classification";
// R3 tools/dynamic-app-tools（Dh：thread_references 可用性判定）。
import { hasThreadReferences } from "../tools/dynamic-app-tools";
import { freezeIdentity } from "../vendor/immer";
import { deepEqual, uniqBy } from "../util/lodash-interop";
// cloneDeep（原 BSe interop，51,818 vendored lodash）——R3 util/lodash-interop
// 尚未导出，缺导出已记录。
import { cloneDeep } from "../util/lodash-interop";

// ---------------------------------------------------------------------------
// 云会话档案（ASe/jSe/MSe）
// ---------------------------------------------------------------------------

/** 云会话档案 schema：record(accountId, record(threadId, {environmentId}))。 */
const CLOUD_CONVERSATIONS_SCHEMA = zRecord(zString(), zRecord(zString(), zObject({ environmentId: zString().nullable() })));

/** 把捕获的云线程原型记入 manager 的云会话档案（每账号最多 100 条）。 */
export function recordCloudThreadPrototype(
  cloud: {
    readAccountId: () => string | null;
    readCloudConversations: () => Record<string, any>;
    writeCloudConversations: (value: Record<string, any>) => void;
  },
  conversationId: string,
  captured: { accountId: string; profileConversations: Record<string, any>; target: unknown } | null | undefined,
) {
  if (captured != null) {
    if (captured.accountId !== cloud.readAccountId())
      throw Error(`Captured thread account does not match manager account`);
    cloud.writeCloudConversations(mergeCloudConversations(cloud.readCloudConversations(), conversationId, captured));
  }
}

/** 合并云会话档案：新条目优先，每账号保留最近 100 个会话。 */
function mergeCloudConversations(
  existing: Record<string, any>,
  conversationId: string,
  captured: { accountId: string; profileConversations: Record<string, any>; target: unknown },
) {
  let parsed = CLOUD_CONVERSATIONS_SCHEMA.parse({ [captured.accountId]: captured.profileConversations })[captured.accountId];
  return {
    ...existing,
    [captured.accountId]: Object.fromEntries(
      Object.entries({ ...parsed, ...existing[captured.accountId], [conversationId]: captured.target }).slice(-100),
    ),
  };
}

// ---------------------------------------------------------------------------
// realtime voice 可视化根初始化（NSe）
// ---------------------------------------------------------------------------

/**
 * realtime voice 线程的 workspace 初始化（原 NSe）：本地 desktop runtime +
 * realtime_voice 起始 + workspaceWrite/dangerFullAccess 沙箱时，把可视化根
 * 加入 runtimeWorkspaceRoots（workspaceWrite 时同步 thread/settings/update），
 * 并从 requestedPermissions 继承保留 writableRoots。
 */
export async function initializeRealtimeVoiceWorkspace(
  hostId: string,
  requestClient: any,
  runtime: any,
  params: any,
  initialization: any,
  acceptedThread: any,
  response: any,
) {
  runtime.assertCurrent?.();
  let threadResponse = response;
  let conversationId = normalizeThreadId(threadResponse.thread.id);
  let requestedPermissions = initialization.requestedPermissions;
  let effectivePermissions = requestedPermissions;
  let isRealtimeVoice = isRealtimeVoiceThread(conversationId);
  if (
    runtime.hasDesktopRuntime &&
    hostId === `local` &&
    params.threadStartKind === `realtime_voice` &&
    isRealtimeVoice != null &&
    (threadResponse.sandbox.type === `workspaceWrite` || threadResponse.sandbox.type === `dangerFullAccess`)
  ) {
    let [workspacesRoot, codexHome] = await Promise.all([runtime.readWorkspacesRoot(), runtime.readCodexHome()]);
    runtime.assertCurrent?.();
    let visualizationRoot = runtime.getVisualizationRoot(workspacesRoot, conversationId, codexHome);
    if (visualizationRoot != null && !initialization.runtimeWorkspaceRoots.includes(visualizationRoot)) {
      await runtime.ensureDirectory(visualizationRoot, acceptedThread.environments?.[0]?.environmentId);
      runtime.assertCurrent?.();
      let runtimeWorkspaceRoots = mergeUnique(threadResponse.runtimeWorkspaceRoots, [
        ...initialization.runtimeWorkspaceRoots,
        visualizationRoot,
      ]);
      let sandboxPolicy = expandSandboxWritableRoots(threadResponse.sandbox, [visualizationRoot]);
      if (threadResponse.sandbox.type === `workspaceWrite`) {
        await requestClient.sendRequest(
          `thread/settings/update`,
          { threadId: conversationId, sandboxPolicy },
          { priority: `critical`, timeoutMs: TURN_START_TIMEOUT_MS },
        );
        runtime.assertCurrent?.();
      }
      threadResponse = {
        ...threadResponse,
        activePermissionProfile:
          threadResponse.sandbox.type === `workspaceWrite` ? null : threadResponse.activePermissionProfile,
        runtimeWorkspaceRoots,
        sandbox: sandboxPolicy,
      };
      if (requestedPermissions != null) {
        effectivePermissions = {
          ...requestedPermissions,
          activePermissionProfile: threadResponse.activePermissionProfile,
          runtimeWorkspaceRoots,
          sandboxPolicy,
        };
      }
    }
  }
  let permissionsConfig = mergePermissionConfigWithFallback(threadResponse, effectivePermissions);
  let retainedWritableRoots =
    hostId !== `durable` &&
    permissionsConfig.activePermissionProfile == null &&
    requestedPermissions?.sandboxPolicy.type === `workspaceWrite` &&
    sandboxMissingRoots(permissionsConfig.sandboxPolicy, requestedPermissions.sandboxPolicy.writableRoots)
      ? requestedPermissions.sandboxPolicy.writableRoots
      : null;
  if (retainedWritableRoots != null) {
    permissionsConfig = {
      ...permissionsConfig,
      sandboxPolicy: expandSandboxWritableRoots(permissionsConfig.sandboxPolicy, retainedWritableRoots),
    };
    threadResponse = { ...threadResponse, sandbox: permissionsConfig.sandboxPolicy };
  }
  return {
    response: threadResponse,
    permissionsConfig,
    retainedWritableRoots,
    getGitInfo: async (cwd: string | null) => {
      let gitInfo = acceptedThread.workspaceKind === `projectless` ? null : (threadResponse.thread.gitInfo ?? null);
      if (acceptedThread.workspaceKind !== `projectless` && hostId !== `durable` && gitInfo?.originUrl == null && cwd) {
        let origins = await runtime.readGitOrigins(cwd);
        runtime.assertCurrent?.();
        let originUrl =
          origins.find((origin: any) => cwd === origin.dir)?.originUrl ??
          origins.find((origin: any) => cwd.startsWith(origin.root))?.originUrl ??
          null;
        gitInfo == null && originUrl != null && (gitInfo = { branch: null, sha: null, originUrl });
      }
      return gitInfo;
    },
  };
}

// ---------------------------------------------------------------------------
// durable 线程设置白名单（PSe/FSe）
// ---------------------------------------------------------------------------

/** durable 模式允许写入 thread config 的设置键白名单（原 PSe，14 键）。 */
export const THREAD_SETTING_KEYS = new Set([
  `codex_internal_persistent_mode`,
  `codex_internal_persistent_mode_message`,
  `model_reasoning_effort`,
  `model_verbosity`,
  `web_search`,
  `agents.max_threads`,
  `agents.max_depth`,
  `mcp_servers`,
  `features.code_mode`,
  `features.code_mode.direct_only_tool_namespaces`,
  `features.current_time_reminder.enabled`,
  `features.multi_agent`,
  `features.orchestrator_skills`,
  `features.send_message_to_user_async`,
]);

/** 裁剪 config 至 durable 白名单（空结果返回 undefined）。 */
export function filterThreadSettingsForDurable(config: Record<string, unknown> | null | undefined) {
  if (config == null) return;
  let filtered = Object.fromEntries(Object.entries(config).filter(([key]) => THREAD_SETTING_KEYS.has(key)));
  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

// ---------------------------------------------------------------------------
// 创建参数组装（ISe/LSe）
// ---------------------------------------------------------------------------

/**
 * 组装创建参数（原 ISe）：环境解析（durable/cloud 原型）、service tier、
 * projectless 提示词、prewarm 可用性判定（te）与 prepareStart 闭包。
 */
export async function prepareConversationParams(
  executorParams: any,
  params: any,
  requestedHistoryMode: string,
) {
  let {
    collaborationMode,
    sideConversation,
    serviceTier,
    workspaceRoots,
    workspaceKind = `project`,
    projectlessOutputDirectory,
    skipFallbackConfigReadForProjectlessCwd = false,
    permissionsConfig,
    permissionSelection,
    cwd,
    memoryPreferences,
    baseInstructions,
    clientUserMessageId,
    cloudThreadPrototype = false,
    additionalDeveloperInstructions,
    serviceName,
    config,
    threadSource = `user`,
    defaultFeatureOverrides,
    dynamicToolFeatureOverrides,
    personality,
    mode = `default`,
    threadStartKind = `default`,
    requiresThreadReferences = false,
  } = params;
  let isSideConversation = sideConversation != null;
  if (isSideConversation && mode === `durable`) throw Error(`Durable side conversations must start on a local host`);
  let isDurable = executorParams.hostId === `durable` || false;
  let isCloudPrototype =
    executorParams.inputs.hasDesktopRuntime && executorParams.hostId === `durable` && cloudThreadPrototype;
  if (isCloudPrototype && sideConversation != null) {
    if (!isSideConversation) throw Error(`Cloud side conversations must be ephemeral`);
    if (sideConversation.parentEnvironment == null)
      throw Error(`Cloud side conversations must reuse the parent's existing environment`);
  }
  let parentEnvironment = isCloudPrototype ? sideConversation?.parentEnvironment : undefined;
  let aeonExecutionTarget = executorParams.inputs.aeonExecutionTarget;
  let environmentResponse: { environments: any[] | null; usesDeferredEnvironment?: boolean; savedEnvironmentConfig?: unknown } | null =
    null;
  if (parentEnvironment == null) {
    if (
      executorParams.inputs.hasDesktopRuntime &&
      executorParams.hostId === `durable` &&
      (mode === `durable` || isCloudPrototype) &&
      executorParams.inputs.readEnvironments != null
    ) {
      environmentResponse = await executorParams.inputs.readEnvironments({
        allowDisconnectedEnvironment: false,
        allowTemporaryCloudEnvironment: isCloudPrototype,
        allowSavedEnvironmentConfig: isCloudPrototype || executorParams.inputs.isBrowserRuntime,
      });
    }
  } else {
    environmentResponse = { environments: [parentEnvironment], usesDeferredEnvironment: false };
  }
  let environments = environmentResponse?.environments ?? null;
  let usesDeferredEnvironment = environmentResponse?.usesDeferredEnvironment === true;
  let environmentCwd = environments?.[0]?.cwd;
  let resolvedServiceTier = await resolveServiceTier(serviceTier, executorParams.logger, () =>
    executorParams.requestClient.sendRequest(`configRequirements/read`, undefined, {
      priority: `critical`,
      timeoutMs: TURN_START_TIMEOUT_MS,
    }),
  );
  let effectiveWorkspaceKind = environmentCwd == null ? workspaceKind : `project`;
  let isProjectless = effectiveWorkspaceKind === `projectless`;
  let effectivePermissionsConfig =
    permissionsConfig == null ||
    environmentCwd == null ||
    environmentCwd === `/` ||
    parentEnvironment != null ||
    permissionsConfig.sandboxPolicy.type !== `workspaceWrite`
      ? permissionsConfig
      : { ...permissionsConfig, sandboxPolicy: { ...permissionsConfig.sandboxPolicy, writableRoots: [environmentCwd] } };
  let runtimeWorkspaceRoots = environments?.[0]?.runtimeWorkspaceRoots ?? (environmentCwd == null ? workspaceRoots : [environmentCwd]);
  let permissionRequest;
  permissionRequest =
    permissionSelection == null
      ? effectivePermissionsConfig == null
        ? { permissionsConfig: null }
        : { permissionsConfig: effectivePermissionsConfig }
      : { permissionsConfig: null, permissionSelection };
  let projectlessWorkspaceBrowserRoot = isProjectless && !isDurable ? (workspaceRoots[0] ?? null) : null;
  let canUsePrewarmedThread =
    executorParams.inputs.memoryPipeline == null &&
    executorParams.inputs.projectId == null &&
    threadSource === `user` &&
    !isSideConversation &&
    !isDurable &&
    mode === `default` &&
    threadStartKind === `default` &&
    baseInstructions == null &&
    additionalDeveloperInstructions == null &&
    (config == null || Object.keys(config).length === 0) &&
    (dynamicToolFeatureOverrides == null || Object.keys(dynamicToolFeatureOverrides).length === 0) &&
    effectivePermissionsConfig != null &&
    (effectivePermissionsConfig.activePermissionProfile == null ||
      effectivePermissionsConfig.activePermissionProfile.id.startsWith(`:`)) &&
    memoryPreferences == null;
  let projectlessInstructions =
    isProjectless && environmentCwd == null && !isDurable
      ? projectlessWorkspaceInstructions({
          cwd,
          projectlessOutputDirectory,
          projectlessWorkspaceBrowserRoot,
        })
      : null;
  let combinedDeveloperInstructions =
    projectlessInstructions != null && additionalDeveloperInstructions != null
      ? `${projectlessInstructions}\n\n${additionalDeveloperInstructions}`
      : (projectlessInstructions ?? additionalDeveloperInstructions);
  return {
    ephemeral: isSideConversation,
    serviceTier: resolvedServiceTier,
    permissionsConfig: effectivePermissionsConfig,
    acceptedThread: {
      fixedCwd: parentEnvironment?.cwd,
      requestedCwd: environmentCwd ?? (isDurable ? null : cwd),
      fallbackCwd: isDurable ? null : (workspaceRoots[0] ?? null),
      workspaceKind: effectiveWorkspaceKind,
      workspaceBrowserRoot: projectlessWorkspaceBrowserRoot,
      projectlessOutputDirectory: isProjectless ? (projectlessOutputDirectory ?? null) : null,
      environments: usesDeferredEnvironment ? null : environments,
      threadSettingsSummary: undefined,
    },
    initialization: {
      requestedPermissions: permissionsConfig,
      runtimeWorkspaceRoots,
      aeonExecutionTarget,
      cloudThreadPrototype:
        isCloudPrototype &&
        sideConversation == null &&
        mode === `default` &&
        threadStartKind === `default` &&
        workspaceKind === `projectless` &&
        executorParams.inputs.readCloudPrototype != null
          ? await executorParams.inputs.readCloudPrototype(usesDeferredEnvironment ? null : (environments?.[0]?.environmentId ?? null))
          : null,
    },
    canUsePrewarmedThread: canUsePrewarmedThread && resolvedServiceTier === serviceTier,
    prewarmedInstructionOverrides: executorParams.inputs.hasDesktopRuntime
      ? executorParams.inputs.instructionOverrides
      : null,
    requiresThreadReferences,
    prepareStart: async () => {
      if (
        isProjectless &&
        !skipFallbackConfigReadForProjectlessCwd &&
        executorParams.inputs.hasDesktopRuntime &&
        executorParams.hostId === `local`
      ) {
        await readThreadCodexConfig(executorParams.requestClient, cwd, { priority: `critical`, timeoutMs: TURN_START_TIMEOUT_MS });
      }
      return buildThreadStartRequest(
        executorParams,
        {
          model: collaborationMode?.settings.model ?? null,
          reasoningEffort: collaborationMode?.settings.reasoning_effort ?? null,
          serviceTier: resolvedServiceTier,
          cwd: environmentCwd ?? cwd,
          runtimeWorkspaceRoots,
          browserEnvironments: environments,
          savedEnvironmentConfig: environmentResponse?.savedEnvironmentConfig,
          cloudSideConversation: parentEnvironment != null,
          ephemeral: isSideConversation,
          memoryPreferences,
          ...permissionRequest,
          approvalsReviewer: effectivePermissionsConfig?.approvalsReviewer ?? null,
          baseInstructions,
          clientUserMessageId,
          additionalDeveloperInstructions: combinedDeveloperInstructions,
          serviceName:
            serviceName == null &&
            !isSideConversation &&
            mode === `default` &&
            threadStartKind === `default` &&
            (isCloudPrototype || (executorParams.inputs.isBrowserRuntime && executorParams.hostId === `local`))
              ? CODEX_CLOUD_SERVICE_NAME
              : serviceName,
          config,
          threadSource,
          defaultFeatureOverrides,
          dynamicToolFeatureOverrides,
          personality,
          requestedHistoryMode,
          ...(params.realtimeVoiceDynamicTools == null
            ? {}
            : { realtimeVoiceDynamicTools: params.realtimeVoiceDynamicTools }),
          mode,
          threadStartKind,
          requiresThreadReferences,
        },
      );
    },
  };
}

/** codex_cloud 服务名（原 She，27,873）。 */
const CODEX_CLOUD_SERVICE_NAME = `codex_cloud`;

/** turn/start 30s 超时（原 ym）。 */
const TURN_START_TIMEOUT_MS = 30_000;

/** codex_cloud originator 的 thread/start 超时（原 bm=12e4）。 */
const CLOUD_TURN_START_TIMEOUT_MS = 120_000;

/**
 * 组装 thread/start 请求（原 LSe）：buildNewConversationParams → durable
 * 裁剪/memory 配置合并 → 环境与 roots 归位 → thread_references 校验。
 */
async function buildThreadStartRequest(executorParams: any, request: any) {
  let {
    model,
    reasoningEffort,
    serviceTier,
    cwd,
    runtimeWorkspaceRoots,
    browserEnvironments,
    cloudSideConversation,
    ephemeral,
    permissionsConfig,
    permissionSelection,
    approvalsReviewer,
    memoryPreferences,
    baseInstructions,
    clientUserMessageId,
    additionalDeveloperInstructions,
    serviceName,
    config,
    threadSource,
    defaultFeatureOverrides,
    dynamicToolFeatureOverrides,
    personality,
    requestedHistoryMode,
    mode = `default`,
    threadStartKind = `default`,
    requiresThreadReferences = false,
  } = request;
  let isDurable = executorParams.hostId === `durable` || false;
  let startRequest = await executorParams.buildNewConversationParams(
    model,
    serviceTier,
    cwd,
    permissionsConfig,
    approvalsReviewer,
    defaultFeatureOverrides,
    personality,
    {
      baseInstructions,
      permissionSelection,
      additionalDeveloperInstructions,
      ...(request.realtimeVoiceDynamicTools == null
        ? {}
        : { realtimeVoiceDynamicTools: request.realtimeVoiceDynamicTools }),
      mode,
      threadStartKind,
      threadSource,
      dynamicToolFeatureOverrides,
      requestedHistoryMode,
    },
  );
  if (serviceName != null) startRequest.serviceName = serviceName;
  if (executorParams.inputs.projectId != null) startRequest.projectId = executorParams.inputs.projectId;
  let memoryConfig =
    memoryPreferences == null
      ? null
      : {
          "memories.generate_memories": memoryPreferences.generateMemories,
          "memories.use_memories": memoryPreferences.useMemories,
        };
  if (
    (executorParams.inputs.memoryPipeline != null &&
      (startRequest.config = {
        ...startRequest.config,
        "memories.version": executorParams.inputs.memoryPipeline.version,
        "memories.dual_write": executorParams.inputs.memoryPipeline.dualWrite,
      }),
    memoryConfig != null && (startRequest.config = { ...startRequest.config, ...memoryConfig }),
    config != null && (startRequest.config = { ...startRequest.config, ...config }),
    reasoningEffort != null && (startRequest.config = { ...startRequest.config, model_reasoning_effort: reasoningEffort }),
    ephemeral && (startRequest.ephemeral = true),
    isDurable &&
      (startRequest = {
        ...startRequest,
        config: filterThreadSettingsForDurable(startRequest.config),
        ephemeral: cloudSideConversation && ephemeral,
        personality: undefined,
      }),
    browserEnvironments != null && (startRequest.environments = browserEnvironments),
    cloudSideConversation
      ? ((startRequest.cwd = cwd), (startRequest.runtimeWorkspaceRoots = runtimeWorkspaceRoots))
      : (browserEnvironments != null && browserEnvironments.length > 0) || isDurable
        ? ((startRequest.cwd = undefined), (startRequest.runtimeWorkspaceRoots = undefined))
        : (startRequest.runtimeWorkspaceRoots = runtimeWorkspaceRoots),
    logFeatureOverrideResolved(executorParams.logger, defaultFeatureOverrides, startRequest.config),
    requiresThreadReferences && !hasThreadReferences(startRequest))
  )
    throw Error(`thread_references_unavailable`);
  let trace = clientUserMessageId == null ? undefined : await executorParams.inputs.traceRequest?.(clientUserMessageId);
  return {
    request: startRequest,
    tokenBudgetHistoryNotes: false,
    shellEnvironmentPolicy: null,
    method: `thread/start`,
    options: {
      clientUserMessageId,
      savedEnvironmentConfig:
        isDurable || (executorParams.inputs.isBrowserRuntime && executorParams.hostId === `local`)
          ? request.savedEnvironmentConfig
          : undefined,
      priority: `critical`,
      timeoutMs: startRequest.serviceName === `codex_cloud` ? CLOUD_TURN_START_TIMEOUT_MS : TURN_START_TIMEOUT_MS,
      ...(trace === undefined ? {} : { trace }),
    },
  };
}

// ---------------------------------------------------------------------------
// ConversationParamsBuilder（CC）
// ---------------------------------------------------------------------------

/**
 * 会话参数构造器（原 CC）：包装 R3 start-config 的 gx/hx 组装链，按 host
 * 能力裁剪（durable 无 shell 环境/动态工具；local 读 codex config）。
 */
export class ConversationParamsBuilder {
  params: any;

  constructor(params: any) {
    this.params = params;
  }

  /** 组装新会话的基础参数（原 gx+hx 链）。 */
  async buildNewConversationParams(
    model: string | null,
    serviceTier: unknown,
    cwd: string | null,
    permissionsConfig: any,
    approvalsReviewer: unknown,
    defaultFeatureOverrides: Record<string, unknown> | null,
    personality: unknown,
    options: any,
  ) {
    let hasDesktopRuntime = this.params.inputs.hasDesktopRuntime;
    let hasInstructionSources = hasDesktopRuntime || this.params.inputs.hasDeveloperInstructions;
    let allowDeveloperInstructions = hasInstructionSources && true;
    let everydayWork = this.params.inputs.everydayWork;
    let readShellEnvironment = this.params.configuration.readShellEnvironment;
    return await buildThreadStartConfig(
      {
        model,
        serviceTier,
        cwd,
        permissionsConfig,
        permissionSelection: options.permissionSelection,
        approvalsReviewer,
        personality,
        defaultFeatureOverrides,
        instructionOverrides: hasDesktopRuntime ? this.params.inputs.instructionOverrides : null,
        allowMemoryPromptOverrides: this.params.hostId === `local`,
        baseInstructions: options.baseInstructions,
        threadSource: options.threadSource,
        includeProseDetailLevelInstructions: hasDesktopRuntime && everydayWork,
        sidebarSectionToolsEnabled:
          hasDesktopRuntime && this.params.inputs.sidebarSectionToolsEnabled ? true : undefined,
        usesDesktopMcp: this.params.inputs.usesDesktopMcp,
        writingBlockInstructions: defaultFeatureOverrides?.writing_blocks === true && everydayWork,
        additionalDeveloperInstructions: options.additionalDeveloperInstructions,
      },
      {
        requestClient: this.params.requestClient,
        logger: this.params.logger,
        fetchProxyConfig: () => this.params.configuration.fetchProxyConfig(),
        fetchCodexConfig: () => this.buildThreadCodexConfig(cwd),
        readShellEnvironment:
          hasDesktopRuntime && this.params.hostId !== `durable` && readShellEnvironment != null
            ? () => readShellEnvironment(cwd)
            : undefined,
        readDynamicTools: hasInstructionSources
          ? () =>
              this.params.inputs.readDynamicTools({
                featureOverrides:
                  options.dynamicToolFeatureOverrides == null
                    ? defaultFeatureOverrides
                    : { ...defaultFeatureOverrides, ...options.dynamicToolFeatureOverrides },
                requestedHistoryMode: options.requestedHistoryMode,
                mode: options.mode ?? `default`,
                threadStartKind: options.threadStartKind ?? `default`,
                realtimeVoiceDynamicTools: options.realtimeVoiceDynamicTools,
              })
          : undefined,
        readDeveloperInstructions: allowDeveloperInstructions
          ? this.params.configuration.readDeveloperInstructions
          : undefined,
      },
      permissionsConfig,
      options.requestedHistoryMode,
      this.params.requestClient.getAppServerVersion(),
    );
  }

  /** 本地 host 读 codex config；其余 host 返回 null。 */
  async buildThreadCodexConfig(cwd: string | null) {
    return this.params.hostId === `local` ? this.params.configuration.readCodexConfig(cwd) : null;
  }

  /** 组装创建参数（委托 prepareConversationParams）。 */
  async prepareConversation(params: any, requestedHistoryMode: string) {
    return prepareConversationParams(
      { ...this.params, buildNewConversationParams: this.buildNewConversationParams.bind(this) },
      params,
      requestedHistoryMode,
    );
  }

  /** prewarm 参数组装（原 preparePrewarm/preparePrewarmRequest）。 */
  async preparePrewarm(
    {
      cwd,
      workspaceRoots,
      workspaceKind,
      projectlessOutputDirectory,
      collaborationMode,
      agentMode,
      serviceName,
      serviceTier,
      defaultFeatureOverrides,
      personality,
    }: any,
    requestedHistoryMode: string,
  ) {
    let model = collaborationMode?.settings.model ?? null;
    let permissionsPromise = readThreadCodexConfig(this.params.requestClient, cwd, { priority: `critical` }).then(
      (config: any) => resolveAgentModePermissions(agentMode, workspaceRoots, config),
    );
    let instructionOverrides = this.params.inputs.instructionOverrides;
    let permissionsConfig = await permissionsPromise;
    return {
      permissionsConfig,
      instructionOverrides,
      start: await this.preparePrewarmRequest({
        model,
        serviceTier,
        cwd,
        workspaceRoots,
        permissionsConfig,
        approvalsReviewer: permissionsConfig.approvalsReviewer,
        additionalDeveloperInstructions:
          workspaceKind === `projectless`
            ? projectlessWorkspaceInstructions({
                cwd,
                projectlessOutputDirectory,
                projectlessWorkspaceBrowserRoot: workspaceRoots[0] ?? null,
              })
            : null,
        defaultFeatureOverrides,
        personality,
        serviceName:
          serviceName ??
          (this.params.inputs.isBrowserRuntime && this.params.hostId === `local` ? `codex_cloud` : null),
        requestedHistoryMode,
      }),
    };
  }

  /** prewarm 的 thread/start 请求（无 clientUserMessageId/trace）。 */
  async preparePrewarmRequest({
    model,
    serviceTier,
    cwd,
    workspaceRoots,
    permissionsConfig,
    approvalsReviewer,
    additionalDeveloperInstructions,
    defaultFeatureOverrides,
    personality,
    serviceName,
    requestedHistoryMode,
  }: any) {
    let request = await this.buildNewConversationParams(
      model,
      serviceTier,
      cwd,
      permissionsConfig,
      approvalsReviewer,
      defaultFeatureOverrides,
      personality,
      {
        additionalDeveloperInstructions,
        requestedHistoryMode,
      },
    );
    if (serviceName != null) request.serviceName = serviceName;
    request.runtimeWorkspaceRoots = workspaceRoots;
    logFeatureOverrideResolved(this.params.logger, defaultFeatureOverrides, request.config);
    return {
      request,
      tokenBudgetHistoryNotes: false,
      shellEnvironmentPolicy: null,
      method: `thread/start`,
      options: { timeoutMs: TURN_START_TIMEOUT_MS },
    };
  }
}

// ---------------------------------------------------------------------------
// ConversationCreationExecutor（RSe）
// ---------------------------------------------------------------------------

/**
 * 会话创建执行器（原 RSe）：prewarmConversation（预热 thread/start 并入池）
 * 与 createConversation（消费预热或发真实请求、组装会话状态、projectless
 * 落盘、git info 异步补齐、realtime voice workspace 初始化）。
 */
export class ConversationCreationExecutor {
  params: any;

  constructor(params: any) {
    this.params = params;
  }

  /** 预热会话：已在池中（匹配）则直接返回 null；否则组装 + prewarmThreadStart。 */
  prewarmConversation(params: any, createInputs: any) {
    let requestedHistoryMode = this.getRequestedThreadHistoryMode(`default`);
    if (
      this.params.prewarmedThreadManager.hasPrewarmedThread(
        params.cwd,
        params.workspaceRoots,
        params.serviceName,
        requestedHistoryMode,
      )
    ) {
      createInputs[Symbol.dispose]?.();
      return Promise.resolve(null);
    }
    let preparation = (async () => {
      let inputs: any;
      try {
        inputs = await createInputs(params, requestedHistoryMode);
        return await new ConversationParamsBuilder({ ...this.params, inputs }).preparePrewarm(params, requestedHistoryMode);
      } finally {
        inputs?.[Symbol.dispose]?.();
        createInputs[Symbol.dispose]?.();
      }
    })();
    let prewarmPromise = (async () => {
      try {
        let prepared = await preparation;
        if (prepared == null) return null;
        let response = await this.params.requestClient.prewarmThreadStart(prepared.start.request, {
          timeoutMs: TURN_START_TIMEOUT_MS,
        });
        this.params.setThreadReferencesSupported(
          normalizeThreadId(response.thread.id),
          hasThreadReferences(prepared.start.request),
        );
        return { response, shellEnvironmentPolicy: prepared.start.shellEnvironmentPolicy };
      } catch (error) {
        if (
          (this.params.logger.warning(`Failed to prewarm conversation`, {
            safe: {},
            sensitive: { cwd: params.cwd, error },
          }),
          error instanceof DeliveryError && error.delivery.stage === `outcome-unknown`)
        )
          throw error;
        return null;
      }
    })();
    this.params.prewarmedThreadManager.setPrewarmedThreadPromise(
      params.cwd,
      params.workspaceRoots,
      params.serviceName,
      requestedHistoryMode,
      prewarmPromise,
      preparation.then(
        (prepared: any) => prepared?.permissionsConfig ?? null,
        () => null,
      ),
      preparation.then(
        (prepared: any) => prepared?.instructionOverrides ?? null,
        () => null,
      ),
      params.defaultFeatureOverrides,
    );
    return prewarmPromise.then((result: any) => result?.response ?? null);
  }

  /** 创建会话（原 createConversation，~290 行）。 */
  async createConversation(
    params: any,
    createInputs: any,
    onOutcomeUnknown: (delivery: any) => void,
    afterConversationCreated: ((conversationId: string, thread: any) => Promise<void>) | undefined,
    daybreakEnabled: boolean | undefined,
  ) {
    let startedAt = Date.now();
    let mode = params.mode ?? `default`;
    let threadStartKind = params.threadStartKind ?? `default`;
    let requestedHistoryMode = this.getRequestedThreadHistoryMode(mode);
    let inputs = await (async () => {
      try {
        return await createInputs(params, requestedHistoryMode);
      } finally {
        createInputs[Symbol.dispose]?.();
      }
    })();
    let inputsLoadedAt = Date.now();
    let prepared: any;
    try {
      prepared = await new ConversationParamsBuilder({ ...this.params, inputs }).prepareConversation(
        params,
        requestedHistoryMode,
      );
    } catch (error) {
      throw (inputs[Symbol.dispose]?.(), error);
    }
    let preparationDoneAt = Date.now();
    let prewarmed: { response: any; shellEnvironmentPolicy: any } | null = null;
    let startRequest: any = null;
    try {
      if (
        prepared.canUsePrewarmedThread &&
        prepared.permissionsConfig != null &&
        this.params.prewarmedThreadManager.hasPrewarmedThread(
          params.cwd,
          params.workspaceRoots,
          params.serviceName ?? null,
          requestedHistoryMode,
        )
      ) {
        prewarmed = await this.params.prewarmedThreadManager.consumePrewarmedThread(
          params.cwd,
          params.workspaceRoots,
          params.serviceName ?? null,
          requestedHistoryMode,
          prepared.permissionsConfig,
          prepared.prewarmedInstructionOverrides,
          params.defaultFeatureOverrides,
          prepared.requiresThreadReferences
            ? (response: any) => this.params.getThreadReferencesSupported(normalizeThreadId(response.thread.id))
            : undefined,
        );
      }
      prewarmed ?? (startRequest = await prepared.prepareStart());
    } finally {
      inputs[Symbol.dispose]?.();
    }
    let requestStartedAt = Date.now();
    let usedPrewarmedThread = prewarmed != null;
    if (prewarmed == null) {
      if (startRequest == null) throw Error(`Missing prepared thread start`);
      let vmProduct = `unknown`;
      this.params.logger.info(`VM lifecycle`, {
        safe: {
          vmEvent: `thread_start_requested`,
          vmProduct,
          method: startRequest.method,
          threadStartKind,
          requestedEnvironmentIds: prepared.acceptedThread.environments?.map((environment: any) => environment.environmentId),
          traceId: startRequest.options.trace?.traceparent.slice(3, 35),
        },
        sensitive: { hostId: this.params.hostId },
      });
      prewarmed = {
        response: await this.params.requestClient
          .sendRequest(startRequest.method, startRequest.request, { ...startRequest.options, onOutcomeUnknown })
          .catch((error: unknown) => {
            throw (
              this.params.logger.warning(`VM lifecycle`, {
                safe: {
                  vmEvent: `thread_start_failed`,
                  vmProduct,
                  threadStartKind,
                  errorType: error instanceof Error ? error.name : `unknown`,
                  durationMs: Date.now() - requestStartedAt,
                  traceId: startRequest?.options.trace?.traceparent.slice(3, 35),
                },
                sensitive: { hostId: this.params.hostId },
              }),
              error
            );
          }),
        shellEnvironmentPolicy: startRequest.shellEnvironmentPolicy,
      };
    }
    let requestCompletedAt = Date.now();
    let response = prewarmed.response;
    let acceptedThread = prepared.acceptedThread;
    let conversationId = normalizeThreadId(response.thread.id);
    let effectiveCwd =
      acceptedThread.fixedCwd ??
      resolveThreadCwdFromResponse({
        requestedCwd: acceptedThread.requestedCwd,
        responseCwd: response.cwd ?? null,
        threadCwd: response.thread.cwd,
        fallbackCwd: acceptedThread.fallbackCwd,
      });
    let gitInfo = acceptedThread.workspaceKind === `projectless` ? null : (response.thread.gitInfo ?? null);
    let currentPermissions = mergePermissionConfigWithFallback(response, prepared.permissionsConfig);
    let { createdAt, updatedAt, recencyAt } = threadTimestamps(response.thread);
    let conversationState = {
      id: conversationId,
      sessionId: response.thread.sessionId,
      shellEnvironmentPolicy: prewarmed.shellEnvironmentPolicy,
      forkedFromId: response.thread.forkedFromId == null ? null : normalizeThreadId(response.thread.forkedFromId),
      ephemeral: prepared.ephemeral,
      sideConversation: prepared.ephemeral,
      sideConversationParentNavigationPath: params.sideConversation?.parentNavigationPath,
      hostId: this.params.hostId,
      turns: [],
      requests: [],
      createdAt,
      updatedAt,
      recencyAt: recencyAt ?? updatedAt,
      title: params.initialTitle == null ? null : (truncateText(params.initialTitle, 60) ?? undefined),
      mode,
      threadStartKind,
      modelProvider: response.thread.modelProvider,
      daybreakEnabled: daybreakEnabled ?? response.thread.daybreakEnabled,
      latestThreadSettings: null,
      latestModel: ``,
      latestReasoningEffort: null,
      previousTurnModel: null,
      latestCollaborationMode:
        params.collaborationMode ?? {
          mode: `default`,
          settings: { model: ``, reasoning_effort: null, developer_instructions: null },
        },
      hasUnreadTurn: false,
      rolloutPath: response.thread.path ?? ``,
      cwd: effectiveCwd,
      gitInfo,
      resumeState: `resumed`,
      latestTokenUsageInfo: null,
      currentPermissions,
      connectedEnvironmentIds: this.params.threadStore.getConversation(conversationId)?.connectedEnvironmentIds,
      ...environmentSelection(response.thread, { environments: acceptedThread.environments ?? undefined }, `live`),
      workspaceKind: acceptedThread.workspaceKind,
      workspaceBrowserRoot: acceptedThread.workspaceBrowserRoot,
      projectlessOutputDirectory: acceptedThread.projectlessOutputDirectory,
      originator: response.thread.originator,
      source: response.thread.source,
      agentNickname: response.thread.agentNickname,
      threadSource: response.thread.threadSource,
      historyMode: response.thread.historyMode,
      canonicalVoiceHistory: isCanonicalVoiceHistory(response.thread),
      serviceName: params.serviceName,
    };
    this.params.canonicalTurnHistory && applyConversationTurns(freezeIdentity(conversationState), [], true, null);
    applyModelSettingsUpdate(freezeIdentity(conversationState), {
      ...buildModelSettingsUpdate(
        response,
        response.model,
        response.reasoningEffort ?? null,
        effectiveCwd,
        params.collaborationMode ?? {
          mode: `default`,
          settings: {
            model: response.model,
            reasoning_effort: response.reasoningEffort ?? null,
            developer_instructions: null,
          },
        },
      ),
      summary: acceptedThread.threadSettingsSummary,
      ...permissionSettingsUpdate(currentPermissions),
    });
    let initializationFailure: { error: unknown } | null = null;
    if (startRequest != null) {
      try {
        startRequest.tokenBudgetHistoryNotes && this.params.setTokenBudgetThread(conversationId);
        this.params.setThreadReferencesSupported(conversationId, hasThreadReferences(startRequest.request));
      } catch (error) {
        initializationFailure = { error };
      }
    }
    try {
      this.params.initializationCapabilities.cloud != null &&
        recordCloudThreadPrototype(this.params.initializationCapabilities.cloud, conversationId, prepared.initialization.cloudThreadPrototype);
    } catch (error) {
      initializationFailure ??= { error };
    }
    this.params.setConversation(conversationState);
    if (acceptedThread.workspaceKind === `projectless`) {
      this.params.projectlessConversations.saveConversationId(conversationId).catch((error: unknown) => {
        this.params.logger.error(`Error saving projectless conversation id`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
      this.params.projectlessConversations.saveOutputDirectoryHint(
        conversationId,
        acceptedThread.projectlessOutputDirectory,
      );
      this.params.projectlessConversations.saveWorkspaceRootHint(conversationId, acceptedThread.workspaceBrowserRoot);
    }
    let storedConversation = this.params.threadStore.getConversation(conversationId);
    let storedPermissions = storedConversation?.currentPermissions;
    let storedThreadSettings = storedConversation?.latestThreadSettings;
    let initialGitInfo = gitInfo;
    let gitInfoPromise: Promise<unknown> | null = null;
    let initializationError: string | null = null;
    try {
      if ((await afterConversationCreated?.(conversationId, response.thread.projectId), initializationFailure != null))
        throw initializationFailure.error;
      let initialization = await initializeRealtimeVoiceWorkspace(
        this.params.hostId,
        this.params.requestClient,
        this.params.initializationCapabilities,
        params,
        prepared.initialization,
        acceptedThread,
        response,
      );
      response = initialization.response;
      let current = this.params.threadStore.getConversation(conversationId);
      this.params.threadStore.updateConversationState(conversationId, (state: any) => {
        current?.currentPermissions === storedPermissions &&
          (state.currentPermissions = freezeIdentity(initialization.permissionsConfig));
        current?.latestThreadSettings === storedThreadSettings &&
          applyModelSettingsUpdate(state, permissionSettingsUpdate(initialization.permissionsConfig));
      });
      if (initialization.retainedWritableRoots != null) {
        try {
          await this.params.mergeThreadWritableRoots(conversationId, initialization.retainedWritableRoots);
        } catch (error) {
          this.params.logger.warning(`Failed to merge thread writable roots`, {
            safe: { conversationId },
            sensitive: { error },
          });
        }
      }
      if (
        (initialGitInfo == null &&
          effectiveCwd != null &&
          acceptedThread.workspaceKind !== `projectless` &&
          ((gitInfoPromise = initialization.getGitInfo(effectiveCwd).catch(() => null)),
          gitInfoPromise.then((resolved: any) => {
            let current = this.params.threadStore.getConversation(conversationId);
            resolved != null &&
              current?.cwd === effectiveCwd &&
              current.gitInfo === initialGitInfo &&
              this.params.threadStore.updateConversationState(conversationId, (state: any) => {
                state.gitInfo = freezeIdentity(resolved);
              });
          }).catch(() => void 0)),
        this.params.initializationCapabilities.assertCurrent?.(),
        prepared.ephemeral || this.params.threadStore.ensureRecentConversationId(conversationId))
      ) {
        // 初始化完成
      }
    } catch (error) {
      initializationError = error instanceof Error ? error.message : String(error);
      this.params.logger.error(`Accepted conversation initialization failed`, {
        safe: { conversationId },
        sensitive: { error },
      });
      daybreakEnabled !== undefined &&
        this.params.threadStore.applyThreadDaybreakUpdate(conversationId, response.thread.daybreakEnabled);
    }
    if (initializationError == null) {
      let completedAt = Date.now();
      this.params.logger.info(`Conversation created`, {
        safe: {
          conversationId,
          durationMs: completedAt - startedAt,
          inputsDurationMs: inputsLoadedAt - startedAt,
          preparationDurationMs: preparationDoneAt - inputsLoadedAt,
          requestPreparationDurationMs: requestStartedAt - preparationDoneAt,
          requestDurationMs: requestCompletedAt - requestStartedAt,
          initializationDurationMs: completedAt - requestCompletedAt,
          mode,
          threadStartKind,
          usedPrewarmedThread,
          vmEvent: `thread_created`,
          vmProduct: `unknown`,
          threadId: conversationId,
          environmentIds: conversationState.environments?.map((environment: any) => environment.environmentId),
          connectedEnvironmentIds: conversationState.connectedEnvironmentIds,
          traceId: startRequest?.options.trace?.traceparent.slice(3, 35),
        },
        sensitive: {},
      });
    }
    return {
      conversationId,
      conversationResponse: response,
      effectiveCwd,
      gitInfoPromise,
      firstTurnContext: { conversationId, gitInfo: initialGitInfo, workspaceKind: acceptedThread.workspaceKind },
      serviceTier: prepared.serviceTier,
      initializationError,
    };
  }

  /** 保存初始 daybreak 设置（显式值优先，失败回滚到响应值）。 */
  async saveInitialDaybreak(
    conversationId: string,
    daybreakEnabled: boolean | undefined,
    responseDaybreakEnabled: boolean,
    updateThreadDaybreakEnabled: (conversationId: string, value: boolean) => Promise<unknown>,
  ) {
    if (daybreakEnabled !== undefined) {
      this.params.threadStore.applyThreadDaybreakUpdate(conversationId, daybreakEnabled);
      try {
        await updateThreadDaybreakEnabled(conversationId, daybreakEnabled);
      } catch (error) {
        throw (this.params.threadStore.applyThreadDaybreakUpdate(conversationId, responseDaybreakEnabled), error);
      }
    }
  }

  /** 请求的历史模式（default 且开关开启 → paginated，否则 legacy）。 */
  getRequestedThreadHistoryMode(mode: string) {
    return mode === `default` && this.params.usePaginatedThreadHistory?.() === true ? `paginated` : `legacy`;
  }
}

// ---------------------------------------------------------------------------
// R3 依赖占位（导出名以 R3 侧落地为准，缺导出已记录）
// ---------------------------------------------------------------------------

// gx/hx（42,479-43,548 start-config 组装链）——R3 threads/start-config。
import { gx as buildThreadStartConfig } from "../threads/start-config";
// xx（42,907 cwd 归并）——R3 threads/start-config。
import { xx as resolveThreadCwdFromResponse } from "../threads/start-config";
// Cx（42,927 权限配置合并）——R3 threads/operations。
import { Cx as mergePermissionConfigWithFallback } from "../threads/operations";
// applyConversationTurns（原 m_，31,126）——R3 turns/canonical-history。
import { applyConversationTurns } from "../turns/canonical-history";
