// home-announcement-state —— Home 页多代理与限流重置公告的状态和内容。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type {
  JsxRuntime,
  MaitaiScopeApi,
  ReactRuntime,
  ReadableSignal,
} from "@rchunk/app-shared";

void runtimeChunk;

const {
  AM: multiAgentBannerExposedEvent,
  BX: useSignalFamilyValue,
  HX: useSignalValue,
  I3: jsxRuntime,
  LX: useSignalScope,
  OM: multiAgentBannerActionEvent,
  Y2: FormattedMessage,
  ZI: applicationScope,
  e6: reactRuntime,
  ig: DismissIcon,
  kM: multiAgentBannerDismissedEvent,
  n4: useIntl,
} = appSharedChunk;
const {
  $M: getRateLimitAnnouncementConfig,
  Gfn: useComposerPrefill,
  Kot: MultiAgentIcon,
  N6t: useAccountIdentity,
  Uzt: openManagedDialog,
  cnt: useFeatureMutation,
  dun: createPersistedSignal,
  f0t: usageQuerySignal,
  i5: getUsageLimitStatus,
  jyt: getHostInfo,
  kI: useCurrentHost,
  lfn: getRateLimitExperiment,
  n6: RateLimitResetIcon,
  nN: useMultiAgentFeatureEnabled,
  ngn: getPersistedFallback,
  ont: hostFeaturesQueryFamily,
  ugn: localHostId,
  uht: useAccountQuery,
  vP: RateLimitResetDialog,
  xpn: logProductEvent,
} = appInitialChunk;
const { Sm: Banner } = appPrimaryChunk;

const MULTI_AGENT_FEATURE = "multi_agent";
const MULTI_AGENT_DISMISSED_KEY = "has-seen-multi-agent-composer-banner";
const RATE_LIMIT_DISMISSAL_KEY =
  "rate-limit-reset-home-announcement-dismissal-by-account-id";
const RATE_LIMIT_DISMISSAL_TTL_MS = 86_400_000;

interface RateLimitDismissal {
  dismissedAtMs: number;
}

type RateLimitDismissals = Record<string, RateLimitDismissal>;

let React: ReactRuntime | null = null;
let jsx: JsxRuntime | null = null;
let multiAgentDismissedState: ReadableSignal<boolean> | null = null;
let rateLimitDismissalState: ReadableSignal<RateLimitDismissals> | null = null;
let initialized = false;

interface AnnouncementEligibility {
  isEligible: boolean;
  isLoading: boolean;
}

interface RateLimitResetEligibility extends AnnouncementEligibility {
  availableCount: number;
  dismiss(): void;
}

interface MultiAgentHomeAnnouncementProps {
  onTryNow?: () => void;
}

interface RateLimitResetHomeAnnouncementProps {
  availableCount: number;
  onDismiss(): void;
}

interface RateLimitResetBannerProps {
  onDismiss(): void;
  onSeeResets(): void;
}

function initializeRuntime(): void {
  if (initialized) return;
  initialized = true;
  React = (typeof reactRuntime === "function"
    ? reactRuntime()
    : reactRuntime);
  jsx = typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime;
  multiAgentDismissedState = createPersistedSignal(
    MULTI_AGENT_DISMISSED_KEY,
    false,
  );
  rateLimitDismissalState = createPersistedSignal(
    RATE_LIMIT_DISMISSAL_KEY,
    {},
  );
}

function initializeAnnouncementClassification(): void {
  initializeRuntime();
}

function initializeAnnouncementPresentation(): void {
  initializeRuntime();
}

function initializeMultiAgentAnnouncementState(): void {
  initializeRuntime();
}

function initializeMultiAgentAnnouncementContent(): void {
  initializeRuntime();
}

function initializeHomeAnnouncementShell(): void {
  initializeRuntime();
}

function initializeAppUpsellAnnouncementState(): void {
  initializeRuntime();
}

function initializeRateLimitResetAnnouncementContent(): void {
  initializeRuntime();
}

function initializeRateLimitResetAnnouncementState(): void {
  initializeRuntime();
}

function resolveScope(): MaitaiScopeApi<Record<string, unknown>> {
  return useSignalScope(applicationScope);
}

function getMultiAgentDismissedSignal(): ReadableSignal<boolean> {
  initializeRuntime();
  if (multiAgentDismissedState == null) {
    throw new Error("Multi-agent dismissal signal failed to initialize");
  }
  return multiAgentDismissedState;
}

function getRateLimitDismissalSignal(): ReadableSignal<RateLimitDismissals> {
  initializeRuntime();
  if (rateLimitDismissalState == null) {
    throw new Error("Rate-limit dismissal signal failed to initialize");
  }
  return rateLimitDismissalState;
}

