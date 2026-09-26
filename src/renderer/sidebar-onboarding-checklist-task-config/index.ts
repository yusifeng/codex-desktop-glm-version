// sidebar-onboarding-checklist-task-config —— 侧边栏对话式 onboarding 状态机。
//
// 原版：app/webview/assets/sidebar-onboarding-checklist-task-config-2c7fbbcf69d8.js。
// 还原范围：角色/任务/权限/能力阶段转换、对话启动去重与取消、
// 完成结果投影、候选任务过滤、远程任务配置校验与本地化文案。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as mailProviderChunk from "@rchunk/onboarding-mail-provider";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const mailProvider = mailProviderChunk as Record<string, any>;

const {
  FX: initializeSignalRuntime,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
  cX: isPermissionPresetAllowed,
  oZ: createSignalFamily,
  pZ: createScopedSignal,
  rZ: createDerivedFamily,
  sZ: createDerivedSignal,
} = appSharedChunk;

type PermissionStatus = "not-requested" | "pending" | "allowed" | "denied";
type WorkflowPhase =
  "role" | "task" | "permission" | "execution" | "capabilities";

export interface ConversationalOnboardingWorkflow {
  advancedCapabilitiesStatus?: "pending" | "completed";
  advancedCapabilitiesToSetup?: string[];
  completedImport?: boolean;
  computerUseAccessGranted?: boolean;
  declinedTasks: string[];
  permissionStatus: PermissionStatus;
  phase: WorkflowPhase;
  selectedRole: string | null;
  selectedTask: string | null;
}

export interface SignalReader {
  get<T>(signal: unknown, key?: unknown): T;
}

export interface SignalStore extends SignalReader {
  set<T>(signal: unknown, value: T | ((previous: T) => T)): void;
  queryClient?: { setQueriesData(filter: unknown, value: unknown): void };
  when?(predicate: (reader: SignalStore) => boolean): Promise<void>;
}

export interface CapabilityStatus {
  id: string;
  status: "checking" | "enabled" | "unavailable" | string;
}

interface CompletionQueryValue {
  data?: { completion?: unknown; status?: string };
}

interface ConversationTurn {
  items: unknown[];
  status?: string;
}

export interface TaskMessage {
  defaultMessage: string;
  description: string;
  id: string;
  translations?: Record<string, string>;
}

export interface OnboardingTaskDefinition {
  instructions?: string;
  is_auto_submit_enabled?: boolean;
  messages: { label: TaskMessage; prompt: TaskMessage };
  origin: "checked_in" | "remote";
  pluginSlots?: Record<string, string>;
}

export interface ParsedRemoteTaskConfig {
  fallbackTaskIds: string[];
  taskDefinitions: Record<string, OnboardingTaskDefinition>;
}

const WORKFLOW_STORAGE_KEY = "electron:conversational-onboarding-workflow";
const CONVERSATION_STORAGE_KEY =
  "electron:conversational-onboarding-conversation";
const CONVERSATION_IDS_STORAGE_KEY =
  "electron:conversational-onboarding-conversation-ids";
const REMOTE_TASK_CONFIG_EXPERIMENT = "1540453652";
const ROLE_ASSIGNMENT_EXPERIMENT = "2214619544";
const CODEX_APPS_READY_TIMEOUT_MS = 35_000;
const NOTIFICATION_PROMPT_DELAY_MS = 2_000;

const LOCAL_TASK_IDS = [
  "desktop_note",
  "csv_chart",
  "hold_next_free_hour",
  "send_message_to_self",
] as const;
const RESERVED_REMOTE_TASK_IDS = new Set([
  "create_project",
  "enable_notifications",
  "explore_codex",
  "finish_connecting_imported_tools",
  "review_latest_plans",
  "claude_import",
  ...LOCAL_TASK_IDS,
]);

const DEFAULT_WORKFLOW: ConversationalOnboardingWorkflow = {
  declinedTasks: [],
  phase: "role",
  selectedRole: null,
  selectedTask: null,
  permissionStatus: "not-requested",
};

const CHATGPT_ROLE_TASKS = [
  "enable_notifications",
  "create_automation",
  "triage_github_prs",
  "catch_up_linear",
];
const GENERAL_ROLE_TASKS = [
  "enable_notifications",
  "create_automation",
  "summarize_inbox",
  "catch_up_updates_and_blockers",
  "summarize_current_priorities",
];
const REPRESENTATIVE_ROLE_TASK: Record<string, string> = {
  product_management: "review_roadmaps_and_projects",
  design: "review_design_briefs",
  marketing: "review_campaigns",
  sales: "review_account_plans",
  finance: "review_forecasts",
  operations: "review_operating_plans",
  people_hr: "review_people_plans_and_policies",
  legal: "review_contracts_and_policies",
  student: "review_class_materials",
};
const GOOGLE_WORKSPACE_PLUGIN_IDS = new Set([
  "gmail",
  "google-calendar",
  "google-drive",
]);

