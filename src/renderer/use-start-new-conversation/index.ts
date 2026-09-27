import { FX as initializeSignalRuntime } from "@rchunk/app-shared";
import {
  d2 as initializeStartNewConversation,
  f2 as revealNewChat,
  h2 as useStartNewConversation,
  m2 as startNewConversation,
  p2 as shouldDefaultNewConversationsToWork,
} from "@rchunk/app-initial";

initializeSignalRuntime();
initializeStartNewConversation();

export {
  revealNewChat,
  shouldDefaultNewConversationsToWork,
  startNewConversation,
  useStartNewConversation,
};
