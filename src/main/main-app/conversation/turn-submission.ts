// turn 提交流程（原版 47,816-48,306 区段）。
//
// 职责：
//   - retrySafetyBufferedTurn（wxe）：safety_buffer_retry 触发——中断当前
//     turn、revert/rollback 掉未确认 turn、按新 model/effort 重新提交；
//   - sendFollowUpMessage（Txe）：follow-up 消息提交（resume + settings
//     更新 + turnCoordinator.sendPreparedMessage）；
//   - runConversationCreationWithFirstTurn（Exe）：创建会话并跑首 turn，
//     创建 promise 与「outcome-unknown 延迟决议」竞速；
//   - startContinuationTurn（Dxe）：continuation turn（活跃 turn 结束后
//     才提交）。
//
// 依赖方向：本模块 → R3 canonical-history / history-policy / operations /
// notifications-apply；manager（rw）实例以参数注入，不做静态引用。

import {
  Wu as versionSupportsFeature,
  Wn as ResumeNotReadyError,
  mr as DeliveryError,
  Zo as errorToString,
  kd as defaultSandboxConfig,
  Nd as extractPermissionRequestFields,
  Ac as createDeferred,
} from "@chunk/shared";
import { findTurnById, mergedConversationTurns } from "../turns/canonical-history";
import { bx as assertLegacyHistoryMode } from "../threads/history-policy";
import { Cx as mergePermissionConfigWithFallback } from "../threads/operations";
import { Ry as appendWorktreeInitItem } from "../streams/notifications-apply";
import { findLast } from "../util/lodash-interop";
// 注：omit（原版 Bb interop）在 R3 的 util/lodash-interop 尚未导出，集成时补齐
// （见报告）；findLast 已导出。
// eslint-disable-next-line
import { omit } from "../util/lodash-interop";
import { mergeWritingBlockContext } from "../markdown/writing-blocks";

// ---------------------------------------------------------------------------
// safety_buffer_retry
// ---------------------------------------------------------------------------

/**
 * safety_buffer_retry：把（仍在缓冲中的）旧 turn 用新 model/effort 重跑。
 * 流程：定位缓冲 turn → 校验历史模式 → 解析 supportedReasoningEfforts →
 * 未开始则只更新下轮 settings；进行中则中断 + revert（分页模式）或
 * rollback（legacy）+ 以 turnTrigger=safety_buffer_retry 重新提交。
 */