const LOCALE_TO_TRANSLATION_KEY: Record<string, string> = {
  "bg-BG": "bg",
  "bn-BD": "bn",
  "bs-BA": "bs",
  "ca-ES": "ca",
  "cs-CZ": "cs",
  "da-DK": "da",
  "de-DE": "de",
  "el-GR": "el",
  "es-419": "es-419",
  "es-ES": "es",
  "et-EE": "et",
  "fi-FI": "fi",
  "fr-CA": "fr-CA",
  "fr-FR": "fr",
  "gu-IN": "gu",
  "hi-IN": "hi",
  "hr-HR": "hr",
  "hu-HU": "hu",
  "hy-AM": "hy",
  "id-ID": "id",
  "is-IS": "is",
  "it-IT": "it",
  "ja-JP": "ja",
  "ka-GE": "ka",
  "kn-IN": "kn",
  "ko-KR": "ko",
  "lv-LV": "lv",
  "mk-MK": "mk",
  "mr-IN": "mr",
  "ms-MY": "ms",
  "my-MM": "my",
  "nb-NO": "nb",
  "nl-NL": "nl",
  "pl-PL": "pl",
  "pt-BR": "pt",
  "pt-PT": "pt-PT",
  "ro-RO": "ro",
  "ru-RU": "ru",
  "sk-SK": "sk",
  "sl-SI": "sl",
  "so-SO": "so",
  "sq-AL": "sq",
  "sr-RS": "sr",
  "sv-SE": "sv",
  "sw-TZ": "sw",
  "ta-IN": "ta",
  "te-IN": "te",
  "th-TH": "th",
  "tr-TR": "tr",
  "uk-UA": "uk",
  "vi-VN": "vi",
  "zh-CN": "zh",
  "zh-HK": "zh-HK",
  "zh-TW": "zh-Hant",
};

let workflowSignal: unknown = Symbol(WORKFLOW_STORAGE_KEY);
let completedImportSignal: unknown = Symbol("completed-import");
let conversationStateFamily: unknown = Symbol("conversation-state-family");
let completionConversationIdSignal: unknown = Symbol(
  "completion-conversation-id",
);
let permissionPromptDisabledSignal: unknown = Symbol("permission-disabled");
let permissionPromptVisibleSignal: unknown = Symbol("permission-visible");
let permissionPromptDelayedSignal: unknown = Symbol("permission-delayed");
let completionQueryFamily: unknown = Symbol("completion-query-family");
let completionResultFamily: unknown = Symbol("completion-result-family");
let completionFailedFamily: unknown = Symbol("completion-failed-family");
let notificationPromptTimer: ReturnType<typeof setTimeout> | undefined;
let workflowStateInitialized = false;
let conversationStateFamilyInitialized = false;
let conversationRuntimeInitialized = false;
let permissionDelayStateInitialized = false;
let permissionPromptStateInitialized = false;

const inFlightStarts = new Map<
  string,
  {
    appPluginName: string | null;
    generation: number;
    promise: Promise<StoredConversation>;
    selectedTask: string;
  }
>();
const inFlightTurns = new Map<string, Promise<void>>();
const startGeneration = new Map<string, number>();

function createSchema<T>(parse: (value: unknown) => T | null) {
  return {
    safeParse(
      value: unknown,
    ): { success: true; data: T } | { success: false; error: Error } {
      const data = parse(value);
      return data == null
        ? { success: false, error: new Error("Invalid value") }
        : { success: true, data };
    },
  };
}

