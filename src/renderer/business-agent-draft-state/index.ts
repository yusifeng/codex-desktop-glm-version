// Persistent business-agent interaction drafts. Release chunk: draft-state-b6af9e5f8526.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface DraftContext { businessAgentId: string; gizmoId: string; interactionId: string; businessName?: string; logoUrl?: string; notice?: string; headerColor?: string; conversationStarters?: string[]; disablePrefill?: boolean; showDisclosureModal?: boolean; showConversationStarters: boolean }
interface DraftInput { userId: string; accountId: string; context: DraftContext }
interface StoredDraft extends DraftInput { expiresAt: number }
interface ScopeReader { get(signal: unknown): unknown }
interface Scope extends ScopeReader { set(signal: unknown, value: unknown): void; when(predicate: (reader: ScopeReader) => boolean): Promise<void>; watch(listener: (reader: ScopeReader) => void): () => void }
interface SharedRuntime { g4(): void; vW: string; wL(): void }
interface InitialRuntime {
  Sqt(): void; Sun(): void; U6t: unknown; _un: unknown; cJt(): void; lqt(): void; mun: unknown; rgn(): void; uun(): void; vun: unknown;
  agn(key: string, update: { entries: Record<string, { value: StoredDraft } | null>; maxEntries?: number }): void;
  cqt: { parse(value: unknown): { business_agent_id: string; underlying_gizmo_id: string; interaction_id: string; privacy_policy_url?: string } };
  dun(key: string, fallback: unknown): unknown; ngn(key: string): unknown; sgn(): Promise<void>;
  rJt: { safePost(path: string, options: Record<string, unknown>): Promise<unknown> };
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const storageKey = "chatgpt-business-agent-drafts-v1";
const maximumDrafts = 100;
const draftLifetimeMs = 86_400_000;
let persistedDraftsSignal: unknown;
let initialized = false;

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value != null && !Array.isArray(value); }
function parseDraft(value: unknown): StoredDraft {
  if (!isRecord(value) || !isRecord(value.context)) throw Error("Invalid business-agent draft");
  const context = value.context;
  if ([value.userId, value.accountId, context.businessAgentId, context.gizmoId, context.interactionId].some((item) => typeof item !== "string" || item.length === 0) || typeof value.expiresAt !== "number" || typeof context.showConversationStarters !== "boolean") throw Error("Invalid business-agent draft");
  return value as unknown as StoredDraft;
}
function parseStore(value: unknown): Record<string, StoredDraft> {
  if (!isRecord(value)) throw Error("Invalid business-agent draft store");
  return Object.fromEntries(Object.entries(value).map(([key, draft]) => [key, parseDraft(draft)]));
}
function makeKey(userId: string, accountId: string, interactionId: string): string { return JSON.stringify([userId, accountId, interactionId]); }

function saveDraft(scope: Scope, interactionId: string, draft: DraftInput): boolean {
  initialize();
  try {
    const stored = parseDraft({ ...draft, expiresAt: Date.now() + draftLifetimeMs });
    initial.agn(storageKey, { entries: { [makeKey(draft.userId, draft.accountId, interactionId)]: { value: stored } }, maxEntries: maximumDrafts });
    scope.set(persistedDraftsSignal, initial.ngn(storageKey));
    return true;
  } catch { return false; }
}
function removeDrafts(scope: Scope, interactionId: string): void {
  initialize();
  let drafts: Record<string, StoredDraft>;
  try { drafts = parseStore(initial.ngn(storageKey)); } catch { return; }
  const userId = scope.get(initial._un), accountId = scope.get(initial.U6t), removals: Record<string, null> = {};
  for (const [key, draft] of Object.entries(drafts)) if (draft.userId === userId && draft.accountId === accountId && draft.context.interactionId === interactionId) removals[key] = null;
  if (Object.keys(removals).length > 0) { initial.agn(storageKey, { entries: removals }); scope.set(persistedDraftsSignal, initial.ngn(storageKey)); }
}
async function recoverDraft(scope: Scope, interactionId: string, gizmoId: string): Promise<{ accountId: string; userId: string; status: "ready"; context: DraftContext & { privacyPolicyUrl?: string; animateDisclosure: false } }> {
  initialize();
  await Promise.all([initial.sgn(), scope.when((reader) => (reader.get(initial.vun) as { status?: string } | null)?.status !== "loading")]);
  const access = scope.get(initial.vun), accountId = scope.get(initial.U6t), userId = scope.get(initial._un);
  if (!isRecord(access) || access.status !== "allowed" || access.accountId !== accountId || typeof accountId !== "string" || scope.get(initial.mun) !== accountId || typeof userId !== "string") throw new DOMException("Business Agent account unavailable", "AbortError");
  const draft = parseDraft(parseStore(scope.get(persistedDraftsSignal) ?? initial.ngn(storageKey))[makeKey(userId, accountId, interactionId)]);
  if (draft.context.gizmoId !== gizmoId || draft.expiresAt <= Date.now()) throw new DOMException("Business Agent draft unavailable", "AbortError");
  let identityChanged = false;
  const unwatch = scope.watch((reader) => { identityChanged ||= reader.get(initial._un) !== userId || reader.get(initial.U6t) !== accountId || reader.get(initial.mun) !== accountId; });
  try {
    const response = initial.cqt.parse(await initial.rJt.safePost("/gizmos/business-agents/{business_agent_id}/interactions", { parameters: { path: { business_agent_id: draft.context.businessAgentId } }, additionalHeaders: { "ChatGPT-Account-ID": accountId, [shared.vW]: accountId, "x-openai-business-agent-interaction-id": draft.context.interactionId } }));
    if (identityChanged || response.business_agent_id !== draft.context.businessAgentId || response.underlying_gizmo_id !== gizmoId || response.interaction_id !== draft.context.interactionId) throw new DOMException("Business Agent identity changed", "AbortError");
    return { accountId, userId, status: "ready", context: { ...draft.context, privacyPolicyUrl: response.privacy_policy_url, animateDisclosure: false } };
  } finally { unwatch(); }
}
function initialize(): void {
  if (initialized) return; initialized = true;
  shared.wL(); shared.g4(); initial.Sun(); initial.rgn(); initial.uun(); initial.cJt(); initial.Sqt(); initial.lqt();
  persistedDraftsSignal = initial.dun(storageKey, undefined);
}
export { saveDraft as i, recoverDraft as n, removeDrafts as r, initialize as t };
