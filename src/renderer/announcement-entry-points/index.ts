// announcement-entry-points —— 首页公告入口的资格判断、展示组件与动作编排。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as computerHistoryIconChunk from "@rchunk/computer-history-plugin-icon";
import * as computerHistoryQueryChunk from "@rchunk/computer-history-query";
import * as computerHistoryPromptChunk from "@rchunk/computer-history-suggestion-prompt";
import * as computerHistorySuggestionsChunk from "@rchunk/computer-history-suggestions";
import * as entryPointAvailabilityChunk from "@rchunk/entry-point-availability";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as externalAgentImportChunk from "@rchunk/run-external-agent-import-command";
import type { JsxRuntime } from "@rchunk/app-shared";

void appInitialChunk;
void computerHistoryQueryChunk;
void computerHistoryPromptChunk;
void computerHistorySuggestionsChunk;
void entryPointAvailabilityChunk;
void runtimeChunk;

interface AppSharedBindings {
  I3: JsxRuntime | (() => JsxRuntime);
}

interface AppPrimaryBindings {
  Sm?: (props: Record<string, unknown>) => unknown;
}

interface ExternalAgentImportBindings {
  runExternalAgentImportCommand?: (
    scope: unknown,
    source: "home_beacon",
  ) => Promise<unknown>;
}

interface ActivityInterval {
  endMs: number;
  startMs: number;
}

interface ImportHistory {
  completedAtMs: number | string;
  successes: readonly unknown[];
}

interface ImportStatus {
  latestImportedAtMs?: number | null;
}

interface AnnouncementViewProps {
  onDismiss(): void;
  onShown?(): void;
}

interface ReplayAnnouncementProps extends AnnouncementViewProps {
  onReplay(): void;
}

interface ExternalImportAnnouncementProps extends AnnouncementViewProps {
  onImport(): void;
  providerId?: "cursor" | "claude-code" | "claude-cowork" | null;
}

interface GiftCreditsAnnouncementProps extends AnnouncementViewProps {
  onOpenGiftCredits?(): void;
}

interface CandidateState {
  isEligible: boolean;
  isLoading: boolean;
  dismiss(): void;
}

const { I3: jsxRuntimeExport } = appSharedChunk as unknown as AppSharedBindings;
const { Sm: AnnouncementShell } = appPrimaryChunk as unknown as AppPrimaryBindings;
const { runExternalAgentImportCommand } =
  externalAgentImportChunk as unknown as ExternalAgentImportBindings;
const { t: computerHistoryIcon } = computerHistoryIconChunk as unknown as {
  t?: string;
};

const HOUR = 60 * 60 * 1_000;
const WEEK = 7 * 24 * HOUR;
const IMPORT_BEACON_COOLDOWN = 30 * 24 * HOUR;
const RECENT_IMPORT_WINDOW = 60 * 24 * HOUR;
const RECENT_ONBOARDING_WINDOW = WEEK;
let jsx: JsxRuntime;

