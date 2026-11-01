// Home announcement entry points: persisted eligibility, account isolation,
// exposure tracking, presentation, and actions for first-party announcements.

import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as computerHistoryIconChunk from "@rchunk/computer-history-plugin-icon";
import * as computerHistoryQueryChunk from "@rchunk/computer-history-query";
import "@rchunk/computer-history-suggestion-prompt";
import * as computerHistorySuggestionsChunk from "@rchunk/computer-history-suggestions";
import * as entryPointAvailabilityChunk from "@rchunk/entry-point-availability";
import * as externalAgentImportChunk from "@rchunk/run-external-agent-import-command";
import type { JsxRuntime, MaitaiScopeApi, ReactRuntime, ScopedSignal } from "@rchunk/app-shared";

type Scope = MaitaiScopeApi<Record<string, unknown>>;
type PersistedSignal<Value> = ScopedSignal<Record<string, unknown>, Value>;
interface ActivityInterval { endMs: number; startMs: number }
interface ImportHistory { completedAtMs: number | string; successes: readonly unknown[] }
interface ImportStatus { latestImportedAtMs?: number | null }
interface QueryResult<Value> { data?: Value; isError?: boolean; isFetching?: boolean; isLoading?: boolean; isPending?: boolean }
interface Experiment {
  __evaluation?: { is_experiment_active?: boolean; is_user_in_experiment?: boolean };
  get<Value>(key: string, fallback: Value): Value;
}
interface ExperimentClient {
  getExperiment(id: string, options?: { disableExposureLog?: boolean }): Experiment;
  isLoading: boolean;
}
interface DiscoveryResult {
  detectedItems: Array<{ providerId: string }>;
  hasDetectionRefreshError: boolean;
  hasImportableItems: boolean;
  isDetectionError: boolean;
  isDetectionFetching: boolean;
}
interface RouteLocation { key?: string; pathname: string }
interface AnnouncementViewProps { onDismiss(): void; onShown?(): void }
interface ReplayAnnouncementProps extends AnnouncementViewProps { onReplay(): void }
interface ExternalImportAnnouncementProps extends AnnouncementViewProps {
  onImport(): void;
  providerId?: "cursor" | "claude-code" | "claude-cowork" | null;
}
interface GiftCreditsAnnouncementProps extends AnnouncementViewProps { onOpenGiftCredits(): void }
interface CandidateState { dismiss(): void; isEligible: boolean; isLoading: boolean }

