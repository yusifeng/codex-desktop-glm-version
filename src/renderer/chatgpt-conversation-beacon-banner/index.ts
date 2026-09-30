// In-conversation beacon banner composition. Release chunk: banner-45681dba535f.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as shareActionChunk from "@rchunk/share-conversation-action";
import * as constantsChunk from "@rchunk/precise-location-banner-constants";
import * as beaconAnnouncementChunk from "@rchunk/codex-app-home-beacon-announcement-core";

interface Beacon {
  beacon_id: string;
  action_items?: unknown;
  ui_info: { dismiss_variant?: string };
}
interface BeaconState {
  beacon?: Beacon;
  eventMetadata: { messageId?: string | null; suppressLifecycle?: boolean };
  productExperience: unknown;
}
interface Props {
  actionOverrides?: Record<string, unknown>;
  allowConversationSharing?: boolean;
  allowExternalActions?: boolean;
  allowRegeneration?: boolean;
  allowRemoteImages?: boolean;
  conversationId: string;
  fallback?: unknown;
  getActionOverride?: unknown;
  isTemporaryChat?: boolean;
  onComposerText?: unknown;
  onSendPrompt?: unknown;
  onStartVoice?: unknown;
  regenerationModelSlug?: string | null;
}
interface SharedRuntime {
  BX<T>(query: unknown, input: unknown): T;
  LX(scope: unknown): unknown;
  I3(): {
    Fragment: unknown;
    jsx(type: unknown, props: Record<string, unknown>): unknown;
  };
  ZI: unknown;
  QI: unknown;
}
interface InitialRuntime {
  aqt(conversationId: string): string | null;
  wVt: unknown;
  fNt: unknown;
  jVt: unknown;
  YVt: unknown;
  WVt: unknown;
  dHt(value: unknown): boolean;
  yNt(value: unknown): boolean;
  gNt(scope: unknown, conversationId: string, state: BeaconState): void;
  mNt(scope: unknown, conversationId: string, state: BeaconState): void;
  _Nt(scope: unknown, conversationId: string, state: BeaconState): void;
}
interface ShareRuntime {
  i(value: unknown): boolean;
  t: unknown;
  o(input: Record<string, unknown>): unknown;
  n(input: Record<string, unknown>): unknown;
  r(input: Record<string, unknown>): unknown;
}
const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const share = shareActionChunk as unknown as ShareRuntime;
const BeaconAnnouncement = (beaconAnnouncementChunk as Record<string, unknown>)
  .t;
const jsx = shared.I3();
void appPrimaryChunk;
void constantsChunk;

export function ChatGptConversationBeaconBanner(props: Props): unknown {
  const allowConversationSharing = props.allowConversationSharing ?? false;
  const allowRegeneration = props.allowRegeneration ?? true;
  const isTemporaryChat = props.isTemporaryChat ?? false;
  const scope = shared.LX(shared.ZI);
  const accountId = initial.aqt(props.conversationId);
  const pcaConversationId = shared.BX<string | null>(
    initial.wVt,
    props.conversationId,
  );
  const state = shared.BX<BeaconState | null>(
    initial.fNt,
    pcaConversationId ?? props.conversationId,
  );
  const latestMessageId = shared.BX<string | null>(
    initial.jVt,
    props.conversationId,
  );
  const conversationMode = shared.BX<unknown>(
    initial.YVt,
    props.conversationId,
  );
  const sharingRestricted = initial.dHt(conversationMode);
  const previouslyDismissed = shared.BX<boolean>(
    initial.WVt,
    props.conversationId,
  );
  const beacon =
    state?.beacon != null && initial.yNt(state.beacon) ? state.beacon : null;
  const shareEligible = beacon != null && share.i(beacon.action_items);
  const shareLocation = shared.BX<unknown>(
    share.t,
    shareEligible ? accountId : null,
  );
  const regenerate = allowRegeneration
    ? share.o({
        scope,
        allowedModelSlug: props.regenerationModelSlug ?? null,
        conversationId: accountId,
        isTemporaryChat,
      })
    : undefined;
  const canShare =
    allowConversationSharing &&
    props.allowExternalActions !== false &&
    !isTemporaryChat &&
    !sharingRestricted;
  const shareConversation = share.n({
    scope,
    canShare,
    conversationId: pcaConversationId,
  });
  const actionOverrides = {
    ...props.actionOverrides,
    share_location: shareLocation,
    regenerate,
    share_conversation: shareConversation,
  };
  const getActionOverride = (action: unknown) =>
    share.r({
      action,
      getActionOverride: props.getActionOverride,
      shareConversationEligible: shareLocation,
      shareConversationOverride: actionOverrides.share_conversation,
    });
  const hidden =
    state == null ||
    beacon == null ||
    beacon.beacon_id === "precise_location_banner_beacon" ||
    (previouslyDismissed && beacon.ui_info.dismiss_variant !== "persistent") ||
    beacon.beacon_id.startsWith("codex_composer_tip_") ||
    (beacon.ui_info.dismiss_variant !== "persistent" &&
      state.eventMetadata.messageId != null &&
      state.eventMetadata.messageId !== latestMessageId);
  if (hidden)
    return props.fallback == null
      ? null
      : jsx.jsx(jsx.Fragment, { children: props.fallback });
  const conversationId = pcaConversationId ?? props.conversationId;
  const analyticsContext = {
    placement: "in_conversation",
    productExperience: state.productExperience,
    suppressLifecycle: state.eventMetadata.suppressLifecycle,
    treatment: "banner",
  };
  return jsx.jsx(BeaconAnnouncement, {
    accountId: conversationId,
    actionOverrides,
    allowExternalActions: props.allowExternalActions,
    allowRemoteImages: props.allowRemoteImages,
    analyticsContext,
    beacon,
    eventMetadata: state.eventMetadata,
    getActionOverride,
    onActionComplete: () => initial.gNt(scope, props.conversationId, state),
    onComposerText: props.onComposerText,
    onDismiss: () => initial.mNt(scope, props.conversationId, state),
    onUnsupported: () => initial._Nt(scope, props.conversationId, state),
    pcaConversationId: accountId,
    onSendPrompt: props.onSendPrompt,
    onStartVoice: props.onStartVoice,
  });
}