function mergedActivityDuration(
  intervals: readonly ActivityInterval[],
  windowStartMs: number,
  windowEndMs: number,
): number {
  const clipped = intervals
    .map(({ endMs, startMs }) => ({
      endMs: Math.min(endMs, windowEndMs),
      startMs: Math.max(startMs, windowStartMs),
    }))
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

function isWeeklyInsightsEligible(
  intervals: readonly ActivityInterval[],
  nowMs = Date.now(),
): boolean {
  const weekStart = nowMs - WEEK;
  return (
    intervals.some(({ startMs }) => startMs <= weekStart) &&
    mergedActivityDuration(intervals, weekStart, nowMs) >= 48 * HOUR &&
    mergedActivityDuration(intervals, nowMs - 48 * HOUR, nowMs) >= 6 * HOUR
  );
}

function isRecentOnboarding(completedAt: string | null | undefined, nowMs: number): boolean {
  if (completedAt == null) return false;
  const age = nowMs - Date.parse(completedAt);
  return age >= 0 && age < RECENT_ONBOARDING_WINDOW;
}

function latestImportedAt(
  histories: readonly ImportHistory[],
  status: ImportStatus,
): number | null {
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
  const cooldownComplete =
    input.lastShownAtMs == null ||
    input.nowMs - input.lastShownAtMs >= IMPORT_BEACON_COOLDOWN;
  const importedRecently =
    input.latestImportedAtMs != null &&
    input.nowMs - input.latestImportedAtMs < RECENT_IMPORT_WINDOW;
  return (
    input.hasImportableItems &&
    input.isExperimentEnabled &&
    cooldownComplete &&
    !importedRecently
  );
}

function AnnouncementCard(props: {
  description: string;
  dismissLabel: string;
  onDismiss(): void;
  onPrimary(): void;
  primaryLabel: string;
  title: string;
  visual?: unknown;
}): unknown {
  const shellProps = {
    description: props.description,
    dismissAction: {
      ariaLabel: props.dismissLabel,
      onClick: props.onDismiss,
    },
    leadingVisual: props.visual,
    primaryAction: { label: props.primaryLabel, onClick: props.onPrimary },
    title: props.title,
  };
  return AnnouncementShell == null
    ? jsx.jsxs("aside", {
        className: "home-announcement",
        children: [
          props.visual,
          jsx.jsx("strong", { children: props.title }),
          jsx.jsx("p", { children: props.description }),
          jsx.jsx("button", {
            onClick: props.onPrimary,
            type: "button",
            children: props.primaryLabel,
          }),
          jsx.jsx("button", {
            "aria-label": props.dismissLabel,
            onClick: props.onDismiss,
            type: "button",
            children: "×",
          }),
        ],
      })
    : jsx.jsx(AnnouncementShell, shellProps);
}

function ComputerHistoryWeeklyInsightsAnnouncement({
  onDismiss,
  onViewRecap,
}: AnnouncementViewProps & { onViewRecap(prompt: string): void }): unknown {
  return AnnouncementCard({
    description: "See insights based on your past week of computer activity",
    dismissLabel: "Dismiss Computer History weekly insights",
    onDismiss,
    onPrimary: () =>
      onViewRecap(
        "Give me a fun recap of my Computer History, including work patterns, distractions, favorite shortcuts, my writing style, and a light roast",
      ),
    primaryLabel: "View recap",
    title: "Your week in Computer History",
    visual:
      computerHistoryIcon == null
        ? null
        : jsx.jsx("img", { alt: "", className: "h-8 w-8", src: computerHistoryIcon }),
  });
}

function ReplayAnnouncement({ onDismiss, onReplay, onShown }: ReplayAnnouncementProps): unknown {
  onShown?.();
  return AnnouncementCard({
    description: "Replay a task you imported from another agent and compare the results.",
    dismissLabel: "Dismiss imported task replay announcement",
    onDismiss,
    onPrimary: onReplay,
    primaryLabel: "Replay a task",
    title: "See how Codex handles imported tasks",
  });
}

function ExternalImportAnnouncement({
  onDismiss,
  onImport,
  onShown,
  providerId,
}: ExternalImportAnnouncementProps): unknown {
  onShown?.();
  const provider =
    providerId === "cursor"
      ? "Cursor"
      : providerId === "claude-code"
        ? "Claude Code"
        : providerId === "claude-cowork"
          ? "Claude Cowork"
          : null;
  return AnnouncementCard({
    description:
      provider == null
        ? "Import your setup, projects, and chats from other AI tools so you can continue here."
        : `Import your setup, projects, and chats from ${provider} so you can continue here.`,
    dismissLabel: "Dismiss import banner",
    onDismiss,
    onPrimary: onImport,
    primaryLabel: provider == null ? "Import your context" : `Import from ${provider}`,
    title: provider == null ? "Bring your work into ChatGPT" : `Bring your ${provider} work into ChatGPT`,
  });
}

function GiftCreditsAnnouncement({
  onDismiss,
  onOpenGiftCredits,
  onShown,
}: Partial<GiftCreditsAnnouncementProps> = {}): unknown {
  onShown?.();
  return AnnouncementCard({
    description: "Send a friend credits they can use for Work or Codex tasks",
    dismissLabel: "Dismiss gift credits banner",
    onDismiss: onDismiss ?? (() => {}),
    onPrimary: onOpenGiftCredits ?? (() => {}),
    primaryLabel: "Gift credits",
    title: "Gift ChatGPT credits",
  });
}

function createCandidateState(enabled = true): CandidateState {
  let dismissed = false;
  return {
    dismiss: () => {
      dismissed = true;
    },
    get isEligible() {
      return enabled && !dismissed;
    },
    isLoading: false,
  };
}

function useReplayAnnouncement(options: { enabled?: boolean } = {}): CandidateState & {
  markShown(): void;
  replay(): void;
} {
  const state = createCandidateState(options.enabled !== false) as CandidateState & {
    markShown(): void;
    replay(): void;
  };
  state.markShown = () => {};
  state.replay = () => {};
  return state;
}

function useExternalImportAnnouncement(options: { enabled?: boolean } = {}): CandidateState & {
  providerId: null;
  markShown(): void;
  openImport(): void;
} {
  const state = createCandidateState(options.enabled !== false) as CandidateState & {
    providerId: null;
    markShown(): void;
    openImport(): void;
  };
  state.markShown = () => {};
  state.openImport = () => {};
  state.providerId = null;
  return state;
}

function useGiftCreditsAnnouncement(options: { enabled?: boolean } = {}): CandidateState & {
  openGiftCredits(): void;
} {
  const state = createCandidateState(options.enabled !== false) as CandidateState & {
    openGiftCredits(): void;
  };
  state.openGiftCredits = () => {};
  return state;
}

async function launchReplay(scope: unknown): Promise<void> {
  await runExternalAgentImportCommand?.(scope, "home_beacon");
}

function initializeAnnouncementEntryPoints(): void {
  if (jsx != null) return;
  jsx = typeof jsxRuntimeExport === "function" ? jsxRuntimeExport() : jsxRuntimeExport;
}

initializeAnnouncementEntryPoints();

export {
  initializeAnnouncementEntryPoints as _,
  initializeAnnouncementEntryPoints as a,
  initializeAnnouncementEntryPoints as c,
  initializeAnnouncementEntryPoints as d,
  useReplayAnnouncement as f,
  isWeeklyInsightsEligible as g,
  latestImportedAt as h,
  useGiftCreditsAnnouncement as i,
  initializeAnnouncementEntryPoints as l,
  initializeAnnouncementEntryPoints as m,
  initializeAnnouncementEntryPoints as n,
  useExternalImportAnnouncement as o,
  ReplayAnnouncement as p,
  initializeAnnouncementEntryPoints as r,
  ExternalImportAnnouncement as s,
  GiftCreditsAnnouncement as t,
  launchReplay as u,
  ComputerHistoryWeeklyInsightsAnnouncement as v,
  initializeAnnouncementEntryPoints as y,
};
