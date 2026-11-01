// codex-home-announcements —— 兼容 Home composer 公告与候选渲染链。
// 原版：app/webview/assets/codex-home-announcements-327826cf904d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as homeBeaconChunk from "@rchunk/home-beacon";
import * as composerSlotChunk from "@rchunk/composer-announcement-slot";
import * as modalSourceChunk from "@rchunk/announcement-modal-source-bridge";
import * as renewalChunk from "@rchunk/workspace-renewal-payment";
import * as beaconAnnouncementChunk from "@rchunk/codex-app-home-beacon-announcement-core";
import * as announcementStateChunk from "@rchunk/home-announcement-state";
import * as bannerChunk from "@rchunk/banner";
import * as composerCandidatesChunk from "@rchunk/home-composer-announcement-candidates";
import type {
  IntlShape,
  JsxRuntime,
  ReactRuntime,
  ServiceTierModel,
} from "@rchunk/app-shared";
import type { HomeBeaconResult } from "@rchunk/home-beacon";

void runtimeChunk;
void modalSourceChunk;
const {
  $3: initializeJsxRuntimeLazy,
  I3: jsxRuntime,
  K2: initializeIntl,
  LX: useSignalScope,
  Y2: FormattedMessage,
  ZI: applicationScope,
  e6: reactRuntime,
  ig: DismissIcon,
  kz: findFastServiceTier,
  m4: classNames,
  n4: useIntl,
  vj: fastModeBannerDismissedEvent,
} = appSharedChunk;
const {
  CNt: useRateLimitResetCandidate,
  D0t: useHomeAnnouncementOverrides,
  i_n: useRouterLocation,
  kNt: getBeaconTreatment,
  sbt: shouldHideHomePromos,
  vN: FastModeIcon,
  xpn: logAnalyticsEvent,
} = appInitialChunk;
const {
  r: useHomeBeacon,
  t: initializeHomeBeacon,
} = homeBeaconChunk;
const {
  n: initializeComposerAnnouncementSlot,
  t: ComposerAnnouncementSlot,
} = composerSlotChunk;
const { n: useWorkspaceRenewalCandidate } = renewalChunk;
const {
  r: initializeBeaconAnnouncement,
  t: BeaconAnnouncement,
} = beaconAnnouncementChunk;
const {
  t: initializeHomeAnnouncementState,
  u: useMultiAgentAnnouncementEligibility,
} = announcementStateChunk;
const { Banner: AnnouncementShell } = (
  initializeHomeAnnouncementState as typeof initializeHomeAnnouncementState & {
    presentation: { Banner: (props: Record<string, unknown>) => unknown };
  }
).presentation;
const { t: CustomGptBanner } = bannerChunk;
const { HomeComposerAnnouncementCandidates } = composerCandidatesChunk;

interface Candidate {
  id?: string;
  content?: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
  trackVisibility?: boolean;
}

type CandidateRenderer = (candidates: Candidate[]) => unknown;

interface RenderCandidatesProps {
  entries: Candidate[];
  fallbackContent?: unknown;
  renderCandidates?: CandidateRenderer;
  trackVisibility?: boolean;
}

interface CandidateStackProps extends Omit<RenderCandidatesProps, "entries"> {
  entries?: Candidate[] | null;
  renderSlot?: (entries: Candidate[]) => unknown;
}

interface FastModeCandidate extends Candidate {
  fastModeModel: ServiceTierModel | null;
  intl: IntlShape;
  isSubmitting: boolean;
  setHasSeenFastModeHomeBanner(seen: boolean): void;
  setIsSubmitting(
    value: boolean | ((current: boolean) => boolean),
  ): void;
  setServiceTier(
    tier: string,
    source: "home_banner",
  ): Promise<unknown> | unknown;
}

interface BeaconContentProps {
  candidate: HomeBeaconResult;
  product?: string;
}

interface HomeAnnouncementCompositionProps {
  entries: Candidate[];
  fallbackContent?: unknown;
  product?: string;
  renderCandidates?: CandidateRenderer;
  shouldHideOnboardingPromos: boolean;
}

interface HomeComposerAnnouncementsProps {
  entryPoint: string;
  homeComposerMode: "chat" | "work" | string;
  renderCandidates?: CandidateRenderer;
  selectedCustomGptId?: string | null;
}