function getAnnouncementRuntime(): {
  React: ReactRuntime;
  jsx: JsxRuntime;
} {
  initializeRuntime();
  if (React == null || jsx == null) {
    throw new Error("Home announcement runtime failed to initialize");
  }
  return { React, jsx };
}

function useMultiAgentAnnouncementEligibility(): AnnouncementEligibility {
  initializeMultiAgentAnnouncementState();
  const currentHost = useCurrentHost();
  const hostId = getHostInfo(currentHost).hostId;
  const featureEnabled = useMultiAgentFeatureEnabled();
  const seen =
    useSignalValue(getMultiAgentDismissedSignal()) ??
    getPersistedFallback(MULTI_AGENT_DISMISSED_KEY, false) ??
    false;
  const query = useSignalFamilyValue(hostFeaturesQueryFamily, hostId);
  const hasEnabledMultiAgent =
    query.data?.some?.(
      (feature) =>
        feature.name === MULTI_AGENT_FEATURE && feature.enabled === true,
    ) ?? false;

  return {
    isEligible: featureEnabled && !seen && !hasEnabledMultiAgent,
    isLoading: featureEnabled && !seen && query.isLoading === true,
  };
}

function message(
  id: string,
  defaultMessage: string,
  description: string,
): unknown {
  const { jsx } = getAnnouncementRuntime();
  return jsx.jsx(FormattedMessage, { id, defaultMessage, description });
}

function analytics(
  scope: MaitaiScopeApi<Record<string, unknown>>,
  event: unknown,
  payload: Record<string, unknown>,
): void {
  logProductEvent(scope, event, payload);
}

function MultiAgentHomeAnnouncement({
  onTryNow,
}: MultiAgentHomeAnnouncementProps): unknown {
  initializeMultiAgentAnnouncementContent();
  const { React, jsx } = getAnnouncementRuntime();
  const scope = resolveScope();
  const intl = useIntl();
  const [, setComposerPrefill] = useComposerPrefill("composer_prefill");
  const seen =
    useSignalValue(getMultiAgentDismissedSignal()) ??
    getPersistedFallback(MULTI_AGENT_DISMISSED_KEY, false) ??
    false;
  const [submitting, setSubmitting] = React.useState(false);
  const exposed = React.useRef(false);

  React.useEffect(() => {
    if (!seen && !exposed.current) {
      exposed.current = true;
      analytics(scope, multiAgentBannerExposedEvent, {});
    }
  }, [scope, seen]);

  if (seen) return null;

  const tryNow = () => {
    setSubmitting(true);
    const formattedPrompt = intl.formatMessage({
      id: "composer.multiAgentBanner.tryNow.prompt",
      defaultMessage: "Spawn a subagent to explore this repo.",
      description:
        "Prompt inserted when the user clicks Try now on the multi-agent composer banner",
    });
    const prompt =
      typeof formattedPrompt === "string"
        ? formattedPrompt
        : "Spawn a subagent to explore this repo.";
    analytics(scope, multiAgentBannerActionEvent, { action: "try_now" });
    const mutation = useFeatureMutation({ hostId: localHostId });
    const request = mutation.mutateAsync({
      featureName: MULTI_AGENT_FEATURE,
      enabled: true,
    });
    Promise.resolve(request).finally(() => {
      if (onTryNow != null) onTryNow();
      else setComposerPrefill({ text: prompt });
      scope.set(getMultiAgentDismissedSignal(), true);
      setSubmitting(false);
    });
  };
  const dismiss = () => {
    analytics(scope, multiAgentBannerDismissedEvent, {});
    scope.set(getMultiAgentDismissedSignal(), true);
  };

  return jsx.jsx(Banner, {
    title: message(
      "codex.multiAgentComposerBanner.title",
      "Subagents in Codex",
      "Title shown in the multi-agent composer banner",
    ),
    description: message(
      "codex.multiAgentComposerBanner.body",
      "Delegate work to subagents that work in parallel. Note: may increase token usage.",
      "Body shown in the multi-agent composer banner",
    ),
    leadingVisual: jsx.jsx(MultiAgentIcon, { className: "icon-sm" }),
    primaryAction: {
      label: message(
        "codex.multiAgentComposerBanner.cta.primary",
        "Try now",
        "Primary CTA shown in the multi-agent composer banner",
      ),
      onClick: tryNow,
      disabled: submitting,
    },
    dismissAction: {
      ariaLabel:
        intl.formatMessage({
          id: "codex.multiAgentComposerBanner.dismissLabel",
          defaultMessage: "Dismiss subagent banner",
          description:
            "Accessible label for dismissing the multi-agent composer banner",
        }) ?? "Dismiss subagent banner",
      icon: DismissIcon,
      onClick: dismiss,
      disabled: submitting,
    },
  });
}

