import {
  FX as initializeSignalRuntime,
  oZ as createScopedState,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  itn as initializeConversationScope,
} from "@rchunk/app-initial";

let conversationNavigationPending: unknown;

function initializeConversationNavigationState(): void {
  initializeSignalRuntime();
  initializeConversationScope();
  conversationNavigationPending = createScopedState(
    conversationScope,
    () => false,
    undefined,
    { autoDispose: 60_000 },
  );
}

export {
  conversationNavigationPending as n,
  initializeConversationNavigationState as t,
};