interface AppSharedBindings {
  BX<Value>(family: unknown, parameter: unknown, options?: Record<string, unknown>): QueryResult<Value>;
  HX<Value>(signal: unknown): Value;
  I3: JsxRuntime | (() => JsxRuntime);
  LX(scope: unknown): Scope;
  Y2?: unknown;
  ZI: unknown;
  e6: ReactRuntime | (() => ReactRuntime);
  ig?: unknown;
  n4?(): { formatMessage(descriptor: { defaultMessage: string; id?: string }, values?: Record<string, unknown>): string };
  pk?: unknown;
  sZ?<Value>(scope: unknown, derive: (context: { get<T>(signal: unknown): T }) => Value): unknown;
}
interface AppInitialBindings {
  CA?(options: Record<string, unknown>): DiscoveryResult;
  Cpn?: unknown;
  Gwt?(input: { hostId: string; queryClient: unknown; scope: Scope }): Promise<void>;
  IA?(): unknown;
  N6t?(): { accountId?: string | null; isLoading?: boolean };
  VDt?(roots: string[], options: { prompt: string }): Promise<{ cwd?: string; projectlessOutputDirectory?: string; workspaceRoots?: string[] }>;
  ZA?: unknown;
  _A?: unknown;
  _Et?(mode: string, source: string): boolean;
  cfn?(): ExperimentClient;
  dun<Value>(key: string, initialValue: Value): PersistedSignal<Value>;
  e4t?: unknown;
  gpt?(scope: Scope, hostId: string, request: Record<string, unknown>, callbacks: { afterConversationCreated?(conversationId: string): void }): Promise<{
    conversationId: string;
    firstTurn: { status: string; turnId?: string };
    status: string;
  }>;
  h4t?(plugin: unknown): unknown;
  i_n?(): RouteLocation;
  mht?(): { data?: { desktop_onboarding_completed_at?: string | null }; isLoading?: boolean };
  mpt?(scope: Scope, outcome: unknown): Error | null;
  nfn?(client: ExperimentClient, id: string): Experiment;
  ngn?<Value>(key: string, fallback: Value): Value;
  ofn?(gate: string): boolean;
  sbt?(options: { hideFirstNewThreadOnboardingPromos: boolean; pathname: string }): boolean;
  sj?(input: { histories: readonly ImportHistory[]; importStatus: ImportStatus }): boolean;
  ugn?: string;
  vj?: unknown;
  xpn?(scope: Scope, event: unknown, payload: Record<string, unknown>): void;
  zA?(enabled: boolean): string[];
  zdn?(scope: Scope, hostId: string, mode: string, options: { priority: string }): Promise<{ data: Array<{ name: string; tools?: Record<string, { name?: string }> }> }>;
  Zgt?(scope: Scope, hostId: string, model: null): Promise<unknown>;
}
interface AppPrimaryBindings { Sm?: (props: Record<string, unknown>) => unknown; Zh?: string }
interface EntryPointAvailabilityBindings {
  a?(input: unknown, entryPoint: string): void;
  n?(options: { enabled: boolean }): boolean | undefined;
}
interface ExternalAgentImportBindings {
  runExternalAgentImportCommand?(scope: unknown, source: "home_beacon"): Promise<unknown>;
}

const shared = appSharedChunk as unknown as AppSharedBindings;
const initial = appInitialChunk as unknown as AppInitialBindings;
const primary = appPrimaryChunk as unknown as AppPrimaryBindings;
const availability = entryPointAvailabilityChunk as unknown as EntryPointAvailabilityBindings;
const externalImport = externalAgentImportChunk as unknown as ExternalAgentImportBindings;
const computerHistory = computerHistoryQueryChunk as unknown as { i?: unknown };
const computerHistorySuggestions = computerHistorySuggestionsChunk as unknown as { i?: unknown };
const computerHistoryIcon = (computerHistoryIconChunk as unknown as { t?: string }).t;

const HOUR = 60 * 60 * 1_000;
const WEEK = 7 * 24 * HOUR;
const IMPORT_BEACON_COOLDOWN = 30 * 24 * HOUR;
const RECENT_IMPORT_WINDOW = 60 * 24 * HOUR;
const REPLAY_EXPERIMENT = "3781811128";
const IMPORT_EXPERIMENT = "1602805785";
const IMPORT_CONTROL = "463876344";
const IMPORT_PROVIDERS = ["cursor", "claude-code", "claude-cowork"] as const;
const GIFT_COOLDOWN_DAYS = [7, 14, 30] as const;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
let computerHistoryDismissedSignal: PersistedSignal<boolean>;
let weeklyInsightsStatusSignal: unknown;
let replayShownAccountsSignal: PersistedSignal<Record<string, boolean>>;
let importLastShownSignal: PersistedSignal<number | null>;
let giftDismissedSignal: PersistedSignal<boolean>;
let giftStateSignal: PersistedSignal<{ lastShownAtMs?: number; shownCount: number }>;