const taskIdSchema = createSchema<string>((value) =>
  typeof value === "string" && value.length > 0 ? value : null,
);
const localTaskIdSchema = createSchema<string>((value) =>
  typeof value === "string" &&
  (LOCAL_TASK_IDS as readonly string[]).includes(value)
    ? value
    : null,
);
const taskIconSchema = createSchema<{ iconAppId?: string; label: string }>(
  (value) => {
    if (value == null || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (typeof record.label !== "string" || record.label.length === 0)
      return null;
    if (
      record.iconAppId != null &&
      (typeof record.iconAppId !== "string" || record.iconAppId.length === 0)
    )
      return null;
    return {
      label: record.label,
      ...(record.iconAppId == null
        ? {}
        : { iconAppId: record.iconAppId as string }),
    };
  },
);

function initializeWorkflowState(): void {
  if (workflowStateInitialized) return;
  workflowStateInitialized = true;
  initializeSignalRuntime?.();
  initializeSharedRuntime?.();
  if (typeof appInitial.dun === "function") {
    workflowSignal = appInitial.dun(WORKFLOW_STORAGE_KEY, DEFAULT_WORKFLOW);
  }
  if (typeof createDerivedSignal === "function") {
    completedImportSignal = createDerivedSignal(
      applicationScope,
      ({ get }: SignalReader) =>
        get<ConversationalOnboardingWorkflow | null>(workflowSignal)
          ?.completedImport,
    );
  }
}

function getWorkflow(store: SignalStore): ConversationalOnboardingWorkflow {
  initializeWorkflowState();
  return (
    store.get<ConversationalOnboardingWorkflow | null>(workflowSignal) ?? {
      ...DEFAULT_WORKFLOW,
      declinedTasks: [],
    }
  );
}

function selectRole(store: SignalStore, role: string): void {
  initializeWorkflowState();
  store.set(workflowSignal, {
    declinedTasks: [],
    phase: "task",
    selectedRole: role,
    selectedTask: null,
    permissionStatus: "not-requested",
  });
}

function selectTask(store: SignalStore, task: string): void {
  const needsPermission =
    task !== "csv_chart" && task !== "data_science_csv_chart";
  store.set(workflowSignal, {
    ...getWorkflow(store),
    advancedCapabilitiesStatus: undefined,
    advancedCapabilitiesToSetup: undefined,
    phase: needsPermission ? "permission" : "execution",
    selectedTask: task,
    permissionStatus: needsPermission ? "pending" : "not-requested",
  });
}

function returnToTaskSelection(
  store: SignalStore,
  declinedTask?: string,
): void {
  const current = getWorkflow(store);
  store.set(workflowSignal, {
    ...current,
    declinedTasks:
      declinedTask == null
        ? current.declinedTasks
        : [...(current.declinedTasks ?? []), declinedTask],
    advancedCapabilitiesStatus: undefined,
    advancedCapabilitiesToSetup: undefined,
    phase: "task",
    selectedTask: null,
    permissionStatus: "not-requested",
  });
}

function setPermissionStatus(
  store: SignalStore,
  status: PermissionStatus,
): void {
  const current = getWorkflow(store);
  store.set(workflowSignal, {
    ...current,
    permissionStatus: status,
    computerUseAccessGranted:
      (current.selectedTask === "computer_use" && status === "allowed") ||
      current.computerUseAccessGranted,
  });
}

function enterCapabilitiesPhase(
  store: SignalStore,
  capabilities: CapabilityStatus[],
): void {
  const current = getWorkflow(store);
  if (
    current.phase !== "execution" ||
    current.selectedTask == null ||
    (current.advancedCapabilitiesToSetup == null &&
      capabilities.some(({ status }) => status === "checking"))
  )
    return;
  const toSetup =
    current.advancedCapabilitiesToSetup ??
    capabilities
      .filter(({ status }) => status !== "enabled" && status !== "unavailable")
      .map(({ id }) => id);
  store.set(workflowSignal, {
    ...current,
    phase: "capabilities",
    advancedCapabilitiesToSetup: toSetup,
    advancedCapabilitiesStatus:
      toSetup.length === 0
        ? "completed"
        : (current.advancedCapabilitiesStatus ?? "pending"),
  });
}

function completeCapabilities(store: SignalStore): void {
  const current = getWorkflow(store);
  if (current.phase === "capabilities") {
    store.set(workflowSignal, {
      ...current,
      advancedCapabilitiesStatus: "completed",
    });
  }
}

function isSelectedTaskBeforeCapabilities(
  store: SignalStore,
  task: string,
): boolean {
  const current = getWorkflow(store);
  return current.phase !== "capabilities" && current.selectedTask === task;
}

function resetWorkflow(store: SignalStore): void {
  initializeWorkflowState();
  store.set(workflowSignal, { ...DEFAULT_WORKFLOW, declinedTasks: [] });
}

function setExecutionPhase(store: SignalStore): void {
  store.set(workflowSignal, { ...getWorkflow(store), phase: "execution" });
}

interface StoredConversation {
  appPluginName: string | null;
  approvedWritableRoot: string | null;
  conversationId: string;
  hostId: string;
  selectedTask: string;
}

function readPersisted<T>(key: string, fallback: T): T {
  return typeof appInitial.ngn === "function"
    ? appInitial.ngn(key, fallback)
    : fallback;
}

function writePersisted(key: string, value: unknown): void {
  appInitial.ogn?.(key, value);
}

function parseStoredConversation(value: unknown): StoredConversation | null {
  if (value == null || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.conversationId !== "string" ||
    record.conversationId.length === 0 ||
    typeof record.hostId !== "string" ||
    record.hostId.length === 0 ||
    typeof record.selectedTask !== "string" ||
    record.selectedTask.length === 0 ||
    (record.approvedWritableRoot != null &&
      typeof record.approvedWritableRoot !== "string")
  )
    return null;
  if (
    record.selectedTask === "desktop_note" &&
    record.approvedWritableRoot == null
  )
    return null;
  return {
    appPluginName:
      typeof record.appPluginName === "string" ? record.appPluginName : null,
    approvedWritableRoot: record.approvedWritableRoot as string | null,
    conversationId: record.conversationId,
    hostId: record.hostId,
    selectedTask: record.selectedTask,
  };
}

function getStoredConversation(
  hostId: string,
  raw = readPersisted(CONVERSATION_STORAGE_KEY, null),
): StoredConversation | null {
  const parsed = parseStoredConversation(raw);
  return parsed?.hostId === hostId ? parsed : null;
}

function rememberConversation(conversation: StoredConversation): void {
  writePersisted(CONVERSATION_STORAGE_KEY, conversation);
  rememberConversationId(conversation.conversationId);
}

function rememberConversationId(conversationId: string): void {
  const ids = getRememberedConversationIds();
  if (!ids.includes(conversationId))
    writePersisted(CONVERSATION_IDS_STORAGE_KEY, [...ids, conversationId]);
}

function getRememberedConversationIds(): string[] {
  const value = readPersisted<unknown>(CONVERSATION_IDS_STORAGE_KEY, []);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function clearRememberedConversationIds(): void {
  writePersisted(CONVERSATION_IDS_STORAGE_KEY, []);
}

function clearStoredConversation(conversation: StoredConversation): boolean {
  if (
    getStoredConversation(conversation.hostId)?.conversationId !==
    conversation.conversationId
  )
    return false;
  writePersisted(CONVERSATION_STORAGE_KEY, null);
  return true;
}

function initializeConversationStateFamily(): void {
  if (conversationStateFamilyInitialized) return;
  conversationStateFamilyInitialized = true;
  initializeSignalRuntime?.();
  initializeSharedRuntime?.();
  if (typeof createSignalFamily === "function") {
    conversationStateFamily = createSignalFamily(
      applicationScope,
      () => null,
      undefined,
      {
        key: ({ hostId, threadId }: { hostId: string; threadId: string }) =>
          `${hostId}:${threadId}`,
      },
    );
  }
}

const ONBOARDING_DEVELOPER_INSTRUCTIONS = [
  "Execute the selected conversational onboarding task immediately",
  "Do not invoke an onboarding skill or interactive onboarding tool",
  "Do not ask follow-up questions or offer task choices",
  "Use a sensible default when optional details are unavailable",
  "Immediately acknowledge the task before calling any tool, using one short user-visible sentence",
  "Always write natural-language text in the user's app language ({locale}), including progress updates and final responses",
  "Give brief progress updates in an ELI5 style without being patronizing",
  "Use one short plain-language sentence describing the user-visible goal, not the implementation",
  "Never mention commands, tools, code, paths, API parameters, filename checks, validation steps, or fallback logic",
  "Do not repeat acknowledgements",
  "Prefer the simplest reliable local toolchain already available and do not install packages",
  "Honor every writable root approved before this conversation",
  `Before the final response, call ${appInitial.lZt} with exactly one terminal outcome. Write completion tool output in the user's app language ({locale}) using that locale's conventions for dates, times, weekday and month names, numbers, and punctuation. Localize task-specific output examples instead of copying their language or formatting. Use {"outcome":"completed","output":"<task-specific output>","url":"<created or affected resource URL>"} when the intended action happened, following any selected task output instruction exactly. Use {"outcome":"not_completed","output":"<friendly first-person sentence>"} when execution succeeded but the intended result could not be achieved. Focus a not_completed output on the user's goal. Omit technical details, tool names, raw constraints, time zones, and error text. Authentication, connector, tool, and runtime errors are execution failures; explain them briefly and stop without calling the completion tool. If the completion tool rejects a terminal result, correct it and retry. After it succeeds, do not call it again`,
  "Give one concise final response and stop",
].join(". ");

function normalizePrompt(prompt: string | (() => string)): unknown {
  const text = typeof prompt === "function" ? prompt() : prompt;
  return typeof appInitial.Mpn === "function"
    ? appInitial.Mpn({
        addedFiles: [],
        fileAttachments: [],
        ideContext: null,
        imageAttachments: [],
        prompt: text,
      })
    : text;
}

async function createOnboardingConversation(
  _store: SignalStore,
  options: Record<string, any>,
): Promise<string> {
  const prompt = normalizePrompt(options.prompt);
  const roots = [options.projectRoot];
  const projectless = appInitial.UDt?.(roots);
  const workspace = (await appInitial.VDt?.(roots, { prompt })) ?? {
    cwd: options.projectRoot,
    workspaceRoots: roots,
  };
  const cwd = workspace.cwd ?? options.projectRoot;
  if (projectless && workspace.projectlessOutputDirectory == null)
    throw new Error("No projectless output directory found");
  const response = await appInitial
    .Ugn(options.store ?? _store, options.hostId)
    .sendRequest(
      "config/read",
      { includeLayers: false, cwd },
      { priority: "critical" },
    );
  const configuration = appInitial.O4({
    addedFiles: [],
    additionalDeveloperInstructions:
      ONBOARDING_DEVELOPER_INSTRUCTIONS.replaceAll(
        "{locale}",
        appInitial.hdn?.() ?? "en",
      ),
    agentMode: isPermissionPresetAllowed?.(
      "granular",
      options.permissionsRequirements,
    )
      ? "granular"
      : options.agentMode,
    permissionProfileId: options.permissionProfileId,
    shouldSendPermissionOverrides: options.shouldSendPermissionOverrides,
    collaborationMode: null,
    config: appInitial.Nmn?.(response.config) ?? response.config,
    configOverrides: { model: appInitial.k0t, model_reasoning_effort: "low" },
    cwd,
    fileAttachments: [],
    input: [],
    model: appInitial.k0t,
    projectlessOutputDirectory: workspace.projectlessOutputDirectory,
    reasoningEffort: "low",
    serviceTier: options.serviceTier,
    threadSource: "conversational_onboarding",
    turnTrigger: "conversational_onboarding",
    threadStartKind: "conversational_onboarding",
    workspaceKind: projectless ? "projectless" : "project",
    workspaceRoots: workspace.workspaceRoots,
  });
  if (typeof appInitial.gpt !== "function") {
    throw new Error("Conversation creation is unavailable");
  }
  const result = await appInitial.gpt(_store, options.hostId, configuration);
  if (result?.status === "created")
    rememberConversationId(result.conversationId);
  const failure = appInitial.mpt?.(_store, result);
  if (failure != null) throw failure;
  if (result?.status !== "created")
    throw new Error("Task creation is not confirmed");
  return result.conversationId;
}

function extractCompletionFromTurns(
  turns: Array<{ items: unknown[] }> | null | undefined,
): unknown {
  if (turns == null) return null;
  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex--) {
    const turn = turns[turnIndex];
    if (turn == null) continue;
    for (let itemIndex = turn.items.length - 1; itemIndex >= 0; itemIndex--) {
      const item = turn.items[itemIndex] as { type?: string } | undefined;
      if (item?.type !== "dynamicToolCall" && item?.type !== "mcpToolCall")
        continue;
      const completion = appInitial.$Dt?.(item);
      if (completion != null) return completion;
    }
  }
  return null;
}

function initializeConversationRuntime(): void {
  if (conversationRuntimeInitialized) return;
  conversationRuntimeInitialized = true;
  initializeWorkflowState();
  initializeConversationStateFamily();
  completionConversationIdSignal =
    createScopedSignal?.(applicationScope, null) ??
    completionConversationIdSignal;
  completionQueryFamily =
    createDerivedFamily?.(
      applicationScope,
      (conversationId: string, { get }: SignalReader) => ({
        enabled: appInitial.pnt?.conversationalOnboarding != null,
        queryKey: ["conversational-onboarding-completion", conversationId],
        queryFn: async () =>
          (await appInitial.pnt?.conversationalOnboarding?.getTaskCompletionState(
            { hostId: "local", conversationId },
          )) ?? { status: "unavailable" },
        staleTime: 0,
      }),
    ) ?? completionQueryFamily;
  completionResultFamily =
    createDerivedFamily?.(
      applicationScope,
      (conversationId: string | null, { get }: SignalReader) => {
        if (conversationId == null) return null;
        const service = appInitial.pnt?.conversationalOnboarding;
        if (service != null) {
          const state = get<CompletionQueryValue>(
            completionQueryFamily,
            conversationId,
          ).data;
          if (state?.status === "completed") return state.completion;
          if (state?.status !== "absent") return null;
        }
        const turns = get<ConversationTurn[] | null>(
          appInitial.n$t,
          conversationId,
        );
        return extractCompletionFromTurns(
          get<string | null>(completionConversationIdSignal) === conversationId
            ? turns?.slice(-1)
            : turns,
        );
      },
    ) ?? completionResultFamily;
  completionFailedFamily =
    createDerivedFamily?.(
      applicationScope,
      (conversationId: string | null, { get }: SignalReader) => {
        if (conversationId == null) return false;
        const lastTurn = get<ConversationTurn[] | null>(
          appInitial.n$t,
          conversationId,
        )?.at(-1);
        return (
          lastTurn != null &&
          lastTurn.status !== "inProgress" &&
          get(completionResultFamily, conversationId) == null
        );
      },
    ) ?? completionFailedFamily;
}

async function disposeStoredConversation(
  store: SignalStore,
  conversation: StoredConversation,
): Promise<void> {
  if (clearStoredConversation(conversation)) {
    inFlightTurns.delete(conversation.conversationId);
    appInitial.egt?.(store, {
      conversationId: conversation.conversationId,
      hostId: conversation.hostId,
      initiatedBy: "system",
    });
    await appInitial.pnt?.conversationalOnboarding?.clearTaskCompletionExpectation(
      {
        conversationId: conversation.conversationId,
        hostId: conversation.hostId,
      },
    );
  }
}

async function createStoredConversation(
  store: SignalStore,
  options: Record<string, any>,
  generation: number,
): Promise<StoredConversation> {
  const current = getStoredConversation(options.hostId);
  if (current != null) await disposeStoredConversation(store, current);
  const conversationId = await createOnboardingConversation(store, {
    ...options,
    store,
  });
  if ((startGeneration.get(options.hostId) ?? 0) !== generation) {
    appInitial.egt?.(store, {
      conversationId,
      hostId: options.hostId,
      initiatedBy: "system",
    });
    await appInitial.pnt?.conversationalOnboarding?.clearTaskCompletionExpectation(
      { conversationId, hostId: options.hostId },
    );
    throw new Error("Conversational onboarding start was cancelled");
  }
  const conversation = {
    appPluginName: options.appPluginName ?? null,
    approvedWritableRoot: null,
    conversationId,
    hostId: options.hostId,
    selectedTask: options.selectedTask,
  };
  rememberConversation(conversation);
  return conversation;
}

function startConversation(
  store: SignalStore,
  options: Record<string, any>,
): Promise<StoredConversation> {
  const generation = startGeneration.get(options.hostId) ?? 0;
  const current = getStoredConversation(options.hostId);
  if (
    current?.appPluginName === options.appPluginName &&
    current.selectedTask === options.selectedTask
  )
    return Promise.resolve(current);
  const inFlight = inFlightStarts.get(options.hostId);
  if (
    inFlight?.appPluginName === options.appPluginName &&
    inFlight.generation === generation &&
    inFlight.selectedTask === options.selectedTask
  )
    return inFlight.promise;
  if (inFlight?.generation === generation)
    return Promise.reject(
      new Error("Another conversational onboarding task is already starting"),
    );
  const promise = createStoredConversation(store, options, generation);
  inFlightStarts.set(options.hostId, {
    appPluginName: options.appPluginName ?? null,
    generation,
    promise,
    selectedTask: options.selectedTask,
  });
  const clear = () => {
    if (inFlightStarts.get(options.hostId)?.promise === promise)
      inFlightStarts.delete(options.hostId);
  };
  promise.then(clear, clear);
  return promise;
}

async function waitForCodexAppsReady(
  store: SignalStore,
  hostId: string,
  threadId: string,
): Promise<void> {
  if (store.when == null) return;
  const key = { hostId, threadId };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const state = await Promise.race([
      store
        .when((reader) => {
          const value = reader.get<any>(conversationStateFamily, key);
          return value != null && value.status !== "starting";
        })
        .then(() => store.get<any>(conversationStateFamily, key)),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), CODEX_APPS_READY_TIMEOUT_MS);
      }),
    ]);
    if (state?.status !== "ready")
      throw new Error("Codex Apps did not become ready for onboarding");
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

