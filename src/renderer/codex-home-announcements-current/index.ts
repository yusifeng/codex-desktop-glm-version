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
import type { ServiceTierModel } from "@rchunk/app-shared";

void runtimeChunk;
void modalSourceChunk;
void worktreeStateChunk;

const {
  $3: initializeJsxRuntimeLazy,
  I3: jsxRuntime,
  K2: initializeIntl,
  HX: useSignalValue,
  LX: useSignalScope,
  Y2: FormattedMessage,
  ZI: applicationScope,
  _j: fastModeBannerActionEvent,
  e6: reactRuntime,
  h4: initializeClassNames,
  ig: DismissIcon,
  kz: parseServiceTier,
  m4: classNames,
  n4: useIntl,
  vj: fastModeBannerDismissedEvent,
} = appSharedChunk;
const {
  CNt: useRateLimitResetCandidate,
  D0t: useHomeAnnouncementOverrides,
  Fk: useRealtimeVoiceStart,
  F$: useNavigateToLocalConversation,
  HZ: useComposerEditor,
  Nk: useWeeklyRecapCandidate,
  i_n: useRouterLocation,
  kNt: getBeaconTreatment,
  qk: useRealtimeVoiceAvailability,
  sbt: shouldHideHomePromos,
  vN: FastModeIcon,
  xpn: logAnalyticsEvent,
  U2: usePluginInstallDetails,
} = appInitialChunk;
const {
  $p: getAnnouncementStatus,
  Ch: useHomeBeaconCandidate,
  dr: AnnouncementEntriesHost,
} = appPrimaryChunk;
const {
  r: initializeBeaconAnnouncement,
  t: BeaconAnnouncement,
} = beaconChunk;
const {
  f: useReplayCandidate,
  g: computerHistoryStatusSignal,
  h: computerHistoryDismissedSignal,
  i: useGiftCreditsCandidate,
  o: useBrowserProfileImportCandidate,
  p: ReplayAnnouncement,
  s: ExternalImportAnnouncement,
  t: GiftCreditsAnnouncement,
  u: launchReplay,
  v: ComputerHistoryAnnouncement,
  y: initializeAnnouncementEntryPoints,
} = entryPointsChunk;
const { n: initializeHomeAnnouncementSlot } = announcementSlotChunk;
const { t: CustomGptBanner } = bannerChunk;
const { RealtimeVoiceHomeAnnouncementContent } = realtimeVoiceChunk;
const { WorktreeOnboardingBannerController } = worktreeControllerChunk;
const { n: useWorktreeOnboardingCandidate } = worktreeStateChunk;
const {
  r: RateLimitResetHomeAnnouncement,
  t: initializeRateLimitResetAnnouncementState,
  u: useMultiAgentAnnouncementEligibility,
} = announcementStateChunk;
const { Banner: AnnouncementShell } = (
  initializeRateLimitResetAnnouncementState as typeof initializeRateLimitResetAnnouncementState & {
    presentation: { Banner: (props: Record<string, unknown>) => unknown };
  }
).presentation;

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
  content?: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
}

interface EntryPointCandidate {
  dismiss(): void;
  isEligible: boolean;
  isLoading: boolean;
  markShown?(): void;
  openGiftCredits?(): void;
  openImport?(): void;
  replay?(): void;
}

interface FastModeCandidate extends AnnouncementEntry {
  content: unknown;
  fastModeModel: ServiceTierModel | null;
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
  initializeHomeAnnouncementSlot?.();
  initializeRateLimitResetAnnouncementState();
  initializeAnnouncementEntryPoints?.();
  initializeBeaconAnnouncement?.();
  React = (typeof reactRuntime === "function"
    ? reactRuntime()
    : reactRuntime) as ReactRuntime;
  jsx = (typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime) as JsxRuntime;
  initialized = true;
}

