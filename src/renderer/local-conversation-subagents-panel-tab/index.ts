import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import { sortByRecency as sortSubagents } from "../app-primary/runtime/sort-by-recency";
import * as localConversationThreadChunk from "@rchunk/local-conversation-thread";
import * as subagentPanelChunk from "@rchunk/subagent-panel";

type SubagentStatus = "done" | "running" | "waiting";
interface ReactRuntime { useState<Value>(initialValue: Value | (() => Value)): [Value, (next: Value | ((previous: Value) => Value)) => void] }
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface IntlShape { formatMessage(message: { defaultMessage: string; id: string }, values?: Record<string, unknown>): string }
interface Subagent {
  canInteract?: boolean;
  conversationId: string;
  displayName: string;
  lastAssistantMessageAtMs?: number | null;
  objective?: string | null;
  recencyAtMs?: number | null;
  startedAtMs?: number | null;
  status: SubagentStatus;
  statusSummary?: string | null;
}
interface ThreadConfiguration { model?: string | null; reasoningEffort?: string | null }
interface PanelItem { avatarSeed: string; id: string; label: string; preview?: unknown; previewLineCount?: 1; trailing?: unknown }
interface PanelSection { className?: string; emptyState?: unknown; id: string; items: PanelItem[]; title: unknown; titleTrailing?: unknown; visibleItemLimit: number }
interface PanelProps { onSelect(id: string): void; sections: PanelSection[] }
interface HeaderProps { backAriaLabel: string; label: string; onBack(): void; seed: string; trailing?: unknown }
interface ThreadProps { canInteract: boolean; conversationId: string; header: unknown; hostId: string; onClose(): void; onOpenBackgroundAgent(agent: { conversationId: string; displayName: string }): void }
interface Props {
  hostId: string;
  isLoading: boolean;
  onSelect(conversationId: string | null, displayName: string | null): void;
  parentConversationId: string;
  requestedConversationId?: string | null;
  requestedDisplayName?: string | null;
}

const sharedRuntime = appSharedChunk as unknown as {
  $3?(): void;
  BX?<Value>(query: unknown, key: unknown): Value;
  FX?(): void;
  I3(): JsxRuntime;
  K2?(): void;
  e6(): ReactRuntime;
  n4?(): IntlShape;
};
const initialRuntime = appInitialChunk as unknown as {
  Dpn?(): void; HZt?(): void; Jit?(): void; M0t?(): void; RS?(): void; Ret?(): void; Vhn?(): void; Zit?(): void; ojt?(): void; sP?(): void;
  IS?: (props: { dateString: string }) => unknown;
  KQt?: unknown;
  Let?: (props: { debugName: string; fillParent: boolean }) => unknown;
  N0t?(value: string | null | undefined): boolean;
  Qmn?(value: string, length: number): string;
  X5?(model: string): string;
  Xit?(durationMs: number): string;
  Yit?(callback: () => void, intervalMs: number | null): void;
  lP?(): Date;
  nN?(): boolean;
  sjt?(objective: string): string;
};
const primaryRuntime = appPrimaryChunk as unknown as { gn?(): void; mn?(): void; pn?: unknown };
const threadRuntime = localConversationThreadChunk as unknown as { s?(): void; t?: (props: ThreadProps) => unknown };
const panelRuntime = subagentPanelChunk as unknown as { n?: (props: PanelProps) => unknown; r?(): void; t?: (props: HeaderProps) => unknown };
const { $3: initializeSharedRuntime, BX: useQueryData, FX: initializeSharedFeatures, I3: getJsxRuntime, K2: initializeSharedUi, e6: getReactRuntime, n4: useIntl } = sharedRuntime;
const { Dpn: initializeConversationState, HZt: initializeRelativeTime, IS: RelativeTime, Jit: initializeThreadQueries, KQt: threadConfigurationQuery, Let: LoadingIndicator, M0t: initializeModels, N0t: isReasoningEffort, Qmn: truncateText, RS: initializeTimers, Ret: initializeThreadState, Vhn: initializeSubagentState, X5: modelDisplayName, Xit: formatDuration, Yit: useInterval, Zit: initializeStatus, lP: useNow, nN: useBackgroundSubagentsEnabled, ojt: initializeConversationQueries, sP: initializeDateTime, sjt: plainObjective } = initialRuntime;
const { gn: initializePrimaryState, mn: initializePrimaryQueries, pn: subagentQuery } = primaryRuntime;
const { s: initializeLocalConversationThread, t: LocalConversationThread } = threadRuntime;
const { n: SubagentPanel, r: initializeSubagentPanel, t: SubagentPanelHeader } = panelRuntime;

initializeSharedRuntime?.();
initializeConversationState?.();
initializeSharedFeatures?.();
initializeModels?.();
initializeSubagentState?.();
initializeSharedUi?.();
initializeRelativeTime?.();
initializeTimers?.();
initializeDateTime?.();
initializeThreadState?.();
initializeStatus?.();
initializeConversationQueries?.();
initializePrimaryState?.();
initializePrimaryQueries?.();
initializeSubagentPanel?.();
initializeThreadQueries?.();
initializeLocalConversationThread?.();

const React = getReactRuntime();
const jsx = getJsxRuntime();

