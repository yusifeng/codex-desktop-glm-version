// automations-page —— Scheduled tasks 的本地/云端统一管理页面。
// 原版：app/webview/assets/automations-page-fb28e6fc19f3.js。

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as elicitationEventsChunk from "@rchunk/elicitation-events";
import * as cloudDetailChunk from "@rchunk/cloud-automation-detail-panel";
import * as frequencySectionChunk from "@rchunk/automation-frequency-section";
import * as editorDialogChunk from "@rchunk/editor-dialog";
import * as deleteDialogChunk from "@rchunk/automation-delete-confirmation-dialog";
import * as scheduleFieldsChunk from "@rchunk/schedule-fields";
import * as migrationStateChunk from "@rchunk/habitat-automation-migration-state";
import * as pluginTasksChunk from "@rchunk/use-plugin-scheduled-tasks";
import * as documentSearchChunk from "@rchunk/document-search";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type AutomationSource = "cloud" | "local";
type AutomationStatus = "ACTIVE" | "COMPLETED" | "DELETED" | "PAUSED";
type PageMode = "create" | "detail" | "edit" | "list";
type StatusFilter = "active" | "all" | "paused";

interface ScheduleConfig {
  customRrule?: string;
  mode?: string;
  time?: string;
  timeZone?: string;
}

interface AutomationDraft {
  id?: string;
  kind?: string;
  name: string;
  prompt: string;
  scheduleConfig: ScheduleConfig;
  source: AutomationSource;
  status: AutomationStatus;
}

interface AutomationRun {
  automationId?: string | null;
  archived?: boolean;
  createdAt: string | number;
  description?: string | null;
  id: string;
  status: "ARCHIVED" | "COMPLETED" | "FAILED" | "IN_PROGRESS";
  threadId?: string | null;
  title?: string | null;
  unread?: boolean;
}

interface AutomationItem {
  canManage?: boolean;
  id: string;
  kind?: string;
  name: string;
  nextRunAt?: string | number | null;
  pluginName?: string | null;
  pluginState?: "disabled" | "missing" | "unavailable" | null;
  prompt?: string;
  runs?: AutomationRun[];
  scheduleLabel?: string | null;
  source: AutomationSource;
  status: AutomationStatus;
}

interface MigrationState {
  migratedCount?: number;
  status: "complete" | "failed" | "pending" | "unavailable";
}

interface AutomationsPresentation {
  automations: AutomationItem[];
  canCreateCloud?: boolean;
  canCreateLocal?: boolean;
  cloudError?: string | null;
  cloudLoading?: boolean;
  deletePending?: boolean;
  draft?: AutomationDraft | null;
  hostId?: string;
  migration?: MigrationState | null;
  mode?: PageMode;
  pluginTasks?: AutomationItem[];
  query?: string;
  selectedAutomationId?: string | null;
  selectedSource?: AutomationSource | null;
  statusFilter?: StatusFilter;
  onArchiveAll?(runs: AutomationRun[]): Promise<void> | void;
  onArchiveRun?(run: AutomationRun): Promise<void> | void;
  onCloseEditor?(): void;
  onCreate?(source: AutomationSource): void;
  onDelete?(automation: AutomationItem): Promise<void> | void;
  onEdit?(automation: AutomationItem): void;
  onMarkAllRead?(runs: AutomationRun[]): Promise<void> | void;
  onMarkRunRead?(run: AutomationRun, read: boolean): Promise<void> | void;
  onMigrate?(): Promise<void> | void;
  onOpenChat?(run: AutomationRun): void;
  onOpenPlugin?(automation: AutomationItem): void;
  onPause?(automation: AutomationItem): Promise<void> | void;
  onQueryChange?(query: string): void;
  onRetryCloud?(): void;
  onRun?(automation: AutomationItem): Promise<void> | void;
  onSave?(draft: AutomationDraft): Promise<void> | void;
  onSelect?(automation: AutomationItem): void;
  onStatusFilterChange?(filter: StatusFilter): void;
  onUnarchiveRun?(run: AutomationRun): Promise<void> | void;
}

interface PageProps {
  presentation?: AutomationsPresentation;
}

interface AppSharedBindings {
  $3?(): void;
  I3(): JsxRuntime;
  K2?(): void;
  BX?: (...arguments_: unknown[]) => unknown;
  HX?: <Value>(signal: unknown, ...arguments_: unknown[]) => Value;
  e6?: (() => ReactRuntime) & ReactRuntime;
  Qh?: unknown;
  Y2?: unknown;
  Yh?: unknown;
}

