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
  i_n: useRouterLocation,
  kNt: getBeaconTreatment,
  qk: useRealtimeVoiceAvailability,
  sbt: shouldHideHomePromos,
  vN: FastModeIcon,
  xpn: logAnalyticsEvent,
  U2: usePluginInstallDetails,
} = appInitialChunk;
interface AnnouncementInitialBindings {
  QZ?: unknown;
  Xyt?: unknown;
  J2?: () => {
    serviceTierSettings?: { isLoading?: boolean; selectedServiceTier?: unknown };
    setServiceTier?(tier: string, source: "home_banner"): Promise<unknown> | unknown;
  };
  dun?: (key: string, fallback: boolean) => unknown;
  f8?: () => { modelSettings?: { model?: unknown } };
  qNt?: unknown;
  s8?: () => { isServiceTierAllowed?: boolean };
  w0t?: (models: unknown, selectedModel: unknown, predicate?: unknown) => ServiceTierModel | null;
  w8?: () => { data?: { models?: unknown } };
}
const {
  J2: useServiceTierSettings,
  QZ: homeAnnouncementSourceContext,
  Xyt: hideFirstNewThreadOnboardingPromosSignal,
  dun: createPersistedBooleanSignal,
  f8: useModelSettings,
  qNt: announcementsDisabledSignal,
  s8: useServiceTierPolicy,
  w0t: selectFastModeModel,
  w8: useModelsQuery,
} = appInitialChunk as unknown as AnnouncementInitialBindings;
interface AnnouncementSharedBindings { Dz?: unknown }
const { Dz: fastModeModelPredicate } = appSharedChunk as unknown as AnnouncementSharedBindings;
interface AnnouncementPrimaryBindings {
  Zp?: (enabled: boolean) => {
    estimate?: { savedHours?: number; savedMinutes?: number; threadCount?: number } | null;
    estimateStatus?: "failed" | "loading" | "ready" | string;
  };
}
const { Zp: useFastModeEstimate } = appPrimaryChunk as unknown as AnnouncementPrimaryBindings;
let fastModeSeenSignal: unknown;
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
  n: initializeAnnouncementModalSource,
} = modalSourceChunk;
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
  t: initializeRateLimitResetAnnouncementState,
  u: useMultiAgentAnnouncementEligibility,
} = announcementStateChunk;
const { Banner: AnnouncementShell } = (
  initializeRateLimitResetAnnouncementState as typeof initializeRateLimitResetAnnouncementState & {
    presentation: { Banner: (props: Record<string, unknown>) => unknown };
  }
).presentation;