async function startOnboardingTurn(
  store: SignalStore,
  options: Record<string, any>,
): Promise<StoredConversation> {
  const generation = startGeneration.get(options.hostId) ?? 0;
  const conversation = await startConversation(store, options);
  if (options.requiresCodexAppsReady === true)
    await waitForCodexAppsReady(
      store,
      options.hostId,
      conversation.conversationId,
    );
  if ((startGeneration.get(options.hostId) ?? 0) !== generation)
    throw new Error("Conversational onboarding start was cancelled");
  const existing = inFlightTurns.get(conversation.conversationId);
  if (existing != null) {
    await existing;
    return conversation;
  }
  const turn = (async () => {
    const expected =
      await appInitial.pnt?.conversationalOnboarding?.expectTaskCompletion({
        conversationId: conversation.conversationId,
        hostId: options.hostId,
        isRevert: options.isRevert,
        selectedTask: options.selectedTask,
      });
    if (
      expected !== true ||
      (startGeneration.get(options.hostId) ?? 0) !== generation
    )
      throw new Error("Conversational onboarding start was cancelled");
    store.queryClient?.setQueriesData(
      {
        queryKey: [
          "conversational-onboarding-completion",
          conversation.conversationId,
        ],
      },
      { status: "pending" },
    );
    await appInitial.GU?.(store, options.hostId, conversation.conversationId, {
      request: {
        turnTrigger: options.isRevert
          ? "conversational_onboarding_revert"
          : "conversational_onboarding",
        threadId: conversation.conversationId,
        input: [
          ...(options.skill == null ? [] : [options.skill]),
          {
            type: "text",
            text: normalizePrompt(options.prompt),
            text_elements: [],
          },
        ],
        serviceTier: options.serviceTier,
      },
    });
  })();
  inFlightTurns.set(conversation.conversationId, turn);
  try {
    await turn;
  } catch (error) {
    inFlightTurns.delete(conversation.conversationId);
    throw error;
  }
  return conversation;
}

