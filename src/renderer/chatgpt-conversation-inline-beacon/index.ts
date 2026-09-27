import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/share-conversation-action";
import "@rchunk/pca-connector-eligibility";
import "@rchunk/pca-connector-action";
export interface InlineBeaconAction { id: string; label: string; onAction?(): void }
export interface InlineBeacon { action_items?: readonly InlineBeaconAction[]; beacon_id: string; ui_info?: { design?: "card" | "inline"; primary_info_text?: string | null } }
export interface ChatGptConversationInlineBeaconProps { beacon?: InlineBeacon | null; conversationId: string; messageIds: readonly string[]; sourceMessageId?: string | null }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ChatGptConversationInlineBeacon({ beacon, conversationId, messageIds, sourceMessageId }: ChatGptConversationInlineBeaconProps): unknown { if (beacon == null || sourceMessageId == null || !messageIds.includes(sourceMessageId)) return null; const actions = (beacon.action_items ?? []).slice(0, 3).map(action => jsx().jsx("button", { onClick: action.onAction, type: "button", children: action.label }, action.id)); const content = jsx().jsxs("div", { children: [beacon.ui_info?.primary_info_text ? jsx().jsx("p", { children: beacon.ui_info.primary_info_text }) : null, jsx().jsx("div", { children: actions })] }); return beacon.ui_info?.design === "card" ? jsx().jsx("article", { "data-beacon-id": beacon.beacon_id, "data-conversation-id": conversationId, children: content }) : jsx().jsx("section", { "data-beacon-id": beacon.beacon_id, "data-conversation-id": conversationId, children: content }); }
export { ChatGptConversationInlineBeacon };
