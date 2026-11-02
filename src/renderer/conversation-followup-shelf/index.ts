import "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as Initial from "@rchunk/app-initial";
import * as Primary from "@rchunk/app-primary";
import * as ScrollController from "@rchunk/thread-scroll-controller-context-value";
import * as NavigationState from "@rchunk/conversation-navigation-state";

interface Suggestion { body: string; icon?: string | null; id: string; source_id?: string | null; tier: "t1" | "t2" | "t3"; title: string }
interface Identity { assistantMessageId: string; conversationId: string }
interface SubmissionOptions {
  chosenSuggestion: { index: number; originating_assistant_message_id: string; source: "conversation_followup_suggestions"; suggestion_id: string; suggestion_source_id?: string | null; suggestion_tier: Suggestion["tier"]; type: "reply" };
  isSubmissionCurrent(): boolean;
  suggestions: string[];
}
interface Props {
  conversationId: string;
  isSubmissionCurrent?(): boolean;
  loading?: boolean;
  onSelect?(index: number, suggestion: Suggestion): void;
  onSubmit?(body: string, options: SubmissionOptions): Promise<boolean>;
  onVisible?(index: number, suggestion: Suggestion): void;
  ready?: boolean;
  suggestions?: Suggestion[];
  visible?: boolean;
}
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
interface ReactRef<Value> { current: Value }
interface ReactRuntime {
  Fragment: unknown;
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useLayoutEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useRef<Value>(value: Value): ReactRef<Value>;
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface ScrollRuntime {
  addScrollListener?(listener: () => void): () => void;
  addUserScrollListener?(listener: (distanceFromBottom: number) => void): () => void;
  getScrollElement?(): HTMLElement | null;
}
interface FollowupPayload { assistant_message_id?: string; conversation_id?: string; suggestions?: unknown[] }
interface ConversationMessage { author?: { role?: string }; metadata?: { conversation_followup_suggestions_eligible?: boolean; is_error?: boolean; is_visually_hidden_from_conversation?: boolean }; status?: string }
interface ConversationMapping { [messageId: string]: { message?: ConversationMessage } }

const shared = Shared as unknown as {
  $3(): { c(size: number): unknown[] }; BX(signal: unknown, ...parameters: unknown[]): unknown; FX(): void; I3(): JsxRuntime; LX(scope: unknown): { queryClient?: unknown }; QI(): void; Yh: unknown; ZI: unknown;
  d$: unknown; e6: ReactRuntime | (() => ReactRuntime); m4(...values: unknown[]): string; o$: { div: unknown; span: unknown };
};
const initial = Initial as unknown as {
  $9t(value: number): unknown; GVt: unknown; J9t?(): void; Pgn?(): void; RVt: unknown; Vzt(): void; XVt: unknown; YVt: unknown; _un: unknown;
  jVt: unknown; mun: unknown; pD: unknown; rJt?: { safePost(path: string, input: Record<string, unknown>): Promise<FollowupPayload> };
  uHt(): void; wVt: unknown; xpn?(scope: unknown, descriptor: unknown, event: Record<string, unknown>): void; xun: unknown; zVt: unknown;
};
const primary = Primary as unknown as { la: unknown; ua(): void };
const scrollChunk = ScrollController as unknown as { n(): void; r(): ScrollRuntime };
const navigation = NavigationState as unknown as { n: unknown; t(): void };

let React: ReactRuntime;
let jsx: JsxRuntime;
const shownIds = new Set<string>();
const interactionDescriptor = { $type: "protobuf_analytics_events.v1.ChatgptConversationFollowupSuggestionInteraction" };

function useSignal(signal: unknown, ...parameters: unknown[]): unknown { return shared.BX(signal, ...parameters); }
function isSuggestion(value: unknown): value is Suggestion {
  if (value == null || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && candidate.id.trim().length > 0 && typeof candidate.title === "string" && candidate.title.trim().length > 0 && typeof candidate.body === "string" && candidate.body.trim().length > 0 && (candidate.tier === "t1" || candidate.tier === "t2" || candidate.tier === "t3");
}
function normalizeSuggestions(values: unknown): Suggestion[] {
  if (!Array.isArray(values)) return [];
  const ids = new Set<string>();
  return values.flatMap(value => isSuggestion(value) && !ids.has(value.id) ? (ids.add(value.id), [value]) : []);
}
function distanceFromBottom(element: HTMLElement): number { return Math.max(0, element.scrollHeight - element.scrollTop - element.clientHeight); }
function hasBlockingOverlay(): boolean { return typeof document !== "undefined" && document.querySelector(":is(:popover-open, dialog[open])") != null; }
function isAtBottom(controller: ScrollRuntime): boolean {
  const element = controller.getScrollElement?.();
  return element != null && element.clientHeight > 0 && (typeof document === "undefined" || document.visibilityState === "visible") && distanceFromBottom(element) <= 2;
}
function logInteraction(identity: Identity, suggestion: Suggestion, index: number, interaction: "clicked" | "shown"): void {
  if (initial.xpn == null) return;
  const scope = shared.LX(shared.ZI);
  initial.xpn(scope, interactionDescriptor, {
    interactionType: interaction === "shown" ? "CHATGPT_CONVERSATION_FOLLOWUP_SUGGESTION_INTERACTION_TYPE_SHOWN" : "CHATGPT_CONVERSATION_FOLLOWUP_SUGGESTION_INTERACTION_TYPE_CLICKED",
    surface: "CHATGPT_CONVERSATION_FOLLOWUP_SUGGESTION_SURFACE_ABOVE_COMPOSER",
    source: "conversation_followup_shelf", presentationMode: "horizontal_carousel",
    conversationId: identity.conversationId, messageId: identity.assistantMessageId,
    position: initial.$9t(index + 1), suggestionId: suggestion.id, suggestionTier: suggestion.tier, suggestionSourceId: suggestion.source_id ?? undefined,
  });
}
async function requestSuggestions(identity: Identity, signal: AbortSignal): Promise<Suggestion[]> {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  signal.addEventListener("abort", forwardAbort, { once: true });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_resolve, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new DOMException("Conversation followups timed out", "TimeoutError")); }, 13_000); });
    const request = initial.rJt?.safePost != null
      ? initial.rJt.safePost("/conversation/{conversation_id}/followup_suggestions", { parameters: { path: { conversation_id: identity.conversationId } }, requestBody: { assistant_message_id: identity.assistantMessageId }, signal: controller.signal })
      : fetch(`/conversation/${encodeURIComponent(identity.conversationId)}/followup_suggestions`, { body: JSON.stringify({ assistant_message_id: identity.assistantMessageId }), headers: { "content-type": "application/json" }, method: "POST", signal: controller.signal }).then(async response => { if (!response.ok) throw new Error(`Request failed (${response.status})`); return response.json() as Promise<FollowupPayload>; });
    const payload = await Promise.race([request, timeoutPromise]);
    signal.throwIfAborted();
    if (payload.conversation_id !== identity.conversationId || payload.assistant_message_id !== identity.assistantMessageId) return [];
    return normalizeSuggestions(payload.suggestions);
  } finally { signal.removeEventListener("abort", forwardAbort); if (timeout != null) clearTimeout(timeout); }
}