interface AppInitialBindings {
  /** Capability query signal used with `{ name: "automations.local|cloud" }`. */
  Xet?: unknown;
  /** Signed-in account projection. */
  yun?: unknown;
  /** Local automations query signal. */
  QCt?: unknown;
  /** Cloud automations query signal. */
  itt?: unknown;
  /** Local automation run-history hook. */
  MC?: () => AutomationHistoryState;
  /** Published local automation mutation factory. */
  iun?: (operation: "automation-create" | "automation-delete" | "automation-run-now" | "automation-update", options?: MutationOptions) => AutomationMutation;
  /** Release request builders for create, full update, and status-only update. */
  Ftt?: (input: AutomationMutationDraft) => unknown;
  Vtt?: (input: AutomationMutationDraft & { status: AutomationStatus }) => unknown;
  Btt?: (automation: RawAutomation, status: AutomationStatus) => unknown;
  /** Cloud automation mutations and the release request serializer. */
  dtt?: unknown;
  ptt?: unknown;
  att?: unknown;
  htt?: (draft: AutomationDraft, timeZone: string) => Record<string, unknown>;
}

interface MutationOptions {
  onError?(error: unknown, variables: unknown): void;
  onSuccess?(result: unknown, variables: unknown): void;
}

interface AutomationMutation {
  isPending?: boolean;
  mutate?(variables: unknown, options?: MutationOptions): void;
  variables?: unknown;
}

interface AutomationMutationDraft {
  draft: AutomationDraft;
  name: string;
  prompt: string;
  rrule: string | null;
}

interface CapabilityState {
  isCapable?: boolean;
  isLoading?: boolean;
}

interface QueryState<Value> {
  data?: Value;
  error?: unknown;
  isFetching?: boolean;
  isLoading?: boolean;
  refetch?(): unknown;
}

interface AutomationHistoryState {
  items?: RawAutomationRun[];
  markAllRead?(): Promise<void> | void;
  unreadRunCounts?: { automationIds?: string[] };
}

interface RawAutomationRun extends Omit<AutomationRun, "id" | "createdAt" | "status"> {
  automation_id?: string | null;
  created_at?: string | number;
  createdAt?: string | number;
  id?: string;
  status?: AutomationRun["status"];
  thread_id?: string | null;
}

interface RawAutomation {
  automation?: RawAutomation;
  canManage?: boolean;
  id?: string;
  kind?: string;
  name?: string;
  next_run_at?: string | number | null;
  nextRunAt?: string | number | null;
  prompt?: string;
  status?: AutomationStatus | "COMPLETED";
  title?: string;
}

interface AutomationCollection {
  accountId?: string | null;
  items?: RawAutomation[];
}

interface InitializerBindings {
  n?(): void;
  t?(): void;
}

interface CloudDetailBindings {
  n?: (props: Record<string, unknown>) => unknown;
  t?(): void;
}

interface FrequencyBindings {
  i?(): void;
  l?: (props: Record<string, unknown>) => unknown;
}

interface EditorDialogBindings {
  a?(): void;
  h?(): void;
  i?(): void;
  m?(): void;
}

interface DeleteDialogBindings {
  n?(): void;
  t?: (props: Record<string, unknown>) => unknown;
}

interface ScheduleFieldsBindings {
  a?: (scope: unknown, item: unknown, navigate?: unknown, options?: Record<string, unknown>) => void;
  i?(): void;
}

interface MigrationBindings {
  n?(): void;
  r?: (service: unknown, accountId: string, userId: string, enabled?: boolean) => Record<string, unknown>;
  t?: (state: Record<string, unknown> | null) => boolean;
}

interface PluginTasksBindings {
  n?: (input: { capable?: boolean; enabled?: boolean; hostId: string; tasks?: unknown[] }) => unknown[] | undefined;
  t?(): void;
}

interface DocumentSearchBindings {
  n?(): void;
  t?: (props: Record<string, unknown>) => unknown;
}

const { $3: initializeJsx, I3: getJsxRuntime, K2: initializeShared } =
  appSharedChunk as unknown as AppSharedBindings;
const { BX: useRuntimeQuery, HX: useRuntimeSignal, e6: getReactRuntime } = appSharedChunk as unknown as AppSharedBindings;
const {
  Xet: automationCapabilitySignal,
  yun: accountSignal,
  QCt: localAutomationsSignal,
  itt: cloudAutomationsSignal,
  MC: useAutomationHistory,
  iun: useAutomationMutation,
  Ftt: buildCreateAutomationRequest,
  Vtt: buildUpdateAutomationRequest,
  Btt: buildAutomationStatusRequest,
  dtt: cloudCreateMutationSignal,
  ptt: cloudUpdateMutationSignal,
  att: cloudDeleteMutationSignal,
  htt: buildCloudAutomationRequest,
} = appInitialChunk as unknown as AppInitialBindings;
const { n: initializePrimary } = appPrimaryChunk as unknown as InitializerBindings;
const { n: initializeElicitationEvents, t: initializeElicitationRuntime } =
  elicitationEventsChunk as unknown as InitializerBindings;
