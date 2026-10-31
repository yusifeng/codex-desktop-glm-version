import {
  $u as normalizeThreadId,
  Dd as permissionsForProfile,
  Nd as permissionParamsOf,
  Wu as supportsAppServerFeature,
  Zo as errorToString,
  jd as runtimeWorkspaceRootsOf,
} from "@chunk/shared";
import {
  applyCanonicalTurns,
  findTurnById,
  mergedConversationTurns,
} from "../turns/canonical-history";
import { replaceLastRequestSection } from "../prompts/section-markers";
import {
  newConversationFromThread,
  turnParamsFromReadResponse,
  withThreadMode,
} from "./hydration";
import { bx as assertLegacyHistoryOperation } from "./history-policy";
import {
  buildModelSettingsUpdate,
  applyThreadSettingsUpdate,
} from "./patch-classification";
import {
  mergePermissionSettings,
  resolveResumeCwd,
} from "./maybe-resume";
import { yx as readMergedHostConfig } from "./start-config";
import { mergeThreadProfiles } from "../workspace/config";
import { threadReferenceCapabilityKey } from "./reference-capability";
import {
  moveForkedThreadToSection,
  prependForkedProjectThread,
  readForkPlacement,
  type ForkPlacement,
  type ForkPlacementContext,
} from "./fork-placement";