function startOnboardingFromExecution(
  store: SignalStore,
  options: Record<string, any>,
): Promise<StoredConversation> {
  setExecutionPhase(store);
  return startOnboardingTurn(store, options);
}

async function startAndSelectConversation(
  store: SignalStore,
  options: Record<string, any>,
): Promise<StoredConversation> {
  const conversation = await startConversation(store, options);
  const existing = inFlightTurns.get(conversation.conversationId);
  if (existing != null) {
    await existing;
    if (inFlightTurns.get(conversation.conversationId) === existing)
      inFlightTurns.delete(conversation.conversationId);
  }
  store.set(completionConversationIdSignal, conversation.conversationId);
  setExecutionPhase(store);
  return conversation;
}

function cancelConversationStart(store: SignalStore, hostId: string): void {
  startGeneration.set(hostId, (startGeneration.get(hostId) ?? 0) + 1);
  const current = getStoredConversation(hostId);
  if (current != null) void disposeStoredConversation(store, current);
}

async function archiveOnboardingConversations(
  store: SignalStore,
  hostId: string,
): Promise<void> {
  await Promise.all(
    getRememberedConversationIds().map(async (conversationId) => {
      await appInitial.Ugn(store, hostId).archiveConversation(conversationId, {
        useAppServerPins: store.get(appInitial.N1t),
        source: "conversational-onboarding-complete",
      });
      await appInitial.pnt?.conversationalOnboarding?.clearTaskCompletionExpectation(
        { hostId, conversationId },
      );
    }),
  );
  clearRememberedConversationIds();
}

