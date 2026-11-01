// new-chat-page-suggestions-eligibility —— 新对话页 suggestions 的来源、就绪与展示资格。
// 原版：app/webview/assets/new-chat-page-suggestions-eligibility-3faf4b7da2a4.js。

import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  $O as timeConstants,
  _L as useQuery,
  ek as initializeQueryRuntime,
  gL as initializeAppServices,
} from "@rchunk/app-shared";
import {
  mnt as initializeAmbientSuggestionsService,
  pnt as appServices,
} from "@rchunk/app-initial";

export type NewChatSuggestionSource = "generated" | "curated";

function ambientSuggestionAppQueryKey(hostId: string): readonly string[] {
  return ["new-chat-suggestion-source", "has-accessible-enabled-ambient-suggestion-app", hostId];
}

function ambientSuggestionAppAccountQueryKey(hostId: string, accountId: string): readonly string[] {
  return [...ambientSuggestionAppQueryKey(hostId), accountId];
}

export interface AmbientSuggestionAppQueryOptions {
  accountId: string;
  enabled: boolean;
  hostId: string;
}

interface CompilerRuntime {
  c(size: number): unknown[];
}

let compilerRuntime: CompilerRuntime;

function createAmbientSuggestionAppQuery({
  accountId,
  enabled,
  hostId,
}: AmbientSuggestionAppQueryOptions): unknown {
  const cache = compilerRuntime.c(9);
  let queryKey: readonly string[];
  if (cache[0] !== accountId || cache[1] !== hostId) {
    queryKey = ambientSuggestionAppAccountQueryKey(hostId, accountId);
    cache[0] = accountId;
    cache[1] = hostId;
    cache[2] = queryKey;
  } else {
    queryKey = cache[2] as readonly string[];
  }

  let queryFn: () => Promise<boolean>;
  if (cache[3] !== hostId) {
    queryFn = async () =>
      (await appServices.ambientSuggestions?.hasAccessibleAndEnabledApp({ hostId })) ?? false;
    cache[3] = hostId;
    cache[4] = queryFn;
  } else {
    queryFn = cache[4] as () => Promise<boolean>;
  }

  let options: Record<string, unknown>;
  if (cache[5] !== enabled || cache[6] !== queryKey || cache[7] !== queryFn) {
    options = {
      queryKey,
      queryFn,
      enabled,
      retry: false,
      staleTime: timeConstants.FIVE_MINUTES,
    };
    cache[5] = enabled;
    cache[6] = queryKey;
    cache[7] = queryFn;
    cache[8] = options;
  } else {
    options = cache[8] as Record<string, unknown>;
  }
  return useQuery(options as never);
}

function selectNewChatSuggestionSource(input: {
  debugOverride?: NewChatSuggestionSource | null;
  experimentEligible: boolean;
  personalized: boolean;
}): NewChatSuggestionSource {
  return input.debugOverride ?? (input.experimentEligible && input.personalized ? "generated" : "curated");
}

function areNewChatSuggestionsReady(input: {
  canUsePersonalizedSuggestions: boolean;
  generatedSuggestionsEnabled: boolean;
  hasGeneratedSuggestionsReadSettled: boolean;
  shouldUseCuratedNewChatPageSuggestions: boolean;
}): boolean {
  return input.shouldUseCuratedNewChatPageSuggestions ||
    !input.generatedSuggestionsEnabled ||
    !input.canUsePersonalizedSuggestions
    ? true
    : input.hasGeneratedSuggestionsReadSettled;
}

function shouldShowNewChatPageSuggestions(input: {
  areNewChatPageSuggestionsLoading: boolean;
  hasProjectRoot: boolean;
  shouldShowHomeSuggestions: boolean;
  shouldUseCuratedNewChatPageSuggestions: boolean;
}): boolean {
  if (input.areNewChatPageSuggestionsLoading) return false;
  if (input.shouldUseCuratedNewChatPageSuggestions) return true;
  return input.hasProjectRoot && input.shouldShowHomeSuggestions;
}

function initializeNewChatPageSuggestionsEligibility(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeAppServices();
  initializeAmbientSuggestionsService();
  initializeQueryRuntime();
}

export {
  initializeNewChatPageSuggestionsEligibility as a,
  areNewChatSuggestionsReady as i,
  ambientSuggestionAppQueryKey as n,
  createAmbientSuggestionAppQuery as o,
  selectNewChatSuggestionSource as r,
  shouldShowNewChatPageSuggestions as t,
};
