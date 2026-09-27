import { FX as initializeSignalRuntime } from "@rchunk/app-shared";
import {
  i as sourceLinksByThread,
  n as priorConversationTurns,
  r as conversationTurnsForSources,
  t as initializeLocalConversationSourcesSignals,
} from "@rchunk/local-conversation-sources-signals";

initializeSignalRuntime();
initializeLocalConversationSourcesSignals();

export {
  conversationTurnsForSources as conversationTurnsForSources$,
  priorConversationTurns as priorConversationTurns$,
  sourceLinksByThread,
};