export async function retrySafetyBufferedTurn({
  conversationId,
  manager,
  model,
  additionalContext,
  startTurn,
  turnId,
  turnMergePolicy,
}: {
  conversationId: string;
  manager: any;
  model: string;
  additionalContext: Record<string, unknown> | undefined;
  startTurn: (request: any, bufferedTurn: any) => Promise<unknown>;
  turnId: string;
  turnMergePolicy: unknown;
}) {
  let conversation = manager.getConversation(conversationId);
  let bufferedTurn = findTurnById(conversation, turnId, turnMergePolicy);
  if (bufferedTurn == null) throw Error(`Buffered turn not found.`);
  let supportsRevert =
    conversation?.historyMode === `paginated` &&
    versionSupportsFeature(manager.requestClient.getAppServerVersion(), `threadRevert`);
  supportsRevert || assertLegacyHistoryMode(conversation?.historyMode, `Retrying buffered turns`);
  let requestedEffort =
    bufferedTurn.params.collaborationMode?.settings.reasoning_effort ??
    bufferedTurn.params.effort ??
    conversation?.latestReasoningEffort ??
    null;
  let effort = (
    await manager
      .sendRequest(`model/list`, { cursor: null, includeHidden: true, limit: 100 })
      .catch(() => null)
  )?.data
    .find((entry: any) => entry.model === model)
    ?.supportedReasoningEfforts.some((entry: any) => entry.reasoningEffort === requestedEffort)
    ? requestedEffort
    : `low`;
  if (bufferedTurn.status !== `inProgress`) {
    await manager.updateThreadSettingsForNextTurn(conversationId, { effort, model });
    return;
  }
  if ((await manager.interruptConversation(conversationId, `system`, turnId)) !== bufferedTurn.turnId)
    throw Error(`The buffered turn is no longer active.`);
  let state = manager.getConversation(conversationId);
  if (state == null) throw Error(`Conversation state not found.`);
  if (mergedConversationTurns(state, turnMergePolicy).at(-1)?.turnId !== turnId)
    throw Error(`The buffered turn is no longer the latest turn.`);
  if (supportsRevert) {
    let response = await manager.sendRequest(`thread/revert`, { threadId: conversationId, beforeTurnId: turnId });
    manager.applyRevertResponseToConversation({ conversationId, response, revertedTurns: [bufferedTurn] });
  } else {
    let response = await manager.sendRequest(`thread/rollback`, { threadId: conversationId, numTurns: 1 });
    manager.applyRollbackResponseToConversation({
      conversationId,
      conversationState: state,
      rollbackResponse: response,
    });
  }
  let request = omit(bufferedTurn.params, [
    `clientUserMessageId`,
    `attachments`,
    `commentAttachments`,
    `useAppServerPermissionDefault`,
  ]);
  await startTurn(
    {
      ...request,
      threadId: conversationId,
      turnTrigger: `safety_buffer_retry`,
      input: bufferedTurn.params.input,
      additionalContext: mergeWritingBlockContext(request.additionalContext, additionalContext),
      collaborationMode:
        request.collaborationMode == null
          ? request.collaborationMode
          : {
              ...request.collaborationMode,
              settings: { ...request.collaborationMode.settings, model, reasoning_effort: effort },
            },
      effort,
      model,
    },
    bufferedTurn,
  );
}

// ---------------------------------------------------------------------------
// follow-up 消息
// ---------------------------------------------------------------------------

/**
 * 发送 follow-up 消息：空文本抛错；先 resume 会话（not-ready 抛
 * ResumeNotReadyError），显式 model/effort 时更新下轮 settings，然后经
 * turnCoordinator.sendPreparedMessage 提交（steer + start 双路径预备）。
 */