const { n: CloudAutomationDetail, t: initializeCloudDetail } =
  cloudDetailChunk as unknown as CloudDetailBindings;
const { i: initializeFrequency, l: FrequencySection } =
  frequencySectionChunk as unknown as FrequencyBindings;
const {
  a: initializeEditorDialog,
  h: initializeEditorForms,
  i: initializeEditorFields,
  m: initializeEditorLayout,
} = editorDialogChunk as unknown as EditorDialogBindings;
const { n: initializeDeleteDialog, t: AutomationDeleteConfirmationDialog } =
  deleteDialogChunk as unknown as DeleteDialogBindings;
const { a: openAutomationConversation, i: initializeScheduleFields } =
  scheduleFieldsChunk as unknown as ScheduleFieldsBindings;
const { n: initializeMigration, r: createMigrationQuery, t: isMigrationComplete } =
  migrationStateChunk as unknown as MigrationBindings;
const { n: usePluginScheduledTasks, t: initializePluginTasks } =
  pluginTasksChunk as unknown as PluginTasksBindings;
const { n: initializeDocumentSearch, t: DocumentSearch } =
  documentSearchChunk as unknown as DocumentSearchBindings;

const EMPTY_PRESENTATION: AutomationsPresentation = { automations: [] };
let initialized = false;
let jsxRuntime: JsxRuntime | null = null;

function initializeAutomationsPage(): void {
  if (initialized) return;
  initializeJsx?.();
  initializeShared?.();
  initializePrimary?.();
  initializeElicitationEvents?.();
  initializeElicitationRuntime?.();
  initializeCloudDetail?.();
  initializeFrequency?.();
  initializeEditorDialog?.();
  initializeEditorForms?.();
  initializeEditorFields?.();
  initializeEditorLayout?.();
  initializeDeleteDialog?.();
  initializeScheduleFields?.();
  initializeMigration?.();
  initializePluginTasks?.();
  initializeDocumentSearch?.();
  void createMigrationQuery;
  void openAutomationConversation;
  jsxRuntime = getJsxRuntime();
  initialized = true;
}

function jsx(): JsxRuntime {
  initializeAutomationsPage();
  if (jsxRuntime == null) throw new Error("Automations page JSX runtime unavailable");
  return jsxRuntime;
}

function queryCapability(name: "automations.cloud" | "automations.local"): CapabilityState {
  if (useRuntimeQuery == null || automationCapabilitySignal == null) return {};
  return (useRuntimeQuery(automationCapabilitySignal, { name }) ?? {}) as CapabilityState;
}

function readSignal<Value>(signal: unknown, fallback: Value, ...arguments_: unknown[]): Value {
  if (useRuntimeSignal == null || signal == null) return fallback;
  return useRuntimeSignal<Value>(signal, ...arguments_) ?? fallback;
}

function normalizeRun(run: RawAutomationRun, index: number): AutomationRun {
  return {
    ...run,
    automationId: run.automationId ?? run.automation_id ?? null,
    createdAt: run.createdAt ?? run.created_at ?? 0,
    id: run.id ?? `automation-run-${index}`,
    status: run.status ?? "COMPLETED",
    threadId: run.threadId ?? run.thread_id ?? null,
  };
}

function normalizeAutomation(
  candidate: RawAutomation,
  source: AutomationSource,
  runsByAutomationId: ReadonlyMap<string, AutomationRun[]>,
  index: number,
): AutomationItem | null {
  const raw = candidate.automation ?? candidate;
  const id = raw.id;
  if (id == null || id.length === 0) return null;
  const rawStatus = raw.status;
  const status: AutomationStatus = rawStatus === "PAUSED" ? "PAUSED" : rawStatus === "DELETED" ? "DELETED" : rawStatus === "COMPLETED" ? "COMPLETED" : "ACTIVE";
  return {
    canManage: raw.canManage ?? candidate.canManage,
    id,
    kind: raw.kind,
    name: raw.name ?? raw.title ?? `Scheduled task ${index + 1}`,
    nextRunAt: raw.nextRunAt ?? raw.next_run_at,
    prompt: raw.prompt,
    runs: runsByAutomationId.get(id),
    source,
    status,
  };
}

