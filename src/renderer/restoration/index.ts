// Restores the durable subagents panel route. Release chunk: restoration-c01e65520ca7.js.
import "@rchunk/rolldown-runtime";
import {
  HZt as initializeSubagentsPanel,
  wQt as hostIdByConversation,
} from "@rchunk/app-initial";

interface RestorationScope {
  value: { routeKind: string; conversationId: string };
  get(signal: typeof hostIdByConversation, conversationId: string): unknown;
}
interface RestorationDescriptor {
  tabId: string;
}
interface RestorationInput {
  revealAndFocus: boolean;
  descriptor: RestorationDescriptor;
  insertPosition?: unknown;
  reason?: string;
  scope: RestorationScope;
}
interface OpenSubagentsOptions {
  revealAndFocus: boolean;
  deferHydrationUntilActivation: boolean;
  hostId: unknown;
  insertPosition?: unknown;
  openOverviewWhenSelectionUnavailable: true;
  parentConversationId: string;
  selectedConversationId: string | null | undefined;
  tabId: string;
}
type OpenSubagentsPanel = (
  scope: RestorationScope,
  options: OpenSubagentsOptions,
) => Promise<unknown> | unknown;

async function restoreSubagentsTabRoute(
  {
    revealAndFocus,
    descriptor,
    insertPosition,
    reason,
    scope,
  }: RestorationInput,
  selectedConversationId: string | null | undefined,
  openSubagentsPanel: OpenSubagentsPanel,
): Promise<boolean> {
  if (scope.value.routeKind !== "local-thread") return false;
  const parentConversationId = scope.value.conversationId;
  return (
    (await openSubagentsPanel(scope, {
      revealAndFocus,
      deferHydrationUntilActivation:
        reason === "persistence" &&
        !revealAndFocus &&
        selectedConversationId != null,
      hostId: scope.get(hostIdByConversation, parentConversationId),
      insertPosition,
      openOverviewWhenSelectionUnavailable: true,
      parentConversationId,
      selectedConversationId,
      tabId: descriptor.tabId,
    })) === descriptor.tabId
  );
}

initializeSubagentsPanel();

export { restoreSubagentsTabRoute };