function initializeAnnouncementEntryPoints(): void {
  if (initialized) return;
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  jsx = typeof shared.I3 === "function" ? shared.I3() : shared.I3;
  computerHistoryDismissedSignal = initial.dun("computer-history-weekly-insights-announcement-dismissed-v1", false);
  replayShownAccountsSignal = initial.dun("codex-replay-home-announcement-shown-account-ids", {});
  importLastShownSignal = initial.dun("external-agent-import-home-beacon-last-shown-at", null);
  giftDismissedSignal = initial.dun("has-seen-gift-credits-home-banner", false);
  giftStateSignal = initial.dun("gift-credits-home-beacon-state", { shownCount: 0 });
  weeklyInsightsStatusSignal = shared.sZ?.(shared.ZI, ({ get }) => {
    if (get<boolean>(computerHistoryDismissedSignal)) return "ineligible";
    if (computerHistorySuggestions.i != null && !get<boolean>(computerHistorySuggestions.i)) return "ineligible";
    const query = computerHistory.i == null ? null : get<QueryResult<ActivityInterval[]>>(computerHistory.i);
    if (query?.isPending) return "loading";
    return query?.data != null && isWeeklyInsightsEligible(query.data) ? "eligible" : "ineligible";
  }) ?? { kind: "weekly-insights-status" };
  initialized = true;
}

function mergedActivityDuration(intervals: readonly ActivityInterval[], windowStartMs: number, windowEndMs: number): number {
  const clipped = intervals
    .map(({ endMs, startMs }) => ({ endMs: Math.min(endMs, windowEndMs), startMs: Math.max(startMs, windowStartMs) }))
    .filter(({ endMs, startMs }) => endMs > startMs)
    .sort((left, right) => left.startMs - right.startMs);
  let duration = 0;
  let coveredUntil = windowStartMs;
  for (const interval of clipped) {
    if (interval.endMs <= coveredUntil) continue;
    duration += interval.endMs - Math.max(interval.startMs, coveredUntil);
    coveredUntil = interval.endMs;
  }
  return duration;
}

function isWeeklyInsightsEligible(intervals: readonly ActivityInterval[], nowMs = Date.now()): boolean {
  const weekStart = nowMs - WEEK;
  return intervals.some(({ startMs }) => startMs <= weekStart) &&
    mergedActivityDuration(intervals, weekStart, nowMs) >= 48 * HOUR &&
    mergedActivityDuration(intervals, nowMs - 48 * HOUR, nowMs) >= 6 * HOUR;
}

function isRecentOnboarding(completedAt: string | null | undefined, nowMs: number): boolean {
  if (completedAt == null) return false;
  const age = nowMs - Date.parse(completedAt);
  return age >= 0 && age < WEEK;
}

function latestImportedAt(histories: readonly ImportHistory[], status: ImportStatus): number | null {
  let latest = status.latestImportedAtMs ?? null;
  for (const history of histories) {
    if (history.successes.length === 0) continue;
    const completedAt = Number(history.completedAtMs);
    latest = latest == null ? completedAt : Math.max(latest, completedAt);
  }
  return latest;
}

function isExternalImportBeaconEligible(input: {
  hasImportableItems: boolean;
  isExperimentEnabled: boolean;
  lastShownAtMs?: number | null;
  latestImportedAtMs?: number | null;
  nowMs: number;
}): boolean {
  return input.hasImportableItems && input.isExperimentEnabled &&
    (input.lastShownAtMs == null || input.nowMs - input.lastShownAtMs >= IMPORT_BEACON_COOLDOWN) &&
    !(input.latestImportedAtMs != null && input.nowMs - input.latestImportedAtMs < RECENT_IMPORT_WINDOW);
}

function useShownOnce(onShown: (() => void) | undefined): void {
  const shown = React.useRef(false);
  const notify = () => {
    if (shown.current) return;
    shown.current = true;
    onShown?.();
  };
  React.useEffect(notify, []);
}

function message(id: string, defaultMessage: string, description: string): unknown {
  return shared.Y2 == null ? defaultMessage : jsx.jsx(shared.Y2, { id, defaultMessage, description });
}

