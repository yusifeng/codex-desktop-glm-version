import { wL as initializeAppRuntime } from "@rchunk/app-shared";
import {
  r as LocalConversationSideChatTab,
  s as initializeLocalConversationThread,
  t as LocalConversationBackgroundAgentTab,
} from "@rchunk/local-conversation-thread";

initializeAppRuntime();
initializeLocalConversationThread();

export { LocalConversationBackgroundAgentTab, LocalConversationSideChatTab };
