import { wL as initializeAppRuntime } from "@rchunk/app-shared";
import {
  i as initializeConversationUi,
  n as BusinessAgentConversationHeader,
  r as BusinessAgentHomeHero,
} from "@rchunk/conversation-ui";

initializeAppRuntime();
initializeConversationUi();

export { BusinessAgentConversationHeader, BusinessAgentHomeHero };