interface CodexHomeAnnouncementsProps {
  composerEntries?: Candidate[];
  fallbackContent?: unknown;
  homeRunLocationRemoteProject?: unknown;
  includeGitCheckoutWarning?: boolean;
  renderCandidates?: CandidateRenderer;
  shouldHideOnboardingPromos: boolean;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeCodexHomeAnnouncements(): void {
  if (initialized) return;
  initializeJsxRuntimeLazy?.();
  initializeIntl?.();
  initializeHomeBeacon?.();
  initializeComposerAnnouncementSlot?.();
  initializeBeaconAnnouncement?.();
  initializeHomeAnnouncementState?.();
  React = typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  jsx = typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime;
  initialized = true;
}

function renderCandidates({
  entries,
  fallbackContent,
  renderCandidates: render,
  trackVisibility = true,
}: RenderCandidatesProps): unknown {
  const candidates = [
    ...entries.map((entry: Candidate) => ({ ...entry, trackVisibility })),
    {
      id: "dictation-first-use",
      isEligible: fallbackContent != null,
      isLoading: false,
      content: fallbackContent,
    },
  ];
  if (render != null) return render(candidates);
  const Host = ComposerAnnouncementSlot ?? "div";
  return jsx.jsx(Host, { area: "home", candidates });
}

function CandidateStack({
  entries,
  fallbackContent,
  renderCandidates: render,
  renderSlot,
  trackVisibility = true,
}: CandidateStackProps): unknown {
  const renewalCandidate = useWorkspaceRenewalCandidate?.() ?? {
    isEligible: false,
    isLoading: false,
    content: null,
  };
  const all = entries == null ? null : [renewalCandidate, ...entries];
  if (all == null)
    return renewalCandidate.isLoading
      ? null
      : (renewalCandidate.content ?? fallbackContent ?? null);
  return (
    renderSlot?.(all) ??
    jsx.jsx(renderCandidates, {
      entries: all,
      fallbackContent,
      renderCandidates: render,
      trackVisibility,
    })
  );
}

function useFastModeCandidate(): FastModeCandidate {
  const override = useHomeAnnouncementOverrides?.()?.fastModeCandidate;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const intl = useIntl();
  if (override != null)
    return { ...override, intl, isSubmitting, setIsSubmitting };
  return {
    content: null,
    fastModeModel: null,
    isEligible: false,
    isLoading: false,
    isSubmitting,
    setHasSeenFastModeHomeBanner() {},
    setIsSubmitting,
    setServiceTier: async () => {},
    intl,
  };
}

function FastModeBanner(props: FastModeCandidate): unknown {
  const Shell = AnnouncementShell ?? "div";
  const scope = useSignalScope(applicationScope);
  const enable = () => {
    if (props.fastModeModel == null) return;
    props.setIsSubmitting(true);
    Promise.resolve(
      props.setServiceTier(
        findFastServiceTier(props.fastModeModel)?.id ?? "priority",
        "home_banner",
      ),
    ).finally(() => {
      props.setHasSeenFastModeHomeBanner(true);
      props.setIsSubmitting(false);
    });
  };
  return jsx.jsx(Shell, {
    title: jsx.jsx(FormattedMessage, {
      id: "codex.fastModeHomeBanner.title",
      defaultMessage: "Enable Fast mode",
      description: "Title shown in the Fast mode home banner",
    }),
    description: props.content,
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
      disabled: props.isSubmitting,
    },
    dismissAction: {
      ariaLabel: props.intl.formatMessage({
        id: "codex.fastModeHomeBanner.dismissLabel",
        defaultMessage: "Dismiss Fast mode banner",
        description:
          "Accessible label for dismissing the Fast mode home banner",
      }),
      icon: DismissIcon,
      disabled: props.isSubmitting,
      onClick: () => {
        logAnalyticsEvent?.(scope, fastModeBannerDismissedEvent, {});
        props.setHasSeenFastModeHomeBanner(true);
      },
    },
  });
}

function useBeacon(product?: string): HomeBeaconResult {
  return (
    useHomeBeacon?.(product, { shouldSuppressFocusedModal: () => false }) ?? {
      accountId: null,
      beacon: null,
      containerBeacon: null,
      isEligible: false,
      isLoading: false,
      shouldSuppressVanillaPromos: false,
    }
  );
}
function BeaconContent({ candidate, product }: BeaconContentProps): unknown {
  if (candidate.accountId == null || candidate.beacon == null) return null;
  return jsx.jsx(BeaconAnnouncement, {
    accountId: candidate.accountId,
    actionAccountId: candidate.accountId,
    analyticsContext: {
      placement: product === "work_tab" ? "work_tab_home" : "homepage",
      productExperience: product === "work_tab" ? "work" : "chat",
      treatment: getBeaconTreatment?.(candidate.beacon),
    },
    beacon: candidate.beacon,
  });
}

