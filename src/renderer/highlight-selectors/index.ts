import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

const { CUt: initializeHighlightLocations, _Ut: conversationHighlightKey } =
  appInitialChunk;

interface ConversationHighlightLocation {
  domain: "conversation";
  turnKey: string;
  unitId: string;
}

interface DiffHighlightLocation {
  domain: "diff";
  path: string;
}

export interface Highlight {
  location:
    ConversationHighlightLocation | DiffHighlightLocation | { domain: string };
  [key: string]: unknown;
}

function selectConversationHighlights(
  highlights: readonly Highlight[],
): Map<string, Highlight[]> {
  const grouped = new Map<string, Highlight[]>();
  for (const highlight of highlights) {
    if (highlight.location.domain !== "conversation") continue;
    const location = highlight.location as ConversationHighlightLocation;
    const key = conversationHighlightKey(location.turnKey, location.unitId);
    const matches = grouped.get(key) ?? [];
    matches.push(highlight);
    grouped.set(key, matches);
  }
  return grouped;
}

function selectDiffHighlights(
  highlights: readonly Highlight[],
): Map<string, Highlight[]> {
  const grouped = new Map<string, Highlight[]>();
  for (const highlight of highlights) {
    if (highlight.location.domain !== "diff") continue;
    const path = (highlight.location as DiffHighlightLocation).path;
    const matches = grouped.get(path) ?? [];
    matches.push(highlight);
    grouped.set(path, matches);
  }
  return grouped;
}

function initializeHighlightSelectors(): void {
  initializeHighlightLocations();
}

export {
  selectDiffHighlights as n,
  initializeHighlightSelectors as r,
  selectConversationHighlights as t,
};
