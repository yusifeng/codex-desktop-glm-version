// usage-code-review-settings —— Codex code review 使用量图表与汇总指标。

import * as activityChartChunk from "@rchunk/activity-chart";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as codeReviewQueriesChunk from "@rchunk/command-menu-queries";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;

type Scope = "business" | "consumer";
type ChartKey = "issues" | "reviews" | "priorities" | "reactions" | "sentiment";
type ChartUnit = "issues" | "reviews" | "reactions" | "percent";
type Visualization = "area" | "bar" | "stacked-bar";

interface CodeReviewMetricRow extends Record<string, number | string> {
  date: string;
  n_comments: number;
  n_comments_p0: number;
  n_comments_p1: number;
  n_comments_p2: number;
  n_reactions: number;
  n_reactions_minus1: number;
  n_reactions_other: number;
  n_reactions_plus1: number;
  n_reviews: number;
}

interface CodeReviewMetrics {
  data: CodeReviewMetricRow[];
}

interface ChartField {
  field: keyof CodeReviewMetricRow;
  key: string;
}

interface ChartDefinition {
  fields: ChartField[];
  key: ChartKey;
  unit: ChartUnit;
}

interface ChartPoint {
  date: string;
  total: number;
  values: Record<string, number>;
}

interface ActivityChartData {
  data: ChartPoint[];
  dataFreshnessTimestamp: null;
  series: Array<{ key: string; name: string; total: number }>;
  total: number;
}

interface QueryResult<Data> {
  data?: Data | null;
  isError: boolean;
  isLoading: boolean;
  refetch(): unknown;
}

interface AccountState {
  accountId?: string | null;
  authMethod?: string | null;
  userId?: string | null;
}

interface ChartStatus {
  animateDataChanges: boolean;
  isError: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  onRetry(): void;
  reduceMotion: boolean;
}

type Component = (props: Record<string, unknown>) => unknown;

interface SharedRuntime {
  $3(): void;
  FX(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  _L<Data>(options: Record<string, unknown>): QueryResult<Data>;
  e6: (() => ReactRuntime) & ReactRuntime;
  gL(): void;
  n4(): IntlShape;
}

interface SettingsLayoutComponent extends Component {
  Content: Component;
  Header: Component;
}

interface InitialRuntime {
  Hln(plan: unknown): boolean;
  M6t(): void;
  N6t(): AccountState;
  Rln(): void;
  Slt(): boolean;
  aa: SettingsLayoutComponent;
  d0t(): void;
  dS(hasCreditBalance: boolean): { plan?: unknown };
  f0t: unknown;
  ifn(): void;
  oa(): void;
  ofn(gateId: string): boolean;
  uS(): void;
  xlt(): void;
}

interface ActivityChartRuntime {
  H: Component;
  U(): void;
  n(): void;
  t: Component;
}

interface QueryRuntime {
  n(options: Record<string, unknown>): Record<string, unknown>;
  t(): void;
}

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  _L: useQuery,
  e6: getReactRuntime,
  gL: initializeUseQuery,
  n4: useIntl,
} = appSharedChunk as unknown as SharedRuntime;
const {
  Hln: isBusinessPlan,
  M6t: initializeAccountState,
  N6t: useAccountState,
  Rln: initializeUsagePlan,
  Slt: useReduceMotion,
  aa: SettingsLayout,
  d0t: initializeUsageSignal,
  dS: useUsagePlan,
  f0t: usageSignal,
  ifn: initializeExperimentRuntime,
  oa: initializeSettingsLayout,
  ofn: isGateEnabled,
  uS: initializeUsageRuntime,
  xlt: initializeMotionRuntime,
} = appInitialChunk as unknown as InitialRuntime;
const {
  H: DateRangeControl,
  U: initializeDateRangeControl,
  n: initializeActivityChart,
  t: ActivityChart,
} = activityChartChunk as unknown as ActivityChartRuntime;
const { n: createCodeReviewQuery, t: initializeCodeReviewQueries } =
  codeReviewQueriesChunk as unknown as QueryRuntime;