function AnnouncementCard(props: {
  actionsPlacement?: string;
  description: unknown;
  leadingVisual?: unknown;
  onDismiss(): void;
  onPrimary(): void;
  primaryLabel: unknown;
  title: unknown;
  variant?: string;
}): unknown {
  const dismissLabel = shared.n4?.().formatMessage({ id: "homeAnnouncement.dismiss", defaultMessage: "Dismiss announcement" }) ?? "Dismiss announcement";
  if (primary.Sm != null) return jsx.jsx(primary.Sm, {
    actionsPlacement: props.actionsPlacement,
    description: props.description,
    dismissAction: { ariaLabel: dismissLabel, icon: shared.ig, onClick: props.onDismiss },
    leadingVisual: props.leadingVisual,
    primaryAction: { label: props.primaryLabel, onClick: props.onPrimary },
    title: props.title,
    variant: props.variant,
  });
  return jsx.jsxs("aside", { className: "home-announcement", children: [
    props.leadingVisual,
    jsx.jsx("strong", { children: props.title }),
    jsx.jsx("p", { children: props.description }),
    jsx.jsx("button", { onClick: props.onPrimary, type: "button", children: props.primaryLabel }),
    jsx.jsx("button", { "aria-label": dismissLabel, onClick: props.onDismiss, type: "button", children: "×" }),
  ] });
}

function ComputerHistoryWeeklyInsightsAnnouncement({ onDismiss, onViewRecap }: AnnouncementViewProps & { onViewRecap(prompt: string): void }): unknown {
  const prompt = "Give me a fun recap of my Computer History, including work patterns, distractions, favorite shortcuts, my writing style, and a light roast";
  return AnnouncementCard({
    title: message("computerHistory.weeklyInsightsAnnouncement.title", "Your week in Computer History", "Weekly Computer History announcement title"),
    description: message("computerHistory.weeklyInsightsAnnouncement.description", "See insights based on your past week of computer activity", "Weekly Computer History announcement description"),
    leadingVisual: computerHistoryIcon == null ? null : jsx.jsx("img", { alt: "", className: "h-8 w-8 shrink-0", src: computerHistoryIcon }),
    primaryLabel: message("computerHistory.weeklyInsightsAnnouncement.viewRecap", "View recap", "Weekly Computer History announcement action"),
    onDismiss,
    onPrimary: () => onViewRecap(shared.n4?.().formatMessage({ id: "computerHistory.weeklyInsightsAnnouncement.weeklyRecapPrompt", defaultMessage: prompt }) ?? prompt),
  });
}

function ReplayAnnouncement({ onDismiss, onReplay, onShown }: ReplayAnnouncementProps): unknown {
  useShownOnce(onShown);
  return jsx.jsx("div", { className: "select-none", children: AnnouncementCard({
    title: message("codexReplay.homeAnnouncement.title", "See how codex handles imported tasks", "Codex Replay announcement title"),
    description: message("codexReplay.homeAnnouncement.description", "Replay a task you imported from another agent and compare the results.", "Codex Replay announcement description"),
    primaryLabel: message("codexReplay.homeAnnouncement.action", "Replay a task", "Codex Replay announcement action"),
    onDismiss,
    onPrimary: onReplay,
  }) });
}

function ExternalImportAnnouncement({ onDismiss, onImport, onShown, providerId }: ExternalImportAnnouncementProps): unknown {
  useShownOnce(onShown);
  const provider = providerId === "cursor" ? "Cursor" : providerId === "claude-code" ? "Claude Code" : providerId === "claude-cowork" ? "Claude Cowork" : null;
  return jsx.jsx("div", { className: "select-none", children: AnnouncementCard({
    title: provider == null ? "Bring your work into ChatGPT" : `Bring your ${provider} work into ChatGPT`,
    description: provider == null
      ? "Import your setup, projects, and chats from other AI tools so you can continue here—and keep future changes in sync"
      : `Import your setup, projects, and chats from ${provider} so you can continue here—and keep future changes in sync`,
    primaryLabel: provider == null ? "Import your context" : `Import from ${provider}`,
    onDismiss,
    onPrimary: onImport,
  }) });
}

