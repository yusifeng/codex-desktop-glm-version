// new-chat-suggestion-source-debug-state —— Ambient suggestions 的持久化覆盖、查询和派生状态。
// 原版：app/webview/assets/new-chat-suggestion-source-debug-state-855bc2eaa826.js。

import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime, QI as initializeScopedSignals, ZI as appScope,
  eZ as createQuerySignal, oZ as createSignalFamily, rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  dun as createPersistedSignal, eun as createAppServerQueryFamily,
  ign as clearPersistedValues, mnt as initializeDesktopBridge,
  ngn as readPersistedValue, nun as initializeAppServerQueries,
  pnt as desktopBridge, rgn as initializePreferenceRuntime,
  uun as initializePreferenceStorage,
} from "@rchunk/app-initial";

export type AmbientSuggestionStatus = "pending" | "accepted" | "dismissed" | string;
export interface AmbientSuggestion { id: string; status: AmbientSuggestionStatus; [key: string]: unknown }
export interface AmbientSuggestionsFile { currentSuggestionIds: string[]; suggestions: AmbientSuggestion[]; [key: string]: unknown }
export interface AmbientSuggestionsResponse { file: AmbientSuggestionsFile; [key: string]: unknown }
export interface AmbientSuggestionScope { domain?: string | null; hostId: string; projectRoot?: string | null }
interface SignalScope {
  set(signal: unknown, update: unknown): void;
  query: { snapshot(signal: unknown, parameter: unknown): { setData(update: (value: AmbientSuggestionsResponse | null | undefined) => AmbientSuggestionsResponse | null | undefined): void } };
}
type SignalReader = (signal: unknown, parameter?: unknown) => any;

const MAX_PENDING_SUGGESTIONS = 3;
const GENERATION_STATUS_POLL_MS = 1_000;
const DEFAULT_STATUS_PREFIX = "ambient-suggestions:default-statuses";
let defaultSuggestionStatusesState: unknown;
let ambientSuggestionsQuery: unknown;
let ambientSuggestionGenerationStatusesQuery: unknown;
let ambientSuggestionsRefreshQuery: unknown;
let selectedAmbientSuggestionDomain: unknown;
let ambientSuggestionDomains: unknown;
let ambientSuggestionsLoaded: unknown;
let pendingAmbientSuggestions: unknown;
let newChatSuggestionSourceDebugOverride: unknown;
let initialized = false;
let overrideInitialized = false;

function projectRootKey(projectRoot?: string | null): string { return projectRoot ?? ""; }
function baseDefaultStatusesKey({ hostId, projectRoot }: AmbientSuggestionScope): string {
  return `${DEFAULT_STATUS_PREFIX}:${hostId}:${projectRootKey(projectRoot)}`;
}
function defaultStatusesKey(scope: AmbientSuggestionScope): string {
  const base = baseDefaultStatusesKey(scope);
  return scope.domain == null ? base : `${base}:${scope.domain}`;
}
function persistedDefaultStatuses(scope: AmbientSuggestionScope): Record<string, AmbientSuggestionStatus> | undefined {
  return readPersistedValue<Record<string, AmbientSuggestionStatus> | undefined>(baseDefaultStatusesKey(scope), undefined);
}
function readDefaultStatuses(get: SignalReader, scope: AmbientSuggestionScope): Record<string, AmbientSuggestionStatus> | undefined {
  const current = get(defaultSuggestionStatusesState)?.[defaultStatusesKey(scope)];
  if (current != null) return current;
  if (scope.domain == null) return persistedDefaultStatuses(scope);
}
function setDefaultSuggestionStatus(scopeApi: SignalScope, scope: AmbientSuggestionScope, suggestionId: string, status: AmbientSuggestionStatus): void {
  const key = defaultStatusesKey(scope);
  scopeApi.set(defaultSuggestionStatusesState, (value: Record<string, Record<string, AmbientSuggestionStatus>> | null | undefined) => {
    const current = value ?? {};
    const statuses = current[key] ?? persistedDefaultStatuses(scope);
    return statuses?.[suggestionId] === status ? current : { ...current, [key]: { ...statuses, [suggestionId]: status } };
  });
}
function clearDefaultSuggestionStatuses(scopeApi: SignalScope): void {
  clearPersistedValues(`${DEFAULT_STATUS_PREFIX}:`);
  scopeApi.set(defaultSuggestionStatusesState, {});
}
function updateCachedSuggestionStatus(scopeApi: SignalScope, params: AmbientSuggestionScope, suggestionId: string, status: AmbientSuggestionStatus): void {
  scopeApi.query.snapshot(ambientSuggestionsQuery, params).setData((response) => response == null ? response : ({
    file: { ...response.file, suggestions: response.file.suggestions.map((suggestion) => suggestion.id === suggestionId ? { ...suggestion, status } : suggestion) },
  }));
}
function listDefaultStatusDomains(statuses: Record<string, AmbientSuggestionStatus> | null | undefined): string[] | null {
  return statuses == null ? null : Object.keys(statuses);
}
function selectPendingCurrentSuggestions(currentIds: readonly string[], suggestions: readonly AmbientSuggestion[]): AmbientSuggestion[] {
  const pending: AmbientSuggestion[] = [];
  for (const id of currentIds) {
    const suggestion = suggestions.find((candidate) => candidate.id === id);
    if (suggestion?.status === "pending") pending.push(suggestion);
    if (pending.length === MAX_PENDING_SUGGESTIONS) break;
  }
  return pending;
}