function initializePermissionDelayState(): void {
  if (permissionDelayStateInitialized) return;
  permissionDelayStateInitialized = true;
  initializeSignalRuntime?.();
  initializeSharedRuntime?.();
  permissionPromptDisabledSignal =
    createScopedSignal?.(applicationScope, false) ??
    permissionPromptDisabledSignal;
  permissionPromptDelayedSignal =
    createScopedSignal?.(applicationScope, false) ??
    permissionPromptDelayedSignal;
}

function initializePermissionPromptState(): void {
  if (permissionPromptStateInitialized) return;
  permissionPromptStateInitialized = true;
  initializePermissionDelayState();
  permissionPromptVisibleSignal =
    createScopedSignal?.(applicationScope, "not-determined") ??
    permissionPromptVisibleSignal;
}

function clearNotificationPromptTimer(): void {
  if (notificationPromptTimer != null) clearTimeout(notificationPromptTimer);
  notificationPromptTimer = undefined;
}

function deferNotificationPrompt(store: SignalStore): void {
  initializePermissionPromptState();
  store.set(permissionPromptVisibleSignal, "disabled");
  clearNotificationPromptTimer();
  notificationPromptTimer = setTimeout(() => {
    notificationPromptTimer = undefined;
    store.set(permissionPromptDelayedSignal, false);
    store.set(permissionPromptDisabledSignal, true);
  }, NOTIFICATION_PROMPT_DELAY_MS);
}

function showNotificationPrompt(store: SignalStore): void {
  clearNotificationPromptTimer();
  store.set(permissionPromptDelayedSignal, false);
  store.set(permissionPromptDisabledSignal, true);
}

function resetNotificationPrompt(store: SignalStore): void {
  clearNotificationPromptTimer();
  store.set(permissionPromptVisibleSignal, "not-determined");
  store.set(permissionPromptDisabledSignal, false);
  store.set(permissionPromptDelayedSignal, false);
}

function roleFallbackTask(role: string | null | undefined): string {
  return (
    (role == null ? undefined : REPRESENTATIVE_ROLE_TASK[role]) ??
    "review_business_and_project_plans"
  );
}

function shouldUseChatGptTaskDefaults(
  configuration: { apps: unknown[]; appTemplates: unknown[] },
  mode: string,
): boolean {
  return (
    mode === "chatgpt" ||
    (configuration.apps.length === 0 && configuration.appTemplates.length === 0)
  );
}

function fallbackTasks(
  roles: unknown,
  representativeRole: string | null | undefined,
): string[] {
  const base = appInitial.Kyt?.(roles)
    ? CHATGPT_ROLE_TASKS
    : GENERAL_ROLE_TASKS;
  return [...base, roleFallbackTask(representativeRole)];
}

function isPluginEligible(
  pluginId: string,
  plan: unknown,
  allowedPlans: unknown[] | null = null,
): boolean {
  const freePlans = new Set([appInitial.Pdn?.FREE, appInitial.Pdn?.GO]);
  return (
    plan == null ||
    ((allowedPlans == null || allowedPlans.includes(plan)) &&
      !(freePlans.has(plan) && GOOGLE_WORKSPACE_PLUGIN_IDS.has(pluginId)))
  );
}