function track(scope: Scope, event: unknown, payload: Record<string, unknown>): void {
  initial.xpn?.(scope, event, payload);
}

function GiftCreditsAnnouncement({ onDismiss, onOpenGiftCredits, onShown }: GiftCreditsAnnouncementProps): unknown {
  useShownOnce(onShown);
  const scope = shared.LX(shared.ZI);
  const route = initial.i_n?.();
  const exposure = React.useRef(false);
  React.useEffect(() => {
    if (exposure.current) return;
    exposure.current = true;
    const now = Date.now();
    const previous = scope.get<{ lastShownAtMs?: number; shownCount: number }>(giftStateSignal);
    scope.set(giftStateSignal, { lastShownAtMs: now, shownCount: (previous?.shownCount ?? 0) + 1 });
    track(scope, "gift_credits_home_beacon", { entryPoint: "codex_desktop_gift_beacon", outcome: "shown", routeEntryKey: route?.key, step: "entry_exposure" });
  }, [route?.key, scope]);
  return AnnouncementCard({
    variant: "beacon",
    actionsPlacement: "bodyOnNarrow",
    title: "Gift ChatGPT credits",
    description: "Send a friend credits they can use for Work or Codex tasks",
    primaryLabel: "Gift credits",
    onDismiss,
    onPrimary: () => {
      track(scope, "gift_credits_home_beacon", { entryPoint: "codex_desktop_gift_beacon", outcome: "opened", step: "entry_exposure" });
      onOpenGiftCredits();
    },
  });
}

function useReplayAnnouncement(options: { enabled?: boolean } = {}): CandidateState & { markShown(): void; replay(): void } {
  const scope = shared.LX(shared.ZI);
  const globallyDisabled = initial.vj == null ? false : shared.HX<boolean>(initial.vj) === true;
  const account = initial.N6t?.() ?? {};
  const profile = initial.mht?.() ?? {};
  const shownAccounts = shared.HX<Record<string, boolean> | undefined>(replayShownAccountsSignal);
  const historyQuery = shared.BX<ImportHistory[]>(initial.ZA, initial.ugn ?? "local", { enabled: options.enabled !== false && !globallyDisabled });
  const experimentClient = initial.cfn?.();
  const [state, setState] = React.useState(() => ({ accountId: account.accountId, dismissed: false }));
  if (state.accountId !== account.accountId) setState({ accountId: account.accountId, dismissed: false });
  const accountId = account.accountId;
  const baseEligible = options.enabled !== false && !globallyDisabled && !state.dismissed && accountId != null &&
    shownAccounts?.[accountId] !== true && isRecentOnboarding(profile.data?.desktop_onboarding_completed_at, Date.now()) &&
    historyQuery.data?.some((history) => history.successes.length > 0) === true;
  const experimentEnabled = experimentClient == null ? false :
    (initial.nfn?.(experimentClient, REPLAY_EXPERIMENT) ?? experimentClient.getExperiment(REPLAY_EXPERIMENT, { disableExposureLog: true })).get("enabled", false);
  const markAccountShown = () => {
    if (accountId == null) return;
    scope.set(replayShownAccountsSignal, { ...(scope.get<Record<string, boolean>>(replayShownAccountsSignal) ?? {}), [accountId]: true });
  };
  return {
    isEligible: baseEligible && experimentEnabled,
    isLoading: options.enabled !== false && !state.dismissed && (account.isLoading === true || profile.isLoading === true || historyQuery.isLoading === true || experimentClient?.isLoading === true),
    dismiss: () => { track(scope, "codex_replay_home_announcement", { action: "dismiss" }); markAccountShown(); setState((current) => ({ ...current, dismissed: true })); },
    markShown: () => { track(scope, "codex_replay_home_announcement", { action: "view" }); markAccountShown(); },
    replay: () => { track(scope, "codex_replay_home_announcement", { action: "click" }); markAccountShown(); setState((current) => ({ ...current, dismissed: true })); },
  };
}

