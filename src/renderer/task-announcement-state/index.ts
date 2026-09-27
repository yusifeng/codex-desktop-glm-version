import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  ZI as appScope,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  A1t as initializeActiveConversationSession,
  M1t as activeConversationSession,
  dun as createPersistedSignal,
  mfn as featureGateFamily,
  pfn as initializeFeatureGates,
  uun as initializePersistedSignals,
} from "@rchunk/app-initial";

interface AnnouncementState {
  dismissed: boolean;
  impressions: number;
  lastSessionId: string | null;
}

interface ConversationLocator {
  conversationId: string;
  hostId: string;
}

interface ActiveSession {
  locator: ConversationLocator;
  phase: string;
  sessionId: string;
}

let voiceReasoningNoticeState: unknown;
let activeVoiceReasoningNoticeSession: unknown;

function initializeTaskAnnouncementState(): void {
  initializeSignalRuntime();
  initializeQueryRuntime();
  initializeFeatureGates();
  initializePersistedSignals();
  initializeActiveConversationSession();
  voiceReasoningNoticeState = createPersistedSignal<AnnouncementState>(
    "voice-reasoning-notice-v3",
    { impressions: 0, lastSessionId: null, dismissed: false },
  );
  activeVoiceReasoningNoticeSession = createDerivedFamily(
    appScope,
    (
      { conversationId, hostId }: ConversationLocator,
      { get },
    ): string | null => {
      if (!get(featureGateFamily, "714010102")) return null;
      const session = get(activeConversationSession) as ActiveSession;
      const notice = get(voiceReasoningNoticeState) as AnnouncementState | null;
      return session.phase !== "active"
        || session.locator.conversationId !== conversationId
        || session.locator.hostId !== hostId
        || notice == null
        || notice.dismissed
        || (notice.impressions >= 3 && notice.lastSessionId !== session.sessionId)
        ? null
        : session.sessionId;
    },
  );
}

export {
  voiceReasoningNoticeState as n,
  activeVoiceReasoningNoticeSession as r,
  initializeTaskAnnouncementState as t,
};
