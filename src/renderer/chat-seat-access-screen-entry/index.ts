import "@rchunk/app-shared";
import * as conversationScreenChunk from "@rchunk/conversation-screen";

const screenRuntime = conversationScreenChunk as unknown as {
  n(props?: Record<string, unknown>): unknown;
  r(): void;
};
const {
  n: ChatSeatAccessScreen,
  r: initializeConversationScreen,
} = screenRuntime;

initializeConversationScreen();

export { ChatSeatAccessScreen };
