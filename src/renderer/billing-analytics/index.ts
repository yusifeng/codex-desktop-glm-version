// Billing analytics reconstructed as a readable query + presentation owner.
// It deliberately depends on the local activity-chart contract instead of the
// release bundle's embedded chart implementation.

import "@rchunk/rolldown-runtime";
import "@rchunk/thread-usage-breakdown";
import "@exact-chunk/BarChart-2010e7d67e4a.js";
import "@exact-chunk/queries-a53713419c4d.js";
import "@rchunk/settings-loading-row";
import "@rchunk/usd";
import * as appInitial from "@rchunk/app-initial";
import {
  I3 as getJsxRuntime,
  _L as useQuery,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  H as DateRangeControl,
  U as initializeDateRangeControl,
  n as initializeActivityChart,
  t as ActivityChart,
  type ActivityChartData,
  type ActivitySeries,
} from "@rchunk/activity-chart";

type Scope = "business" | "consumer" | "workspace";
type Breakdown = "feature" | "model" | "product" | "surface" | "turn_trigger";

interface AccountState {
  accountId?: string | null;
  authMethod?: string | null;
  userId?: string | null;
}

interface LimitBreakdown {
  dimension: string;
  rows: Array<{ basis_points?: number | null; key: string }>;
}

interface LimitPeriod {
  accounting_complete?: boolean;
  breakdowns?: LimitBreakdown[] | null;
  ends_at: string;
  id: string;
  plan_type?: string;
  starts_at: string;
  used_basis_points?: number | null;
  window_minutes: number;
}

interface PlanLimitHistory {
  approximate?: boolean;
  coverage_complete?: boolean;
  coverage_start?: string | null;
  data_as_of?: string | null;
  periods: LimitPeriod[];
}

interface QueryResult<Data> {
  data?: Data | null;
  isError?: boolean;
  isLoading?: boolean;
  isPending?: boolean;
  isFetching?: boolean;
  refetch(): unknown;
}

interface ApiClient {
  safeGet<Data>(path: string, options?: Record<string, unknown>): Promise<Data>;
}

interface BillingAnalyticsProps {
  canViewCreditSettings?: boolean;
  isActive?: boolean;
  isPolling?: boolean;
  isUsdWorkspace?: boolean;
  reduceMotion?: boolean;
  scope?: Scope;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const BREAKDOWN_LABELS: Record<Breakdown, string> = {
  feature: "By feature",
  model: "By model",
  product: "By product",
  surface: "By surface",
  turn_trigger: "By turn start",
};
const SERIES_COLORS = [
  "var(--color-chart-blue, #3b82f6)",
  "var(--color-chart-purple, #8b5cf6)",
  "var(--color-chart-yellow, #eab308)",
  "var(--color-text-tertiary, #71717a)",
] as const;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function initializeBillingAnalytics(): void {
  if (initialized) return;
  initialized = true;
  initializeDateRangeControl();
  initializeActivityChart();
  const runtime = appInitial as Record<string, unknown>;
  for (const key of ["M6t", "cJt", "ifn", "oa", "xlt"]) {
    const initializer = runtime[key];
    if (typeof initializer === "function") (initializer as () => void)();
  }
  React = typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsx = getJsxRuntime();
}

function normalizeBasisPoints(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) / 10_000 : 0;
}

