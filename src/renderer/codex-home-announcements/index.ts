// codex-home-announcements —— 兼容 Home composer 公告与候选渲染链。
// 原版：app/webview/assets/codex-home-announcements-327826cf904d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as homeBeaconChunk from "@rchunk/home-beacon";
import * as composerSlotChunk from "@rchunk/composer-announcement-slot";
import * as modalSourceChunk from "@rchunk/announcement-modal-source-bridge";
import * as renewalChunk from "@rchunk/workspace-renewal-payment";
import * as beaconAnnouncementChunk from "@rchunk/codex-app-home-beacon-announcement-core";
import * as announcementStateChunk from "@rchunk/home-announcement-state";
import * as bannerChunk from "@rchunk/banner";
import * as composerCandidatesChunk from "@rchunk/home-composer-announcement-candidates";

void runtimeChunk;
void modalSourceChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const homeBeacon = homeBeaconChunk as Record<string, any>;
const composerSlot = composerSlotChunk as Record<string, any>;
const renewal = renewalChunk as Record<string, any>;
const beaconAnnouncement = beaconAnnouncementChunk as Record<string, any>;
const announcementState = announcementStateChunk as Record<string, any>;
const banner = bannerChunk as Record<string, any>;
const composerCandidates = composerCandidatesChunk as Record<string, any>;

interface Candidate {
  id?: string;
  content: unknown;
  isEligible: boolean;
  isLoading: boolean;
  pageContextClaim?: unknown;
  trackVisibility?: boolean;
}

let React: any;
let jsx: any;
let initialized = false;
function initializeCodexHomeAnnouncements(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  homeBeacon.r?.();
  composerSlot.n?.();
  renewal.n?.();
  beaconAnnouncement.r?.();
  announcementState.t?.();
  React = appShared.e6?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function renderCandidates({
  entries,
  fallbackContent,
  renderCandidates: render,
  trackVisibility = true,
}: Record<string, any>): unknown {
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
  const Host = composerSlot.t ?? "div";
  return jsx.jsx(Host, { area: "home", candidates });
}

function CandidateStack({
  entries,
  fallbackContent,
  renderCandidates: render,
  renderSlot,
  trackVisibility = true,
}: Record<string, any>): unknown {
  const renewalCandidate = renewal.n?.() ?? {
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

function useFastModeCandidate(): Record<string, any> {
  const override = appInitial.D0t?.()?.fastModeCandidate;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  return (
    override ?? {
      content: null,
      fastModeModel: null,
      isEligible: false,
      isLoading: false,
      isSubmitting,
      setHasSeenFastModeHomeBanner() {},
      setIsSubmitting,
      setServiceTier: async () => {},
      intl: appShared.n4?.(),
    }
  );
}

function FastModeBanner(props: Record<string, any>): unknown {
  const Shell = appPrimary.Sm ?? "div";
  const FormattedMessage = appShared.Y2;
  const scope = appShared.LX?.(appShared.ZI);
  const enable = () => {
    if (props.fastModeModel == null) return;
    props.setIsSubmitting(true);
    Promise.resolve(
      props.setServiceTier(
        appShared.kz?.(props.fastModeModel)?.id ?? "priority",
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
      disabled: props.isSubmitting,
    },
    dismissAction: {
      ariaLabel: props.intl.formatMessage({
        id: "codex.fastModeHomeBanner.dismissLabel",
        defaultMessage: "Dismiss Fast mode banner",
        description:
          "Accessible label for dismissing the Fast mode home banner",
      }),
      icon: appShared.ig,
      disabled: props.isSubmitting,
      onClick: () => {
        appInitial.xpn?.(scope, appShared.vj, {});
        props.setHasSeenFastModeHomeBanner(true);
      },
    },
  });
}

function useBeacon(product?: string): Record<string, any> {
  return (
    homeBeacon.t?.(product, { shouldSuppressFocusedModal: () => false }) ?? {
      accountId: null,
      beacon: null,
      isEligible: false,
      isLoading: false,
      shouldSuppressVanillaPromos: false,
    }
  );
}
function BeaconContent({ candidate, product }: Record<string, any>): unknown {
  if (candidate.accountId == null || candidate.beacon == null) return null;
  return jsx.jsx(beaconAnnouncement.t, {
    accountId: candidate.accountId,
    actionAccountId: candidate.accountId,
    analyticsContext: {
      placement: product === "work_tab" ? "work_tab_home" : "homepage",
      productExperience: product === "work_tab" ? "work" : "chat",
      treatment: appInitial.kNt?.(candidate.beacon),
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
}: Record<string, any>): unknown {
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
}: Record<string, any>): unknown {
  const pathname = appInitial.i_n?.()?.pathname ?? "/";
  const hidePromos = appInitial.sbt?.({
    hideFirstNewThreadOnboardingPromos: false,
    pathname,
  });
  const product =
    homeComposerMode === "chat"
      ? "chatgpt"
      : homeComposerMode === "work"
        ? "work_tab"
        : undefined;
  const className = appShared.m4?.(
    "empty:hidden",
    entryPoint === "codex" && "electron:mx-[var(--home-composer-inline-inset)]",
  );
  const customGpt =
    selectedCustomGptId == null
      ? null
      : jsx.jsx("div", {
          className,
          children: jsx.jsx(banner.t, { gizmoId: selectedCustomGptId }),
        });
  const CandidateSource = composerCandidates.HomeComposerAnnouncementCandidates;
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
}: Record<string, any>): unknown {
  void homeRunLocationRemoteProject;
  void includeGitCheckoutWarning;
  const fast = useFastModeCandidate();
  const beaconCandidate = useBeacon("codex");
  const suppress = beaconCandidate.shouldSuppressVanillaPromos;
  const entries: Candidate[] = [
    appInitial.CNt?.() ?? {
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
    announcementState.u?.() ?? {
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