function runtimePresentation(react?: ReactRuntime): AutomationsPresentation {
  const [selectedKey, setSelectedKey] = react?.useState<string | null>(null) ?? [null, () => undefined];
  const [query, setQuery] = react?.useState("") ?? ["", () => undefined];
  const [statusFilter, setStatusFilter] = react?.useState<StatusFilter>("all") ?? ["all" as StatusFilter, () => undefined];
  const [mode, setMode] = react?.useState<PageMode>("list") ?? ["list" as PageMode, () => undefined];
  const [draft, setDraft] = react?.useState<AutomationDraft | null>(null) ?? [null, () => undefined];
  const localCapability = queryCapability("automations.local");
  const cloudCapability = queryCapability("automations.cloud");
  const account = readSignal<{ accountId?: string | null }>(accountSignal, {});
  const cloudDisabled = useRuntimeQuery?.(false, "4283773748") === true;
  const localQuery = readSignal<QueryState<AutomationCollection>>(
    localAutomationsSignal,
    {},
    { enabled: localCapability.isCapable === true },
  );
  const cloudEnabled = cloudCapability.isCapable === true && cloudDisabled !== true;
  const cloudQuery = readSignal<QueryState<AutomationCollection>>(
    cloudAutomationsSignal,
    {},
    { enabled: cloudEnabled },
  );
  const cloudCreateMutation = readSignal<AutomationMutation>(cloudCreateMutationSignal, {});
  const cloudUpdateMutation = readSignal<AutomationMutation>(cloudUpdateMutationSignal, {});
  const cloudDeleteMutation = readSignal<AutomationMutation>(cloudDeleteMutationSignal, {});
  const history = useAutomationHistory?.() ?? {};
  const mutationOptions: MutationOptions = {
    onSuccess: () => {
      void localQuery.refetch?.();
      setMode("detail");
    },
  };
  const createMutation = useAutomationMutation?.("automation-create", mutationOptions) ?? {};
  const updateMutation = useAutomationMutation?.("automation-update", mutationOptions) ?? {};
  const deleteMutation = useAutomationMutation?.("automation-delete", mutationOptions) ?? {};
  const runMutation = useAutomationMutation?.("automation-run-now", mutationOptions) ?? {};
  const runsByAutomationId = new Map<string, AutomationRun[]>();
  for (const [index, rawRun] of (history.items ?? []).entries()) {
    const run = normalizeRun(rawRun, index);
    if (run.automationId == null) continue;
    const existing = runsByAutomationId.get(run.automationId) ?? [];
    existing.push(run);
    runsByAutomationId.set(run.automationId, existing);
  }
  const local = localCapability.isCapable === true ? localQuery.data?.items ?? [] : [];
  const cloud = account.accountId != null && cloudQuery.data?.accountId === account.accountId
    ? cloudQuery.data.items ?? []
    : [];
  const automations = [
    ...local.map((item, index) => normalizeAutomation(item, "local", runsByAutomationId, index)),
    ...cloud.map((item, index) => normalizeAutomation(item, "cloud", runsByAutomationId, index)),
  ].filter((item): item is AutomationItem => item != null);
  const selected = automations.find((item) => `${item.source}:${item.id}` === selectedKey) ?? automations[0];
  const saveDraft = (nextDraft: AutomationDraft): void => {
    if (nextDraft.source === "cloud") {
      const requestBody = buildCloudAutomationRequest?.(
        { ...nextDraft, name: nextDraft.name.trim(), prompt: nextDraft.prompt.trim() },
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ) ?? {
        name: nextDraft.name.trim(),
        prompt: nextDraft.prompt.trim(),
        schedule: nextDraft.scheduleConfig,
      };
      if (nextDraft.id == null) cloudCreateMutation.mutate?.({ requestBody, team: null });
      else cloudUpdateMutation.mutate?.({ automationId: nextDraft.id, requestBody });
      return;
    }
    const input: AutomationMutationDraft = {
      draft: nextDraft,
      name: nextDraft.name.trim(),
      prompt: nextDraft.prompt.trim(),
      rrule: nextDraft.scheduleConfig.customRrule ?? null,
    };
    if (nextDraft.id == null) {
      createMutation.mutate?.(buildCreateAutomationRequest?.(input) ?? input);
      return;
    }
    updateMutation.mutate?.(
      buildUpdateAutomationRequest?.({ ...input, status: nextDraft.status }) ?? { ...input, status: nextDraft.status },
    );
  };
  const updateStatus = (item: AutomationItem): void => {
    const nextStatus: AutomationStatus = item.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    if (item.source === "cloud") {
      cloudUpdateMutation.mutate?.({ automationId: item.id, isEnabled: nextStatus === "ACTIVE" });
      return;
    }
    const raw: RawAutomation = { ...item };
    updateMutation.mutate?.(buildAutomationStatusRequest?.(raw, nextStatus) ?? { id: item.id, status: nextStatus });
  };
  return {
    ...EMPTY_PRESENTATION,
    automations,
    canCreateCloud: cloudCapability.isCapable === true && account.accountId != null && cloudDisabled !== true,
    canCreateLocal: localCapability.isCapable === true,
    cloudError: cloudQuery.error == null ? null : "Cloud scheduled tasks could not be loaded",
    cloudLoading: cloudQuery.isFetching === true,
    draft,
    mode: mode === "list" && selected != null ? "detail" : mode,
    query,
    selectedAutomationId: selected?.id ?? null,
    selectedSource: selected?.source ?? null,
    statusFilter,
    onCloseEditor: () => setMode(selected == null ? "list" : "detail"),
    onCreate: (source) => {
      setDraft({ kind: "cron", name: "", prompt: "", scheduleConfig: { mode: "daily", time: "09:00" }, source, status: "ACTIVE" });
      setMode("create");
    },
    onDelete: (item) => {
      if (item.source === "local") deleteMutation.mutate?.({ id: item.id });
      else cloudDeleteMutation.mutate?.({ automationId: item.id });
    },
    onEdit: (item) => {
      setDraft({ id: item.id, kind: item.kind ?? "cron", name: item.name, prompt: item.prompt ?? "", scheduleConfig: {}, source: item.source, status: item.status });
      setMode("edit");
    },
    onMarkAllRead: () => history.markAllRead?.(),
    onQueryChange: setQuery,
    onRetryCloud: () => { void cloudQuery.refetch?.(); },
    onRun: (item) => {
      if (item.source === "local") runMutation.mutate?.({ id: item.id, collaborationMode: null, permissions: null });
    },
    onSave: saveDraft,
    onSelect: (item) => setSelectedKey(`${item.source}:${item.id}`),
    onPause: updateStatus,
    onStatusFilterChange: setStatusFilter,
  };
}

