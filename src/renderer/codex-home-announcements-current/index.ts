// codex-home-announcements-current —— 当前 Home composer 与 Codex Home 公告候选编排。
// 原版：app/webview/assets/codex-home-announcements-cc03f986780c.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as modalSourceChunk from "@rchunk/announcement-modal-source-bridge";
import * as beaconChunk from "@rchunk/codex-app-home-beacon-announcement-core";
import * as announcementStateChunk from "@rchunk/home-announcement-state";
import * as bannerChunk from "@rchunk/banner";
import * as worktreeStateChunk from "@rchunk/worktree-onboarding-state";
import * as entryPointsChunk from "@rchunk/announcement-entry-points";
import * as announcementSlotChunk from "@rchunk/home-announcement-slot";
import * as realtimeVoiceChunk from "@rchunk/realtime-voice-home-announcement";
import * as worktreeControllerChunk from "@rchunk/worktree-onboarding-banner-controller";

void runtimeChunk;
void modalSourceChunk;
void bannerChunk;
void worktreeStateChunk;

const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const beacon = beaconChunk as Record<string, any>;
const state = announcementStateChunk as Record<string, any>;
const entryPoints = entryPointsChunk as Record<string, any>;
const announcementSlot = announcementSlotChunk as Record<string, any>;
const realtimeVoice = realtimeVoiceChunk as Record<string, any>;
const worktreeController = worktreeControllerChunk as Record<string, any>;

interface AnnouncementEntry {
  content: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
}

