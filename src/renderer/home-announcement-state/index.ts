// home-announcement-state —— Home 页多代理与限流重置公告的状态和内容。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

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
} = appShared;

const MULTI_AGENT_FEATURE = "multi_agent";
const MULTI_AGENT_DISMISSED_KEY = "has-seen-multi-agent-composer-banner";
const RATE_LIMIT_DISMISSAL_KEY =
  "rate-limit-reset-home-announcement-dismissal-by-account-id";
const RATE_LIMIT_DISMISSAL_TTL_MS = 86_400_000;

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value): [
    Value,
    (value: Value | ((current: Value) => Value)) => void,
  ];
}

interface JsxRuntime {
  jsx(component: unknown, props: unknown): unknown;
}

interface AnnouncementScope {
  set?(signal: unknown, value: unknown): void;
}

interface MultiAgentFeature {
  enabled?: boolean;
  name?: string;
}

interface MultiAgentFeatureQuery {
  data?: MultiAgentFeature[];
  isLoading?: boolean;
}

interface UsageQuery {
  data?: {
    rate_limit_reset_credits?: { available_count?: number };
  } | null;
  isLoading?: boolean;
}

interface RateLimitDismissal {
  dismissedAtMs: number;
}

type RateLimitDismissals = Record<string, RateLimitDismissal>;

let React: ReactRuntime;
let jsx: JsxRuntime;
let multiAgentDismissedState: unknown = Symbol(MULTI_AGENT_DISMISSED_KEY);
let rateLimitDismissalState: unknown = Symbol(RATE_LIMIT_DISMISSAL_KEY);
let initialized = false;

interface AnnouncementEligibility {
  isEligible: boolean;
  isLoading: boolean;
}

interface RateLimitResetEligibility extends AnnouncementEligibility {
  availableCount: number;
  dismiss(): void;
}

function initializeRuntime(): void {
  if (initialized) return;
  initialized = true;
  React = (typeof reactRuntime === "function"
    ? reactRuntime()
    : reactRuntime) as ReactRuntime;
  jsx = (typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime) as JsxRuntime;
  multiAgentDismissedState =
    appInitial.dun?.(MULTI_AGENT_DISMISSED_KEY, false) ??
    multiAgentDismissedState;
  rateLimitDismissalState =
    appInitial.dun?.(RATE_LIMIT_DISMISSAL_KEY, {}) ?? rateLimitDismissalState;
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

function resolveScope(): AnnouncementScope {
  return (
    useSignalScope?.(applicationScope) ?? useSignalScope?.(appInitial.kht) ?? {}
  );
}

function useMultiAgentAnnouncementEligibility(): AnnouncementEligibility {
  initializeMultiAgentAnnouncementState();
  const currentHost = appInitial.kI?.();
  const hostId = appInitial.jyt?.(currentHost)?.hostId;
  const featureEnabled = appInitial.nN?.() === true;
  const seen =
    (useSignalValue?.(multiAgentDismissedState) as boolean | undefined) ??
    appInitial.ngn?.(MULTI_AGENT_DISMISSED_KEY, false) ??
    false;
  const query =
    (useSignalFamilyValue?.(appInitial.ont, hostId) as
      | MultiAgentFeatureQuery
      | undefined) ?? {};
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
  return FormattedMessage == null
    ? defaultMessage
    : jsx.jsx(FormattedMessage, { id, defaultMessage, description });
}

function analytics(
  scope: AnnouncementScope,
  event: unknown,
  payload: object,
): void {
  appInitial.xpn?.(scope, event, payload);
}

function MultiAgentHomeAnnouncement({
  onTryNow,
}: {
  onTryNow?: () => void;
}): unknown {
  initializeMultiAgentAnnouncementContent();
  const scope = resolveScope();
  const intl = useIntl?.();
  const [, setComposerPrefill] = appInitial.Gfn?.("composer_prefill") ?? [
    null,
    null,
  ];
  const seen =
    (useSignalValue?.(multiAgentDismissedState) as boolean | undefined) ??
    appInitial.ngn?.(MULTI_AGENT_DISMISSED_KEY, false) ??
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
    const prompt =
      intl?.formatMessage?.({
        id: "composer.multiAgentBanner.tryNow.prompt",
        defaultMessage: "Spawn a subagent to explore this repo.",
        description:
          "Prompt inserted when the user clicks Try now on the multi-agent composer banner",
      }) ?? "Spawn a subagent to explore this repo.";
    analytics(scope, multiAgentBannerActionEvent, { action: "try_now" });
    const mutation = appInitial.cnt?.({ hostId: appInitial.ugn });
    const request = mutation?.mutateAsync?.({
      featureName: MULTI_AGENT_FEATURE,
      enabled: true,
    });
    Promise.resolve(request).finally(() => {
      if (onTryNow != null) onTryNow();
      else setComposerPrefill?.({ text: prompt });
      scope?.set?.(multiAgentDismissedState, true);
      setSubmitting(false);
    });
  };
  const dismiss = () => {
    analytics(scope, multiAgentBannerDismissedEvent, {});
    scope?.set?.(multiAgentDismissedState, true);
  };

  const Banner = appPrimary.Sm ?? "div";
  const MultiAgentIcon = appInitial.Kot ?? "span";
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
        intl?.formatMessage?.({
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
}: {
  availableCount: number;
  onDismiss(): void;
}): unknown {
  initializeRateLimitResetAnnouncementContent();
  const scope = resolveScope();
  const openResets = () => {
    appInitial.Uzt?.(scope, appInitial.vP, {
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
}: {
  onDismiss(): void;
  onSeeResets(): void;
}): unknown {
  const intl = useIntl?.();
  const Banner = appPrimary.Sm ?? "div";
  const ResetIcon = appInitial.n6 ?? "span";
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
    leadingVisual: jsx.jsx(ResetIcon, { className: "size-8" }),
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
        intl?.formatMessage?.({
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
  const identity = appInitial.N6t?.() ?? {};
  const accountId = identity.accountId ?? null;
  const accountQuery = appInitial.uht?.() ?? {};
  const usageQuery =
    (useSignalValue?.(appInitial.f0t) as UsageQuery | undefined) ?? {};
  const availableCount =
    usageQuery.data?.rate_limit_reset_credits?.available_count ?? 0;
  const usage = appInitial.i5?.(usageQuery.data ?? null) ?? null;
  const dismissalByAccount =
    (useSignalValue?.(rateLimitDismissalState) as
      | RateLimitDismissals
      | undefined) ?? {};
  const dismissal = accountId == null ? null : dismissalByAccount[accountId];
  const threshold =
    appInitial.$M?.(appInitial.lfn?.(), {
      currentAccount: accountQuery.data,
      disableExposureLog: true,
    })?.config?.remainingThresholdPercent ?? 10;
  const dismiss = () => {
    if (accountId == null) return;
    scope?.set?.(
      rateLimitDismissalState,
      (current: Record<string, unknown>) => ({
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