function displayName(item: AutomationItem): string {
  return item.name.trim() || "Untitled scheduled task";
}

function matchesFilter(item: AutomationItem, query: string, filter: StatusFilter): boolean {
  if (filter === "active" && item.status !== "ACTIVE") return false;
  if (filter === "paused" && item.status !== "PAUSED") return false;
  const normalized = query.trim().toLocaleLowerCase();
  return normalized.length === 0 ||
    displayName(item).toLocaleLowerCase().includes(normalized) ||
    item.prompt?.toLocaleLowerCase().includes(normalized) === true ||
    item.pluginName?.toLocaleLowerCase().includes(normalized) === true;
}

function normalizedItems(presentation: AutomationsPresentation): AutomationItem[] {
  const pluginItems = usePluginScheduledTasks?.({
    hostId: presentation.hostId ?? "local",
    capable: presentation.canCreateLocal !== false,
    tasks: presentation.pluginTasks ?? [],
  });
  const extras = (pluginItems ?? []) as AutomationItem[];
  const byKey = new Map<string, AutomationItem>();
  for (const item of [...presentation.automations, ...extras]) {
    byKey.set(`${item.source}:${item.id}`, item);
  }
  return [...byKey.values()];
}

function PageHeader({ presentation }: { presentation: AutomationsPresentation }): unknown {
  const canCreate = presentation.canCreateLocal !== false || presentation.canCreateCloud === true;
  const preferredSource: AutomationSource =
    presentation.canCreateLocal !== false ? "local" : "cloud";
  return jsx().jsxs("header", {
    className: "flex items-start justify-between gap-4 border-b border-token-border-default px-6 py-5",
    children: [
      jsx().jsxs("div", {
        children: [
          jsx().jsx("h1", { className: "text-xl font-semibold", children: "Scheduled tasks" }),
          jsx().jsx("p", {
            className: "text-sm text-token-text-secondary",
            children: "Ask ChatGPT or Codex to run work on a schedule, set reminders, or monitor for updates.",
          }),
        ],
      }),
      jsx().jsx("button", {
        type: "button",
        disabled: !canCreate,
        onClick: () => presentation.onCreate?.(preferredSource),
        children: "Create",
      }),
    ],
  });
}