function statusFor(entry: AnnouncementEntry): unknown {
  return (
    getAnnouncementStatus?.({
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
  const Host = AnnouncementEntriesHost ?? "div";
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
  const Shell = AnnouncementShell ?? "div";
  const scope = useSignalScope?.(applicationScope);
  const enable = () => {
    if (fastModeModel == null) return;
    setIsSubmitting(true);
    logAnalyticsEvent?.(scope, fastModeBannerActionEvent, {});
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
    logAnalyticsEvent?.(scope, fastModeBannerDismissedEvent, {});
    setHasSeenFastModeHomeBanner(true);
  };
  return jsx.jsx(Shell, {
    title: jsx.jsx(FormattedMessage, {
      id: "codex.fastModeHomeBanner.title",
      defaultMessage: "Enable Fast mode",
      description: "Title shown in the Fast mode home banner",
    }),
    description: content,
    leadingVisual: jsx.jsx(FastModeIcon ?? "span", {
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
  const override = useHomeAnnouncementOverrides?.() ?? {};
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
  const candidate = useHomeBeaconCandidate?.(product, {
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
  const Component = BeaconAnnouncement;
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
      treatment: getBeaconTreatment?.(candidate.beacon),
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
  const scope = useSignalScope?.(applicationScope);
  const candidateOverride = useHomeAnnouncementOverrides?.()
    ?.homeAnnouncementCandidates;
  if (candidateOverride != null)
    return jsx.jsx(AnnouncementEntries, {
      entries: candidateOverride,
      trackVisibility: false,
    });
  const worktree = useWorktreeOnboardingCandidate?.({
    enabled: !shouldHideOnboardingPromos,
    entryPoint,
    isLocalModeRemote,
  }) ?? { isEligible: false, isLoading: false };
  const recap = useWeeklyRecapCandidate?.() ?? {
    isEligible: false,
    isLoading: false,
    availableCount: 0,
    dismiss() {},
  };
  const voiceStart = useRealtimeVoiceStart?.(
    beaconProduct === "work_tab" ? "work" : entryPoint,
  );
  const voiceAvailable = useRealtimeVoiceAvailability?.();
  const gift = (useGiftCreditsCandidate?.({ enabled: !shouldHideOnboardingPromos }) ?? {
    dismiss() {}, isEligible: false, isLoading: false, openGiftCredits() {},
  }) as EntryPointCandidate;
  const externalImport = (useBrowserProfileImportCandidate?.({ enabled: true }) ?? {
    dismiss() {}, isEligible: false, isLoading: false, markShown() {}, openImport() {},
  }) as EntryPointCandidate & { providerId?: string };
  const replay = (useReplayCandidate?.({ enabled: true }) ?? {
    dismiss() {}, isEligible: false, isLoading: false, markShown() {}, replay() {},
  }) as EntryPointCandidate;
  const historyStatus = computerHistoryStatusSignal == null ? "ineligible" : useSignalValue?.(computerHistoryStatusSignal);
  const editor = useComposerEditor?.();
  const navigateToLocalConversation = useNavigateToLocalConversation?.();
  const pluginInstall = usePluginInstallDetails?.();
  const voiceEntry: AnnouncementEntry = {
    isEligible: voiceStart != null && voiceAvailable === true,
    isLoading: voiceStart != null && voiceAvailable === undefined,
    content:
      voiceStart == null
        ? null
        : jsx.jsx(RealtimeVoiceHomeAnnouncementContent, {
            entryPoint,
            onDismiss: () => {},
            onStart: () => void voiceStart(),
          }),
  };
  const worktreeEntry: AnnouncementEntry = {
    isEligible: worktree.isEligible,
    isLoading: false,
    content: worktree.isEligible
      ? jsx.jsx(WorktreeOnboardingBannerController, {})
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
  const giftEntry: AnnouncementEntry = {
    isEligible: !shouldHideOnboardingPromos && gift.isEligible,
    isLoading: !shouldHideOnboardingPromos && gift.isLoading,
    content: GiftCreditsAnnouncement == null ? null : jsx.jsx(GiftCreditsAnnouncement, {
      onDismiss: gift.dismiss,
      onOpenGiftCredits: gift.openGiftCredits ?? (() => {}),
    }),
  };
  const importEntry: AnnouncementEntry = {
    isEligible: externalImport.isEligible,
    isLoading: externalImport.isLoading,
    content: ExternalImportAnnouncement == null ? null : jsx.jsx(ExternalImportAnnouncement, {
      onDismiss: externalImport.dismiss,
      onImport: externalImport.openImport ?? (() => {}),
      onShown: externalImport.markShown,
      providerId: externalImport.providerId,
    }),
  };
  const historyAllowed = !shouldHideOnboardingPromos && !isLocalModeRemote && beaconProduct !== "chatgpt";
  const dismissHistory = () => scope?.set?.(computerHistoryDismissedSignal, true);
  const historyEntry: AnnouncementEntry = {
    isEligible: historyAllowed && historyStatus === "eligible",
    isLoading: historyAllowed && historyStatus === "loading",
    content: ComputerHistoryAnnouncement == null ? null : jsx.jsx(ComputerHistoryAnnouncement, {
      onDismiss: dismissHistory,
      onViewRecap: (prompt: string) => {
        dismissHistory();
        editor?.setPromptText?.(prompt);
        editor?.eventEmitter?.emit?.("submit");
      },
    }),
  };
  const replayEntry: AnnouncementEntry = {
    isEligible: replay.isEligible,
    isLoading: replay.isLoading,
    content: ReplayAnnouncement == null ? null : jsx.jsx(ReplayAnnouncement, {
      onDismiss: replay.dismiss,
      onShown: replay.markShown,
      onReplay: () => {
        if (scope == null || launchReplay == null) return;
        void launchReplay({
          scope,
          navigateToLocalConversation,
          onReplay: replay.replay,
          showPluginInstallDetails: pluginInstall?.showPluginInstallDetails,
        });
      },
    }),
  };
  const entries = [
    giftEntry,
    voiceEntry,
    importEntry,
    worktreeEntry,
    recapEntry,
    historyEntry,
    replayEntry,
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
  const source = useRouterLocation?.()?.pathname ?? "/";
  const hidePromos = shouldHideHomePromos?.({
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
      : jsx.jsx(CustomGptBanner, { gizmoId: selectedCustomGptId });
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
    useRateLimitResetCandidate?.() ?? {
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
  const pathname = useRouterLocation?.()?.pathname ?? "/";
  const hidePromos = shouldHideHomePromos?.({
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