function RateLimitResetHomeAnnouncement({
  availableCount,
  onDismiss,
}: RateLimitResetHomeAnnouncementProps): unknown {
  initializeRateLimitResetAnnouncementContent();
  const { jsx } = getAnnouncementRuntime();
  const scope = resolveScope();
  const openResets = () => {
    openManagedDialog(scope, RateLimitResetDialog, {
      initialAvailableCount: availableCount,
      isRateLimitReached: false,
      onResetComplete() {},
    });
  };
  return jsx.jsx(RateLimitResetBanner, { onDismiss, onSeeResets: openResets });
}

function RateLimitResetBanner({
  onDismiss,
  onSeeResets,
}: RateLimitResetBannerProps): unknown {
  const { jsx } = getAnnouncementRuntime();
  const intl = useIntl();
  return jsx.jsx(Banner, {
    title: message(
      "codex.rateLimitResetHomeBanner.title",
      "You have a new rate limit reset available",
      "Title shown in the home banner when a Codex rate limit reset credit is available",
    ),
    description: message(
      "codex.rateLimitResetHomeBanner.description",
      "You were granted a rate limit reset that will expire in 30 days.",
      "Description shown in the home banner when a Codex rate limit reset credit is available",
    ),
    leadingVisual: jsx.jsx(RateLimitResetIcon, { className: "size-8" }),
    primaryAction: {
      label: message(
        "codex.rateLimitResetHomeBanner.seeResets",
        "See resets",
        "Button label that opens the available Codex rate limit resets modal",
      ),
      onClick: onSeeResets,
    },
    dismissAction: {
      ariaLabel:
        intl.formatMessage({
          id: "codex.rateLimitResetHomeBanner.dismiss",
          defaultMessage: "Dismiss rate limit reset banner",
          description:
            "Accessible label for dismissing the Codex rate limit reset home banner",
        }) ?? "Dismiss rate limit reset banner",
      icon: DismissIcon,
      onClick: onDismiss,
    },
  });
}

function useRateLimitResetAnnouncement(): RateLimitResetEligibility {
  initializeRateLimitResetAnnouncementState();
  const scope = resolveScope();
  const identity = useAccountIdentity();
  const accountId = identity.accountId ?? null;
  const accountQuery = useAccountQuery();
  const usageQuery = useSignalValue(usageQuerySignal);
  const availableCount =
    usageQuery.data?.rate_limit_reset_credits?.available_count ?? 0;
  const usage = getUsageLimitStatus(usageQuery.data ?? null);
  const dismissalByAccount =
    useSignalValue(getRateLimitDismissalSignal()) ?? {};
  const dismissal = accountId == null ? null : dismissalByAccount[accountId];
  const threshold =
    getRateLimitAnnouncementConfig(getRateLimitExperiment(), {
      currentAccount: accountQuery.data,
      disableExposureLog: true,
    }).config.remainingThresholdPercent;
  const dismiss = () => {
    if (accountId == null) return;
    scope.set(
      getRateLimitDismissalSignal(),
      (current: RateLimitDismissals) => ({
        ...current,
        [accountId]: { dismissedAtMs: Date.now() },
      }),
    );
  };
  const dismissalExpired =
    dismissal == null ||
    Date.now() - dismissal.dismissedAtMs >= RATE_LIMIT_DISMISSAL_TTL_MS;

  return {
    availableCount,
    dismiss,
    isEligible:
      accountId != null &&
      availableCount > 0 &&
      usage != null &&
      usage.remainingPercent <= threshold &&
      dismissalExpired,
    isLoading:
      identity.isLoading === true ||
      accountQuery.isLoading === true ||
      (usageQuery.data == null && usageQuery.isLoading === true),
  };
}

export {
  initializeAppUpsellAnnouncementState as a,
  initializeMultiAgentAnnouncementContent as c,
  initializeAnnouncementPresentation as d,
  initializeAnnouncementClassification as f,
  initializeRateLimitResetAnnouncementContent as i,
  initializeMultiAgentAnnouncementState as l,
  useRateLimitResetAnnouncement as n,
  initializeHomeAnnouncementShell as o,
  RateLimitResetHomeAnnouncement as r,
  MultiAgentHomeAnnouncement as s,
  initializeRateLimitResetAnnouncementState as t,
  useMultiAgentAnnouncementEligibility as u,
};
