import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/schedule-draft";

export type AutomationStatus = "active" | "completed" | "paused";
export interface AutomationSummary {
  id: string;
  display_schedule?: string | null;
  is_enabled: boolean;
  last_run_time?: string | null;
  next_run_times: string[];
  schedule_components: { end_date?: string | null; frequency: string; start_time?: string | null };
  timing_mode?: string;
  updated_at: string;
}
export interface AutomationSummaryItem { automation: AutomationSummary }
export interface AutomationGroups { active: AutomationSummaryItem[]; recent: AutomationSummaryItem[]; paused: AutomationSummaryItem[]; completed: AutomationSummaryItem[] }
export interface AutomationSummaryLineProps { item: AutomationSummaryItem; now?: Date; runPhase?: "executing" | "starting" | null; status?: AutomationStatus }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function mergeAutomationSummaries(...groups: Array<readonly AutomationSummary[] | null | undefined>): AutomationSummaryItem[] {
  const latest = new Map<string, AutomationSummary>();
  for (const group of groups) for (const automation of group ?? []) {
    const current = latest.get(automation.id);
    if (current == null || automation.updated_at >= current.updated_at) latest.set(automation.id, automation);
  }
  return [...latest.values()].map((automation) => ({ automation }));
}

function getAutomationStatus(automation: AutomationSummary): AutomationStatus {
  return automation.timing_mode !== "condition_watch" && automation.next_run_times.length === 0
    ? "completed"
    : automation.is_enabled ? "active" : "paused";
}

function timestamp(item: AutomationSummaryItem, pausedAt?: Record<string, number>): number {
  const value = pausedAt?.[item.automation.id] ?? Date.parse(item.automation.updated_at);
  return Number.isNaN(value) ? 0 : value;
}

function groupAutomationSummaries(items: readonly AutomationSummaryItem[], now: number, pausedAt?: Record<string, number>): AutomationGroups {
  const result: AutomationGroups = { active: [], recent: [], paused: [], completed: [] };
  for (const item of items) {
    const status = getAutomationStatus(item.automation);
    result[status].push(item);
    if (status !== "active" && timestamp(item, status === "paused" ? pausedAt : undefined) >= now - 86_400_000) result.recent.push(item);
  }
  result.paused.sort((left, right) => timestamp(right) - timestamp(left));
  result.completed.sort((left, right) => timestamp(right) - timestamp(left));
  result.recent.sort((left, right) => timestamp(right, pausedAt) - timestamp(left, pausedAt));
  return result;
}

function formatRelative(target: string, now: Date): string {
  const difference = Date.parse(target) - now.getTime();
  if (!Number.isFinite(difference)) return "";
  const absolute = Math.abs(difference);
  if (absolute < 3_600_000) return `${Math.max(1, Math.round(absolute / 60_000))} min`;
  if (absolute < 86_400_000) return `${Math.round(absolute / 3_600_000)} hr`;
  return new Date(target).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function AutomationSummaryLine({ item, now = new Date(), runPhase, status }: AutomationSummaryLineProps): unknown {
  const automation = item.automation;
  const resolvedStatus = status ?? getAutomationStatus(automation);
  const cadence = automation.timing_mode === "condition_watch"
    ? "Monitoring"
    : automation.schedule_components.frequency === "once"
      ? "Scheduled"
      : automation.display_schedule ?? automation.schedule_components.frequency;
  let timing = "";
  if (runPhase != null) timing = runPhase === "starting" ? "Starting run…" : "Running now";
  else if (resolvedStatus === "active" && automation.next_run_times[0] != null) timing = `Next run ${formatRelative(automation.next_run_times[0], now)}`;
  else if (automation.last_run_time != null) timing = `Last run ${formatRelative(automation.last_run_time, now)}`;
  const statusText = resolvedStatus === "paused" ? "Paused" : resolvedStatus === "completed" ? "Completed" : cadence;
  return jsx().jsx("span", { "data-automation-status": resolvedStatus, children: [statusText, timing].filter(Boolean).join(" · ") });
}

function initializeScheduleDraft(): void {}
function initializeConversationSummary(): void { jsx(); }
export { groupAutomationSummaries as a, getAutomationStatus as i, initializeConversationSummary as n, initializeScheduleDraft as o, mergeAutomationSummaries as r, AutomationSummaryLine as t };