function MigrationBanner({ presentation }: { presentation: AutomationsPresentation }): unknown {
  const migration = presentation.migration;
  if (migration == null || isMigrationComplete?.(migration as unknown as Record<string, unknown>) === true || migration.status === "complete") return null;
  const failed = migration.status === "failed" || migration.status === "unavailable";
  return jsx().jsxs("aside", {
    role: failed ? "alert" : "status",
    className: "mx-4 mt-4 rounded-lg border border-token-border-default p-3",
    children: [
      jsx().jsx("strong", { children: failed ? "Local task sync needs attention" : "Syncing local automations" }),
      jsx().jsx("p", {
        children: failed
          ? "Local tasks are still available on this device. Retry to sync them to cloud storage."
          : "Your local scheduled tasks are being prepared for the updated automation store.",
      }),
      jsx().jsx("button", { type: "button", onClick: presentation.onMigrate, children: failed ? "Retry sync" : "Sync now" }),
    ],
  });
}

function TaskRow({ item, presentation }: { item: AutomationItem; presentation: AutomationsPresentation }): unknown {
  const selected =
    item.id === presentation.selectedAutomationId &&
    (presentation.selectedSource == null || item.source === presentation.selectedSource);
  return jsx().jsx("li", {
    children: jsx().jsxs("button", {
      type: "button",
      "aria-current": selected ? "page" : undefined,
      className: "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left",
      onClick: () => presentation.onSelect?.(item),
      children: [
        jsx().jsxs("span", {
          className: "min-w-0",
          children: [
            jsx().jsx("span", { className: "block truncate", children: displayName(item) }),
            jsx().jsx("span", {
              className: "block truncate text-xs text-token-text-secondary",
              children: item.scheduleLabel ?? (item.source === "cloud" ? "Cloud scheduled task" : "Local scheduled task"),
            }),
          ],
        }),
        jsx().jsx("span", {
          className: "text-xs uppercase text-token-text-secondary",
          children: item.status === "PAUSED" ? "Paused" : item.status === "COMPLETED" ? "Completed" : "Active",
        }),
      ],
    }),
  });
}

function TaskList({ items, presentation }: { items: AutomationItem[]; presentation: AutomationsPresentation }): unknown {
  const query = presentation.query ?? "";
  const filter = presentation.statusFilter ?? "all";
  const visible = items.filter((item) => item.status !== "DELETED" && matchesFilter(item, query, filter));
  const local = visible.filter((item) => item.source === "local");
  const cloud = visible.filter((item) => item.source === "cloud");
  const renderGroup = (title: string, group: AutomationItem[]) =>
    group.length === 0
      ? null
      : jsx().jsxs("section", {
          children: [
            jsx().jsx("h2", { className: "px-3 py-2 text-xs font-semibold uppercase", children: title }),
            jsx().jsx("ul", { children: group.map((item) => jsx().jsx(TaskRow, { item, presentation }, `${item.source}:${item.id}`)) }),
          ],
        });
  return jsx().jsxs("aside", {
    className: "min-h-0 w-80 shrink-0 overflow-auto border-e border-token-border-default p-3",
    children: [
      jsx().jsx("input", {
        type: "search",
        "aria-label": "Search scheduled tasks",
        value: query,
        onChange: (event: { currentTarget: { value: string } }) => presentation.onQueryChange?.(event.currentTarget.value),
      }),
      jsx().jsx("select", {
        "aria-label": "Scheduled task status",
        value: filter,
        onChange: (event: { currentTarget: { value: StatusFilter } }) => presentation.onStatusFilterChange?.(event.currentTarget.value),
        children: ["all", "active", "paused"].map((value) =>
          jsx().jsx("option", { value, children: value === "all" ? "All" : value === "active" ? "Active" : "Paused" }, value),
        ),
      }),
      presentation.cloudError == null
        ? null
        : jsx().jsxs("div", {
            role: "alert",
            children: [
              jsx().jsx("p", { children: "Cloud scheduled tasks could not be loaded" }),
              jsx().jsx("button", { type: "button", onClick: presentation.onRetryCloud, children: "Try again" }),
            ],
          }),
      presentation.cloudLoading === true ? jsx().jsx("p", { role: "status", children: "Loading scheduled tasks…" }) : null,
      visible.length === 0
        ? DocumentSearch == null
          ? jsx().jsx("p", { children: "No scheduled tasks found" })
          : jsx().jsx(DocumentSearch, { query, emptyMessage: "No scheduled tasks found" })
        : null,
      renderGroup("Local", local),
      renderGroup("Cloud", cloud),
    ],
  });
}