function useExternalImportAnnouncement(options: { enabled?: boolean } = {}): CandidateState & {
  markShown(): void;
  openImport(): void;
  providerId?: "cursor" | "claude-code" | "claude-cowork";
} {
  const scope = shared.LX(shared.ZI);
  const route = initial.i_n?.() ?? { pathname: "/" };
  const globallyDisabled = initial.vj == null ? false : shared.HX<boolean>(initial.vj) === true;
  const hidePromos = initial.sbt?.({ hideFirstNewThreadOnboardingPromos: false, pathname: route.pathname }) ?? false;
  const persistedLastShown = shared.HX<number | null | undefined>(importLastShownSignal);
  const [lastShownAtMount] = React.useState(() => persistedLastShown);
  const [dismissed, setDismissed] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [now] = React.useState(() => Date.now());
  const experimentClient = initial.cfn?.();
  const personalizedExperiment = experimentClient?.getExperiment(IMPORT_EXPERIMENT, { disableExposureLog: true });
  const personalized = personalizedExperiment?.__evaluation?.is_user_in_experiment === true && personalizedExperiment.__evaluation.is_experiment_active === true;
  const selectedExperiment = personalized ? IMPORT_EXPERIMENT : IMPORT_CONTROL;
  const enabledByExperiment = experimentClient?.getExperiment(selectedExperiment, { disableExposureLog: true }).get<boolean>("enabled", false) === true;
  const cooldownComplete = lastShownAtMount == null || now - lastShownAtMount >= IMPORT_BEACON_COOLDOWN;
  const queryEnabled = options.enabled !== false && !globallyDisabled && !hidePromos && cooldownComplete && !dismissed;
  const histories = shared.BX<ImportHistory[]>(initial.ZA, initial.ugn ?? "local", { enabled: queryEnabled });
  const providers = initial.zA?.(initial.ofn?.("external-agent-import") ?? true) ?? [...IMPORT_PROVIDERS];
  const status = shared.BX<ImportStatus>(initial._A, { hostId: initial.ugn ?? "local", providers }, { enabled: queryEnabled });
  const latest = histories.data == null || status.data == null ? null : latestImportedAt(histories.data, status.data);
  const discoveryEnabled = queryEnabled && histories.data != null && status.data != null && !(initial.sj?.({ histories: histories.data, importStatus: status.data }) ?? false);
  const discovery = initial.CA?.({ cacheDiscovery: true, enabled: discoveryEnabled, hostId: initial.ugn ?? "local", providers, refetchOnWindowFocus: true, retry: false, sessionLimits: initial.IA?.() });
  const providerId = personalized ? IMPORT_PROVIDERS.find((provider) => providers.includes(provider) && discovery?.detectedItems.some((item) => item.providerId === provider)) : undefined;
  const discoveryReady = discovery != null && !discovery.isDetectionFetching && !discovery.isDetectionError && !discovery.hasDetectionRefreshError;
  const eligible = queryEnabled && enabledByExperiment && !histories.isError && !status.isError &&
    (!personalized || (discoveryReady && providerId != null)) &&
    isExternalImportBeaconEligible({ hasImportableItems: discovery?.hasImportableItems === true, isExperimentEnabled: true, lastShownAtMs: lastShownAtMount, latestImportedAtMs: latest, nowMs: now });
  const loading = queryEnabled && (experimentClient?.isLoading === true || histories.isLoading === true || histories.isFetching === true || status.isLoading === true || status.isFetching === true || (personalized && discovery?.isDetectionFetching === true));
  return {
    dismiss: () => { track(scope, "external_agent_import_home_beacon", { action: "dismissed" }); setDismissed(true); },
    isEligible: eligible,
    isLoading: loading,
    markShown: () => { if (shown) return; setShown(true); track(scope, "external_agent_import_home_beacon", { action: "shown" }); scope.set(importLastShownSignal, Date.now()); },
    openImport: () => { track(scope, "external_agent_import_home_beacon", { action: "import_clicked" }); void externalImport.runExternalAgentImportCommand?.(scope, "home_beacon").catch(() => undefined); },
    providerId,
  };
}