function filterCandidateTasks({
  canEnableNotifications,
  candidateItemIds,
  hideGoogleWorkspaceItems,
  mailProvider: provider,
  plan,
  taskDefinitions,
}: {
  canEnableNotifications: boolean;
  candidateItemIds: string[];
  hideGoogleWorkspaceItems: boolean;
  mailProvider: unknown;
  plan: unknown;
  taskDefinitions: Record<string, OnboardingTaskDefinition>;
}): string[] {
  const providerKind = mailProvider.a?.(provider, plan);
  return [...new Set(candidateItemIds)]
    .filter((taskId) => {
      if (taskId === "enable_notifications") return canEnableNotifications;
      if (
        [
          "create_project",
          "claude_import",
          "finish_connecting_imported_tools",
        ].includes(taskId)
      )
        return true;
      const task = taskDefinitions[taskId];
      if (task == null) return false;
      return (
        providerKind !== "google" ||
        !Object.values(task.pluginSlots ?? {}).some(
          (pluginId) =>
            !isPluginEligible(pluginId, plan) ||
            (hideGoogleWorkspaceItems &&
              GOOGLE_WORKSPACE_PLUGIN_IDS.has(pluginId)),
        )
      );
    })
    .slice(0, 10);
}

function chooseChecklistTasks({
  assignmentParameter,
  canEnableNotifications,
  generalAssignment,
  hideGoogleWorkspaceItems,
  mailProvider: provider,
  plan,
  representativeRole,
  roleAssignment,
  roles,
  taskDefinitions,
}: Record<string, any>): {
  exposureParameter: string | null;
  itemIds: string[];
} {
  const assigned =
    Array.isArray(roleAssignment) &&
    roleAssignment.every((item) => typeof item === "string") &&
    roleAssignment.length > 0
      ? roleAssignment
      : null;
  const general =
    Array.isArray(generalAssignment) &&
    generalAssignment.every((item) => typeof item === "string") &&
    generalAssignment.length > 0
      ? generalAssignment
      : null;
  const chosenAssignment =
    assignmentParameter === undefined
      ? representativeRole
      : assignmentParameter;
  let exposureParameter: string | null = null;
  let candidates: string[];
  if (chosenAssignment != null && assigned != null) {
    exposureParameter = chosenAssignment;
    candidates = assigned;
  } else if (general != null) {
    exposureParameter = "general";
    candidates = general;
  } else candidates = fallbackTasks(roles, representativeRole);
  const itemIds = filterCandidateTasks({
    canEnableNotifications,
    candidateItemIds: candidates,
    hideGoogleWorkspaceItems,
    mailProvider: provider,
    plan,
    taskDefinitions,
  });
  return itemIds.length > 0
    ? { exposureParameter, itemIds }
    : {
        exposureParameter,
        itemIds: filterCandidateTasks({
          canEnableNotifications,
          candidateItemIds: fallbackTasks(roles, representativeRole),
          hideGoogleWorkspaceItems,
          mailProvider: provider,
          plan,
          taskDefinitions,
        }),
      };
}

function extractTemplateVariables(text: string): Set<string> | null {
  const variables = new Set<string>();
  const remainder = text.replace(
    /\{([A-Za-z][A-Za-z0-9_]*)\}/g,
    (_match, name: string) => {
      variables.add(name);
      return "";
    },
  );
  return /[{}]/.test(remainder) ? null : variables;
}

function isTaskMessage(value: unknown): value is TaskMessage {
  if (value == null || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === "string" &&
    message.id.length > 0 &&
    typeof message.defaultMessage === "string" &&
    message.defaultMessage.length > 0 &&
    typeof message.description === "string" &&
    message.description.length > 0 &&
    (message.translations == null ||
      (typeof message.translations === "object" &&
        Object.values(message.translations as object).every(
          (entry) => typeof entry === "string" && entry.length > 0,
        )))
  );
}

function parseTaskDefinition(value: unknown): OnboardingTaskDefinition | null {
  if (value == null || typeof value !== "object") return null;
  const task = value as Record<string, any>;
  if (
    !isTaskMessage(task.messages?.label) ||
    !isTaskMessage(task.messages?.prompt)
  )
    return null;
  const labelCopies = [
    task.messages.label.defaultMessage,
    ...Object.values(task.messages.label.translations ?? {}),
  ] as string[];
  if (labelCopies.some((copy) => extractTemplateVariables(copy)?.size !== 0))
    return null;
  const pluginSlots = task.pluginSlots == null ? {} : task.pluginSlots;
  if (
    typeof pluginSlots !== "object" ||
    Object.values(pluginSlots).some(
      (entry) => typeof entry !== "string" || entry.length === 0,
    )
  )
    return null;
  const expected = new Set(Object.keys(pluginSlots));
  const instructionVariables = extractTemplateVariables(
    task.instructions ?? "",
  );
  const promptCopies = [
    task.messages.prompt.defaultMessage,
    ...Object.values(task.messages.prompt.translations ?? {}),
  ] as string[];
  const mismatch =
    instructionVariables == null ||
    promptCopies.some((copy) => {
      const variables = extractTemplateVariables(copy);
      if (variables == null) return true;
      const combined = new Set([...instructionVariables, ...variables]);
      return (
        combined.size !== expected.size ||
        [...expected].some((name) => !combined.has(name))
      );
    });
  if (mismatch) return null;
  return {
    is_auto_submit_enabled:
      typeof task.is_auto_submit_enabled === "boolean"
        ? task.is_auto_submit_enabled
        : undefined,
    instructions:
      typeof task.instructions === "string" && task.instructions.length > 0
        ? task.instructions
        : undefined,
    pluginSlots,
    messages: task.messages,
    origin: "remote",
  };
}