function FollowupShelfView({ loading, onSelect, onVisible, suggestions, visible }: { loading: boolean; onSelect(index: number): void; onVisible(index: number): void; suggestions: readonly Suggestion[]; visible: boolean }): unknown {
  const rootRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const root = rootRef.current;
    if (root == null || loading || !visible || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(entries => { for (const entry of entries) { const index = entry.target.getAttribute("data-suggestion-index"); if (entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0 && index != null) onVisible(Number(index)); } }, { root });
    for (const element of root.querySelectorAll("[data-suggestion-index]")) observer.observe(element);
    return () => observer.disconnect();
  }, [loading, onVisible, suggestions, visible]);
  const items: Array<Suggestion | null> = loading ? [null, null, null] : [...suggestions];
  return jsx.jsxs("div", { className: shared.m4("flow-root h-14 min-w-0 pb-4 select-none", !visible && "pointer-events-none"), role: "group", "aria-hidden": !visible, inert: !visible, "aria-label": "Follow-up suggestions", "aria-busy": loading, "data-conversation-followup-shelf": true, children: [
    loading ? jsx.jsx("span", { role: "status", className: "sr-only", children: "Loading suggestions" }) : null,
    jsx.jsx("div", { ref: rootRef, className: "-my-2 hide-scrollbar flex min-w-0 overflow-x-auto py-2", children: jsx.jsx("div", { className: "flex w-max shrink-0 items-center gap-2 px-toolbar md:mx-auto md:px-0", children: items.map((suggestion, index) => suggestion == null ? jsx.jsx("span", { "data-followup-skeleton": true }, index) : jsx.jsx(shared.Yh, { color: "conversationFollowup", size: "conversationFollowup", "data-suggestion-index": index, disabled: !visible, onClick: () => { if (visible) onSelect(index); }, children: suggestion.title }, suggestion.id)) }) }),
  ] });
}