function PluginWarning({ item, presentation }: { item: AutomationItem; presentation: AutomationsPresentation }): unknown {
  if (item.pluginState == null) return null;
  const message =
    item.pluginState === "disabled"
      ? "The source plugin for this scheduled task is disabled."
      : item.pluginState === "missing"
        ? "The source plugin for this scheduled task is uninstalled."
        : "The source plugin for this scheduled task is unavailable.";
  return jsx().jsxs("aside", {
    role: "alert",
    children: [
      jsx().jsx("p", { children: message }),
      jsx().jsx("button", { type: "button", onClick: () => presentation.onOpenPlugin?.(item), children: "Open plugin" }),
    ],
  });
}

function RunHistory({ item, presentation }: { item: AutomationItem; presentation: AutomationsPresentation }): unknown {
  const runs = item.runs ?? [];
  const archiveable = runs.filter((run) => run.status !== "ARCHIVED" && run.status !== "IN_PROGRESS" && run.threadId != null);
  return jsx().jsxs("section", {
    className: "mt-6",
    children: [
      jsx().jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          jsx().jsx("h3", { children: "Previous runs" }),
          jsx().jsxs("div", {
            children: [
              jsx().jsx("button", { type: "button", onClick: () => presentation.onMarkAllRead?.(runs), children: "Mark all as read" }),
              jsx().jsx("button", { type: "button", disabled: archiveable.length === 0, onClick: () => presentation.onArchiveAll?.(archiveable), children: "Archive all" }),
            ],
          }),
        ],
      }),
      runs.length === 0
        ? jsx().jsx("p", { children: "No updates available" })
        : jsx().jsx("ul", {
            children: runs.map((run) =>
              jsx().jsx("li", {
                children: jsx().jsxs("article", {
                  children: [
                    jsx().jsx("button", { type: "button", onClick: () => presentation.onOpenChat?.(run), children: run.title ?? "Untitled" }),
                    jsx().jsx("p", { children: run.description ?? (run.status === "IN_PROGRESS" ? "Run in progress" : "No update from this run") }),
                    run.unread === true
                      ? jsx().jsx("button", { type: "button", onClick: () => presentation.onMarkRunRead?.(run, true), children: "Mark as read" })
                      : jsx().jsx("button", { type: "button", onClick: () => presentation.onMarkRunRead?.(run, false), children: "Mark as unread" }),
                    run.archived === true || run.status === "ARCHIVED"
                      ? jsx().jsx("button", { type: "button", onClick: () => presentation.onUnarchiveRun?.(run), children: "Unarchive" })
                      : run.status === "IN_PROGRESS" || run.threadId == null
                        ? null
                        : jsx().jsx("button", { type: "button", onClick: () => presentation.onArchiveRun?.(run), children: "Archive" }),
                  ],
                }),
              }, run.id),
            ),
          }),
    ],
  });
}

function LocalDetail({ item, presentation }: { item: AutomationItem; presentation: AutomationsPresentation }): unknown {
  return jsx().jsxs("article", {
    className: "p-6",
    children: [
      jsx().jsx("h2", { children: displayName(item) }),
      jsx().jsx("p", { children: item.prompt }),
      jsx().jsx("p", { children: item.scheduleLabel ?? "Custom schedule" }),
      jsx().jsx(PluginWarning, { item, presentation }),
      jsx().jsxs("div", {
        "aria-label": "Scheduled task actions",
        children: [
          jsx().jsx("button", { type: "button", disabled: item.canManage === false, onClick: () => presentation.onEdit?.(item), children: "Edit" }),
          jsx().jsx("button", { type: "button", disabled: item.status !== "ACTIVE", onClick: () => presentation.onRun?.(item), children: "Run now" }),
          jsx().jsx("button", { type: "button", onClick: () => presentation.onPause?.(item), children: item.status === "PAUSED" ? "Resume" : "Pause" }),
          jsx().jsx("button", { type: "button", onClick: () => presentation.onDelete?.(item), children: "Delete" }),
        ],
      }),
      jsx().jsx(RunHistory, { item, presentation }),
    ],
  });
}

function CloudDetail({ item, presentation }: { item: AutomationItem; presentation: AutomationsPresentation }): unknown {
  if (CloudAutomationDetail == null) return jsx().jsx(LocalDetail, { item, presentation });
  return jsx().jsx(CloudAutomationDetail, {
    automation: item,
    onClose: () => presentation.onSelect?.({ ...item, id: "" }),
    onDelete: () => presentation.onDelete?.(item),
    onEdit: () => presentation.onEdit?.(item),
    onPause: () => presentation.onPause?.(item),
    onRunNow: () => presentation.onRun?.(item),
  });
}

