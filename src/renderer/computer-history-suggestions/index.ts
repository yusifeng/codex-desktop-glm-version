// computer-history-suggestions —— Computer History suggestion 资格、状态合并与未读 skill 跟踪。
// 原版：app/webview/assets/computer-history-suggestions-55e8abf166e7.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/computer-history-query";

export interface ComputerHistorySuggestion {
  type: "skill" | "automation" | string;
  name: string;
  interval: { startMs: number; endMs: number };
  [key: string]: unknown;
}

export interface ComputerHistorySuggestionState {
  knownSuggestions: ComputerHistorySuggestion[] | null;
  unreadSkillsSuggestions: ComputerHistorySuggestion[];
}

function sameSuggestionWindow(
  left: ComputerHistorySuggestion,
  right: ComputerHistorySuggestion,
): boolean {
  return left.type === right.type &&
    left.name.trim().toLowerCase() === right.name.trim().toLowerCase() &&
    left.interval.startMs < right.interval.endMs &&
    right.interval.startMs < left.interval.endMs;
}

function retainUpdatedUnreadSuggestions(
  unread: ComputerHistorySuggestion[],
  incoming: ComputerHistorySuggestion[],
): ComputerHistorySuggestion[] {
  return unread.flatMap((suggestion) => {
    const updated = incoming.find((candidate) => sameSuggestionWindow(suggestion, candidate));
    return updated == null ? [] : [updated];
  });
}

function mergeComputerHistorySuggestions(
  state: ComputerHistorySuggestionState,
  incoming: ComputerHistorySuggestion[] | null | undefined,
): ComputerHistorySuggestionState {
  if (incoming == null) return state;
  if (state.knownSuggestions == null) {
    return { knownSuggestions: incoming, unreadSkillsSuggestions: [] };
  }
  const knownSuggestions = [...state.knownSuggestions];
  const newlyUnread: ComputerHistorySuggestion[] = [];
  for (const suggestion of incoming) {
    const index = knownSuggestions.findIndex((known) => sameSuggestionWindow(known, suggestion));
    if (index === -1) {
      knownSuggestions.push(suggestion);
      if (suggestion.type === "skill") newlyUnread.push(suggestion);
    } else {
      knownSuggestions[index] = suggestion;
    }
  }
  return {
    knownSuggestions,
    unreadSkillsSuggestions: [
      ...retainUpdatedUnreadSuggestions(state.unreadSkillsSuggestions, incoming),
      ...newlyUnread,
    ],
  };
}

const computerHistorySuggestionsEligibility = {
  evaluate(input: {
    chronicleServiceAvailable: boolean;
    platform: string;
    featureFlagEnabled: boolean;
    configQuerySuccess: boolean;
    chronicleEnabled?: boolean;
    requirementsPending: boolean;
    chronicleRequirement?: boolean;
  }): boolean {
    return input.chronicleServiceAvailable &&
      input.platform === "macOS" &&
      input.featureFlagEnabled &&
      input.configQuerySuccess &&
      input.chronicleEnabled === true &&
      !input.requirementsPending &&
      input.chronicleRequirement !== false;
  },
};

const currentComputerHistorySuggestions = {
  select(input: {
    eligible: boolean;
    query: { isSuccess: boolean; data?: ComputerHistorySuggestion[] | null };
  }): ComputerHistorySuggestion[] | null {
    if (!input.eligible || !input.query.isSuccess || input.query.data == null) return null;
    return input.query.data;
  },
};

const computerHistorySuggestionState = {
  initial: { knownSuggestions: null, unreadSkillsSuggestions: [] } as ComputerHistorySuggestionState,
  merge: mergeComputerHistorySuggestions,
};

const markComputerHistorySkillSuggestionsRead = {
  apply(state: ComputerHistorySuggestionState): ComputerHistorySuggestionState {
    return state.unreadSkillsSuggestions.length === 0
      ? state
      : { ...state, unreadSkillsSuggestions: [] };
  },
};

function initializeComputerHistorySuggestions(): void {}

export {
  initializeComputerHistorySuggestions as a,
  computerHistorySuggestionsEligibility as i,
  computerHistorySuggestionState as n,
  currentComputerHistorySuggestions as r,
  markComputerHistorySkillSuggestionsRead as t,
};
