import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/loading-page";
import "@rchunk/registered-conversation-thumbnail";

export interface SideChatTarget { panelId: string; [key: string]: unknown }
export interface OpenSideChatInput { conversationId: string; hostId: string; target: SideChatTarget; title?: string }
const sideChatContext = { displayName: "LocalConversationSideChatContext", defaultValue: null as OpenSideChatInput | null };
const sideChatSurface = { id: "local-conversation-side-chat", isAvailable: (routeKind: string) => routeKind === "local-thread" };
async function openSideChat(input: OpenSideChatInput, open?: (input: OpenSideChatInput) => Promise<unknown> | unknown): Promise<OpenSideChatInput> { await open?.(input); return input; }
const initialize = (): void => {};
export { sideChatSurface as i, initialize as n, openSideChat as r, sideChatContext as t };
