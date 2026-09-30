import * as Rolldown from "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as Initial from "@rchunk/app-initial";
import * as SubagentRow from "@rchunk/subagent-row";
import * as RegisteredConversation from "@rchunk/registered";
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown }
const shared = Shared as unknown as { $3(): { c(n: number): unknown[] }; BX(f: unknown, p: unknown): unknown; FX(): void; I3(): JsxRuntime; K2(): void; LS: unknown; Qh: unknown; Vx: unknown; Y2: unknown; lw(): void; oZ(s: unknown, f: unknown): unknown; sw: unknown; $h(): void; BO(): unknown };
const initial = Initial as unknown as { HZt(): void; Xd: unknown; Zd(): void; cet: unknown; let(): void; vZt: unknown };
const row = SubagentRow as unknown as { n(): void; t: unknown };
const registered = RegisteredConversation as unknown as { n(): void; t: unknown };
let compiler: { c(n: number): unknown[] }, jsx: JsxRuntime, descendants: unknown;
function RegisteredSubagentsThumbnail({ parentConversationId, hostId, requestedConversationId, requestedDisplayName, title }: Record<string, string | null | undefined>): unknown {
  compiler.c(10);
  if (requestedConversationId != null) return jsx.jsx(registered.t, { conversationId: requestedConversationId, hostId, title: requestedDisplayName ?? title });
  const agents = shared.BX(descendants, { parentConversationId, hostId }) as Array<Record<string, unknown>> | null;
  if (!agents?.length) return null;
  const ordered = [...agents].sort((a, b) => Number((a.status as { type: string }).type !== "active") - Number((b.status as { type: string }).type !== "active")).slice(0, 4);
  return jsx.jsx(initial.Xd, { icon: jsx.jsx(shared.LS, {}), title, subtitle: jsx.jsx(shared.Y2, { id: "tabThumbnail.subagents.loadedCount", defaultMessage: "{count, plural, one {# loaded agent} other {# loaded agents}}", values: { count: agents.length } }), sections: ordered.map((agent) => ({ kind: "block", content: jsx.jsx(row.t, { avatarSeed: agent.id, name: agent.name ?? agent.agentNickname ?? agent.preview, status: (agent.status as { type: string }).type }) })) });
}
function initialize(): void { compiler = shared.$3(); void Rolldown.o; shared.FX(); shared.K2(); initial.HZt(); initial.Zd(); initial.let(); shared.lw(); shared.$h(); row.n(); registered.n(); jsx = shared.I3(); descendants = shared.oZ(initial.cet, ({ parentConversationId, hostId }: { parentConversationId: string | null; hostId?: string }, { scope }: { scope: { get(k: unknown, p: unknown): { getSubagentDescendantSnapshot(id: string): { descendantThreads: unknown } } } }) => parentConversationId == null ? null : scope.get(initial.vZt, hostId).getSubagentDescendantSnapshot(parentConversationId).descendantThreads); }
initialize();
export { RegisteredSubagentsThumbnail };
