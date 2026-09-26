// new-chat-page-suggestions-eligibility —— 新对话页 suggestions 的来源、就绪与展示资格。
// 原版：app/webview/assets/new-chat-page-suggestions-eligibility-3faf4b7da2a4.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";

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
  hasAccessibleAndEnabledApp?(input: { hostId: string }): Promise<boolean | null | undefined>;
}

function createAmbientSuggestionAppQuery(options: AmbientSuggestionAppQueryOptions) {
  return {
    queryKey: ambientSuggestionAppAccountQueryKey(options.hostId, options.accountId),
    queryFn: async () =>
      (await options.hasAccessibleAndEnabledApp?.({ hostId: options.hostId })) ?? false,
    enabled: options.enabled,
    retry: false as const,
    staleTime: 5 * 60 * 1000,
  };
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

function initializeNewChatPageSuggestionsEligibility(): void {}

export {
  initializeNewChatPageSuggestionsEligibility as a,
  areNewChatSuggestionsReady as i,
  ambientSuggestionAppQueryKey as n,
  createAmbientSuggestionAppQuery as o,
  selectNewChatSuggestionSource as r,
  shouldShowNewChatPageSuggestions as t,
};