function AutomationEditor({ presentation }: { presentation: AutomationsPresentation }): unknown {
  const selected = normalizedItems(presentation).find((item) => item.id === presentation.selectedAutomationId && (presentation.selectedSource == null || item.source === presentation.selectedSource));
  const initial = presentation.draft ?? {
    id: selected?.id,
    kind: selected?.kind ?? "cron",
    name: selected?.name ?? "",
    prompt: selected?.prompt ?? "",
    scheduleConfig: {},
    source: selected?.source ?? (presentation.canCreateLocal !== false ? "local" : "cloud"),
    status: selected?.status ?? "ACTIVE",
  };
  const draft: AutomationDraft = { ...initial, scheduleConfig: { ...initial.scheduleConfig } };
  return jsx().jsxs("form", {
    className: "flex h-full flex-col gap-4 p-6",
    onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void presentation.onSave?.(draft); },
    children: [
      jsx().jsx("h2", { children: selected == null ? "New scheduled task" : "Edit scheduled task" }),
      jsx().jsx("input", {
        "aria-label": "Task name",
        defaultValue: draft.name,
        onChange: (event: { currentTarget: { value: string } }) => { draft.name = event.currentTarget.value; },
      }),
      jsx().jsx("textarea", {
        "aria-label": "Instructions",
        defaultValue: draft.prompt,
        onChange: (event: { currentTarget: { value: string } }) => { draft.prompt = event.currentTarget.value; },
      }),
      FrequencySection == null
        ? null
        : jsx().jsx(FrequencySection, {
            draft: { frequency: draft.scheduleConfig.mode ?? "daily", time: draft.scheduleConfig.time ?? "09:00", timeZone: draft.scheduleConfig.timeZone ?? "UTC" },
            onChange: (schedule: ScheduleConfig) => { draft.scheduleConfig = { ...draft.scheduleConfig, ...schedule }; },
          }),
      jsx().jsxs("footer", {
        children: [
          jsx().jsx("button", { type: "button", onClick: presentation.onCloseEditor, children: "Cancel" }),
          jsx().jsx("button", { type: "submit", disabled: draft.name.trim().length === 0 || draft.prompt.trim().length === 0, children: "Save" }),
        ],
      }),
    ],
  });
}

function DetailSurface({ items, presentation }: { items: AutomationItem[]; presentation: AutomationsPresentation }): unknown {
  if (presentation.mode === "create" || presentation.mode === "edit") return jsx().jsx(AutomationEditor, { presentation });
  const selected = items.find((item) => item.id === presentation.selectedAutomationId && (presentation.selectedSource == null || item.source === presentation.selectedSource));
  if (selected == null) return jsx().jsx("div", { className: "flex h-full items-center justify-center", children: "Select a scheduled task to view" });
  return selected.source === "cloud"
    ? jsx().jsx(CloudDetail, { item: selected, presentation })
    : jsx().jsx(LocalDetail, { item: selected, presentation });
}

function DeleteDialog({ items, presentation }: { items: AutomationItem[]; presentation: AutomationsPresentation }): unknown {
  if (AutomationDeleteConfirmationDialog == null || presentation.deletePending !== true) return null;
  const selected = items.find((item) => item.id === presentation.selectedAutomationId && (presentation.selectedSource == null || item.source === presentation.selectedSource));
  if (selected == null) return null;
  return jsx().jsx(AutomationDeleteConfirmationDialog, {
    isPending: false,
    name: displayName(selected),
    onCancel: presentation.onCloseEditor ?? (() => undefined),
    onConfirm: () => presentation.onDelete?.(selected),
    open: true,
  });
}

function AutomationsLayoutPage({ presentation: explicit }: PageProps = {}): unknown {
  initializeAutomationsPage();
  const presentation = explicit ?? runtimePresentation(getReactRuntime?.());
  const items = normalizedItems(presentation);
  return jsx().jsxs("main", {
    className: "flex h-full min-h-0 flex-col bg-token-main-surface-primary",
    children: [
      jsx().jsx(PageHeader, { presentation }),
      jsx().jsx(MigrationBanner, { presentation }),
      jsx().jsxs("div", {
        className: "flex min-h-0 flex-1",
        children: [
          jsx().jsx(TaskList, { items, presentation }),
          jsx().jsx("section", { className: "min-w-0 flex-1 overflow-auto", children: jsx().jsx(DetailSurface, { items, presentation }) }),
        ],
      }),
      jsx().jsx(DeleteDialog, { items, presentation }),
    ],
  });
}

initializeAutomationsPage();
export { AutomationsLayoutPage };