function useGiftCreditsAnnouncement(options: { enabled?: boolean } = {}): CandidateState & { openGiftCredits(): void } {
  const scope = shared.LX(shared.ZI);
  const dismissedPersisted = shared.HX<boolean | undefined>(giftDismissedSignal) ?? initial.ngn?.("has-seen-gift-credits-home-banner", false) ?? false;
  const giftState = shared.HX<{ lastShownAtMs?: number; shownCount: number } | undefined>(giftStateSignal);
  const [dismissed, setDismissed] = React.useState(false);
  const [now] = React.useState(() => Date.now());
  const cooldownDays = GIFT_COOLDOWN_DAYS[(giftState?.shownCount ?? 0) - 1] ?? 30;
  const cooldownComplete = giftState?.lastShownAtMs == null || now - giftState.lastShownAtMs >= cooldownDays * 24 * HOUR;
  const baseEligible = options.enabled !== false && !dismissed && !dismissedPersisted && giftState != null && cooldownComplete;
  const available = availability.n?.({ enabled: baseEligible });
  const dismiss = () => { setDismissed(true); scope.set(giftDismissedSignal, true); };
  return {
    dismiss,
    isEligible: baseEligible && available === true,
    isLoading: options.enabled !== false && !dismissed && !dismissedPersisted && (giftState == null || (baseEligible && available === undefined)),
    openGiftCredits: () => { dismiss(); availability.a?.(undefined, "codex_desktop_gift_beacon"); },
  };
}

interface ReplayLaunchOptions {
  navigateToLocalConversation?(conversationId: string): void;
  onReplay?(): void;
  scope: Scope;
  showPluginInstallDetails?(plugin: unknown, options: { hostId: string; marketplaceAnalytics: string; onSuccess(): Promise<void> }): boolean;
}

async function launchReplay(options: ReplayLaunchOptions): Promise<void> {
  const { scope } = options;
  const queryClient = scope.queryClient as {
    fetchQuery(options: unknown): Promise<unknown>;
  };
  const queryOptions = (scope.query as { getOptions?(query: unknown, input: Record<string, unknown>): unknown }).getOptions?.(
    initial.e4t,
    {
      hostId: initial.ugn ?? "local",
      marketplacePath: null,
      pluginName: "codex-replay",
      remoteMarketplaceName: "openai-curated-remote",
    },
  );
  if (queryOptions == null || options.showPluginInstallDetails == null) {
    throw new Error("Codex Replay catalog runtime is unavailable");
  }
  try {
    const plugin = await queryClient.fetchQuery({
      ...(queryOptions as Record<string, unknown>),
      retry: false,
    });
    const shown = options.showPluginInstallDetails(initial.h4t?.(plugin) ?? plugin, {
      hostId: "local",
      marketplaceAnalytics: primary.Zh ?? "globalAnnouncement",
      onSuccess: async () => {
        let outcome = "catalog_reload_failed";
        try {
          if (initial.Gwt == null) throw new Error("Catalog reload runtime is unavailable");
          await initial.Gwt({ scope, hostId: initial.ugn ?? "local", queryClient: scope.queryClient });
          outcome = "mcp_timeout";
          await waitForReplayTool(scope);
          outcome = "mode_unavailable";
          if (initial._Et?.("switchToMode3", "codex_replay_home_announcement") !== true) {
            throw new Error("Codex mode is unavailable");
          }
          outcome = "conversation_start_failed";
          const conversationId = await createReplayConversation(scope);
          options.navigateToLocalConversation?.(conversationId);
          outcome = "conversation_started";
        } catch (error) {
          reportReplayError(scope, error);
        } finally {
          const logger = initial.Cpn == null ? null : scope.get<{ logProductEvent?(event: unknown, payload: Record<string, unknown>): void }>(initial.Cpn);
          logger?.logProductEvent?.("codex_replay_onboarding_launch", { outcome });
        }
      },
    });
    if (shown) options.onReplay?.();
  } catch (error) {
    reportReplayError(scope, error);
  }
}

