import { FX as initializeSignalRuntime } from "@rchunk/app-shared";
import {
  gAt as refetchChatGptConversation,
  mAt as initializeChatGptConversationUpdates,
} from "@rchunk/app-initial";

initializeSignalRuntime();
initializeChatGptConversationUpdates();

export { refetchChatGptConversation };