export async function sendFollowUpMessage({
  conversationId,
  createId,
  manager,
  options: {
    additionalContext,
    inputItems,
    toolOutput,
    writingBlockContextPrepared,
    messageMetadata,
    messageThreadId,
    model,
    prompt,
    turnTrigger,
    reasoningEffort,
    serviceTier,
    usePermissionSelection,
  },
}: {
  conversationId: string;
  createId: () => string;
  manager: any;
  options: {
    additionalContext: Record<string, unknown> | undefined;
    inputItems: unknown[] | undefined;
    toolOutput: unknown;
    writingBlockContextPrepared: boolean | undefined;
    messageMetadata: unknown;
    messageThreadId: string | null | undefined;
    model: string | null | undefined;
    prompt: string;
    turnTrigger: string;
    reasoningEffort: string | null | undefined;
    serviceTier: unknown;
    usePermissionSelection: boolean | undefined;
  };
}) {
  let text = prompt.trim();
  if (text.length === 0) throw Error(`Cannot send an empty follow-up message.`);
  let resume = await manager.resumeConversation({
    conversationId,
    model: model ?? null,
    serviceTier,
    reasoningEffort: reasoningEffort ?? null,
    workspaceRoots: [manager.getConversationCwd(conversationId) ?? `/`],
    collaborationMode: manager.getConversation(conversationId)?.latestCollaborationMode ?? null,
    useAppServerPermissionDefault: usePermissionSelection,
  });
  if (resume.status === `not-ready`) throw new ResumeNotReadyError(resume);
  if (model != null || reasoningEffort !== undefined) {
    let conversation = manager.getConversation(conversationId);
    let effectiveModel = model ?? conversation?.latestModel;
    if (effectiveModel == null || effectiveModel.trim().length === 0)
      throw Error(`Cannot set reasoning without a thread model.`);
    await manager.updateThreadSettingsForNextTurn(conversationId, {
      model: effectiveModel,
      effort: reasoningEffort === undefined ? (conversation?.latestReasoningEffort ?? null) : reasoningEffort,
    });
  }
  let input = toolOutput == null ? [{ type: `text`, text, text_elements: [] }, ...(inputItems ?? [])] : [];
  let responsesapiClientMetadata =
    messageMetadata == null ? undefined : { message_metadata: JSON.stringify(messageMetadata) };
  let cwd = manager.getConversationCwd(conversationId) ?? `/`;
  let restoreMessage = {
    id: createId(),
    text,
    context: {
      prompt: text,
      messageThreadId,
      turnTrigger,
      addedFiles: [],
      fileAttachments: [],
      ideContext: null,
      imageAttachments: [],
      workspaceRoots: [cwd],
    },
    cwd,
    createdAt: Date.now(),
    responsesapiClientMetadata,
  };
  let start = {
    request: {
      threadId: conversationId,
      turnTrigger,
      additionalContext,
      input,
      toolOutput,
      clientUserMessageId: restoreMessage.id,
      responsesapiClientMetadata,
      serviceTier,
    },
    context: {
      messageThreadId: restoreMessage.context.messageThreadId,
      writingBlockContextPrepared,
      usePermissionSelection: usePermissionSelection === true && manager.canUsePermissionSelection(conversationId),
    },
  };
  manager.getConversation(conversationId);
  return manager.turnCoordinator.sendPreparedMessage({
    conversationId,
    executionHostId: manager.getHostId(),
    resume: {
      conversationId,
      model: model ?? null,
      reasoningEffort: reasoningEffort ?? null,
      serviceTier,
      workspaceRoots: [cwd],
      collaborationMode: manager.getConversation(conversationId)?.latestCollaborationMode ?? null,
      useAppServerPermissionDefault: usePermissionSelection,
    },
    steer: {
      input,
      toolOutput,
      restoreMessage,
      serviceTier,
      attachments: [],
      clientUserMessageId: restoreMessage.id,
      additionalContext,
    },
    start,
  });
}

// ---------------------------------------------------------------------------
// 会话创建 + 首 turn
// ---------------------------------------------------------------------------

/**
 * 创建会话并提交首 turn。创建 promise 与 deferred 竞速：请求派发时报告
 * outcome-unknown 即刻以该状态决议（不等创建流程自然失败）。回调句柄
 * （beforeFirstTurn/afterConversationCreated/onMessageAdded/onSettled）带
 * dup 能力时复制一份，finally 统一 dispose。
 *
 * @param manager   AppServerConversationManager 实例（logger/个性化/快照广播）
 * @param facade    会话创建门面（assertActive/threadCreation/deferral/settings/
 *                  history/executeTurnStart 等——rw 方法组以子对象注入）
 * @param params    创建参数（input/cwd/workspaceRoots/…）
 * @param callbacks 首 turn 生命周期回调与覆盖项
 */
