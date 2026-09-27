import { wL as initializeAppRuntime } from "@rchunk/app-shared";
import {
  n as initializeChatGptConversationTranscript,
  t as ChatGptConversationTranscript,
} from "@rchunk/chatgpt-conversation-transcript";

initializeAppRuntime();
initializeChatGptConversationTranscript();

export { ChatGptConversationTranscript };