const CHARTS: ChartDefinition[] = [
  {
    key: "issues",
    unit: "issues",
    fields: [{ key: "issues", field: "n_comments" }],
  },
  {
    key: "reviews",
    unit: "reviews",
    fields: [{ key: "reviews", field: "n_reviews" }],
  },
  {
    key: "priorities",
    unit: "issues",
    fields: [
      { key: "p0", field: "n_comments_p0" },
      { key: "p1", field: "n_comments_p1" },
      { key: "p2", field: "n_comments_p2" },
    ],
  },
  {
    key: "reactions",
    unit: "reactions",
    fields: [
      { key: "plus1", field: "n_reactions_plus1" },
      { key: "minus1", field: "n_reactions_minus1" },
      { key: "other", field: "n_reactions_other" },
    ],
  },
  {
    key: "sentiment",
    unit: "percent",
    fields: [
      { key: "plus1", field: "n_reactions_plus1" },
      { key: "minus1", field: "n_reactions_minus1" },
      { key: "other", field: "n_reactions_other" },
    ],
  },
];

const CHART_TITLES: Record<ChartKey, string> = {
  issues: "Issues found",
  reviews: "PRs reviewed",
  priorities: "Issues by priority",
  reactions: "Reactions",
  sentiment: "Reaction sentiment",
};

const SERIES_NAMES: Record<string, string> = {
  issues: "Issues found",
  reviews: "PRs reviewed",
  p0: "P0",
  p1: "P1",
  p2: "P2",
  plus1: "👍 reactions",
  minus1: "👎 reactions",
  other: "Other reactions",
};

let jsx: JsxRuntime;
let React: ReactRuntime;

function metric(
  row: CodeReviewMetricRow,
  field: keyof CodeReviewMetricRow,
): number {
  const value = row[field];
  return typeof value === "number" ? value : 0;
}

function chartDefinitions(
  metrics?: CodeReviewMetrics | null,
): ChartDefinition[] {
  return CHARTS.filter((chart) => {
    if (chart.key !== "reactions" && chart.key !== "sentiment") return true;
    return metrics == null || metrics.data.some((row) => row.n_reactions > 0);
  });
}

function seriesName(key: string, chart: ChartKey): string {
  if (key === "other" && chart === "priorities") return "Other";
  return SERIES_NAMES[key] ?? key;
}

function buildChartData(
  chart: ChartDefinition,
  metrics?: CodeReviewMetrics | null,
): ActivityChartData | undefined {
  if (metrics == null) return undefined;
  const isPriorities = chart.key === "priorities";
  const points = metrics.data.map((row) => {
    const fieldsTotal = chart.fields.reduce(
      (sum, field) => sum + metric(row, field.field),
      0,
    );
    const total =
      chart.key === "reactions" || chart.key === "sentiment"
        ? row.n_reactions
        : isPriorities
          ? row.n_comments
          : fieldsTotal;
    const values = Object.fromEntries(
      chart.fields.map((field) => [
        field.key,
        chart.key === "sentiment" && total > 0
          ? (metric(row, field.field) / total) * 100
          : metric(row, field.field),
      ]),
    );
    if (isPriorities) values.other = Math.max(row.n_comments - fieldsTotal, 0);
    return { date: row.date, total, values };
  });
  const series = chart.fields.map((field) => ({
    key: field.key,
    name: seriesName(field.key, chart.key),
    total: metrics.data.reduce((sum, row) => sum + metric(row, field.field), 0),
  }));
  if (isPriorities) {
    series.push({
      key: "other",
      name: "Other",
      total: points.reduce((sum, point) => sum + (point.values.other ?? 0), 0),
    });
  }
  return {
    total: points.reduce((sum, point) => sum + point.total, 0),
    dataFreshnessTimestamp: null,
    series,
    data: points,
  };
}

function sentimentSummary(metrics: CodeReviewMetrics, intl: IntlShape): string {
  const total = metrics.data.reduce((sum, row) => sum + row.n_reactions, 0);
  const positive = metrics.data.reduce(
    (sum, row) => sum + row.n_reactions_plus1,
    0,
  );
  return (
    intl.formatNumber(total === 0 ? 0 : positive / total, {
      maximumFractionDigits: 0,
      style: "percent",
    }) + " positive"
  );
}

function CodeReviewChart({
  chart,
  consumerAnalytics,
  metrics,
  scope,
  status,
}: {
  chart: ChartDefinition;
  consumerAnalytics: boolean;
  metrics?: CodeReviewMetrics | null;
  scope: Scope;
  status: ChartStatus;
}): unknown {
  const intl = useIntl();
  const visualization: Visualization =
    chart.key === "priorities"
      ? "stacked-bar"
      : chart.key === "issues" || chart.key === "reviews"
        ? "bar"
        : "area";
  return jsx.jsx(ActivityChart, {
    consumerAnalytics,
    ariaLabel: CHART_TITLES[chart.key],
    data: buildChartData(chart, metrics),
    hideTotal: chart.key === "sentiment",
    scope,
    status,
    totalLabel:
      chart.key === "sentiment" && metrics != null
        ? sentimentSummary(metrics, intl)
        : undefined,
    title: CHART_TITLES[chart.key],
    unit: chart.unit,
    visualization,
    chartKey: chart.key,
  });
}

