// home-beacon —— Home Beacon 的账户资格、选择、抑制与曝光生命周期状态。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
  _Z: releaseSignalFamilyMember,
  e6: reactRuntime,
} = appSharedChunk;
const {
  $Nt: shouldSuppressHomepageTakeover,
  CNt: isHomepageTakeoverBeacon,
  DNt: initializeBeaconPredicates,
  GNt: focusedModalSuppressionSignal,
  JNt: initializeOnboardingState,
  KNt: getSuppressedPageContextClaims,
  M6t: initializeIdentityState,
  N6t: useAccountIdentity,
  ONt: logBeaconLifecycle,
  Qgn: initializeAccountQueries,
  SNt: isBannerBeacon,
  WNt: pageContextClaims,
  YNt: activePageContextClaimsSignal,
  ZNt: pageContextSuppressionEnabledSignal,
  bNt: isContainerBeacon,
  ePt: debugBeaconId,
  iPt: initializeBeaconDebugState,
  i_n: useRouterLocation,
  ifn: initializeTelemetryIdentity,
  lfn: getTelemetrySession,
  mpn: localeSignal,
  nPt: debugBeaconEnabledSignal,
  ppn: initializeBeaconAnalytics,
  rht: initializeAccountState,
  uht: useCurrentAccount,
} = appInitialChunk;
const {
  Dh: initializePageContextAvailability,
  Eh: getPageContextAvailability,
  Fh: defaultShouldSuppressFocusedModal,
  Ih: createBeaconVisitKey,
  Lh: initializeBeaconQuery,
  Mh: initializeBeaconSelection,
  Nh: beaconSelectionFamily,
  Ph: initializeBeaconVisitState,
  Th: PageContext,
  bh: initializeBeaconLifecycle,
  jh: beaconSelectionValueFamily,
  wh: viewedBeaconKeysSignal,
} = appPrimaryChunk;

interface ReactRuntime {
  useContext<Value>(context: unknown): Value;
  useEffect(
    effect: () => void | (() => void),
    dependencies: readonly unknown[],
  ): void;
  useRef<Value>(initialValue: Value): { current: Value };
}

interface HomeBeaconRecord extends Record<string, unknown> {
  beacon_id: string;
  custom_fields?: { show_after_onboarding?: boolean };
}

type BeaconSelection =
  | { status: "idle" | "pending" }
  | { beacon: HomeBeaconRecord; status: "selected" };

interface HomeBeaconResult {
  accountId: string | null;
  beacon: HomeBeaconRecord | null;
  containerBeacon: HomeBeaconRecord | null;
  isEligible: boolean;
  isLoading: boolean;
  shouldSuppressVanillaPromos: boolean;
}

function resolveRuntime<Runtime>(runtimeOrFactory: unknown): Runtime {
  return (typeof runtimeOrFactory === "function"
    ? runtimeOrFactory()
    : runtimeOrFactory) as Runtime;
}

let React: ReactRuntime;
let debugBeacon: HomeBeaconRecord;
let initialized = false;

interface BeaconMessageIdentity {
  conversationId: string;
  messageId: string;
  suppressLifecycle?: boolean;
}

function isBeaconAccountEligible(input: {
  accountId: string | null;
  authMethod: string | null;
  isAuthLoading: boolean;
}): boolean {
  return (
    !input.isAuthLoading &&
    input.authMethod === "chatgpt" &&
    input.accountId != null
  );
}

function beaconExposureKey(
  accountId: string,
  beaconId: string,
  message: BeaconMessageIdentity | null,
): string {
  return message == null
    ? `${accountId}:session:${beaconId}`
    : `${accountId}:${beaconId}:${message.conversationId}:${message.messageId}`;
}

function recordBeaconViewOnce(
  scope: {
    get(signal: unknown): Set<string>;
    set(signal: unknown, update: (current: Set<string>) => Set<string>): void;
  },
  accountId: string,
  beacon: { beacon_id: string },
  message: BeaconMessageIdentity | null,
): boolean {
  initializeHomeBeacon();
  if (message?.suppressLifecycle === true) return false;
  const key = beaconExposureKey(accountId, beacon.beacon_id, message);
  if (scope.get(viewedBeaconKeysSignal).has(key)) return false;
  scope.set(viewedBeaconKeysSignal, (current) => {
    const next = new Set(current);
    next.add(key);
    return next;
  });
  logBeaconLifecycle?.(
    message == null
      ? { beacon, eventType: "view", accountId }
      : { beacon, eventType: "view", metadata: message },
  );
  return true;
}