function text(message: string, values?: Record<string, unknown>): string { return useIntl?.().formatMessage({ defaultMessage: message, id: message }, values) ?? message.replace(/\{(\w+)\}/g, (_match, key: string) => String(values?.[key] ?? "")); }
function normalizeObjective(value: string): string { const normalized = plainObjective?.(value) ?? value.trim().replace(/\s+/g, " " ); return truncateText?.(normalized, 60) ?? (normalized.length > 60 ? normalized.slice(0, 57) + "…" : normalized); }
function displayDuration(durationMs: number): string { if (formatDuration != null) return formatDuration(durationMs); const seconds = Math.floor(durationMs / 1000); if (seconds < 60) return seconds + "s"; const minutes = Math.floor(seconds / 60); return minutes < 60 ? minutes + "m" : Math.floor(minutes / 60) + "h"; }
function isDone(subagent: Subagent): boolean { return subagent.status === "done"; }
function isActive(subagent: Subagent): boolean { return subagent.status !== "done"; }
function isWaiting(subagent: Subagent): boolean { return subagent.status === "waiting"; }
function StatusTrailing({ subagent }: { subagent: Subagent }): unknown {
  const nowDate = useNow?.() ?? new Date();
  const [nowMs, setNowMs] = React.useState(nowDate.getTime());
  useInterval?.(() => setNowMs(Date.now()), subagent.status === "done" ? null : 1000);
  if (subagent.status === "waiting") return jsx.jsx("span", { children: "Waiting" });
  if (subagent.status !== "done" && subagent.startedAtMs != null) return jsx.jsx("span", { children: displayDuration(Math.max(nowMs - subagent.startedAtMs, 0)) });
  const completedAt = subagent.lastAssistantMessageAtMs ?? subagent.recencyAtMs ?? null;
  if (completedAt == null) return null;
  const dateString = new Date(completedAt).toISOString();
  return jsx.jsx("time", { dateTime: dateString, children: RelativeTime == null ? text("Completed") : jsx.jsxs("span", { children: [jsx.jsx(RelativeTime, { dateString }, "completed-at"), " ago"] }) });
}
function toPanelItem(subagent: Subagent): PanelItem {
  const preview = subagent.objective == null ? subagent.statusSummary ?? (subagent.status === "done" ? null : "Working") : normalizeObjective(subagent.objective);
  return { avatarSeed: subagent.conversationId, id: subagent.conversationId, label: subagent.displayName, preview, previewLineCount: 1, trailing: jsx.jsx(StatusTrailing, { subagent }) };
}
function SubagentOverview({ onSelect, subagents }: { onSelect(conversationId: string, displayName: string): void; subagents: Subagent[] }): unknown {
  const sorted = sortSubagents(subagents);
  const byId = new Map(sorted.map((subagent) => [subagent.conversationId, subagent]));
  const active = sorted.filter(isActive);
  const done = sorted.filter(isDone);
  const waitingCount = active.filter(isWaiting).length;
  const sections: PanelSection[] = [
    { emptyState: "No active subagents", id: "active", items: active.map(toPanelItem), title: `Active · ${active.length}`, titleTrailing: waitingCount === 0 ? null : `${waitingCount} waiting`, visibleItemLimit: 4 },
    { className: "mt-6", id: "done", items: done.map(toPanelItem), title: `Done · ${done.length}`, visibleItemLimit: 10 },
  ];
  if (SubagentPanel == null) return null;
  return jsx.jsx(SubagentPanel, { sections, onSelect: (id: string) => { const selected = byId.get(id); if (selected != null) onSelect(selected.conversationId, selected.displayName); } });
}
function SelectedSubagentHeader({ conversationId, displayName, hostId, onBack }: { conversationId: string; displayName: string; hostId: string; onBack(): void }): unknown {
  const configuration = useQueryData?.<ThreadConfiguration | null>(threadConfigurationQuery, { hostId, threadId: conversationId }) ?? null;
  let trailing: unknown = null;
  if (configuration?.model) {
    const model = modelDisplayName?.(configuration.model) ?? configuration.model;
    trailing = configuration.reasoningEffort != null && (isReasoningEffort?.(configuration.reasoningEffort) ?? true) ? `${model} · ${configuration.reasoningEffort}` : model;
  }
  if (SubagentPanelHeader == null) return null;
  return jsx.jsx(SubagentPanelHeader, { backAriaLabel: "Back to subagents", label: displayName, seed: conversationId, trailing, onBack });
}
function LocalConversationSubagentsPanelTab(props: Props): unknown {
  const enabled = useBackgroundSubagentsEnabled?.() ?? true;
  const queryKey = enabled ? { conversationId: props.parentConversationId, hostId: props.hostId } : null;
  const subagents = useQueryData?.<Subagent[]>(subagentQuery, queryKey) ?? [];
  if (props.requestedConversationId == null) return jsx.jsx(SubagentOverview, { subagents, onSelect: props.onSelect });

  const selected = subagents.find((subagent) => subagent.conversationId === props.requestedConversationId);
  const displayName = selected?.displayName ?? props.requestedDisplayName ?? "";
  const close = () => props.onSelect(null, null);
  const header = jsx.jsx(SelectedSubagentHeader, { conversationId: props.requestedConversationId, displayName, hostId: props.hostId, onBack: close });
  if (props.isLoading) return jsx.jsxs("div", { className: "flex h-full flex-col", children: [header, jsx.jsx("div", { className: "relative min-h-0 flex-1", children: LoadingIndicator == null ? jsx.jsx("div", { role: "status", children: "Loading subagent transcript…" }) : jsx.jsx(LoadingIndicator, { fillParent: true, debugName: "Subagent transcript" }) })] });
  if (LocalConversationThread == null) return header;
  return jsx.jsx(LocalConversationThread, { canInteract: selected?.canInteract === true, conversationId: props.requestedConversationId, header, hostId: props.hostId, onClose: close, onOpenBackgroundAgent: (agent: { conversationId: string; displayName: string }) => props.onSelect(agent.conversationId, agent.displayName) });
}

export { LocalConversationSubagentsPanelTab };