function CodeReviewSettingsContent({
  isActive,
  isPolling = true,
  reduceMotion,
  scope,
}: {
  isActive: boolean;
  isPolling?: boolean;
  reduceMotion: boolean;
  scope: Scope;
}): unknown {
  const consumerAnalytics = scope === "consumer" && isGateEnabled("393259752");
  const account = useAccountState();
  const intl = useIntl();
  const [days, setDays] = React.useState(30);
  const [cached, setCached] = React.useState<{
    accountId: string | null;
    data: CodeReviewMetrics;
    userId: string | null;
  } | null>(null);
  const query = useQuery<CodeReviewMetrics>(
    createCodeReviewQuery({
      isPolling,
      auth: account,
      days,
      enabled: isActive,
      scope,
    }),
  );
  const sameAccount =
    cached?.accountId === (account.accountId ?? null) &&
    cached.userId === (account.userId ?? null);
  const isUpdating =
    query.isLoading && !query.isError && query.data == null && sameAccount;
  const metrics = isUpdating ? cached?.data : query.data;
  const animateDataChanges =
    !reduceMotion &&
    query.data != null &&
    sameAccount &&
    cached?.data !== query.data;
  const status: ChartStatus = {
    animateDataChanges,
    isError: query.isError,
    isLoading: query.isLoading,
    isUpdating,
    reduceMotion,
    onRetry: () => {
      query.refetch();
    },
  };
  const changeDays = (nextDays: number) => {
    if (metrics?.data.some(hasActivity)) {
      setCached({
        accountId: account.accountId ?? null,
        data: metrics,
        userId: account.userId ?? null,
      });
    } else {
      setCached(null);
    }
    setDays(nextDays);
  };
  const header = jsx.jsx(SettingsLayout.Header, {
    actionsAlignment: "end",
    title: "Code review",
    actions: jsx.jsx(DateRangeControl, {
      ariaLabel: intl.formatMessage({
        id: "settings.usage.billing.codeReview.periodLabel",
        defaultMessage: "Code review time range",
        description:
          "Accessible label for the seven-day or thirty-day date-range selector shared by all desktop Codex code review analytics charts",
      }),
      days,
      onChange: changeDays,
    }),
  });
  const charts = chartDefinitions(metrics).map((chart) =>
    jsx.jsx(
      CodeReviewChart,
      {
        chart,
        consumerAnalytics,
        metrics,
        scope,
        status,
      },
      chart.key,
    ),
  );
  const content = jsx.jsx(SettingsLayout.Content, {
    className: "gap-3",
    children: charts,
  });
  return jsx.jsxs(SettingsLayout, { children: [header, content] });
}

function hasActivity(row: CodeReviewMetricRow): boolean {
  return row.n_comments > 0 || row.n_reactions > 0 || row.n_reviews > 0;
}

function UsageCodeReviewSettings({
  isPolling = true,
}: {
  isPolling?: boolean;
}): unknown {
  const usage = useSignalValue<{
    data?: { credits?: { balance?: unknown } } | null;
  }>(usageSignal);
  const { plan } = useUsagePlan(usage.data?.credits?.balance != null);
  const scope: Scope = isBusinessPlan(plan) ? "business" : "consumer";
  return jsx.jsx(CodeReviewSettingsContent, {
    isActive: true,
    isPolling,
    reduceMotion: useReduceMotion(),
    scope,
  });
}

function initializeUsageCodeReviewSettings(): void {
  initializeRuntimeLazy?.();
  initializeSignalRuntime?.();
  initializeUseQuery?.();
  initializeAccountState?.();
  initializeUsageRuntime?.();
  initializeUsageSignal?.();
  initializeMotionRuntime?.();
  initializeUsagePlan?.();
  initializeExperimentRuntime?.();
  initializeSettingsLayout?.();
  initializeCodeReviewQueries?.();
  initializeDateRangeControl?.();
  initializeActivityChart?.();
  React =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

initializeUsageCodeReviewSettings();

export { UsageCodeReviewSettings };