async function waitForReplayTool(scope: Scope): Promise<void> {
  if (initial.zdn == null) throw new Error("MCP readiness runtime is unavailable");
  const timeoutError = new Error("Codex Replay did not become ready in time");
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    try {
      const response = await withTimeout(
        initial.zdn(scope, initial.ugn ?? "local", "toolsAndAuthOnly", { priority: "interactive" }),
        remaining,
        timeoutError,
      );
      if (response.data.some((server) => server.name === "codex-replay" && server.tools?.open_controller?.name === "open_controller")) return;
    } catch (error) {
      if (error === timeoutError) throw error;
    }
    const delay = Math.min(500, deadline - Date.now());
    if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
  throw timeoutError;
}

function withTimeout<Value>(promise: Promise<Value>, timeoutMs: number, timeoutError: Error): Promise<Value> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutError), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error instanceof Error ? error : new Error(String(error))); },
    );
  });
}

async function createReplayConversation(scope: Scope): Promise<string> {
  if (initial.VDt == null || initial.Zgt == null || initial.gpt == null) {
    throw new Error("Codex Replay conversation runtime is unavailable");
  }
  const prompt = "[@Codex Replay](plugin://codex-replay@openai-curated-remote) Open the Replay controller.";
  const projectless = await initial.VDt(["~"], { prompt });
  if (projectless.cwd == null) throw new Error("Missing projectless thread cwd");
  const serviceTier = await initial.Zgt(scope, initial.ugn ?? "local", null);
  const outcome = await initial.gpt(scope, initial.ugn ?? "local", {
    collaborationMode: null,
    cwd: projectless.cwd,
    initialTitle: "Codex Replay",
    input: [{ type: "text", text: prompt, text_elements: [] }],
    projectlessOutputDirectory: projectless.projectlessOutputDirectory,
    serviceTier,
    skipAutoTitleGeneration: true,
    threadSource: "codex_replay",
    turnTrigger: "codex_replay",
    useAppServerPermissionDefault: true,
    workspaceKind: "projectless",
    workspaceRoots: projectless.workspaceRoots,
  }, {});
  const failure = initial.mpt?.(scope, outcome) ?? null;
  if (outcome.status === "outcome-unknown" || failure != null) throw failure ?? new Error("Codex Replay conversation outcome is unknown");
  return outcome.conversationId;
}

function reportReplayError(scope: Scope, error: unknown): void {
  const toast = shared.pk == null ? null : scope.get<{ danger?(message: string, options?: Record<string, unknown>): void }>(shared.pk);
  toast?.danger?.(error instanceof Error ? error.message : String(error), {
    errorAnalytics: { toastId: "codexReplayHomeAnnouncementActions.reportCodexReplayStartError" },
  });
}

initializeAnnouncementEntryPoints();

export {
  initializeAnnouncementEntryPoints as _, initializeAnnouncementEntryPoints as a,
  initializeAnnouncementEntryPoints as c, initializeAnnouncementEntryPoints as d,
  useReplayAnnouncement as f, weeklyInsightsStatusSignal as g,
  computerHistoryDismissedSignal as h, useGiftCreditsAnnouncement as i,
  initializeAnnouncementEntryPoints as l, initializeAnnouncementEntryPoints as m,
  initializeAnnouncementEntryPoints as n, useExternalImportAnnouncement as o,
  ReplayAnnouncement as p, initializeAnnouncementEntryPoints as r,
  ExternalImportAnnouncement as s, GiftCreditsAnnouncement as t,
  launchReplay as u, ComputerHistoryWeeklyInsightsAnnouncement as v,
  initializeAnnouncementEntryPoints as y,
};