type Sandbox = {
  type?: string;
  writableRoots?: string[];
  [key: string]: unknown;
};
export function mergeUnique<T>(
  ...lists: Array<readonly T[] | null | undefined>
): T[] {
  const result: T[] = [];
  const seen = new Set<T>();
  for (const list of lists)
    for (const value of list ?? [])
      if (!seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
  return result;
}
export const Nx = mergeUnique;
export function expandSandboxWritableRoots<T>(
  policy: T,
  roots: readonly unknown[],
): T {
  if (typeof policy !== "object" || policy == null || !("type" in policy) || policy.type !== "workspaceWrite") return policy;
  const current = "writableRoots" in policy && Array.isArray(policy.writableRoots)
    ? policy.writableRoots.filter((root): root is string => typeof root === "string")
    : [];
  const requested = roots.filter((root): root is string => typeof root === "string");
  const writableRoots = mergeUnique(current, requested);
  return writableRoots.length === current.length
    ? policy
    : ({ ...policy, writableRoots } as T);
}
export const Ox = expandSandboxWritableRoots;
export function sandboxMissingRoots(
  policy: unknown,
  roots: readonly unknown[],
): boolean {
  if (typeof policy !== "object" || policy == null || !("type" in policy) || policy.type !== "workspaceWrite") return false;
  const writableRoots = "writableRoots" in policy && Array.isArray(policy.writableRoots) ? policy.writableRoots : [];
  return roots.some((root) => typeof root === "string" && !writableRoots.includes(root));
}
export const kx = sandboxMissingRoots;
const isWindows = (path: string) =>
  /^[a-z]:[\/]/iu.test(path) || path.startsWith("\\");
export function filterCompatibleRoots(
  cwd: string | null | undefined,
  roots: readonly string[],
): string[] {
  if (cwd == null) return [...roots];
  const windows = isWindows(cwd);
  return roots.filter((root) => root === "~" || isWindows(root) === windows);
}
export const Ax = filterCompatibleRoots;
export function isWriterConflictError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
  return (
    lower.includes("already has an active writer") ||
    lower.includes("already has a live local writer")
  );
}
export const Px = isWriterConflictError;
export function Ex(value: unknown): Record<string, string[]> {
  if (typeof value !== "object" || value == null || Array.isArray(value))
    return {};
  const result: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value))
    if (Array.isArray(entry) && entry.every((item) => typeof item === "string"))
      result[key] = entry;
  return result;
}
export function Dx(
  current: readonly string[],
  required: readonly string[],
): boolean {
  return required.some((root) => !current.includes(root));
}
export function Vye({
  writableRootsByThread,
  conversationId,
  writableRoots,
}: {
  writableRootsByThread: Record<string, string[]>;
  conversationId: string;
  writableRoots: readonly string[];
}): Record<string, string[]> {
  return {
    ...writableRootsByThread,
    [conversationId]: mergeUnique(
      writableRootsByThread[conversationId],
      writableRoots,
    ),
  };
}
export function Cx(
  response: Record<string, unknown>,
  fallback: Record<string, unknown> | null | undefined = null,
  _useDefault?: unknown,
  _profile?: unknown,
): Record<string, unknown> {
  return mergePermissionSettings(fallback ?? response, response);
}
export async function readDefaultPersonality(
  client: {
    sendRequest(
      method: string,
      params: unknown,
    ): Promise<{ config?: Record<string, unknown> }>;
  },
  settings: unknown,
  cwd?: string | null,
  config?: unknown,
): Promise<unknown> {
  const resolved = config === undefined
    ? await readMergedHostConfig(client, cwd ?? "")
    : typeof config === "object" && config != null && !Array.isArray(config)
      ? (config as Record<string, unknown>)
      : null;
  const personality = normalizedPersonality(resolved?.personality) ??
    normalizedPersonality(resolved?.model_personality);
  if (personality != null) return personality;
  const experiment = await (settings as {
    readExperimentPersonality?(): Promise<unknown>;
  })?.readExperimentPersonality?.().catch(() => null) ?? null;
  return resolved == null ? null : experiment;
}
export const Iye = readDefaultPersonality;
function normalizedPersonality(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
export function listMcpServers(
  client: {
    sendRequest(
      method: string,
      params: unknown,
      options?: unknown,
    ): Promise<unknown>;
  },
  requestCache: Map<string, Promise<unknown>>,
  params: unknown,
  options?: unknown,
): Promise<unknown> {
  const requestOptions = {
    ...(typeof options === "object" && options != null ? options : {}),
    priority:
      (options as { priority?: unknown } | null | undefined)?.priority ??
      (typeof params === "object" && params != null && "threadId" in params &&
      (params as { threadId?: unknown }).threadId != null
        ? "interactive"
        : "background"),
  };
  const key = JSON.stringify({ options: requestOptions, params });
  const existing = requestCache.get(key);
  if (existing) return existing;
  const request = client.sendRequest("mcpServerStatus/list", params, requestOptions);
  requestCache.set(key, request);
  return request.finally(() => requestCache.delete(key));
}
export const Fye = listMcpServers;
export async function editLastUserTurn(input: {
  manager: Record<string, any>;
  conversationId: string;
  options: Record<string, any>;
  startTurn?: (
    request: unknown,
    bufferedTurn: unknown,
    useDefault: boolean,
  ) => Promise<unknown>;
  turnMergePolicy?: unknown;
  ownerWindowError?: string;
}): Promise<unknown> {
  const { manager, conversationId, options, startTurn, turnMergePolicy } = input;
  const turn = findTurnById(manager.getConversation(conversationId), options.turnId, turnMergePolicy);
  if (turn == null) throw Error("Turn not found for edit.");
  const role = manager.getStreamRole(conversationId);
  if (
    await manager.sendThreadFollowerRequest(
      role,
      "thread-follower-edit-last-user-turn",
      {
        conversationId,
        turnId: turn.turnId,
        message: options.message,
        agentMode: options.agentMode,
        shouldSendPermissionOverrides: options.shouldSendPermissionOverrides,
        serviceTier: options.serviceTier,
        additionalContext: options.additionalContext,
        writingBlockContextPrepared: options.writingBlockContextPrepared,
      },
    )
  )
    return;
  if (role?.role !== "owner")
    throw Error(input.ownerWindowError ?? "Conversation is not owned by this window.");
  await manager.waitForPendingThreadSettingsUpdate(conversationId);
  const conversation = manager.getConversation(conversationId);
  if (conversation == null) throw Error("Conversation state not found.");

  const textIndex = turn.params.input.findIndex((item: any) => item.type === "text");
  const editedInput =
    textIndex === -1
      ? turn.params.input
      : turn.params.input.map((item: any, index: number) =>
          index !== textIndex || item.type !== "text"
            ? item
            : {
                ...item,
                text: replaceLastRequestSection(item.text, options.message),
                text_elements: [],
              },
        );
  const canRevert =
    conversation.historyMode === "paginated" &&
    supportsAppServerFeature(manager.requestClient.getAppServerVersion(), "threadRevert");
  if (!canRevert) assertLegacyHistoryOperation(conversation.historyMode, "Editing messages");
  const turns = mergedConversationTurns(conversation, turnMergePolicy);
  const turnIndex = turns.findIndex((candidate: any) => candidate.turnId === turn.turnId);
  const revertedTurns = turns.slice(turnIndex);
  if (
    turn.turnId == null ||
    turnIndex === -1 ||
    revertedTurns.slice(1).some((candidate: any) => candidate.params.input.length > 0)
  )
    throw Error("Only the most recent message can be edited.");
  if (revertedTurns.some((candidate: any) => candidate.status === "inProgress"))
    throw Error("Cannot edit a message while a turn is in progress.");

  const permissionConfig = options.shouldSendPermissionOverrides
    ? mergeThreadProfiles(
        (
          await manager.sendRequest("config/read", {
            includeLayers: false,
            cwd: conversation.cwd ?? null,
          })
        ).config,
      )
    : null;
  let responseThread: any;
  if (canRevert) {
    const response = await manager.sendRequest("thread/revert", {
      threadId: conversationId,
      beforeTurnId: turn.turnId,
    });
    responseThread = response.thread;
    manager.applyRevertResponseToConversation({
      conversationId,
      response,
      revertedTurns,
    });
  } else {
    const response = await manager.sendRequest("thread/rollback", {
      threadId: conversationId,
      numTurns: revertedTurns.filter((candidate: any) => candidate.turnId != null).length,
    });
    responseThread = response.thread;
    manager.applyRollbackResponseToConversation({
      conversationId,
      conversationState: conversation,
      rollbackResponse: response,
    });
  }

  const cwd = responseThread.cwd || conversation.cwd || undefined;
  const permissions =
    permissionConfig == null
      ? null
      : permissionsForProfile(options.agentMode, cwd == null ? [] : [cwd], permissionConfig as any);
  if (permissions != null) {
    const activePermissionProfile =
      conversation.latestThreadSettings?.activePermissionProfile === undefined
        ? conversation.currentPermissions?.activePermissionProfile
        : conversation.latestThreadSettings.activePermissionProfile;
    if (activePermissionProfile !== undefined)
      permissions.activePermissionProfile = activePermissionProfile;
  }
  if (startTurn == null) return;
  await startTurn(
    {
      threadId: conversationId,
      turnTrigger: "edit_user_message",
      input: editedInput,
      cwd,
      ...(permissions == null
        ? {}
        : {
            approvalPolicy: permissions.approvalPolicy,
            approvalsReviewer: permissions.approvalsReviewer,
            ...permissionParamsOf(permissions),
            runtimeWorkspaceRoots:
              permissions.activePermissionProfile == null
                ? undefined
                : runtimeWorkspaceRootsOf(permissions),
          }),
      serviceTier: options.serviceTier,
      additionalContext: options.additionalContext,
    },
    turn,
    permissions == null || undefined,
  );
}
export const Eye = editLastUserTurn;
export async function forkConversation(input: {
  manager: Record<string, any>;
  params: Record<string, any>;
  beforeConversationAdded?: (conversationId: string) => unknown;
  capabilities: ForkCapabilities;
  history: Record<string, any>;
  hostMode?: unknown;
  compareSemanticVersions: (left: string, right: string) => number;
  threadRecognition?: unknown;
  notificationDeferral: {
    run<T extends { conversationId: string }>(
      defer: boolean,
      operation: (accept: (id: string) => void) => Promise<T>,
    ): Promise<T>;
  };
  saveThreadProjectAssignment?: (input: { threadId: string; assignment: unknown }) => Promise<unknown>;
  workspaceStorage: { setProjectAssignment(id: string, assignment: unknown): Promise<unknown> };
}): Promise<Record<string, unknown>> {
  const {
    beforeConversationAdded,
    capabilities,
    history,
    hostMode,
    compareSemanticVersions,
    threadRecognition,
    manager,
    notificationDeferral,
    params,
    saveThreadProjectAssignment,
    workspaceStorage,
  } = input;
  const appServerVersion = manager.requestClient.getAppServerVersion();
  if (
    appServerVersion == null ||
    appServerVersion === "0.0.0" ||
    (params.ephemeral === true && params.sideConversation !== true) ||
    compareSemanticVersions(
      appServerVersion,
      params.ephemeral === true ? "0.146.0-alpha.8" : "0.146.0-alpha.7",
    ) < 0
  )
    assertLegacyHistoryOperation(
      manager.getConversation(params.sourceConversationId)?.historyMode,
      "Forking",
    );

  const sourceConversation = manager.getConversation(params.sourceConversationId);
  let projectAssignment = null;
  if (!params.ephemeral && params.rolloutPath == null)
    projectAssignment =
      params.projectAssignment === undefined
        ? await manager.getThreadProjectAssignment(params.sourceConversationId)
        : params.projectAssignment;
  const product = tx(manager, params, capabilities, history);
  const sourceTitle =
    params.sourceTitle === undefined ? (sourceConversation?.title ?? null) : params.sourceTitle;
  const finishTrace = (error?: unknown) => {
    try {
      error === undefined ? product.trace?.finish() : product.trace?.finish(error);
    } catch (traceError) {
      manager.logger.warning("Task fork trace callback failed", {
        safe: {},
        sensitive: { error: traceError },
      });
    }
  };
  let acceptedConversationId: string | null = null;
  try {
    const prepared = await product.prepareRequest();
    if (prepared.status === "not-ready") {
      finishTrace();
      return prepared;
    }
    const trace = product.trace?.trace;
    const requestOptions =
      trace == null ? undefined : { source: "thread_hydration", trace };
    return await notificationDeferral.run(true, async (acceptConversation) => {
      const forkResponse = await manager.sendRequest(
        "thread/fork",
        prepared.request,
        requestOptions,
      );
      const conversationId = normalizeThreadId(forkResponse.thread.id);
      acceptedConversationId = conversationId;
      acceptConversation(conversationId);
      let synchronization: any = { status: "complete" };
      try {
        materializeForkedConversation(manager, {
          conversationId,
          forkResponse,
          hostMode,
          threadRecognition,
          params,
          product,
          sourceConversation,
        });
        try {
          await beforeConversationAdded?.(conversationId);
        } catch (error) {
          manager.logger.warning("Task fork identity callback failed", {
            safe: {},
            sensitive: { error },
          });
          synchronization = { status: "failed", message: errorToString(error) };
        }
        product.copyThreadMetadata(params.sourceConversationId, conversationId);
        if (product.sideConversationBoundaryItems != null)
          await manager.sendRequest(
            "thread/inject_items",
            { threadId: conversationId, items: product.sideConversationBoundaryItems },
            requestOptions,
          );
        if (params.ephemeral === true) {
          manager.broadcastConversationSnapshot(conversationId);
          manager.notifyConversationUpdated(conversationId);
        }
      } catch (error) {
        synchronization = { status: "failed", message: errorToString(error) };
      }

      const setup = await wx({
        conversationId,
        product,
        resumeParams:
          params.ephemeral === true || synchronization.status === "failed"
            ? null
            : {
                conversationId,
                model: null,
                serviceTier: forkResponse.serviceTier,
                reasoningEffort: null,
                workspaceRoots: params.workspaceRoots?.length
                  ? params.workspaceRoots
                  : [forkResponse.cwd],
                permissions: Cx(forkResponse),
                collaborationMode: params.collaborationMode ?? null,
                ...(trace == null ? {} : { trace }),
              },
        projectAssignment,
        placement: prepared.placement,
        saveThreadProjectAssignment,
        workspaceStorage,
      });
      if (synchronization.status === "complete") synchronization = setup;
      try {
        if (params.model != null || params.reasoningEffort != null)
          manager.updateConversationState(conversationId, (state: Record<string, unknown>) => {
            applyThreadSettingsUpdate(state, {
              ...(params.model == null ? {} : { model: params.model }),
              ...(params.reasoningEffort == null ? {} : { effort: params.reasoningEffort }),
            });
          });
        if (params.addForkedSyntheticItem !== false)
          manager.addForkedFromConversationSyntheticItem(
            conversationId,
            params.sourceConversationId,
            sourceTitle,
          );
      } catch (error) {
        synchronization = { status: "failed", message: errorToString(error) };
      }
      synchronization.status === "failed"
        ? finishTrace(Error(synchronization.message))
        : finishTrace();
      return {
        status: "created",
        conversationId,
        synchronization,
        projectAssignment,
        sourceConversation,
      };
    });
  } catch (error) {
    finishTrace(error);
    if (acceptedConversationId != null)
      return {
        status: "created",
        conversationId: acceptedConversationId,
        synchronization: { status: "failed", message: errorToString(error) },
        projectAssignment,
        sourceConversation,
      };
    throw error;
  }
}
export const Mye = forkConversation;
export async function uve(
  manager: Record<string, any>,
  params: Record<string, unknown>,
  compareSemanticVersions: (left: string, right: string) => number,
): Promise<Record<string, unknown>> {
  const { targetTurnId, ...forkParams } = params;
  const sourceConversationId = String(params.sourceConversationId);
  const source = manager.getConversation(sourceConversationId);
  if (source == null) throw Error("Source conversation not found.");
  const appServerVersion = manager.requestClient.getAppServerVersion();
  if (
    source.historyMode === "paginated" ||
    (appServerVersion != null && appServerVersion !== "0.0.0" &&
      compareSemanticVersions(appServerVersion, "0.143.0-alpha.32") >= 0)
  ) return manager.forkConversationFromLatest({ ...forkParams, lastTurnId: targetTurnId });
  const turns = await manager.getCompleteConversationTurns(sourceConversationId);
  const targetIndex = turns.findIndex((turn: Record<string, unknown>) => turn.turnId === targetTurnId);
  if (targetIndex === -1) throw Error("Target turn not found.");
  const result = await manager.forkConversationFromLatest({ ...forkParams, addForkedSyntheticItem: false });
  if (result.status === "not-ready") return result;
  const conversationId = result.conversationId;
  try {
    const numTurns = turns.length - targetIndex - 1;
    const rollbackResponse = numTurns > 0
      ? await manager.sendRequest("thread/rollback", { threadId: conversationId, numTurns })
      : null;
    const conversation = manager.getConversation(conversationId);
    if (conversation == null) throw Error("Forked conversation state not found.");
    if (rollbackResponse != null)
      manager.applyRollbackResponseToConversation({ conversationId, conversationState: conversation, rollbackResponse });
    manager.addForkedFromConversationSyntheticItem(
      conversationId,
      sourceConversationId,
      params.sourceTitle === undefined ? source.title : params.sourceTitle,
    );
    return result;
  } catch (error) {
    const message = errorToString(error);
    return {
      status: "created",
      conversationId,
      synchronization: {
        status: "failed",
        message: result.synchronization.status === "failed"
          ? `${result.synchronization.message}; ${message}`
          : message,
      },
    };
  }
}

function materializeForkedConversation(
  manager: Record<string, any>,
  {
    conversationId,
    forkResponse,
    hostMode,
    threadRecognition,
    params,
    product,
    sourceConversation,
  }: Record<string, any>,
): void {
  const cwd = resolveResumeCwd({
    requestedCwd: params.cwd ?? null,
    responseCwd: forkResponse.cwd ?? null,
    threadCwd: forkResponse.thread.cwd,
    fallbackCwd: product.fallbackCwd,
  });
  const permissions = Cx(forkResponse);
  const sideConversation = params.sideConversation === true;
  const collaborationMode = params.collaborationMode ?? {
    mode: "default",
    settings: {
      model: "",
      reasoning_effort: null,
      developer_instructions: null,
    },
  };
  const conversation: any = {
    ...newConversationFromThread({
      thread: withThreadMode(
        forkResponse.thread,
        manager.getConversation(conversationId)?.threadStartKind ?? null,
        hostMode,
        threadRecognition,
      ),
      hostId: manager.getHostId(),
      conversationId,
      turns: sideConversation
        ? []
        : product.mapForkResponseToTurns(forkResponse, {
            resolvedPermissions: permissions,
            fallbackCwd: cwd ?? null,
          }),
      threadTitle: forkResponse.thread.name?.trim() || null,
      resumeState: params.ephemeral === true ? "resumed" : "needs_resume",
      latestCollaborationMode: collaborationMode,
      workspaceKind: sourceConversation?.workspaceKind ?? "project",
      workspaceBrowserRoot: sourceConversation?.workspaceBrowserRoot ?? null,
      projectlessOutputDirectory:
        sourceConversation?.workspaceKind === "projectless"
          ? (sourceConversation.projectlessOutputDirectory ?? null)
          : null,
    }),
    ephemeral: params.ephemeral === true,
    daybreakEnabled:
      params.ephemeral === true && sideConversation
        ? (sourceConversation?.daybreakEnabled ?? forkResponse.thread.daybreakEnabled)
        : forkResponse.thread.daybreakEnabled,
    sideConversation,
    sideConversationParentNavigationPath: sideConversation
      ? (params.sideConversationParentNavigationPath ?? null)
      : null,
    latestThreadSettings: null,
    threadRuntimeStatus: sideConversation
      ? { type: "idle" }
      : forkResponse.thread.status,
    cwd,
    currentPermissions: permissions,
  };
  if (manager.canonicalTurnHistory)
    applyCanonicalTurns(
      conversation as any,
      conversation.turns,
      true,
      null,
      manager.history?.turnMergePolicy,
    );
  applyThreadSettingsUpdate(
    conversation,
    buildModelSettingsUpdate(
      forkResponse,
      forkResponse.model,
      forkResponse.reasoningEffort ?? null,
      cwd,
      params.collaborationMode ?? {
        mode: "default",
        settings: {
          model: forkResponse.model,
          reasoning_effort: forkResponse.reasoningEffort ?? null,
          developer_instructions: null,
        },
      },
    ),
  );
  manager.setConversation(conversation);
  if (params.ephemeral === true)
    manager.setConversationStreamRole(conversationId, { role: "owner" });
}

export async function Tx(input: {
  manager: Record<string, any>;
  projectlessConversations: Record<string, any>;
  result: Record<string, unknown>;
  params: Record<string, any>;
}): Promise<Record<string, unknown>> {
  const { manager, projectlessConversations, result, params } = input;
  const conversationId = String(result.conversationId);
  try {
    const projectAssignment = result.projectAssignment as any;
    const sourceConversation = result.sourceConversation as any;
    if (!params.ephemeral && projectAssignment != null) {
      projectlessConversations.removeConversationId(conversationId);
      manager.updateConversationState(conversationId, (state: any) => {
        state.workspaceKind = "project";
        state.workspaceBrowserRoot = null;
        state.projectlessOutputDirectory = null;
      });
    } else if (!params.ephemeral && sourceConversation?.workspaceKind === "projectless") {
      const workspaceBrowserRoot = sourceConversation.workspaceBrowserRoot ?? null;
      const outputDirectory = sourceConversation.projectlessOutputDirectory ?? null;
      await projectlessConversations.saveConversationId(conversationId);
      manager.updateConversationState(conversationId, (state: any) => {
        state.workspaceKind = "projectless";
        state.workspaceBrowserRoot = workspaceBrowserRoot;
        state.projectlessOutputDirectory = outputDirectory;
      });
      await projectlessConversations.saveOutputDirectoryHint(conversationId, outputDirectory);
      await projectlessConversations.saveWorkspaceRootHint(conversationId, workspaceBrowserRoot);
    }
    return {
      status: "created",
      conversationId,
      synchronization: result.synchronization,
    };
  } catch (error) {
    return {
      status: "created",
      conversationId,
      synchronization: { status: "failed", message: errorToString(error) },
    };
  }
}
export async function wx(input: {
  conversationId: string;
  product: ForkProduct;
  resumeParams: Record<string, unknown> | null;
  placement: { placement?: ForkPlacement | null } | ForkPlacement | null;
  projectAssignment?: any;
  saveThreadProjectAssignment?: (input: { threadId: string; assignment: unknown }) => Promise<unknown>;
  workspaceStorage: { setProjectAssignment(id: string, assignment: unknown): Promise<unknown> };
}): Promise<Record<string, unknown>> {
  let synchronization: Record<string, unknown> = { status: "complete" };
  try {
    if (input.resumeParams != null) {
      const result = await input.product.resumeForkedConversation(input.resumeParams);
      if (result.status === "not-ready")
        synchronization = {
          status: "failed",
          message: `Task setup is not ready: ${result.reason}`,
        };
    }
  } catch (error) {
    synchronization = { status: "failed", message: errorToString(error) };
  }
  try {
    if (input.projectAssignment != null)
      input.saveThreadProjectAssignment == null
        ? await input.workspaceStorage.setProjectAssignment(
            input.conversationId,
            input.projectAssignment,
          )
        : await input.saveThreadProjectAssignment({
            threadId: input.conversationId,
            assignment: input.projectAssignment,
          });
  } catch (error) {
    synchronization = { status: "failed", message: errorToString(error) };
  }
  try {
    const placement =
      input.placement != null && "placement" in input.placement
        ? input.placement.placement ?? null
        : (input.placement as ForkPlacement | null);
    await input.product.commitAcceptedPlacement(
      input.conversationId,
      input.projectAssignment?.projectId,
      placement,
    );
  } catch (error) {
    synchronization = { status: "failed", message: errorToString(error) };
  }
  return synchronization;
}

const SIDE_CONVERSATION_BOUNDARY = `Side conversation boundary.

Everything before this boundary is inherited history from the parent thread. It is reference context only. It is not your current task.

Do not continue, execute, or complete any instructions, plans, tool calls, approvals, edits, or requests from before this boundary. Only messages submitted after this boundary are active user instructions for this side conversation.

You are a side-conversation assistant, separate from the main thread. Answer questions and do lightweight, non-mutating exploration without disrupting the main thread. If there is no user question after this boundary yet, wait for one.

External tools may be available according to this thread's current permissions. Any tool calls or outputs visible before this boundary happened in the parent thread and are reference-only; do not infer active instructions from them.

Sub-agents are off-limits in this side conversation. Do not interact with any existing or new sub-agents, even if sub-agents were used before this boundary.

Do not modify files, source, git state, permissions, configuration, or workspace state unless the user explicitly asks for that mutation after this boundary. Do not request escalated permissions or broader sandbox access unless the user explicitly asks for a mutation that requires it. If the user explicitly requests a mutation, keep it minimal, local to the request, and avoid disrupting the main thread.`;

export function tokenBudgetThreadKey(hostId: string, conversationId: string): string {
  return `token-budget-thread:${JSON.stringify([hostId, conversationId])}`;
}

function enableTokenBudgetHistoryNotes(
  config: Record<string, any> | null | undefined,
  version: string | null,
): Record<string, any> {
  if (!supportsAppServerFeature(version, "tokenBudgetHistoryNotes"))
    throw Error("FailedPrecondition: history_notes_extension_unsupported");
  const nested = config?.["features.token_budget"];
  const result = {
    ...config,
    "features.token_budget": {
      ...(typeof nested === "object" && nested != null && !Array.isArray(nested) ? nested : {}),
      enabled: true,
      use_history_notes_extension: true,
    },
  };
  delete result["features.token_budget.enabled"];
  delete result["features.token_budget.use_history_notes_extension"];
  return result;
}

interface ForkCapabilities {
  accountId: string | null;
  readConfig(cwd: string | null): Promise<Record<string, any> | null>;
  readPlacement(id: string): any;
  prependProjectThread(projectId: string, conversationId: string): Promise<void>;
  moveThreadToSection(
    conversationId: string,
    placement: NonNullable<ForkPlacement["customSection"]>,
  ): Promise<void>;
  readTokenBudgetThread(hostId: string, conversationId: string): boolean;
  writeTokenBudgetThread(conversationId: string): unknown;
  readThreadReferences(conversationId: string): boolean | undefined;
  writeThreadReferences(conversationId: string, enabled: boolean): unknown;
  beginTrace?: (input: { ephemeral: boolean; sideConversation: boolean }) => any;
}

interface ForkProduct {
  trace: { finish(error?: unknown): void; trace?: unknown } | null;
  fallbackCwd: string | null;
  sideConversationBoundaryItems: any[] | null;
  copyThreadMetadata(sourceId: string, conversationId: string): void;
  mapForkResponseToTurns(response: any, context: any): any[];
  resumeForkedConversation(params: Record<string, unknown>): Promise<any>;
  commitAcceptedPlacement(
    conversationId: string,
    projectId: string | null | undefined,
    placement: ForkPlacement | null,
  ): Promise<void>;
  prepareRequest(): Promise<any>;
}

export function tx(
  manager: Record<string, any>,
  params: Record<string, any>,
  capabilities: ForkCapabilities,
  history: Record<string, any>,
): ForkProduct {
  const tokenBudgetThread = capabilities.readTokenBudgetThread(
    params.sourceHostId ?? manager.getHostId(),
    params.sourceConversationId,
  );
  return {
    trace:
      capabilities.beginTrace?.({
        ephemeral: params.ephemeral ?? false,
        sideConversation: params.sideConversation ?? false,
      }) ?? null,
    fallbackCwd: params.workspaceRoots?.[0] ?? null,
    sideConversationBoundaryItems:
      params.sideConversation === true
        ? [
            {
              type: "message",
              role: "user",
              content: [{ type: "input_text", text: SIDE_CONVERSATION_BOUNDARY }],
            },
          ]
        : null,
    copyThreadMetadata(sourceId, conversationId) {
      const references = capabilities.readThreadReferences(sourceId);
      if (references !== undefined)
        capabilities.writeThreadReferences(conversationId, references);
      if (tokenBudgetThread) capabilities.writeTokenBudgetThread(conversationId);
    },
    mapForkResponseToTurns: (response, context) =>
      history.mapThreadTurns(turnParamsFromReadResponse(response, context)),
    resumeForkedConversation: (resumeParams) =>
      manager.resumeConversationForUnavailableOwner(resumeParams, params.readResumeInputs),
    async commitAcceptedPlacement(conversationId, projectId, placement) {
      if (placement?.prependToManualProject && projectId != null)
        await capabilities.prependProjectThread(projectId, conversationId);
      if (placement?.customSection != null)
        await capabilities.moveThreadToSection(conversationId, placement.customSection);
    },
    async prepareRequest() {
      const customSection = params.placement?.customSection;
      if (
        capabilities.accountId != null &&
        customSection != null &&
        (customSection.accountId !== capabilities.accountId ||
          customSection.beforeThreadId !== params.sourceConversationId)
      )
        throw Error("Fork placement identity does not match its receiving owner");
      let placementResult: any = { status: "ready", placement: null };
      if (!params.ephemeral && !params.sideConversation) {
        placementResult =
          params.placement == null
            ? capabilities.readPlacement(params.sourceConversationId)
            : { status: "ready", placement: params.placement };
        if (placementResult.status === "not-ready") return placementResult;
      }
      const baseConfig = await capabilities.readConfig(
        params.cwd ?? manager.getConversation(params.sourceConversationId)?.cwd ?? null,
      );
      let config = params.config == null ? baseConfig : { ...baseConfig, ...params.config };
      if (tokenBudgetThread)
        config = enableTokenBudgetHistoryNotes(
          config,
          manager.requestClient.getAppServerVersion(),
        );
      return {
        ...placementResult,
        request: {
          threadId: params.sourceConversationId,
          ...(params.lastTurnId == null ? {} : { lastTurnId: params.lastTurnId }),
          path: params.rolloutPath ?? null,
          cwd: params.cwd,
          runtimeWorkspaceRoots: params.workspaceRoots,
          threadSource: params.threadSource ?? "user",
          model: params.model ?? undefined,
          config:
            params.reasoningEffort == null
              ? (config ?? undefined)
              : { ...config, model_reasoning_effort: params.reasoningEffort },
          developerInstructions: params.developerInstructions,
          ...(params.sideConversation || !params.ephemeral ? { excludeTurns: true } : {}),
          ...(params.ephemeral ? { ephemeral: true } : {}),
        },
      };
    },
  };
}
export async function Hye({
  conversationId,
  manager,
  resumeConversation,
  shouldHandleFailure,
}: {
  conversationId: string;
  manager: {
    getConversation(id: string): { cwd?: string | null; latestCollaborationMode?: unknown } | null;
    updateConversationState?(id: string, update: (state: Record<string, unknown>) => void): void;
    logger?: { warning(message: string, data?: unknown): void };
  };
  resumeConversation(params: Record<string, unknown>): Promise<{ status?: string }>;
  shouldHandleFailure(): boolean;
}): Promise<void> {
  const conversation = manager.getConversation(conversationId);
  try {
    await resumeConversation({
      conversationId,
      model: null,
      reasoningEffort: null,
      workspaceRoots: conversation?.cwd ? [conversation.cwd] : ["/"],
      collaborationMode: conversation?.latestCollaborationMode,
    });
  } catch (error) {
    if (!shouldHandleFailure()) throw error;
    manager.updateConversationState?.(conversationId, (state) => {
      state.resumeState = "needs_resume";
    });
    manager.logger?.warning("Failed to resume subagent for file approval", {
      sensitive: { error },
    });
    throw error;
  }
}
export function dye({
  hostId,
  appServerVersion,
  runtime,
  settings,
  storage,
  beginTrace,
  isActive,
}: Record<string, any>): ForkCapabilities {
  const accountId = runtime.accountId();
  const placementContext: ForkPlacementContext = {
    accountId: () => {
      if (!isActive() || runtime.accountId() !== accountId)
        throw Error("Fork placement account retired");
      return accountId;
    },
    hostId,
    appServerVersion,
    readSetting: settings.read.bind(settings),
    storage,
    pinnedThreads: runtime.pinnedThreads.bind(runtime),
  };
  return {
    accountId,
    readConfig: settings.readCodexConfig.bind(settings),
    readPlacement: (conversationId) =>
      readForkPlacement(placementContext, conversationId),
    prependProjectThread: (projectId, conversationId) =>
      prependForkedProjectThread(placementContext, projectId, conversationId),
    moveThreadToSection: (conversationId, placement) =>
      moveForkedThreadToSection(placementContext, conversationId, placement),
    readTokenBudgetThread: (sourceHostId, conversationId) =>
      runtime.hasDesktopRuntime &&
      storage.readValue(tokenBudgetThreadKey(sourceHostId, conversationId)) === true,
    writeTokenBudgetThread: (conversationId) =>
      storage.writeValue(tokenBudgetThreadKey(hostId, conversationId), true),
    readThreadReferences: (conversationId) => {
      const value = storage.readValue(threadReferenceCapabilityKey(conversationId));
      return typeof value === "boolean" ? value : undefined;
    },
    writeThreadReferences: (conversationId, enabled) =>
      storage.writeValue(threadReferenceCapabilityKey(conversationId), enabled),
    beginTrace,
  };
}