export async function runConversationCreationWithFirstTurn(
  manager: any,
  facade: {
    assertActive: () => void;
    runtimeSettings: any;
    threadWorkspaceStorage: any;
    threadStartedNotificationDeferral: any;
    threadCreation: any;
    settings: any;
    history: any;
    notifyConversationCallbacks: (conversationId: string) => void;
    executeTurnStart: any;
  },
  params: Record<string, unknown>,
  {
    readThreadCreationInputs,
    afterConversationCreated,
    beforeFirstTurn,
    onMessageAdded,
    onSettled,
    dynamicToolFeatureOverrides,
    worktreeInit,
  }: {
    readThreadCreationInputs: unknown;
    afterConversationCreated: any;
    beforeFirstTurn: any;
    onMessageAdded: any;
    onSettled: any;
    dynamicToolFeatureOverrides: unknown;
    worktreeInit: unknown;
  },
) {
  facade.assertActive();
  let beforeFirstTurnHandle = beforeFirstTurn != null && `dup` in beforeFirstTurn ? beforeFirstTurn.dup() : null;
  let afterConversationCreatedHandle =
    afterConversationCreated != null && `dup` in afterConversationCreated ? afterConversationCreated.dup() : null;
  let onSettledHandle = onSettled != null && `dup` in onSettled ? onSettled.dup() : null;
  let onMessageAddedHandle = onMessageAdded != null && `dup` in onMessageAdded ? onMessageAdded.dup() : null;
  let outcomeUnknown = createDeferred();
  let notifySettled = async (result: unknown) => {
    try {
      await (onSettledHandle ?? onSettled)?.(result);
    } catch (error) {
      manager.logger.warning(`Task creation settlement callback failed`, {
        safe: {},
        sensitive: { error },
      });
    }
  };
  let creation = (async () => {
    let {
      input,
      toolOutput,
      responseItems,
      turnTrigger,
      sideConversation,
      initialTitle,
      clientUserMessageId,
      collaborationMode,
      multiAgentMode = `explicitRequestOnly`,
      daybreakEnabled,
      serviceTier,
      workspaceRoots,
      workspaceKind = `project`,
      projectlessOutputDirectory,
      skipFallbackConfigReadForProjectlessCwd = false,
      permissionsConfig,
      permissionSelection,
      usePermissionSelection = false,
      useAppServerPermissionDefault = false,
      cwd,
      attachments,
      localTurnMetadata,
      commentAttachments,
      mcpAppModelContextAttachments,
      memoryPreferences,
      baseInstructions,
      additionalDeveloperInstructions,
      serviceName,
      config,
      projectAssignment,
      mode,
      threadSource,
      threadStartKind,
      requiresThreadReferences = false,
    } = params;
    let personality = await manager.readDefaultPersonality(cwd);
    let saveThreadProjectAssignment = facade.runtimeSettings.saveThreadProjectAssignment;
    let onConversationCreated =
      afterConversationCreated == null && (projectAssignment === undefined || saveThreadProjectAssignment == null)
        ? undefined
        : async (conversationId: string, thread: unknown) => {
            await (afterConversationCreatedHandle ?? afterConversationCreated)?.(conversationId, thread);
            projectAssignment !== undefined &&
              saveThreadProjectAssignment != null &&
              (await saveThreadProjectAssignment({ threadId: conversationId, assignment: projectAssignment }, thread));
          };
    let resolvedPermissionsConfig;
    resolvedPermissionsConfig =
      permissionSelection == null
        ? useAppServerPermissionDefault
          ? { permissionsConfig: null }
          : { permissionsConfig: permissionsConfig ?? defaultSandboxConfig(workspaceRoots) }
        : { permissionsConfig: null, permissionSelection };
    let {
      conversationId,
      conversationResponse,
      effectiveCwd,
      gitInfoPromise,
      firstTurnContext,
      serviceTier: acceptedServiceTier,
      initializationError,
    } = await facade.threadStartedNotificationDeferral.run(onConversationCreated != null, () =>
      facade.threadCreation.createConversation(
        {
          clientUserMessageId,
          cloudThreadPrototype: params.cloudThreadPrototype,
          sideConversation,
          collaborationMode,
          initialTitle,
          serviceTier,
          serviceName,
          workspaceRoots,
          workspaceKind,
          projectlessOutputDirectory,
          skipFallbackConfigReadForProjectlessCwd,
          ...resolvedPermissionsConfig,
          cwd,
          memoryPreferences,
          baseInstructions,
          additionalDeveloperInstructions,
          config,
          projectAssignment,
          mode,
          threadSource,
          ...(params.realtimeVoiceDynamicTools == null
            ? {}
            : { realtimeVoiceDynamicTools: params.realtimeVoiceDynamicTools }),
          threadStartKind,
          requiresThreadReferences,
          defaultFeatureOverrides: facade.settings.readDefaultFeatureOverrides(),
          dynamicToolFeatureOverrides,
          personality,
        },
        readThreadCreationInputs,
        (dispatch: any) => outcomeUnknown.resolve({ status: `outcome-unknown`, requestId: dispatch.requestId }),
        onConversationCreated,
        daybreakEnabled,
      ),
    );
    if (initializationError != null)
      return {
        status: `created`,
        conversationId,
        firstTurn: { status: `not-started`, message: initializationError },
      };
    let effectiveCollaborationMode = collaborationMode;
    try {
      await facade.threadCreation.saveInitialDaybreak(
        conversationId,
        daybreakEnabled,
        conversationResponse.thread.daybreakEnabled,
        manager.updateThreadDaybreakEnabled.bind(manager),
      );
      projectAssignment !== undefined &&
        saveThreadProjectAssignment == null &&
        (await facade.threadWorkspaceStorage.setProjectAssignment(conversationId, projectAssignment));
      facade.notifyConversationCallbacks(conversationId);
      manager.broadcastConversationSnapshot(conversationId);
    } catch (error) {
      return {
        status: `created`,
        conversationId,
        firstTurn: { status: `not-started`, message: errorToString(error) },
      };
    }
    if (
      input.length === 0 &&
      toolOutput == null &&
      (attachments?.length ?? 0) === 0 &&
      (commentAttachments?.length ?? 0) === 0
    )
      return { status: `created`, conversationId, firstTurn: { status: `not-requested` } };
    let turnPermissions = mergePermissionConfigWithFallback(conversationResponse, permissionsConfig);
    let messageThreadId = params.messageThreadId;
    let turnClientUserMessageId = clientUserMessageId ?? facade.history.createSearchIslandId();
    let onFirstTurnReady = () =>
      facade.runtimeSettings.onFirstTurnReady?.({
        conversationId,
        cwd: effectiveCwd ?? null,
        startParams: params,
      });
    let hasBeforeStartHooks = beforeFirstTurn != null || worktreeInit != null;
    return {
      status: `created`,
      conversationId,
      firstTurn: await (async () => {
        try {
          onFirstTurnReady();
          return {
            status: `accepted`,
            turnId: (
              await facade.executeTurnStart(
                conversationId,
                {
                  request: {
                    threadId: conversationId,
                    clientUserMessageId: turnClientUserMessageId,
                    turnTrigger,
                    cwd: effectiveCwd,
                    ...(useAppServerPermissionDefault || usePermissionSelection
                      ? {}
                      : {
                          approvalPolicy: turnPermissions.approvalPolicy,
                          approvalsReviewer: turnPermissions.approvalsReviewer,
                          ...extractPermissionRequestFields(turnPermissions),
                        }),
                    model: collaborationMode == null ? conversationResponse.model : null,
                    serviceTier: acceptedServiceTier,
                    effort: collaborationMode?.settings.reasoning_effort,
                    multiAgentMode,
                    input,
                    toolOutput,
                    additionalContext: params.additionalContext,
                    collaborationMode: effectiveCollaborationMode,
                  },
                  context: {
                    messageThreadId,
                    attachments,
                    commentAttachments,
                    useAppServerPermissionDefault: useAppServerPermissionDefault || usePermissionSelection,
                    usePermissionSelection,
                    threadStartKind,
                    mcpAppModelContextAttachments,
                    responseItems,
                    localTurnMetadata,
                    beforeSendRequest: hasBeforeStartHooks
                      ? async () => {
                          worktreeInit != null && appendWorktreeInitItem(manager, conversationId, worktreeInit, facade.history);
                          beforeFirstTurn != null &&
                            gitInfoPromise != null &&
                            (firstTurnContext.gitInfo = firstTurnContext.gitInfo ?? (await gitInfoPromise));
                          await (beforeFirstTurnHandle ?? beforeFirstTurn)?.(firstTurnContext);
                        }
                      : undefined,
                  },
                },
                `nested`,
                (dispatch: any) =>
                  outcomeUnknown.resolve({
                    status: `created`,
                    conversationId,
                    firstTurn: {
                      status: `outcome-unknown`,
                      clientUserMessageId: turnClientUserMessageId,
                      requestId: dispatch.requestId,
                    },
                  }),
                onMessageAddedHandle ?? onMessageAdded,
              )
            ).turn.id,
          };
        } catch (error) {
          return error instanceof DeliveryError && error.delivery.stage === `outcome-unknown`
            ? {
                status: `outcome-unknown`,
                clientUserMessageId: turnClientUserMessageId,
                requestId: error.delivery.requestId,
              }
            : {
                status: error instanceof Error && `jsonRpcCode` in error ? `rejected` : `not-started`,
                message: errorToString(error),
              };
        }
      })(),
    };
  })()
    .then(
      async (result: any) => (await notifySettled(result), result),
      async (error: unknown) => {
        if (error instanceof DeliveryError && error.delivery.stage === `outcome-unknown`) {
          let outcome = { status: `outcome-unknown`, requestId: error.delivery.requestId };
          await notifySettled(outcome);
          return outcome;
        }
        throw (await notifySettled({ status: `failed`, message: errorToString(error) }), error);
      },
    )
    .finally(() => {
      beforeFirstTurnHandle?.[Symbol.dispose]();
      afterConversationCreatedHandle?.[Symbol.dispose]();
      onSettledHandle?.[Symbol.dispose]();
      onMessageAddedHandle?.[Symbol.dispose]();
    });
  return Promise.race([creation, outcomeUnknown.promise]);
}