function friendlyLabel(value: string): string {
  const known: Record<string, string> = {
    codex: "Codex", work: "Work", desktop_app: "Desktop app", work_desktop: "Work desktop",
    web: "Cloud", work_web: "Work web", github_code_review: "GitHub code review",
    composer: "User messages", composer_queue: "Queued messages", composer_queue_run_now: "Run now",
    __other_usage_series__: "Other",
  };
  return known[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function selectedBreakdown(period: LimitPeriod, breakdown: Breakdown): LimitBreakdown | undefined {
  const candidates = breakdown === "feature" ? ["thread_source", "turn_trigger"] : [breakdown];
  return period.breakdowns?.find((item) => candidates.includes(item.dimension as Breakdown));
}

function selectSeries(history: PlanLimitHistory | null | undefined, breakdown: Breakdown): ActivitySeries[] {
  const totals = new Map<string, number>();
  for (const period of history?.periods ?? []) {
    for (const row of selectedBreakdown(period, breakdown)?.rows ?? []) {
      totals.set(row.key, (totals.get(row.key) ?? 0) + normalizeBasisPoints(row.basis_points));
    }
  }
  const ranked = [...totals].sort((left, right) => right[1] - left[1]);
  const top = ranked.slice(0, 3);
  const other = ranked.slice(3).reduce((sum, [, value]) => sum + value, 0);
  const result = top.map(([key, total], index) => ({ color: SERIES_COLORS[index], key, name: friendlyLabel(key), total }));
  if (other > 0) result.push({ color: SERIES_COLORS[3], key: "__other_usage_series__", name: "Other", total: other });
  return result;
}

function periodDate(period: LimitPeriod): string {
  return period.ends_at.slice(0, 10);
}

function buildHistoryChart(history: PlanLimitHistory | null | undefined, breakdown: Breakdown, windowMinutes: number): ActivityChartData | undefined {
  if (history == null) return undefined;
  const periods = history.periods
    .filter((period) => period.window_minutes === windowMinutes)
    .toSorted((left, right) => Date.parse(left.ends_at) - Date.parse(right.ends_at));
  const series = selectSeries({ ...history, periods }, breakdown);
  if (series.length === 0) series.push({ color: SERIES_COLORS[0], key: "total", name: "Plan usage", total: periods.reduce((sum, period) => sum + normalizeBasisPoints(period.used_basis_points), 0) });
  const data = periods.map((period) => {
    const breakdownRows = selectedBreakdown(period, breakdown)?.rows ?? [];
    const rankedRows = breakdownRows.toSorted((left, right) => normalizeBasisPoints(right.basis_points) - normalizeBasisPoints(left.basis_points));
    const visible = new Set(series.map((item) => item.key));
    const values: Record<string, number> = {};
    for (const row of rankedRows) {
      const key = visible.has(row.key) ? row.key : "__other_usage_series__";
      values[key] = (values[key] ?? 0) + normalizeBasisPoints(row.basis_points);
    }
    if (breakdownRows.length === 0) values.total = normalizeBasisPoints(period.used_basis_points);
    return { date: periodDate(period), total: normalizeBasisPoints(period.used_basis_points), values };
  });
  return {
    data,
    dataFreshnessTimestamp: history.data_as_of ?? null,
    series,
    total: periods.reduce((sum, period) => sum + normalizeBasisPoints(period.used_basis_points), 0),
  };
}

function validateHistory(value: unknown): PlanLimitHistory {
  if (value == null || typeof value !== "object") throw new TypeError("Invalid plan usage history response");
  const candidate = value as Partial<PlanLimitHistory>;
  if (!Array.isArray(candidate.periods)) throw new TypeError("Plan usage history is missing periods");
  return { ...candidate, periods: candidate.periods.filter((period): period is LimitPeriod => Boolean(period && typeof period === "object" && typeof period.ends_at === "string" && typeof period.window_minutes === "number")) } as PlanLimitHistory;
}

function historyQuery(account: AccountState, days: number, enabled: boolean, polling: boolean): Record<string, unknown> {
  const runtime = appInitial as unknown as { udn?: ApiClient };
  return {
    enabled: enabled && account.authMethod === "chatgpt" && account.accountId != null && account.userId != null && runtime.udn != null,
    queryKey: ["consumer-plan-limit-history", account.accountId, account.userId, days],
    queryFn: async ({ signal }: { signal: AbortSignal }) => validateHistory(await runtime.udn!.safeGet("/wham/usage/plan_limit_history", {
      expectedErrorStatuses: [404], parameters: { query: { days } }, signal,
    })),
    retry: false,
    staleTime: FIVE_MINUTES,
    refetchInterval: polling ? FIVE_MINUTES : false,
    refetchOnWindowFocus: false,
  };
}

function BreakdownControl({ breakdown, onChange, scope }: { breakdown: Breakdown; onChange(value: Breakdown): void; scope: Scope }): unknown {
  const options: Breakdown[] = scope === "workspace" ? ["product", "model", "surface", "turn_trigger"] : ["feature", "model", "surface", "turn_trigger"];
  return jsx.jsx("label", { className: "flex items-center gap-2 text-sm text-secondary", children: [
    jsx.jsx("span", { className: "sr-only", children: "Group usage history" }),
    jsx.jsx("select", { "aria-label": "Group usage history", className: "rounded-md border border-primary bg-primary px-2 py-1", onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value as Breakdown), value: breakdown, children: options.map((option) => jsx.jsx("option", { value: option, children: BREAKDOWN_LABELS[option] }, option)) }),
  ] });
}

function LimitSummary({ history }: { history?: PlanLimitHistory | null }): unknown {
  const latest = new Map<number, LimitPeriod>();
  for (const period of history?.periods ?? []) {
    const current = latest.get(period.window_minutes);
    if (!current || Date.parse(period.ends_at) > Date.parse(current.ends_at)) latest.set(period.window_minutes, period);
  }
  return jsx.jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [
    [300, "5-hour usage"], [10080, "Weekly usage"],
  ].map(([windowMinutes, label]) => {
    const period = latest.get(windowMinutes as number);
    const value = normalizeBasisPoints(period?.used_basis_points);
    return jsx.jsxs("article", { className: "rounded-xl border border-primary bg-primary p-4", children: [
      jsx.jsx("h3", { className: "text-sm text-secondary", children: label }),
      jsx.jsx("div", { className: "mt-1 text-2xl font-semibold tabular-nums", children: new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(value) }),
      jsx.jsx("div", { "aria-hidden": true, className: "mt-3 h-2 overflow-hidden rounded-full bg-secondary", children: jsx.jsx("div", { className: "h-full rounded-full bg-accent", style: { width: `${Math.min(100, value * 100)}%` } }) }),
    ] }, windowMinutes);
  }) });
}

