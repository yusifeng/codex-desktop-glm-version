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
const entryPoints = entryPointsChunk as Record<string, any>;
const announcementSlot = announcementSlotChunk as Record<string, any>;
const realtimeVoice = realtimeVoiceChunk as Record<string, any>;
const worktreeController = worktreeControllerChunk as Record<string, any>;

const {
  $3: initializeJsxRuntimeLazy,
  I3: jsxRuntime,
  K2: initializeIntl,
  LX: useSignalScope,
  T: fastModeBannerDismissedEvent,
  Y2: FormattedMessage,
  ZI: applicationScope,
  _j: fastModeBannerActionEvent,
  e6: reactRuntime,
  h4: initializeClassNames,
  ig: DismissIcon,
  kz: parseServiceTier,
  m4: classNames,
  n4: useIntl,
} = appShared;
const {
  r: RateLimitResetHomeAnnouncement,
  t: initializeRateLimitResetAnnouncementState,
  u: useMultiAgentAnnouncementEligibility,
} = announcementStateChunk;

interface ReactRuntime {
  useState<Value>(initialValue: Value): [
    Value,
    (value: Value | ((current: Value) => Value)) => void,
  ];
}

interface JsxRuntime {
  jsx(component: unknown, props: unknown, key?: string): unknown;
  jsxs(component: unknown, props: unknown, key?: string): unknown;
}

interface IntlShape {
  formatMessage(descriptor: {
    defaultMessage: string;
    description?: string;
    id: string;
  }): string;
}

type SetState<Value> = (
  value: Value | ((current: Value) => Value),
) => void;

interface AnnouncementEntry {
  content: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
}

interface FastModeCandidate extends AnnouncementEntry {
  content: unknown;
  fastModeModel: unknown;
  intl: IntlShape;
  isSubmitting: boolean;
  setHasSeenFastModeHomeBanner(seen: boolean): void;
  setIsSubmitting: SetState<boolean>;
  setServiceTier(tier: string, source: "home_banner"): Promise<unknown> | unknown;
}

interface BeaconCandidate {
  accountId?: string | null;
  beacon?: unknown;
  isEligible: boolean;
  isLoading: boolean;
  shouldSuppressVanillaPromos?: boolean;
}

interface HomeAnnouncementCandidatesProps {
  beaconProduct?: "chatgpt" | "work_tab";
  entryPoint: string;
  isLocalModeRemote: boolean;
  shouldHideOnboardingPromos: boolean;
}

interface HomeComposerAnnouncementsProps {
  entryPoint: string;
  hasSeparateCodexAnnouncements?: boolean;
  homeComposerMode: "chat" | "work" | string;
  isLocalModeRemote?: boolean;
  selectedCustomGptId?: string | null;
}

interface CodexHomeAnnouncementEntriesProps {
  homeRunLocationRemoteProject?: unknown;
  includeGitCheckoutWarning?: boolean;
  shouldHideOnboardingPromos: boolean;
}

interface CodexHomeAnnouncementsProps {
  homeRunLocationRemoteProject?: unknown;
  includeGitCheckoutWarning?: boolean;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeCodexHomeAnnouncements(): void {
  if (initialized) return;
  initializeJsxRuntimeLazy?.();
  initializeIntl?.();
  initializeClassNames?.();
  announcementSlot.n?.();
  initializeRateLimitResetAnnouncementState();
  entryPoints.t?.();
  beacon.r?.();
  React = (typeof reactRuntime === "function"
    ? reactRuntime()
    : reactRuntime) as ReactRuntime;
  jsx = (typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime) as JsxRuntime;
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
}: FastModeCandidate): unknown {
  const Shell = appPrimary.Sm ?? "div";
  const scope = useSignalScope?.(applicationScope);
  const enable = () => {
    if (fastModeModel == null) return;
    setIsSubmitting(true);
    appInitial.xpn?.(scope, fastModeBannerActionEvent, {});
    Promise.resolve(
      setServiceTier(
        parseServiceTier?.(fastModeModel)?.id ?? "priority",
        "home_banner",
      ),
    ).finally(() => {
      setHasSeenFastModeHomeBanner(true);
      setIsSubmitting(false);
    });
  };
  const dismiss = () => {
    appInitial.xpn?.(scope, fastModeBannerDismissedEvent, {});
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
      icon: DismissIcon,
      onClick: dismiss,
      disabled: isSubmitting,
    },
  });
}

function useFastModeCandidate(): FastModeCandidate {
  const intl = useIntl?.() as IntlShape;
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

function useBeaconCandidate(product?: string): BeaconCandidate {
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
function BeaconContent({
  candidate,
  product,
}: {
  candidate: BeaconCandidate;
  product?: string;
}): unknown {
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
}: HomeAnnouncementCandidatesProps): unknown {
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
    content: jsx.jsx(RateLimitResetHomeAnnouncement ?? "div", {
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
}: HomeComposerAnnouncementsProps): unknown {
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
    className: classNames?.(
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
}: CodexHomeAnnouncementEntriesProps): unknown {
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
    useMultiAgentAnnouncementEligibility(),
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
}: CodexHomeAnnouncementsProps): unknown {
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