interface ReactRuntime {
  useContext<Value>(context: unknown): Value;
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
  beacon?: { custom_fields?: { show_after_onboarding?: boolean } } | null;
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
  initializeAnnouncementModalSource?.();
  initializeRateLimitResetAnnouncementState();
  initializeAnnouncementEntryPoints?.();
  initializeBeaconAnnouncement?.();
  useHomeAnnouncementOverrides?.();
  fastModeSeenSignal = createPersistedBooleanSignal?.("has-seen-fast-mode-home-banner", false);
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
  const scope = useSignalScope?.(applicationScope);
  const policy = useServiceTierPolicy?.() ?? {};
  const models = useModelsQuery?.().data?.models;
  const modelSettings = useModelSettings?.().modelSettings ?? {};
  const tier = useServiceTierSettings?.() ?? {};
  const seen = fastModeSeenSignal == null ? false : useSignalValue?.(fastModeSeenSignal) === true;
  const fastModeModel = selectFastModeModel?.(models, modelSettings.model, fastModeModelPredicate) ?? null;
  const canEstimate = policy.isServiceTierAllowed === true && fastModeModel != null && !seen &&
    tier.serviceTierSettings?.selectedServiceTier == null && tier.serviceTierSettings?.isLoading !== true;
  const estimateState = useFastModeEstimate?.(canEstimate) ?? {};
  const estimate = estimateState.estimate;
  const isEligible = canEstimate && estimateState.estimateStatus === "ready" && estimate != null;
  const isLoading = canEstimate && estimateState.estimateStatus !== "ready" && estimateState.estimateStatus !== "failed";
  const content = !isEligible || estimate == null ? null : jsx.jsx(FormattedMessage, {
    id: "codex.fastModeHomeBanner.body.personalizedEstimate",
    defaultMessage: "Based on your work last week across {threadCount, plural, one {# chat} other {# chats}}, Fast could have saved about {savedHours} hours and {savedMinutes} minutes. Increases plan usage.",
    description: "Personalized estimate shown in the Fast mode home banner",
    values: {
      savedHours: estimate.savedHours ?? 0,
      savedMinutes: estimate.savedMinutes ?? 0,
      threadCount: estimate.threadCount ?? 0,
    },
  });
  return {
    content,
    intl,
    isEligible,
    isLoading,
    isSubmitting,
    fastModeModel,
    setHasSeenFastModeHomeBanner(value) {
      if (fastModeSeenSignal != null) scope?.set?.(fastModeSeenSignal, value);
    },
    setIsSubmitting,
    setServiceTier: tier.setServiceTier ?? (async () => {}),
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
  editor,
  product,
  startRealtimeVoice,
}: {
  candidate: BeaconCandidate;
  editor?: { focus?(): void; setText?(value: string): void; setPromptText?(value: string): void };
  product?: string;
  startRealtimeVoice?: (() => unknown) | null;
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
    onComposerText: (value: string) => {
      editor?.focus?.();
      if (editor?.setText != null) editor.setText(value);
      else editor?.setPromptText?.(value);
    },
    onStartVoice: startRealtimeVoice == null ? undefined : () => void startRealtimeVoice(),
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
  const announcementsDisabled = useSignalValue?.(announcementsDisabledSignal) === true;
  const voiceStart = useRealtimeVoiceStart?.(
    beaconProduct === "work_tab" ? "work" : entryPoint,
  );
  const voiceAvailable = useRealtimeVoiceAvailability?.();
  const gift = (useGiftCreditsCandidate?.({ enabled: !announcementsDisabled && !shouldHideOnboardingPromos }) ?? {
    dismiss() {}, isEligible: false, isLoading: false, openGiftCredits() {},
  }) as EntryPointCandidate;
  const externalImportEnabled = !announcementsDisabled && (voiceStart == null || voiceAvailable === false);
  const externalImport = (useBrowserProfileImportCandidate?.({ enabled: externalImportEnabled }) ?? {
    dismiss() {}, isEligible: false, isLoading: false, markShown() {}, openImport() {},
  }) as EntryPointCandidate & { providerId?: string };
  const replay = (useReplayCandidate?.({ enabled: !announcementsDisabled }) ?? {
    dismiss() {}, isEligible: false, isLoading: false, markShown() {}, replay() {},
  }) as EntryPointCandidate;
  const worktreeEnabled = !announcementsDisabled && !shouldHideOnboardingPromos &&
    !gift.isEligible && !gift.isLoading &&
    (voiceStart == null || voiceAvailable === false) &&
    !externalImport.isEligible && !externalImport.isLoading;
  const worktree = useWorktreeOnboardingCandidate?.({
    enabled: worktreeEnabled,
    entryPoint,
    isLocalModeRemote,
  }) ?? { isEligible: false, isLoading: false };
  const historyStatus = computerHistoryStatusSignal == null ? "ineligible" : useSignalValue?.(computerHistoryStatusSignal);
  const editor = useComposerEditor?.();
  const beaconCandidate = useBeaconCandidate(beaconProduct);
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
    historyEntry,
    replayEntry,
  ];
  if (announcementsDisabled) return null;
  if (beaconProduct == null) return jsx.jsx(AnnouncementEntries, { entries, trackVisibility: false });
  const allowBeaconAfterOnboarding = !shouldHideOnboardingPromos ||
    beaconCandidate.beacon?.custom_fields?.show_after_onboarding === true;
  const beaconEntry: AnnouncementEntry = {
    isEligible: allowBeaconAfterOnboarding && beaconCandidate.isEligible,
    isLoading: allowBeaconAfterOnboarding && beaconCandidate.isLoading,
    content: jsx.jsx(BeaconContent, {
      candidate: beaconCandidate,
      editor,
      product: beaconProduct,
      startRealtimeVoice: voiceStart,
    }),
  };
  const vanillaEntries = beaconCandidate.shouldSuppressVanillaPromos === true
    ? entries.map((entry) => ({ ...entry, isEligible: false, isLoading: false }))
    : entries;
  return jsx.jsx(AnnouncementEntries, {
    entries: [beaconEntry, ...vanillaEntries],
    trackVisibility: false,
  });
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
  const sourceContext = homeAnnouncementSourceContext == null
    ? "default"
    : React.useContext<string>(homeAnnouncementSourceContext);
  const hideFirstNewThreadOnboardingPromos = hideFirstNewThreadOnboardingPromosSignal == null
    ? false
    : useSignalValue?.(hideFirstNewThreadOnboardingPromosSignal) === true;
  const hidePromos = shouldHideHomePromos?.({
    hideFirstNewThreadOnboardingPromos,
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
      sourceContext === "default"
        ? jsx.jsx(HomeAnnouncementCandidates, {
            beaconProduct,
            entryPoint,
            isLocalModeRemote,
            shouldHideOnboardingPromos: hidePromos,
          })
        : null,
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
  const multiAgent = useMultiAgentAnnouncementEligibility();
  const beaconCandidate = useBeaconCandidate("codex");
  const allowVanillaPromos = beaconCandidate.shouldSuppressVanillaPromos !== true;
  const allowBeaconAfterOnboarding = !shouldHideOnboardingPromos ||
    beaconCandidate.beacon?.custom_fields?.show_after_onboarding === true;
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
      isEligible: allowBeaconAfterOnboarding && beaconCandidate.isEligible,
      isLoading: allowBeaconAfterOnboarding && beaconCandidate.isLoading,
      content: beaconContent,
    },
    {
      ...multiAgent,
      isEligible: !shouldHideOnboardingPromos && allowVanillaPromos && multiAgent.isEligible,
      isLoading: !shouldHideOnboardingPromos && allowVanillaPromos && multiAgent.isLoading,
    },
    {
      isEligible: !shouldHideOnboardingPromos && allowVanillaPromos && fastMode.isEligible,
      isLoading: !shouldHideOnboardingPromos && allowVanillaPromos && fastMode.isLoading,
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