let React: any;
let jsx: any;
let initialized = false;
function initializeCodexHomeAnnouncements(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  appShared.h4?.();
  announcementSlot.n?.();
  state.t?.();
  entryPoints.t?.();
  beacon.r?.();
  React = appShared.e6?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function statusFor(entry: AnnouncementEntry): unknown {
  return (
    appPrimary.$p?.({
      isEligible: entry.isEligible,
      isLoading: entry.isLoading,
    }) ??
    (entry.isLoading ? "loading" : entry.isEligible ? "eligible" : "ineligible")
  );
}
function firstActive(
  entries: AnnouncementEntry[],
): AnnouncementEntry | undefined {
  return entries.find((entry) => entry.isEligible || entry.isLoading);
}
function AnnouncementEntries({
  entries,
  trackVisibility = false,
}: {
  entries: AnnouncementEntry[];
  trackVisibility?: boolean;
}): unknown {
  const Host = appPrimary.Ne ?? "div";
  return jsx.jsx(Host, { entries, trackVisibility });
}

function FastModeBanner({
  content,
  fastModeModel,
  intl,
  isSubmitting,
  setHasSeenFastModeHomeBanner,
  setIsSubmitting,
  setServiceTier,
}: Record<string, any>): unknown {
  const Shell = appPrimary.Sm ?? "div";
  const FormattedMessage = appShared.Y2;
  const scope = appShared.LX?.(appShared.ZI);
  const enable = () => {
    if (fastModeModel == null) return;
    setIsSubmitting(true);
    appInitial.xpn?.(scope, appShared._j, {});
    Promise.resolve(
      setServiceTier(
        appShared.kz?.(fastModeModel)?.id ?? "priority",
        "home_banner",
      ),
    ).finally(() => {
      setHasSeenFastModeHomeBanner(true);
      setIsSubmitting(false);
    });
  };
  const dismiss = () => {
    appInitial.xpn?.(scope, appShared.T, {});
    setHasSeenFastModeHomeBanner(true);
  };
  return jsx.jsx(Shell, {
    title: jsx.jsx(FormattedMessage, {
      id: "codex.fastModeHomeBanner.title",
      defaultMessage: "Enable Fast mode",
      description: "Title shown in the Fast mode home banner",
    }),
    description: content,
    leadingVisual: jsx.jsx(appInitial.vN ?? "span", {
      className: "icon-sm text-chart-yellow",
    }),
    primaryAction: {
      label: jsx.jsx(FormattedMessage, {
        id: "codex.fastModeHomeBanner.cta.primary",
        defaultMessage: "Enable now",
        description: "Primary CTA shown in the Fast mode home banner",
      }),
      onClick: enable,
      disabled: isSubmitting,
    },
    dismissAction: {
      ariaLabel: intl.formatMessage({
        id: "codex.fastModeHomeBanner.dismissLabel",
        defaultMessage: "Dismiss Fast mode banner",
        description:
          "Accessible label for dismissing the Fast mode home banner",
      }),
      icon: appShared.ig,
      onClick: dismiss,
      disabled: isSubmitting,
    },
  });
}

function useFastModeCandidate(): Record<string, any> {
  const intl = appShared.n4?.();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const override = appInitial.D0t?.() ?? {};
  if (override.fastModeCandidate != null)
    return {
      ...override.fastModeCandidate,
      intl,
      isSubmitting,
      setIsSubmitting,
    };
  return {
    content: null,
    intl,
    isEligible: false,
    isLoading: false,
    isSubmitting,
    fastModeModel: null,
    setHasSeenFastModeHomeBanner() {},
    setIsSubmitting,
    setServiceTier: async () => {},
  };
}

function useBeaconCandidate(product?: string): Record<string, any> {
  const candidate = appPrimary.Ch?.(product, {
    shouldSuppressFocusedModal: () => false,
  });
  return (
    candidate ?? {
      accountId: null,
      beacon: null,
      isEligible: false,
      isLoading: false,
      shouldSuppressVanillaPromos: false,
    }
  );
}
function BeaconContent({ candidate, product }: Record<string, any>): unknown {
  const Component = beacon.t;
  if (
    candidate.accountId == null ||
    candidate.beacon == null ||
    Component == null
  )
    return null;
  return jsx.jsx(Component, {
    accountId: candidate.accountId,
    actionAccountId: candidate.accountId,
    analyticsContext: {
      placement:
        product === "work_tab"
          ? "work_tab_home"
          : product === "codex"
            ? "codex_home"
            : "homepage",
      productExperience: product === "work_tab" ? "work" : "chat",
      treatment: appInitial.qNt?.(candidate.beacon),
    },
    beacon: candidate.beacon,
  });
}

function HomeAnnouncementCandidates({
  beaconProduct,
  entryPoint,
  isLocalModeRemote,
  shouldHideOnboardingPromos,
}: Record<string, any>): unknown {
  const candidateOverride = appInitial.D0t?.()?.homeAnnouncementCandidates;
  if (candidateOverride != null)
    return jsx.jsx(AnnouncementEntries, {
      entries: candidateOverride,
      trackVisibility: false,
    });
  const worktree = appInitial.Wk?.({
    enabled: !shouldHideOnboardingPromos,
    entryPoint,
    isLocalModeRemote,
  }) ?? { isEligible: false, isLoading: false };
  const recap = appInitial.Nk?.() ?? {
    isEligible: false,
    isLoading: false,
    availableCount: 0,
    dismiss() {},
  };
  const voiceStart = appInitial.Fk?.(
    beaconProduct === "work_tab" ? "work" : entryPoint,
  );
  const voiceAvailable = appInitial.qk?.();
  const voiceEntry: AnnouncementEntry = {
    isEligible: voiceStart != null && voiceAvailable === true,
    isLoading: voiceStart != null && voiceAvailable === undefined,
    content:
      voiceStart == null
        ? null
        : jsx.jsx(realtimeVoice.RealtimeVoiceHomeAnnouncementContent, {
            entryPoint,
            onDismiss: () => {},
            onStart: () => void voiceStart(),
          }),
  };
  const worktreeEntry: AnnouncementEntry = {
    isEligible: worktree.isEligible,
    isLoading: false,
    content: worktree.isEligible
      ? jsx.jsx(worktreeController.WorktreeOnboardingBannerController, {})
      : null,
  };
  const recapEntry: AnnouncementEntry = {
    isEligible:
      !shouldHideOnboardingPromos &&
      !isLocalModeRemote &&
      beaconProduct !== "chatgpt" &&
      recap.isEligible,
    isLoading:
      !shouldHideOnboardingPromos &&
      !isLocalModeRemote &&
      beaconProduct !== "chatgpt" &&
      recap.isLoading,
    content: jsx.jsx(state.r ?? "div", {
      availableCount: recap.availableCount,
      onDismiss: recap.dismiss,
    }),
  };
  const entries = [
    appInitial.iPt?.({ enabled: !shouldHideOnboardingPromos }) ?? {
      isEligible: false,
      isLoading: false,
      content: null,
    },
    voiceEntry,
    appInitial.qNt?.({ enabled: true }) ?? {
      isEligible: false,
      isLoading: false,
      content: null,
    },
    worktreeEntry,
    recapEntry,
    appInitial.HNt?.({ enabled: true }) ?? {
      isEligible: false,
      isLoading: false,
      content: null,
    },
  ];
  return jsx.jsx(AnnouncementEntries, { entries, trackVisibility: false });
}

function HomeComposerAnnouncements({
  entryPoint,
  hasSeparateCodexAnnouncements,
  homeComposerMode,
  isLocalModeRemote = false,
  selectedCustomGptId,
}: Record<string, any>): unknown {
  void hasSeparateCodexAnnouncements;
  const source = appInitial.i_n?.()?.pathname ?? "/";
  const hidePromos = appInitial.sbt?.({
    hideFirstNewThreadOnboardingPromos: false,
    pathname: source,
  });
  const beaconProduct =
    homeComposerMode === "chat"
      ? "chatgpt"
      : homeComposerMode === "work"
        ? "work_tab"
        : undefined;
  const customGpt =
    selectedCustomGptId == null
      ? null
      : jsx.jsx(bannerChunk.t, { gizmoId: selectedCustomGptId });
  return jsx.jsxs("div", {
    className: appShared.m4?.(
      "empty:hidden",
      entryPoint === "codex" &&
        "electron:mx-[var(--home-composer-inline-inset)]",
    ),
    children: [
      customGpt,
      jsx.jsx(HomeAnnouncementCandidates, {
        beaconProduct,
        entryPoint,
        isLocalModeRemote,
        shouldHideOnboardingPromos: hidePromos,
      }),
    ],
  });
}

function CodexHomeAnnouncementEntries({
  homeRunLocationRemoteProject,
  includeGitCheckoutWarning,
  shouldHideOnboardingPromos,
}: Record<string, any>): unknown {
  void homeRunLocationRemoteProject;
  void includeGitCheckoutWarning;
  const fastMode = useFastModeCandidate();
  const beaconCandidate = useBeaconCandidate("codex");
  const beaconContent = jsx.jsx(BeaconContent, {
    candidate: beaconCandidate,
    product: "codex",
  });
  const entries: AnnouncementEntry[] = [
    appInitial.CNt?.() ?? {
      isEligible: false,
      isLoading: false,
      content: null,
    },
    {
      isEligible: !shouldHideOnboardingPromos && beaconCandidate.isEligible,
      isLoading: !shouldHideOnboardingPromos && beaconCandidate.isLoading,
      content: beaconContent,
    },
    state.u?.() ?? { isEligible: false, isLoading: false, content: null },
    {
      isEligible: !shouldHideOnboardingPromos && fastMode.isEligible,
      isLoading: !shouldHideOnboardingPromos && fastMode.isLoading,
      content:
        fastMode.content == null
          ? null
          : jsx.jsx(FastModeBanner, { ...fastMode }),
    },
  ];
  return jsx.jsx(AnnouncementEntries, { entries, trackVisibility: false });
}

function CodexHomeAnnouncements({
  homeRunLocationRemoteProject = null,
  includeGitCheckoutWarning = true,
}: Record<string, any>): unknown {
  const pathname = appInitial.i_n?.()?.pathname ?? "/";
  const hidePromos = appInitial.sbt?.({
    hideFirstNewThreadOnboardingPromos: false,
    pathname,
  });
  return jsx.jsx(CodexHomeAnnouncementEntries, {
    homeRunLocationRemoteProject,
    includeGitCheckoutWarning,
    shouldHideOnboardingPromos: hidePromos,
  });
}

function initializeBeaconAnnouncements(): void {
  initializeCodexHomeAnnouncements();
}

initializeCodexHomeAnnouncements();
export {
  initializeBeaconAnnouncements as i,
  HomeComposerAnnouncements as n,
  initializeCodexHomeAnnouncements as r,
  CodexHomeAnnouncements as t,
};
