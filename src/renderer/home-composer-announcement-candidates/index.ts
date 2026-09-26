// home-composer-announcement-candidates —— Home composer 的产品公告候选聚合器。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-home-announcements";
import "@rchunk/worktree-onboarding-state";
import "@rchunk/announcement-entry-points";
import "@rchunk/realtime-voice-home-announcement";
import "@rchunk/worktree-onboarding-banner-controller";

interface CandidateState { isEligible: boolean; isLoading?: boolean; content?: unknown; [key: string]: unknown }
const candidate = (id: string, state: CandidateState, eligible = state.isEligible) => ({
  id, isEligible: eligible, isLoading: state.isLoading === true, content: eligible ? state.content ?? { kind: `${id}-announcement` } : null,
});

function HomeComposerAnnouncementCandidates(input: {
  renderCandidates(candidates: unknown[]): unknown;
  beaconProduct?: string | null; entryPoint?: string; homeRunLocationRemoteProject?: unknown;
  includeGitCheckoutWarning?: boolean; shouldHideOnboardingPromos?: boolean;
  giftCredits?: CandidateState; realtimeVoice?: CandidateState; externalAgentImport?: CandidateState;
  worktreeOnboarding?: CandidateState; computerHistory?: CandidateState; codexReplay?: CandidateState;
}) {
  const hidden = input.shouldHideOnboardingPromos === true;
  const remote = input.homeRunLocationRemoteProject != null;
  const gift = candidate("gift-credits", input.giftCredits ?? { isEligible: false }, !hidden && (input.giftCredits?.isEligible ?? false));
  const realtime = candidate("realtime-voice", input.realtimeVoice ?? { isEligible: false });
  const external = candidate("external-agent-import", input.externalAgentImport ?? { isEligible: false });
  const worktree = candidate("worktree-onboarding", input.worktreeOnboarding ?? { isEligible: false },
    !hidden && !remote && (input.worktreeOnboarding?.isEligible ?? false));
  const history = candidate("computer-history", input.computerHistory ?? { isEligible: false },
    !hidden && !remote && input.beaconProduct !== "chatgpt" && (input.computerHistory?.isEligible ?? false));
  const replay = candidate("codex-replay", input.codexReplay ?? { isEligible: false });
  const candidates = [gift, realtime, external, worktree, history, replay];
  return {
    kind: input.beaconProduct == null ? "codex-home-announcements" as const : "product-home-announcements" as const,
    product: input.beaconProduct ?? null,
    entryPoint: input.entryPoint,
    includeGitCheckoutWarning: input.includeGitCheckoutWarning === true,
    shouldHideOnboardingPromos: hidden,
    fallbackContent: { kind: "home-announcement-fallback" },
    candidates,
    rendered: input.renderCandidates(candidates),
  };
}

export { HomeComposerAnnouncementCandidates };