// ---------------------------------------------------------------------------
// continuation turn
// ---------------------------------------------------------------------------

/** continuation turn：活跃 turn 仍在跑时等它结束（thread 状态回落 idle）再提交。 */
export async function startContinuationTurn({
  conversationId,
  manager,
  options,
  resumeConversation,
  startTurn,
  turnMergePolicy,
}: {
  conversationId: string;
  manager: any;
  options: any;
  resumeConversation: (request: any) => Promise<any>;
  startTurn: (operation: any) => Promise<unknown>;
  turnMergePolicy: unknown;
}) {
  let resume = await resumeConversation({
    conversationId,
    model: null,
    reasoningEffort: null,
    serviceTier: null,
    workspaceRoots: [manager.getConversationCwd(conversationId) ?? `/`],
    collaborationMode: options.collaborationMode ?? manager.getConversation(conversationId)?.latestCollaborationMode ?? null,
  });
  if (resume.status === `not-ready`) throw new ResumeNotReadyError(resume);
  let conversation = manager.getConversation(conversationId);
  let latestTurn =
    conversation == null
      ? null
      : (findLast(mergedTurnsView(conversation, turnMergePolicy), (turn: any) => turn.turnId != null) ?? null);
  if (
    conversation?.threadRuntimeStatus?.type === `active` ||
    (latestTurn?.status === `inProgress` && conversation?.threadRuntimeStatus?.type !== `idle`)
  ) {
    if (
      options.continuationInput == null ||
      (await manager.readThread(conversationId, { includeTurns: false })).thread.status.type !== `idle`
    )
      return;
    let runtimeStatus = manager.getConversation(conversationId)?.threadRuntimeStatus;
    if (runtimeStatus !== conversation?.threadRuntimeStatus && runtimeStatus?.type !== `idle`) return;
  }
  await startTurn({
    context: { writingBlockContextPrepared: options.writingBlockContextPrepared },
    request: {
      threadId: conversationId,
      turnTrigger: options.turnTrigger,
      collaborationMode: options.collaborationMode,
      input: options.continuationInput ?? [],
      additionalContext: options.additionalContext,
    },
  });
}
