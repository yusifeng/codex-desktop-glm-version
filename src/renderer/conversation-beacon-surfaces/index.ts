import "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as Initial from "@rchunk/app-initial";
import * as ShareAction from "@rchunk/share-conversation-action";
import * as Announcement from "@rchunk/announcement-modal-source-bridge";
import * as HomeBeacon from "@rchunk/codex-app-home-beacon-announcement";
import * as TemporaryChat from "@rchunk/chatgpt-temporary-chat-ui";
const shared = Shared as unknown as { $3(): { c(n: number): unknown[] }; FX(): void; I3(): Shared.JsxRuntime; LX(s: unknown): unknown; QI(): void; ZI: unknown; e6(): unknown };
const initial = Initial as unknown as { ANt(): void; aqt(id: string): string; dHt(): void; uHt(): void };
const share = ShareAction as unknown as { o(input: Record<string, unknown>): unknown; s(): void };
const announcement = Announcement as unknown as { n(): void; t: unknown };
const home = HomeBeacon as unknown as { r(): void; t(): void };
const temporary = TemporaryChat as unknown as { i(): void; n: unknown };
let compiler: { c(n: number): unknown[] }, jsx: Shared.JsxRuntime;
function ConversationBeaconSurface(props: Record<string, unknown>): unknown { return jsx.jsx(announcement.t, { source: "conversation", candidate: { id: props.conversationId, status: "eligible", render: () => null } }); }
function ChatGptConversationBeaconSurfaces(props: Record<string, unknown>): unknown {
  compiler.c(22);
  const allowRegeneration = props.allowRegeneration !== false;
  const scope = shared.LX(shared.ZI);
  const regenerate = allowRegeneration ? share.o({ scope, allowedModelSlug: props.regenerationModelSlug ?? null, conversationId: initial.aqt(String(props.conversationId)), isTemporaryChat: props.isTemporaryChat }) : undefined;
  const actionOverrides = { ...(props.actionOverrides as Record<string, unknown> | undefined), regenerate };
  const render = () => jsx.jsx(ConversationBeaconSurface, { ...props, actionOverrides, isCompetingModalOpen: false });
  return jsx.jsx(temporary.n, { isTemporaryChat: props.isTemporaryChat, children: render });
}
function initialize(): void { compiler = shared.$3(); shared.FX(); shared.QI(); temporary.i(); initial.uHt(); initial.ANt(); share.s(); announcement.n(); home.r(); home.t(); initial.dHt(); jsx = shared.I3(); }
initialize();
export { ChatGptConversationBeaconSurfaces };