function initializeNewChatSuggestionSourceDebugState(): void {
  if (initialized) return;
  initializeSignalRuntime(); initializeDesktopBridge(); initializeScopedSignals();
  initializePreferenceRuntime(); initializePreferenceStorage(); initializeAppServerQueries();
  defaultSuggestionStatusesState = createPersistedSignal(DEFAULT_STATUS_PREFIX, {});
  const createServerQuery = createAppServerQueryFamily as unknown as (scope: unknown, name: string, options: (parameter: any) => Record<string, unknown>) => unknown;
  ambientSuggestionsQuery = createServerQuery(appScope, "ambient-suggestions", ({ projectRoot }: AmbientSuggestionScope) => ({ enabled: projectRoot != null }));
  const ambientSuggestionsBridge = desktopBridge.ambientSuggestions as unknown as { getGenerationStatuses?(): Promise<unknown> } | undefined;
  ambientSuggestionGenerationStatusesQuery = createQuerySignal(appScope, () => ({
    enabled: ambientSuggestionsBridge != null,
    queryFn: () => ambientSuggestionsBridge?.getGenerationStatuses?.(),
    queryKey: ["ambient-suggestions-generation-statuses"],
    refetchInterval: GENERATION_STATUS_POLL_MS,
    staleTime: GENERATION_STATUS_POLL_MS,
  }));
  ambientSuggestionsRefreshQuery = createServerQuery(appScope, "ambient-suggestions-refresh", ({ domain, hostId, projectRoot, staleTimeMs, surface }: AmbientSuggestionScope & { staleTimeMs: number; surface: unknown }) => ({
    enabled: projectRoot != null, gcTime: staleTimeMs,
    params: { domain, hostId, projectRoot, surface }, select: () => true, staleTime: staleTimeMs,
  }));
  selectedAmbientSuggestionDomain = createSignalFamily(appScope, () => null);
  ambientSuggestionDomains = createDerivedFamily(appScope, (scope: AmbientSuggestionScope, { get }) => listDefaultStatusDomains(readDefaultStatuses(get, scope)));
  ambientSuggestionsLoaded = createDerivedFamily(appScope, (scope: AmbientSuggestionScope, { get }) => {
    const query = get(ambientSuggestionsQuery as never, scope) as { data?: unknown; isError?: boolean };
    return query.data != null || query.isError === true;
  });
  pendingAmbientSuggestions = createDerivedFamily(appScope, ({ domain, hostId, projectRoot }: AmbientSuggestionScope, { get }) => {
    const file = (get(ambientSuggestionsQuery as never, { domain, hostId, projectRoot }) as { data?: AmbientSuggestionsResponse }).data?.file;
    return selectPendingCurrentSuggestions(file?.currentSuggestionIds ?? [], file?.suggestions ?? []);
  });
  initialized = true;
}

function initializeNewChatSuggestionSourceDebugOverride(): void {
  if (overrideInitialized) return;
  initializePreferenceStorage();
  newChatSuggestionSourceDebugOverride = createPersistedSignal("electron:new-chat-suggestion-source-debug-override", null);
  overrideInitialized = true;
}

export {
  ambientSuggestionsQuery as a, initializeNewChatSuggestionSourceDebugState as c,
  updateCachedSuggestionStatus as d, setDefaultSuggestionStatus as f,
  ambientSuggestionGenerationStatusesQuery as i, ambientSuggestionDomains as l,
  newChatSuggestionSourceDebugOverride as n, ambientSuggestionsLoaded as o,
  pendingAmbientSuggestions as p, selectedAmbientSuggestionDomain as r,
  ambientSuggestionsRefreshQuery as s, initializeNewChatSuggestionSourceDebugOverride as t,
  clearDefaultSuggestionStatuses as u,
};
