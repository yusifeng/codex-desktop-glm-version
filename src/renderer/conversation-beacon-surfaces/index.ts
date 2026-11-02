import "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as Initial from "@rchunk/app-initial";
import * as ShareAction from "@rchunk/share-conversation-action";
import * as Announcement from "@rchunk/announcement-modal-source-bridge";
import * as HomeBeacon from "@rchunk/codex-app-home-beacon-announcement";
import * as TemporaryChat from "@rchunk/chatgpt-temporary-chat-ui";

interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown }
interface ReactRef<Value> { current: Value }
interface ReactRuntime {
  Fragment: unknown;
  useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  useRef<Value>(value: Value): ReactRef<Value>;
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface Beacon { action_items?: unknown; beacon_id?: string }
interface BeaconEventMetadata { conversationId?: string; messageId?: string; suppressLifecycle?: boolean }
interface BeaconState {
  beacon?: Beacon | null;
  eventMetadata: BeaconEventMetadata;
  productExperience?: unknown;
}
interface AnalyticsContext { placement: "in_conversation"; productExperience?: unknown; suppressLifecycle?: boolean; treatment: "modal" }
interface OpenPresentation { analyticsContext: AnalyticsContext; beacon: Beacon; conversationId: string; presentationKey: string; state: BeaconState }
interface BeaconPresentationProps {
  children?: unknown;
  closeWithoutDismiss(presentation: OpenPresentation): void;
  openPresentation: OpenPresentation;
  openPresentationRef: ReactRef<OpenPresentation | null>;
  supportStatus: "supported" | "unsupported" | string;
  terminalPresentationStatesRef: ReactRef<WeakSet<BeaconState>>;
}
interface ConversationBeaconProps {
  actionOverrides?: Record<string, unknown>;
  allowConversationSharing?: boolean;
  allowExternalActions?: boolean;
  allowRemoteImages?: boolean;
  conversationId: string;
  getActionOverride?: (action: unknown) => unknown;
  isCompetingModalOpen: boolean;
  isTemporaryChat?: boolean;
  onComposerText?: (text: string) => void;
  onStartVoice?: () => void;
}
interface ChatGptConversationBeaconSurfacesProps extends Omit<ConversationBeaconProps, "isCompetingModalOpen"> {
  allowRegeneration?: boolean;
  regenerationModelSlug?: string | null;
}

const shared = Shared as unknown as {
  $3(): { c(size: number): unknown[] };
  BX(signal: unknown, ...parameters: unknown[]): unknown;
  FX(): void;
  HX(signal: unknown): unknown;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  QI(): void;
  ZI: unknown;
  e6: ReactRuntime | (() => ReactRuntime);
};
const initial = Initial as unknown as {
  ANt(): void; Gzt(): boolean; JNt(): void;
  QNt(input: { activeClaims: unknown; isPageContextUpsellSuppressionEnabled: unknown; responseLeafId?: string }): boolean;
  TNt(beacon?: Beacon | null): boolean; UNt: new (scope: unknown) => { shouldSuppressBeaconUI(input: { responseLeafId?: string }): boolean };
  Vzt(): void; YNt: unknown; YVt: unknown; ZNt: unknown;
  _Nt(scope: unknown, conversationId: string, state: BeaconState): void;
  aqt(id: string): string; dHt(value: unknown): unknown;
  fNt: unknown;
  gNt(scope: unknown, conversationId: string, state: BeaconState): void;
  hNt(): void;
  jNt(scope: unknown, input: Record<string, unknown>): void;
  jVt: unknown;
  mNt(scope: unknown, conversationId: string, state: BeaconState): boolean;
  oqt(): void; uHt(): void;
  wNt(beacon?: Beacon | null): boolean;
  wVt: unknown;
};
const share = ShareAction as unknown as {
  a(): void;
  i(actions: unknown): boolean;
  n(input: { canShare: boolean; conversationId: unknown; scope: unknown }): unknown;
  o(input: Record<string, unknown>): unknown;
  r(input: { action: unknown; getActionOverride?: (action: unknown) => unknown; shareConversationEligible: unknown; shareConversationOverride: unknown }): unknown;
  s(): void;
  t: unknown;
};
const announcement = Announcement as unknown as { n(): void; t: unknown };
const home = HomeBeacon as unknown as { r(): void; t: unknown };
const temporary = TemporaryChat as unknown as { i(): void; n: unknown };

let React: ReactRuntime;
let jsx: JsxRuntime;

function useSignal(signal: unknown, ...parameters: unknown[]): unknown { return shared.BX(signal, ...parameters); }
function useValue(signal: unknown): unknown { return shared.HX(signal); }
function resolvePresentationKey(beacon: Beacon, metadata: BeaconEventMetadata): string { return JSON.stringify([beacon.beacon_id, metadata.conversationId, metadata.messageId]); }
function sameLifecycleToken(reference: ReactRef<number>, token: number): boolean { return reference.current === token; }

function BeaconPresentationLifecycle({ children, closeWithoutDismiss, openPresentation, openPresentationRef, supportStatus, terminalPresentationStatesRef }: BeaconPresentationProps): unknown {
  const generation = React.useRef(0);
  React.useEffect(() => {
    const token = ++generation.current;
    if (supportStatus === "unsupported") {
      terminalPresentationStatesRef.current.add(openPresentation.state);
      if (openPresentationRef.current?.state === openPresentation.state) openPresentationRef.current = null;
      return;
    }
    if (supportStatus !== "supported" || terminalPresentationStatesRef.current.has(openPresentation.state) || openPresentationRef.current?.state === openPresentation.state) return;
    const previous = openPresentationRef.current;
    if (previous != null) closeWithoutDismiss(previous);
    openPresentationRef.current = openPresentation;
    return () => { queueMicrotask(() => { if (sameLifecycleToken(generation, token)) closeWithoutDismiss(openPresentation); }); };
  }, [closeWithoutDismiss, openPresentation, openPresentationRef, supportStatus, terminalPresentationStatesRef]);
  return children == null ? null : jsx.jsx(jsx.Fragment, { children });
}

function ConversationBeaconSurface({ actionOverrides, allowConversationSharing = false, allowExternalActions = false, allowRemoteImages = false, conversationId, getActionOverride, isCompetingModalOpen, isTemporaryChat, onComposerText, onStartVoice }: ConversationBeaconProps): unknown {
  const scope = shared.LX(shared.ZI);
  const openPresentationRef = React.useRef<OpenPresentation | null>(null);
  const terminalStatesRef = React.useRef(new WeakSet<BeaconState>());
  const [preservedState, setPreservedState] = React.useState<BeaconState | null>(null);
  const activeClaims = useValue(initial.YNt);
  const pageContextSuppression = useValue(initial.ZNt);
  const primaryConversationId = useSignal(initial.wVt, conversationId) as string | null;
  const currentState = useSignal(initial.fNt, primaryConversationId ?? conversationId) as BeaconState | null;
  const currentMessageId = useSignal(initial.jVt, conversationId) as string | null;
  const workContext = useSignal(initial.YVt, conversationId);
  const isWorkConversation = Boolean(initial.dHt(workContext));
  const normalizedState = currentState == null ? null : currentState;
  const competingModal = isCompetingModalOpen || initial.Gzt();
  const candidateBeacon = normalizedState?.beacon;
  const supportedBeacon = candidateBeacon != null && (initial.wNt(candidateBeacon) || initial.TNt(candidateBeacon)) ? candidateBeacon : null;
  const metadataMatches = normalizedState?.eventMetadata.messageId == null
    ? primaryConversationId != null && normalizedState?.eventMetadata.conversationId === primaryConversationId
    : normalizedState.eventMetadata.messageId === currentMessageId;
  const metadata = metadataMatches && normalizedState != null ? normalizedState.eventMetadata : null;
  const responseLeafId = metadata?.messageId ?? metadata?.conversationId;
  const lifecycleAllowed = metadata?.suppressLifecycle === true || !initial.QNt({ activeClaims, isPageContextUpsellSuppressionEnabled: pageContextSuppression, responseLeafId });
  const matchedBeacon = metadataMatches ? supportedBeacon : null;
  const preserveOpenPresentation = normalizedState != null && preservedState === normalizedState;
  const beacon = matchedBeacon != null && (lifecycleAllowed || preserveOpenPresentation) ? matchedBeacon : null;
  const hasActionItems = beacon != null && share.i(beacon.action_items);
  const shareEligible = useSignal(share.t, hasActionItems ? conversationId : null);
  const presentationKey = beacon == null || metadata == null ? null : resolvePresentationKey(beacon, metadata);
  const canShare = allowConversationSharing && allowExternalActions && !isTemporaryChat && !isWorkConversation;
  const shareConversation = share.n({ scope, canShare, conversationId: primaryConversationId });
  const resolvedOverrides = { ...actionOverrides, share_conversation: shareConversation };
  const resolveAction = (action: unknown) => share.r({ action, getActionOverride, shareConversationEligible: shareEligible, shareConversationOverride: resolvedOverrides.share_conversation });

  const closeWithoutDismiss = (presentation: OpenPresentation) => {
    if (terminalStatesRef.current.has(presentation.state)) return;
    terminalStatesRef.current.add(presentation.state);
    if (openPresentationRef.current?.state === presentation.state) openPresentationRef.current = null;
    setPreservedState(current => current === presentation.state ? null : current);
    initial.jNt(scope, { action: "closed_without_dismiss", beacon: presentation.beacon, ...presentation.analyticsContext });
    initial.gNt(scope, presentation.conversationId, presentation.state);
  };
  const lifecycleGeneration = React.useRef(0);
  const latestClose = React.useRef(closeWithoutDismiss);
  latestClose.current = closeWithoutDismiss;
  React.useEffect(() => {
    const token = ++lifecycleGeneration.current;
    return () => { queueMicrotask(() => { if (sameLifecycleToken(lifecycleGeneration, token) && openPresentationRef.current != null) latestClose.current(openPresentationRef.current); }); };
  }, []);
  React.useEffect(() => {
    const opened = openPresentationRef.current;
    if (opened != null && (competingModal || opened.state !== normalizedState || presentationKey == null || opened.presentationKey !== presentationKey)) latestClose.current(opened);
  }, [competingModal, normalizedState, presentationKey]);

  if (beacon == null || metadata == null || presentationKey == null || normalizedState == null || competingModal) return null;
  const analyticsContext: AnalyticsContext = { placement: "in_conversation", productExperience: normalizedState.productExperience, suppressLifecycle: normalizedState.eventMetadata.suppressLifecycle, treatment: "modal" };
  const openPresentation: OpenPresentation = { analyticsContext, beacon, conversationId, presentationKey, state: normalizedState };
  const onDismiss = () => {
    if (!terminalStatesRef.current.has(normalizedState) && initial.mNt(scope, conversationId, normalizedState)) {
      terminalStatesRef.current.add(normalizedState);
      if (openPresentationRef.current?.state === normalizedState) openPresentationRef.current = null;
      setPreservedState(current => current === normalizedState ? null : current);
    }
  };
  const onActionComplete = () => {
    if (!terminalStatesRef.current.has(normalizedState)) {
      initial.gNt(scope, conversationId, normalizedState);
      terminalStatesRef.current.add(normalizedState);
      if (openPresentationRef.current?.state === normalizedState) openPresentationRef.current = null;
      setPreservedState(current => current === normalizedState ? null : current);
    }
  };
  const onUnsupported = () => {
    terminalStatesRef.current.add(normalizedState);
    if (openPresentationRef.current?.state === normalizedState) openPresentationRef.current = null;
    setPreservedState(current => current === normalizedState ? null : current);
    initial._Nt(scope, conversationId, normalizedState);
  };
  const onModalOpen = () => {
    if (metadata.suppressLifecycle !== true && new initial.UNt(scope).shouldSuppressBeaconUI({ responseLeafId })) return;
    openPresentationRef.current = openPresentation;
    setPreservedState(normalizedState);
  };
  const render = () => jsx.jsx(home.t, {
    accountId: primaryConversationId ?? conversationId,
    actionOverrides: resolvedOverrides,
    allowExternalActions,
    allowRemoteImages,
    analyticsContext,
    beacon,
    eventMetadata: metadata,
    getActionOverride: resolveAction,
    onActionComplete,
    onComposerText,
    onDismiss,
    onModalOpen,
    onStartVoice,
    onUnsupported,
    pcaConversationId: initial.aqt(conversationId),
    preserveOpenPageContextPresentation: preserveOpenPresentation,
    renderPresentation: ({ content, supportStatus }: { content?: unknown; supportStatus: string }) => jsx.jsx(BeaconPresentationLifecycle, { children: content, closeWithoutDismiss, openPresentation, openPresentationRef, supportStatus, terminalPresentationStatesRef: terminalStatesRef }),
  }, presentationKey);
  return jsx.jsx(announcement.t, { source: "conversation", candidate: { id: `conversation-beacon:${conversationId}:${presentationKey}`, status: "eligible", render } });
}

function ChatGptConversationBeaconSurfaces({ actionOverrides, allowConversationSharing, allowExternalActions, allowRegeneration = true, allowRemoteImages, conversationId, getActionOverride, isTemporaryChat, onComposerText, onStartVoice, regenerationModelSlug = null }: ChatGptConversationBeaconSurfacesProps): unknown {
  const scope = shared.LX(shared.ZI);
  const regenerate = allowRegeneration ? share.o({ scope, allowedModelSlug: regenerationModelSlug, conversationId: initial.aqt(conversationId), isTemporaryChat }) : undefined;
  const resolvedOverrides = { ...actionOverrides, regenerate };
  const render = () => jsx.jsx(ConversationBeaconSurface, { actionOverrides: resolvedOverrides, allowConversationSharing, allowExternalActions, allowRemoteImages, conversationId, getActionOverride, isCompetingModalOpen: false, isTemporaryChat, onComposerText, onStartVoice });
  return jsx.jsx(temporary.n, { isTemporaryChat, children: render });
}

function initialize(): void {
  void shared.$3(); shared.FX(); shared.QI(); temporary.i(); initial.uHt(); initial.ANt(); home.r(); initial.Vzt(); initial.JNt(); share.s(); initial.oqt(); share.a(); initial.hNt();
  announcement.n(); jsx = shared.I3(); React = typeof shared.e6 === "function" && !("useState" in shared.e6) ? shared.e6() : shared.e6 as ReactRuntime;
}
initialize();
export { ChatGptConversationBeaconSurfaces };