function useHomeBeacon(
  product = "codex",
  options: { shouldSuppressFocusedModal?: () => boolean } = {},
): HomeBeaconResult {
  initializeHomeBeacon();
  const shouldSuppressFocusedModal =
    options.shouldSuppressFocusedModal ?? defaultShouldSuppressFocusedModal;
  const navigation = useRouterLocation?.() ?? { key: "", pathname: "/" };
  const scope = useSignalScope(applicationScope);
  const identity = useAccountIdentity?.() ?? {};
  const accountQuery = useCurrentAccount?.() ?? {
    data: undefined,
    isLoading: false,
  };
  const session = getTelemetrySession?.();
  const localeState = useSignalValue<{ locale: string }>(localeSignal) ?? {
    locale: "en",
  };
  const debug = useSignalValue<boolean>(debugBeaconEnabledSignal) === true;
  const activeClaims = useSignalValue<unknown>(activePageContextClaimsSignal);
  const focusedModalSuppressed =
    useSignalValue<boolean>(focusedModalSuppressionSignal) === true;
  const pageContextSuppressionEnabled =
    useSignalValue<boolean>(pageContextSuppressionEnabledSignal) === true;
  const pageContext = React.useContext<unknown>(PageContext);
  const telemetryAccountId =
    session?.getContext?.().user?.customIDs?.account_id ?? null;
  const accountId =
    identity.accountId ??
    accountQuery.data?.id ??
    telemetryAccountId ??
    identity.userId ??
    null;
  const canFetch = isBeaconAccountEligible({
    accountId,
    authMethod: identity.authMethod,
    isAuthLoading: identity.isLoading === true,
  });
  const visitKey =
    accountId == null
      ? null
        : createBeaconVisitKey?.({
          accountId,
          locale: localeState.locale,
          navigationKey: navigation.key,
          pathname: navigation.pathname,
          product,
        });
  const selection = (useSignalFamilyValue?.(beaconSelectionValueFamily, {
    accountId,
    locale: localeState.locale,
    pathname: navigation.pathname,
    product,
    shouldFetch: canFetch,
    shouldSuppressFocusedModal,
    visitKey: visitKey ?? "",
  }) ?? { status: "idle" }) as BeaconSelection;

  const cleanupKey = JSON.stringify([
    accountId,
    localeState.locale,
    navigation.pathname,
    product,
    visitKey ?? "",
  ]);
  const cleanupState = React.useRef({
    activeKey: cleanupKey,
    cleanupGeneration: 0,
  });
  React.useEffect(() => {
    const state = cleanupState.current;
    const generation = (state.cleanupGeneration += 1);
    state.activeKey = cleanupKey;
    return () => {
      queueMicrotask(() => {
        if (
          state.cleanupGeneration === generation ||
          state.activeKey !== cleanupKey
        ) {
          releaseSignalFamilyMember?.(scope, beaconSelectionFamily, {
            accountId,
            locale: localeState.locale,
            pathname: navigation.pathname,
            product,
            shouldSuppressFocusedModal: defaultShouldSuppressFocusedModal,
            visitKey: visitKey ?? "",
          });
        }
      });
    };
  }, [
    accountId,
    cleanupKey,
    localeState.locale,
    navigation.pathname,
    product,
    scope,
    visitKey,
  ]);

  const selected = selection.status === "selected" ? selection.beacon : null;
  const homepageTakeoverSuppression =
    !debug &&
    canFetch &&
    shouldSuppressHomepageTakeover?.({
      activeClaims,
      isCurrentHomeBeacon: true,
      isHomepageTakeoverOwner:
        selected != null && isHomepageTakeoverBeacon?.(selected) === true,
      isPageContextUpsellSuppressionEnabled: pageContextSuppressionEnabled,
    });
  const suppressSelected =
    !debug &&
    canFetch &&
    (focusedModalSuppressed || homepageTakeoverSuppression);
  const suppressedClaims =
    !debug &&
    getSuppressedPageContextClaims?.({
      activeClaims,
      isPageContextUpsellSuppressionEnabled: pageContextSuppressionEnabled,
    });
  const shouldSuppressNonLegalBanners =
    suppressedClaims?.has?.(pageContextClaims.NonLegalBanners) === true;

  let candidate = null;
  if (debug) candidate = debugBeacon;
  else if (canFetch && !suppressSelected) candidate = selected;
  let beacon =
    candidate != null && isBannerBeacon?.(candidate) ? candidate : null;
  const containerBeacon =
    candidate != null && isContainerBeacon?.(candidate) ? candidate : null;
  const availability = getPageContextAvailability?.(
    beacon != null && isHomepageTakeoverBeacon?.(beacon) === true,
    pageContext,
  ) ?? { isPending: false, isUnavailable: false };
  if (availability.isPending || availability.isUnavailable) beacon = null;

  const selectionPending = !debug && canFetch && selection.status === "pending";
  const selectionActive =
    !debug &&
    canFetch &&
    (selection.status === "pending" || selection.status === "selected");

  return {
    accountId: debug ? "debug" : accountId,
    beacon,
    containerBeacon,
    isEligible: beacon != null,
    isLoading:
      !debug &&
      (identity.isLoading === true ||
        selectionPending ||
        availability.isPending === true),
    shouldSuppressVanillaPromos:
      identity.isLoading === true ||
      (selectionActive && !availability.isUnavailable) ||
      beacon != null ||
      shouldSuppressNonLegalBanners,
  };
}

function initializeHomeBeacon(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime?.();
  React = resolveRuntime<ReactRuntime>(reactRuntime);
  initializeAccountQueries?.();
  initializeIdentityState?.();
  initializeBeaconPredicates?.();
  initializeBeaconQuery?.();
  initializeBeaconVisitState?.();
  initializeBeaconSelection?.();
  initializeAccountState?.();
  initializeBeaconLifecycle?.();
  initializeBeaconDebugState?.();
  initializePageContextAvailability?.();
  initializeBeaconAnalytics?.();
  initializeOnboardingState?.();
  initializeSharedRuntime?.();
  initializeTelemetryIdentity?.();
  debugBeacon = {
    type: "beacon_ui_response",
    beacon_id: debugBeaconId,
    beacon_name: "Codex App Home Beacon Debug",
    show_timing: "immediate",
    ui_info: {
      type: "beacon_banner_info",
      title: "Codex app home banner",
      description: "Local debug preview",
      informational_link: null,
      icon_image_url: null,
      icon_image_url_dark: null,
      icon_image_size: "large",
      banner_position: null,
      banner_design: "default",
      dismiss_variant: "dismiss_on_send",
    },
    action_items: [
      {
        id: "learn_more",
        action_v2: { action_enum: "open_url", url: "/settings" },
        text: "Learn more",
        type: "primary",
        icon_url: null,
        description: null,
      },
    ],
  };
}

initializeHomeBeacon();

export {
  recordBeaconViewOnce as n,
  useHomeBeacon as r,
  initializeHomeBeacon as t,
};
