// composer-banners —— Home/Task composer 的环境、用量与安全公告聚合层。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/usage";
import "@rchunk/composer-announcement-slot";
import "@rchunk/task-announcement-candidates";

interface BannerCandidate { id: string; isEligible: boolean; isLoading: boolean; content: unknown }
const banner = (id: string, content: unknown): BannerCandidate => ({ id, isEligible: content != null && typeof content !== "boolean", isLoading: false, content: typeof content === "boolean" ? null : content });

function ComposerBanners(input: {
  conversationId?: string | null; hostId: string; latestTurnId?: string | null;
  environmentBanners?: { windowsSandboxWarnings?: unknown; legacyWslState?: unknown; showFullAccessWarning?: boolean } | null;
  homeComposerBanners?: ((render: (extra: BannerCandidate[]) => unknown) => unknown) | null;
  misalignmentPolicyViolationBanner?: unknown; safetyBufferingBanner?: unknown; safetyEvent?: unknown;
  onDismissSafetyEvent?(): void; showUltraWarning?: boolean; ultraWarningModel?: string | null;
  usageBannerContent?: unknown; ultraWarningContent?: unknown; taskCandidates?: BannerCandidate[];
}) {
  const environment = input.environmentBanners;
  const candidates = [
    banner("windows-sandbox", environment?.windowsSandboxWarnings),
    banner("wsl-migration", environment?.legacyWslState),
    banner("full-access", environment?.showFullAccessWarning ? { kind: "full-access-warning" } : null),
    banner("cyber-safety", input.safetyEvent == null ? null : { event: input.safetyEvent, dismiss: input.onDismissSafetyEvent }),
    banner("codex-usage", input.usageBannerContent),
    banner("ultra-usage", input.showUltraWarning && input.ultraWarningModel != null ? input.ultraWarningContent : null),
    banner("misalignment-policy", input.misalignmentPolicyViolationBanner),
    banner("safety-buffering", input.safetyBufferingBanner),
    banner("dictation-first-use", { kind: "dictation-first-use" }),
  ];
  if (input.conversationId == null) {
    return { kind: "home-composer-banners" as const, area: "home" as const, candidates, homeCandidates: input.homeComposerBanners ?? null };
  }
  return {
    kind: "task-composer-banners" as const,
    area: "task" as const,
    conversationId: input.conversationId,
    hostId: input.hostId,
    turnId: input.latestTurnId ?? null,
    candidates: [...candidates, ...(input.taskCandidates ?? [])],
    fallbackCandidates: [...candidates, { id: "workspace-renewal-payment", isEligible: false, isLoading: true, content: null }],
  };
}

export { ComposerBanners };