function HomeAnnouncementComposition({
  entries,
  fallbackContent,
  product,
  renderCandidates: render,
  shouldHideOnboardingPromos,
}: HomeAnnouncementCompositionProps): unknown {
  const beaconCandidate = useBeacon(product);
  const beaconContent = jsx.jsx(BeaconContent, {
    candidate: beaconCandidate,
    product,
  });
  const suppress = beaconCandidate.shouldSuppressVanillaPromos;
  const vanillaEntries = suppress
    ? entries.map((entry: Candidate) => ({
        ...entry,
        isEligible: false,
        isLoading: false,
      }))
    : entries;
  const beaconEntry = {
    id: "home-beacon",
    content: beaconContent,
    isEligible:
      (!shouldHideOnboardingPromos ||
        beaconCandidate.beacon?.custom_fields?.show_after_onboarding ===
          true) &&
      beaconCandidate.isEligible,
    isLoading:
      (!shouldHideOnboardingPromos ||
        beaconCandidate.beacon?.custom_fields?.show_after_onboarding ===
          true) &&
      beaconCandidate.isLoading,
  };
  return jsx.jsx(CandidateStack, {
    entries: [beaconEntry, ...vanillaEntries],
    fallbackContent,
    renderCandidates: render,
  });
}

function HomeComposerAnnouncements({
  entryPoint,
  homeComposerMode,
  renderCandidates: render,
  selectedCustomGptId,
}: HomeComposerAnnouncementsProps): unknown {
  const pathname = useRouterLocation?.()?.pathname ?? "/";
  const hidePromos = shouldHideHomePromos?.({
    hideFirstNewThreadOnboardingPromos: false,
    pathname,
  });
  const product =
    homeComposerMode === "chat"
      ? "chatgpt"
      : homeComposerMode === "work"
        ? "work_tab"
        : undefined;
  const className = classNames(
    "empty:hidden",
    entryPoint === "codex" && "electron:mx-[var(--home-composer-inline-inset)]",
  );
  const customGpt =
    selectedCustomGptId == null
      ? null
      : jsx.jsx("div", {
          className,
          children: jsx.jsx(CustomGptBanner, { gizmoId: selectedCustomGptId }),
        });
  const CandidateSource = HomeComposerAnnouncementCandidates;
  const content =
    CandidateSource == null
      ? jsx.jsx(HomeAnnouncementComposition, {
          entries: [],
          product,
          renderCandidates: render,
          shouldHideOnboardingPromos: hidePromos,
        })
      : jsx.jsx(CandidateSource, {
          beaconProduct: product,
          entryPoint,
          renderCandidates: render,
          shouldHideOnboardingPromos: hidePromos,
        });
  return selectedCustomGptId == null
    ? jsx.jsx("div", { className, children: content })
    : jsx.jsxs(jsx.Fragment, {
        children: [
          customGpt,
          jsx.jsx(React.Suspense ?? jsx.Fragment, {
            fallback: null,
            children: content,
          }),
        ],
      });
}

function CodexHomeAnnouncements({
  composerEntries = [],
  fallbackContent,
  homeRunLocationRemoteProject,
  includeGitCheckoutWarning,
  renderCandidates: render,
  shouldHideOnboardingPromos,
}: CodexHomeAnnouncementsProps): unknown {
  void homeRunLocationRemoteProject;
  void includeGitCheckoutWarning;
  const fast = useFastModeCandidate();
  const beaconCandidate = useBeacon("codex");
  const suppress = beaconCandidate.shouldSuppressVanillaPromos;
  const entries: Candidate[] = [
    useRateLimitResetCandidate?.() ?? {
      id: "rate-limit-reset",
      isEligible: false,
      isLoading: false,
      content: null,
    },
    {
      id: "home-beacon",
      isEligible: !shouldHideOnboardingPromos && beaconCandidate.isEligible,
      isLoading: !shouldHideOnboardingPromos && beaconCandidate.isLoading,
      content: jsx.jsx(BeaconContent, {
        candidate: beaconCandidate,
        product: "codex",
      }),
    },
    ...(suppress
      ? composerEntries.map((entry: Candidate) => ({
          ...entry,
          isEligible: false,
          isLoading: false,
        }))
      : composerEntries),
    useMultiAgentAnnouncementEligibility?.() ?? {
      id: "multi-agent",
      isEligible: false,
      isLoading: false,
      content: null,
    },
    {
      id: "fast-mode",
      isEligible: !shouldHideOnboardingPromos && !suppress && fast.isEligible,
      isLoading: !shouldHideOnboardingPromos && !suppress && fast.isLoading,
      content:
        fast.content == null ? null : jsx.jsx(FastModeBanner, { ...fast }),
    },
  ];
  return jsx.jsx(CandidateStack, {
    entries,
    fallbackContent,
    renderCandidates: render,
  });
}

function initializeHomeComposition(): void {
  initializeCodexHomeAnnouncements();
}
function initializeCandidateStack(): void {
  initializeCodexHomeAnnouncements();
}
function initializeSharedUi(): void {
  initializeCodexHomeAnnouncements();
}

initializeCodexHomeAnnouncements();
export {
  initializeHomeComposition as a,
  HomeAnnouncementComposition as i,
  HomeComposerAnnouncements as n,
  initializeSharedUi as o,
  initializeCodexHomeAnnouncements as r,
  CodexHomeAnnouncements as t,
};