function checkedInTaskDefinitions(): Record<string, OnboardingTaskDefinition> {
  return (appInitial.Mwt ?? {}) as Record<string, OnboardingTaskDefinition>;
}

function checkedInFallbackTasks(): string[] {
  return Array.isArray(appInitial.Nwt) ? appInitial.Nwt : [];
}

function parseRemoteTaskConfig(value: unknown): ParsedRemoteTaskConfig {
  const fallback = {
    fallbackTaskIds: checkedInFallbackTasks(),
    taskDefinitions: checkedInTaskDefinitions(),
  };
  if (value == null || typeof value !== "object") return fallback;
  const config = value as Record<string, any>;
  if (config.tasks == null || typeof config.tasks !== "object") return fallback;
  const taskDefinitions = { ...checkedInTaskDefinitions() };
  for (const [taskId, definition] of Object.entries(config.tasks)) {
    if (taskId.length === 0 || RESERVED_REMOTE_TASK_IDS.has(taskId)) continue;
    const parsed = parseTaskDefinition(definition);
    if (parsed != null) taskDefinitions[taskId] = parsed;
  }
  const fallbackTaskIds =
    Array.isArray(config.fallback_tasks) &&
    config.fallback_tasks.every(
      (item: unknown) => typeof item === "string" && item.length > 0,
    )
      ? config.fallback_tasks
      : checkedInFallbackTasks();
  return {
    fallbackTaskIds,
    taskDefinitions,
  };
}

function localizedTaskMessage(
  task: OnboardingTaskDefinition,
  key: "label" | "prompt",
  locale: string,
): TaskMessage {
  if (task.origin === "checked_in") return task.messages[key];
  const message = task.messages[key];
  return {
    id: `${message.id}.statsig.${locale}`,
    defaultMessage:
      message.translations?.[LOCALE_TO_TRANSLATION_KEY[locale] ?? locale] ??
      message.defaultMessage,
    description: message.description,
  };
}

function readRemoteConfig(
  options: { disableExposureLog?: boolean } = {},
): ParsedRemoteTaskConfig {
  const result = appInitial.afn?.(REMOTE_TASK_CONFIG_EXPERIMENT, {
    disableExposureLog: options.disableExposureLog === true,
  });
  return parseRemoteTaskConfig(result?.value);
}

function useRemoteTaskDefinitions(
  options: { disableExposureLog?: boolean } = {},
): Record<string, OnboardingTaskDefinition> {
  return readRemoteConfig(options).taskDefinitions;
}

function parseRemotePluginIds(
  value: unknown,
): Record<string, string> | undefined {
  if (value == null || typeof value !== "object") return undefined;
  const ids = (value as Record<string, unknown>).remotePluginIds;
  return ids != null &&
    typeof ids === "object" &&
    Object.values(ids).every(
      (entry) => typeof entry === "string" && entry.length > 0,
    )
    ? (ids as Record<string, string>)
    : undefined;
}

function useRemotePluginIds(): Record<string, string> | undefined {
  const result = appInitial.afn?.(REMOTE_TASK_CONFIG_EXPERIMENT, {
    disableExposureLog: true,
  });
  return parseRemotePluginIds(result?.value);
}

function initializeTaskSchemas(): void {}
function initializeCandidateTaskSelection(): void {}
function initializeRemoteTaskConfig(): void {}
function initializeCandidateTaskConstants(): void {}
function initializeLocaleMap(): void {}

export {
  setExecutionPhase as $,
  initializeConversationRuntime as A,
  initializeConversationStateFamily as B,
  initializePermissionDelayState as C,
  startAndSelectConversation as D,
  archiveOnboardingConversations as E,
  taskIconSchema as F,
  initializeWorkflowState as G,
  completedImportSignal as H,
  taskIdSchema as I,
  returnToTaskSelection as J,
  isSelectedTaskBeforeCapabilities as K,
  localTaskIdSchema as L,
  cancelConversationStart as M,
  startOnboardingFromExecution as N,
  completionFailedFamily as O,
  LOCAL_TASK_IDS as P,
  enterCapabilitiesPhase as Q,
  initializeTaskSchemas as R,
  permissionPromptVisibleSignal as S,
  permissionPromptDelayedSignal as T,
  workflowSignal as U,
  completeCapabilities as V,
  getWorkflow as W,
  selectTask as X,
  selectRole as Y,
  setPermissionStatus as Z,
  isPluginEligible as _,
  initializeRemoteTaskConfig as a,
  deferNotificationPrompt as b,
  useRemoteTaskDefinitions as c,
  ROLE_ASSIGNMENT_EXPERIMENT as d,
  chooseChecklistTasks as f,
  shouldUseChatGptTaskDefaults as g,
  initializeCandidateTaskSelection as h,
  parseRemoteTaskConfig as i,
  startConversation as j,
  completionResultFamily as k,
  LOCALE_TO_TRANSLATION_KEY as l,
  initializeCandidateTaskConstants as m,
  localizedTaskMessage as n,
  useRemotePluginIds as o,
  roleFallbackTask as p,
  resetWorkflow as q,
  parseRemotePluginIds as r,
  readRemoteConfig as s,
  REMOTE_TASK_CONFIG_EXPERIMENT as t,
  initializeLocaleMap as u,
  initializePermissionPromptState as v,
  permissionPromptDisabledSignal as w,
  resetNotificationPrompt as x,
  showNotificationPrompt as y,
  conversationStateFamily as z,
};