function BillingAnalytics({ isActive = true, isPolling = true, reduceMotion = false, scope = "consumer" }: BillingAnalyticsProps = {}): unknown {
  initializeBillingAnalytics();
  const runtime = appInitial as unknown as { N6t?: () => AccountState };
  const account = runtime.N6t?.() ?? {};
  const [days, setDays] = React.useState(30);
  const [breakdown, setBreakdown] = React.useState<Breakdown>(scope === "workspace" ? "product" : "feature");
  const query = useQuery(historyQuery(account, days, isActive, isPolling) as never) as QueryResult<PlanLimitHistory>;
  const history = query.data;
  const fiveHour = buildHistoryChart(history, breakdown, 300);
  const weekly = buildHistoryChart(history, breakdown, 10080);
  const status = {
    animateDataChanges: !reduceMotion && Boolean(query.isFetching && history),
    isError: Boolean(query.isError),
    isLoading: Boolean(query.isLoading || query.isPending),
    isUpdating: Boolean(query.isFetching && history),
    reduceMotion,
    onRetry: () => { void query.refetch(); },
  };
  const updated = history?.data_as_of == null ? null : new Date(history.data_as_of);
  const subtitle = updated && !Number.isNaN(updated.valueOf()) ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(updated)}` : "See what used each of your plan limits";
  return jsx.jsxs("div", { className: "space-y-6", children: [
    jsx.jsxs("section", { children: [
      jsx.jsxs("header", { className: "mb-3 flex flex-wrap items-end justify-between gap-3", children: [
        jsx.jsxs("div", { children: [jsx.jsx("h2", { className: "text-lg font-semibold", children: "Plan usage history" }), jsx.jsx("p", { className: "text-sm text-secondary", children: subtitle })] }),
        jsx.jsxs("div", { className: "flex items-center gap-2", children: [jsx.jsx(BreakdownControl, { breakdown, onChange: setBreakdown, scope }), jsx.jsx(DateRangeControl, { ariaLabel: "Usage time range", days, onChange: setDays })] }),
      ] }),
      jsx.jsx(LimitSummary, { history }),
    ] }),
    jsx.jsx(ActivityChart, { actions: null, ariaLabel: "Five-hour plan usage", breakdown, data: fiveHour, emptyMessage: "No five-hour usage during this period", scope, status, title: "5-hour periods", unit: "percent", visualization: "stacked-bar" }),
    jsx.jsx(ActivityChart, { actions: null, ariaLabel: "Weekly plan usage", breakdown, data: weekly, emptyMessage: "No weekly usage during this period", scope, status, title: "Weekly periods", unit: "percent", visualization: "stacked-bar" }),
  ] });
}

initializeBillingAnalytics();

export {
  initializeBillingAnalytics as n,
  BillingAnalytics as t,
};