function ConversationFollowupShelf(props: Props): unknown {
  const canonicalConversationId = useSignal(initial.wVt, props.conversationId) as string | null;
  const assistantMessageId = useSignal(initial.jVt, props.conversationId) as string | null;
  const userId = useSignal(initial._un) as string | null;
  const accountId = useSignal(initial.mun) as string | null;
  const featureEnabled = useSignal(initial.xun);
  const runtimeConfig = useSignal(primary.la);
  const conversationStatus = useSignal(initial.YVt, props.conversationId);
  const hiddenConversation = useSignal(initial.XVt, props.conversationId);
  const activeTurn = useSignal(initial.GVt, props.conversationId) as { active?: boolean; retryPending?: boolean } | null;
  const mapping = useSignal(initial.RVt, props.conversationId) as ConversationMapping | null;
  const branchState = useSignal(initial.zVt, props.conversationId) as Record<string, unknown> | null;
  const controller = scrollChunk.r();
  const assistantMessage = assistantMessageId == null ? null : mapping?.[assistantMessageId]?.message;
  const stateGraphAvailable = userId != null || accountId != null || mapping != null;
  const releaseEligible = userId != null && accountId != null && canonicalConversationId != null && assistantMessageId != null && featureEnabled === true && runtimeConfig != null && conversationStatus === "idle" && !hiddenConversation && !activeTurn?.active && !activeTurn?.retryPending && assistantMessage?.author?.role === "assistant" && assistantMessage.status === "finished_successfully" && assistantMessage.metadata?.conversation_followup_suggestions_eligible === true && assistantMessage.metadata.is_visually_hidden_from_conversation !== true && assistantMessage.metadata.is_error !== true && branchState?.[assistantMessageId] == null;
  const identity = releaseEligible ? { conversationId: canonicalConversationId, assistantMessageId } : !stateGraphAvailable && (props.suggestions != null || props.loading != null) && canonicalConversationId != null && assistantMessageId != null ? { conversationId: canonicalConversationId, assistantMessageId } : null;
  const [remoteSuggestions, setRemoteSuggestions] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [userReachedBottom, setUserReachedBottom] = React.useState(false);
  const explicit = props.suggestions != null || props.loading != null;
  const submissionCurrent = props.isSubmissionCurrent?.() ?? true;
  const routeHasMessageTarget = typeof location !== "undefined" && new URLSearchParams(location.search).has("message");
  const eligible = (props.ready ?? true) && submissionCurrent && identity != null && !routeHasMessageTarget;

  React.useLayoutEffect(() => {
    const update = () => { if (isAtBottom(controller) && !hasBlockingOverlay()) setUserReachedBottom(true); };
    update();
    const removeScroll = controller.addScrollListener?.(update) ?? (() => undefined);
    const removeUserScroll = controller.addUserScrollListener?.(distance => { if (distance <= 2) update(); }) ?? (() => undefined);
    if (typeof window !== "undefined") window.addEventListener("resize", update);
    if (typeof document !== "undefined") { document.addEventListener("visibilitychange", update); document.addEventListener("toggle", update, true); }
    return () => { removeScroll(); removeUserScroll(); if (typeof window !== "undefined") window.removeEventListener("resize", update); if (typeof document !== "undefined") { document.removeEventListener("visibilitychange", update); document.removeEventListener("toggle", update, true); } };
  }, [controller]);

  React.useEffect(() => {
    if (explicit || !eligible || identity == null || (!userReachedBottom && controller.getScrollElement != null)) { if (!eligible) setRemoteSuggestions([]); return; }
    const abort = new AbortController();
    setLoading(true);
    void requestSuggestions(identity, abort.signal).then(values => { if (!abort.signal.aborted && (props.isSubmissionCurrent?.() ?? true)) setRemoteSuggestions(values); }).catch(reason => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setRemoteSuggestions([]); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [assistantMessageId, canonicalConversationId, eligible, explicit, userReachedBottom]);

  const suggestions = props.suggestions ?? remoteSuggestions;
  const isLoading = props.loading ?? loading;
  const visible = props.visible ?? (eligible && !submitting && (userReachedBottom || controller.getScrollElement == null));
  if (!isLoading && suggestions.length === 0) return null;
  const select = (index: number) => {
    const suggestion = suggestions[index];
    if (!visible || suggestion == null || submitting || !(props.isSubmissionCurrent?.() ?? true)) return;
    props.onSelect?.(index, suggestion);
    if (props.onSubmit == null || identity == null) return;
    setSubmitting(true);
    void props.onSubmit(suggestion.body, { chosenSuggestion: { type: "reply", source: "conversation_followup_suggestions", index, suggestion_id: suggestion.id, suggestion_tier: suggestion.tier, suggestion_source_id: suggestion.source_id, originating_assistant_message_id: identity.assistantMessageId }, suggestions: suggestions.map(value => value.title), isSubmissionCurrent: props.isSubmissionCurrent ?? (() => true) })
      .then(submitted => { if (submitted) { logInteraction(identity, suggestion, index, "clicked"); setRemoteSuggestions([]); } })
      .finally(() => setSubmitting(false));
  };
  const markVisible = (index: number) => {
    const suggestion = suggestions[index];
    if (!visible || suggestion == null || shownIds.has(suggestion.id) || !(props.isSubmissionCurrent?.() ?? true)) return;
    shownIds.add(suggestion.id); props.onVisible?.(index, suggestion); if (identity != null) logInteraction(identity, suggestion, index, "shown");
  };
  return jsx.jsx(shared.d$, { initial: false, children: jsx.jsx(FollowupShelfView, { loading: isLoading, suggestions, visible, onSelect: select, onVisible: markVisible }) });
}

function initialize(): void {
  void shared.$3(); shared.FX(); shared.QI(); initial.uHt(); initial.Vzt(); primary.ua(); scrollChunk.n(); navigation.t();
  jsx = shared.I3(); React = typeof shared.e6 === "function" && !("useState" in shared.e6) ? shared.e6() : shared.e6 as ReactRuntime;
}
initialize();
export { ConversationFollowupShelf };
