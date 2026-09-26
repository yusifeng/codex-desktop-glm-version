// new-chat-suggestion-source-debug-state —— Ambient suggestions 的调试覆盖与查询状态描述。
// 原版：app/webview/assets/new-chat-suggestion-source-debug-state-855bc2eaa826.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";

export type AmbientSuggestionStatus = "pending" | "accepted" | "dismissed" | string;

export interface AmbientSuggestion {
  id: string;
  status: AmbientSuggestionStatus;
  [key: string]: unknown;
}

export interface AmbientSuggestionsFile {
  currentSuggestionIds: string[];
  suggestions: AmbientSuggestion[];
  [key: string]: unknown;
}

export interface AmbientSuggestionsResponse {
  file: AmbientSuggestionsFile;
  [key: string]: unknown;
}

export interface AmbientSuggestionScope {
  domain?: string | null;
  hostId: string;
  projectRoot?: string | null;
}

const DEFAULT_STATUS_PREFIX = "ambient-suggestions:default-statuses";

function scopeProjectRoot(projectRoot?: string | null): string {
  return projectRoot ?? "";
}

function defaultStatusesKey(scope: AmbientSuggestionScope): string {
  const base = `${DEFAULT_STATUS_PREFIX}:${scope.hostId}:${scopeProjectRoot(scope.projectRoot)}`;
  return scope.domain == null ? base : `${base}:${scope.domain}`;
}

function baseDefaultStatusesKey(scope: AmbientSuggestionScope): string {
  return `${DEFAULT_STATUS_PREFIX}:${scope.hostId}:${scopeProjectRoot(scope.projectRoot)}`;
}

function readDefaultStatuses(
  values: Record<string, Record<string, AmbientSuggestionStatus>> | null | undefined,
  scope: AmbientSuggestionScope,
): Record<string, AmbientSuggestionStatus> | undefined {
  return values?.[defaultStatusesKey(scope)] ??
    (scope.domain == null ? parsePersistedDefaultStatuses(baseDefaultStatusesKey(scope)) : undefined);
}

function parsePersistedDefaultStatuses(_key: string): Record<string, AmbientSuggestionStatus> | undefined {
  return undefined;
}

function mergeDefaultSuggestionStatus(
  values: Record<string, Record<string, AmbientSuggestionStatus>> | null | undefined,
  scope: AmbientSuggestionScope,
  suggestionId: string,
  status: AmbientSuggestionStatus,
): Record<string, Record<string, AmbientSuggestionStatus>> {
  const key = defaultStatusesKey(scope);
  const current = values ?? {};
  const defaults = current[key] ?? parsePersistedDefaultStatuses(baseDefaultStatusesKey(scope)) ?? {};
  if (defaults[suggestionId] === status) return current;
  return { ...current, [key]: { ...defaults, [suggestionId]: status } };
}

const defaultSuggestionStatusesState = Symbol(DEFAULT_STATUS_PREFIX);

function setDefaultSuggestionStatus(
  storeOrValues: any,
  scope: AmbientSuggestionScope,
  suggestionId: string,
  status: AmbientSuggestionStatus,
): any {
  if (typeof storeOrValues?.set === "function") {
    storeOrValues.set(defaultSuggestionStatusesState, (values: any) =>
      mergeDefaultSuggestionStatus(values, scope, suggestionId, status));
    return;
  }
  return mergeDefaultSuggestionStatus(storeOrValues, scope, suggestionId, status);
}

function clearDefaultSuggestionStatuses(store?: any): Record<string, never> | void {
  if (typeof store?.set === "function") {
    store.set(defaultSuggestionStatusesState, {});
    return;
  }
  return {};
}

function updateResponseStatus(response: AmbientSuggestionsResponse | null | undefined, suggestionId: string, status: AmbientSuggestionStatus) {
  if (response == null) return response;
  return {
    ...response,
    file: {
      ...response.file,
      suggestions: response.file.suggestions.map((suggestion) =>
        suggestion.id === suggestionId ? { ...suggestion, status } : suggestion,
      ),
    },
  };
}

function updateCachedSuggestionStatus(
  queryClientOrResponse: any,
  paramsOrSuggestionId: any,
  suggestionIdOrStatus: any,
  maybeStatus?: AmbientSuggestionStatus,
): AmbientSuggestionsResponse | null | undefined | void {
  if (queryClientOrResponse?.query?.snapshot != null) {
    queryClientOrResponse.query
      .snapshot(ambientSuggestionsQuery, paramsOrSuggestionId)
      .setData((response: AmbientSuggestionsResponse | null | undefined) =>
        updateResponseStatus(response, suggestionIdOrStatus, maybeStatus!),
      );
    return;
  }
  return updateResponseStatus(queryClientOrResponse, paramsOrSuggestionId, suggestionIdOrStatus);
}

function listDefaultStatusDomains(
  statuses: Record<string, AmbientSuggestionStatus> | null | undefined,
): string[] | null {
  return statuses == null ? null : Object.keys(statuses);
}

function selectPendingCurrentSuggestions(
  currentSuggestionIds: readonly string[],
  suggestions: readonly AmbientSuggestion[],
): AmbientSuggestion[] {
  const pending: AmbientSuggestion[] = [];
  for (const id of currentSuggestionIds) {
    const suggestion = suggestions.find((candidate) => candidate.id === id);
    if (suggestion?.status === "pending") pending.push(suggestion);
    if (pending.length === 3) break;
  }
  return pending;
}

const ambientSuggestionsQuery = {
  name: "ambient-suggestions",
  enabled: (input: { projectRoot?: string | null }) => input.projectRoot != null,
};
const ambientSuggestionGenerationStatusesQuery = {
  queryKey: ["ambient-suggestions-generation-statuses"],
  refetchInterval: 1000,
  staleTime: 1000,
};
const ambientSuggestionsRefreshQuery = {
  name: "ambient-suggestions-refresh",
  enabled: (input: { projectRoot?: string | null }) => input.projectRoot != null,
};
const selectedAmbientSuggestionDomain = { initial: null as string | null };
const ambientSuggestionDomains = { select: listDefaultStatusDomains };
const ambientSuggestionsLoaded = {
  select: (query: { data?: unknown; isError?: boolean }) => query.data != null || query.isError === true,
};
const pendingAmbientSuggestions = { select: selectPendingCurrentSuggestions };
const newChatSuggestionSourceDebugOverride = { storageKey: "electron:new-chat-suggestion-source-debug-override", initial: null };

function initializeNewChatSuggestionSourceDebugState(): void {}
function initializeNewChatSuggestionSourceDebugOverride(): void {}

export {
  ambientSuggestionsQuery as a,
  initializeNewChatSuggestionSourceDebugState as c,
  updateCachedSuggestionStatus as d,
  setDefaultSuggestionStatus as f,
  ambientSuggestionGenerationStatusesQuery as i,
  ambientSuggestionDomains as l,
  newChatSuggestionSourceDebugOverride as n,
  ambientSuggestionsLoaded as o,
  pendingAmbientSuggestions as p,
  selectedAmbientSuggestionDomain as r,
  ambientSuggestionsRefreshQuery as s,
  initializeNewChatSuggestionSourceDebugOverride as t,
  clearDefaultSuggestionStatuses as u,
};
