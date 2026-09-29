// appgen-analytics-page —— Appgen Site 的流量概览与自定义事件分析页。
// 原版：app/webview/assets/page-cba32c20eeaa.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as tabsChunk from "@rchunk/security-tabs";
import * as siteDetailLayoutChunk from "@rchunk/appgen-site-detail-layout";
// @ts-ignore -- recovered published dependency; its semantic manifest entry is not shared yet.
import * as chartI18nChunk from "@rchunk/i18n";
import * as chartStoresChunk from "@rchunk/chart-stores";
import type { IntlShape, JsxRuntime, ReactRuntime, ScopedQueryFamily } from "@rchunk/app-shared";

void runtimeChunk;

type AnalyticsSection = "overview" | "events";
type AnalyticsRange = "7d" | "30d";
type AnalyticsInterval = "hourly" | "daily";
type AnalyticsGranularity = "auto" | AnalyticsInterval;

interface TrafficPoint {
  pageViews: number;
  timestampMs: number;
  uniqueVisitors: number;
}

interface TopPage {
  pageViews: number;
  path: string;
  uniqueVisitors: number;
}

interface AnalyticsOverview {
  endTimeMs: number;
  interval: AnalyticsInterval;
  projectId: string;
  startTimeMs: number;
  summary: { pageViews: number; uniqueVisitors: number };
  topPages: TopPage[];
  traffic: TrafficPoint[];
}

interface AnalyticsEventCatalog {
  eventNames: string[];
  projectId: string;
}

interface AnalyticsEvent {
  endTimeMs: number;
  eventName: string;
  interval: "daily";
  occurrences: Array<{ count: number; timestampMs: number }>;
  projectId: string;
  startTimeMs: number;
  totalOccurrences: number;
  uniqueVisitors: number;
}

interface OverviewParameters {
  granularity: AnalyticsGranularity;
  projectId: string;
  range: AnalyticsRange;
}

interface EventParameters {
  eventName: string;
  projectId: string;
  range: AnalyticsRange;
}

interface QueryResult<Data> {
  data?: Data;
  isError: boolean;
  isFetching?: boolean;
  refetch(): unknown;
}

interface AnalyticsIntlShape extends IntlShape {
  formatDateTimeRange(
    start: number,
    end: number,
    options: { dateStyle: "medium"; timeZone: string },
  ): string;
}

interface AppSharedBindings {
  $3(): void;
  $O: { FIVE_MINUTES: number };
  BX<Parameter, Data>(
    family: ScopedQueryFamily<unknown, Parameter, Data>,
    parameter: Parameter,
  ): QueryResult<Data>;
  FX(): void;
  I3(): JsxRuntime;
  K2(): void;
  QI(): void;
  QX<Parameter, Data>(
    scope: unknown,
    options: (parameter: Parameter) => {
      queryFn(): Promise<Data>;
      queryKey: readonly unknown[];
      retry: false;
      staleTime: number;
    },
  ): ScopedQueryFamily<unknown, Parameter, Data>;
  Qh(props: Record<string, unknown>): unknown;
  Y2(props: Record<string, unknown>): unknown;
  Yh(props: Record<string, unknown>): unknown;
  Z4(): unknown;
  ZI: unknown;
  e6(): ReactRuntime;
  h4(): void;
  n4(): AnalyticsIntlShape;
  xD(): void;
}

interface AppInitialBindings {
  Qgn(): void;
  Ygn(props: Record<string, unknown>): unknown;
  _an(): void;
  fan(toolName: string, arguments_: Record<string, unknown>, context: unknown): Promise<unknown>;
  ifn(): void;
  inn(projectId: string): string;
  ket(props: Record<string, unknown>): unknown;
  l_n(): { projectId?: string | null };
  lnn(): void;
  o_n(): (destination: string) => void;
  ofn(gateId: string): boolean;
  rnn(projectId: string): string;
}

interface ChartI18nBindings {
  a(props: Record<string, unknown>): unknown;
  i(): void;
  n(props: { children?: unknown; locale: string }): unknown;
  o(): void;
  r(): void;
}

const {
  $3: initializeRuntimeLazy,
  $O: queryDurations,
  BX: useQueryFamily,
  FX: initializeSignals,
  I3: getJsxRuntime,
  K2: initializeSharedComponents,
  QI: initializeApplicationScope,
  QX: createQueryFamily,
  Qh: LoadingSpinner,
  Y2: FormattedMessage,
  Yh: Button,
  Z4: getToolContext,
  ZI: applicationScope,
  e6: getReactRuntime,
  h4: initializeIntl,
  n4: useIntl,
  xD: initializeSchemas,
} = appSharedChunk as unknown as AppSharedBindings;
const {
  Qgn: initializeRouter,
  Ygn: Navigate,
  _an: initializeAppgenRouting,
  fan: callTool,
  ifn: initializeFeatureGates,
  inn: overviewRoute,
  ket: EmptyState,
  l_n: useRouteParameters,
  lnn: initializeAppgenQueries,
  o_n: useNavigate,
  ofn: useFeatureGate,
  rnn: eventsRoute,
} = appInitialChunk as unknown as AppInitialBindings;
const { n: initializeTabs, t: Tabs } = tabsChunk;
const { n: initializeSiteDetailLayout, t: SiteDetailLayout } = siteDetailLayoutChunk;
const { a: Chart, i: initializeChartI18n, o: initializeChartLocale, r: initializeChartMessages } =
  chartI18nChunk as unknown as ChartI18nBindings;
const { n: initializeChartStores } = chartStoresChunk;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const DAY_ANCHOR_MS = 8 * HOUR_MS;
const TIME_ZONE = "Etc/GMT+8";
const RANGE_DAYS: Record<AnalyticsRange, number> = { "7d": 7, "30d": 30 };

initializeRuntimeLazy();
initializeSchemas();
initializeSignals();
initializeApplicationScope();
initializeSharedComponents();
initializeIntl();
initializeRouter();
initializeFeatureGates();
initializeAppgenRouting();
initializeAppgenQueries();
initializeTabs();
initializeSiteDetailLayout();
initializeChartI18n();
initializeChartLocale();
initializeChartMessages();
initializeChartStores();

const React = getReactRuntime();
const jsx = getJsxRuntime();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Invalid analytics number");
  }
  return value;
}

function nonEmptyString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Invalid analytics string");
  }
  return value;
}

function parseWindow(value: unknown): { endTimeMs: number; interval: AnalyticsInterval; startTimeMs: number } {
  if (!isRecord(value)) throw new Error("Invalid analytics window");
  const granularity = value.granularity;
  if (granularity !== "1h" && granularity !== "1d") throw new Error("Invalid analytics interval");
  return {
    endTimeMs: finiteNumber(value.end_time_ms),
    interval: granularity === "1h" ? "hourly" : "daily",
    startTimeMs: finiteNumber(value.start_time_ms),
  };
}

function parseOverview(value: unknown): AnalyticsOverview {
  if (!isRecord(value) || !isRecord(value.window) || !isRecord(value.overall) || !isRecord(value.timeseries)) {
    throw new Error("Invalid analytics overview");
  }
  const overall = value.overall;
  const pageViews = overall.page_views;
  const uniqueVisitors = overall.unique_visitors;
  if (!isRecord(pageViews) || !isRecord(uniqueVisitors)) throw new Error("Invalid analytics totals");
  const points = value.timeseries.points;
  const topPages = value.top_pages;
  if (!Array.isArray(points) || !Array.isArray(topPages)) throw new Error("Invalid analytics series");
  const window = parseWindow(value.window);
  return {
    ...window,
    projectId: nonEmptyString(value.project_id),
    summary: { pageViews: finiteNumber(pageViews.value), uniqueVisitors: finiteNumber(uniqueVisitors.value) },
    topPages: topPages.map((entry) => {
      if (!isRecord(entry)) throw new Error("Invalid top page");
      return { path: nonEmptyString(entry.path), pageViews: finiteNumber(entry.page_views), uniqueVisitors: finiteNumber(entry.unique_visitors) };
    }),
    traffic: points.map((entry) => {
      if (!isRecord(entry)) throw new Error("Invalid traffic point");
      return { timestampMs: finiteNumber(entry.timestamp_ms), pageViews: finiteNumber(entry.page_views), uniqueVisitors: finiteNumber(entry.unique_visitors) };
    }),
  };
}

function parseEventCatalog(value: unknown): AnalyticsEventCatalog {
  if (!isRecord(value) || !Array.isArray(value.event_names)) throw new Error("Invalid analytics event catalog");
  return { projectId: nonEmptyString(value.project_id), eventNames: value.event_names.map(nonEmptyString) };
}

function parseEvent(value: unknown): AnalyticsEvent {
  if (!isRecord(value) || !isRecord(value.window) || !isRecord(value.overall) || !isRecord(value.timeseries)) {
    throw new Error("Invalid analytics event");
  }
  const occurrences = value.overall.occurrences;
  const uniqueVisitors = value.overall.unique_visitors;
  const points = value.timeseries.points;
  if (!isRecord(occurrences) || !isRecord(uniqueVisitors) || !Array.isArray(points)) {
    throw new Error("Invalid analytics event totals");
  }
  const window = parseWindow(value.window);
  return {
    ...window,
    interval: "daily",
    eventName: nonEmptyString(value.event_name),
    projectId: nonEmptyString(value.project_id),
    totalOccurrences: finiteNumber(occurrences.value),
    uniqueVisitors: finiteNumber(uniqueVisitors.value),
    occurrences: points.map((entry) => {
      if (!isRecord(entry)) throw new Error("Invalid event point");
      return { timestampMs: finiteNumber(entry.timestamp_ms), count: finiteNumber(entry.occurrences) };
    }),
  };
}

function resolveInterval(range: AnalyticsRange, granularity: AnalyticsGranularity): AnalyticsInterval {
  return granularity === "auto" ? (range === "7d" ? "hourly" : "daily") : granularity;
}

function createDateWindow(range: AnalyticsRange, granularity: AnalyticsGranularity, now = Date.now()) {
  const interval = resolveInterval(range, granularity);
  const alignedDay = Math.floor((now - DAY_ANCHOR_MS) / DAY_MS) * DAY_MS + DAY_ANCHOR_MS;
  return {
    endTimeMs: interval === "daily" ? alignedDay + DAY_MS : Math.ceil(now / HOUR_MS) * HOUR_MS,
    interval,
    startTimeMs: alignedDay - (RANGE_DAYS[range] - 1) * DAY_MS,
  };
}

const overviewQuery = createQueryFamily<OverviewParameters, AnalyticsOverview>(applicationScope, (parameters) => ({
  queryKey: ["appgen", "analytics", "overview", parameters.projectId, parameters.range, resolveInterval(parameters.range, parameters.granularity)],
  queryFn: async () => {
    const window = createDateWindow(parameters.range, parameters.granularity);
    return parseOverview(await callTool("sites.get_site_analytics_overview", {
      project_id: parameters.projectId,
      start_time_ms: window.startTimeMs,
      end_time_ms: window.endTimeMs,
      granularity: window.interval === "hourly" ? "1h" : "1d",
    }, getToolContext()));
  },
  retry: false,
  staleTime: queryDurations.FIVE_MINUTES,
}));

const eventCatalogQuery = createQueryFamily<string, AnalyticsEventCatalog>(applicationScope, (projectId) => ({
  queryKey: ["appgen", "analytics", "events", projectId],
  queryFn: async () => {
    const window = createDateWindow("30d", "daily");
    return parseEventCatalog(await callTool("sites.list_site_analytics_events", {
      project_id: projectId,
      start_time_ms: window.startTimeMs,
      end_time_ms: window.endTimeMs,
    }, getToolContext()));
  },
  retry: false,
  staleTime: queryDurations.FIVE_MINUTES,
}));

const eventQuery = createQueryFamily<EventParameters, AnalyticsEvent>(applicationScope, (parameters) => ({
  queryKey: ["appgen", "analytics", "event", parameters.projectId, parameters.eventName, parameters.range],
  queryFn: async () => {
    const window = createDateWindow(parameters.range, "daily");
    return parseEvent(await callTool("sites.query_site_analytics_event", {
      project_id: parameters.projectId,
      event_name: parameters.eventName,
      start_time_ms: window.startTimeMs,
      end_time_ms: window.endTimeMs,
    }, getToolContext()));
  },
  retry: false,
  staleTime: queryDurations.FIVE_MINUTES,
}));

function message(id: string, defaultMessage: string): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage });
}

function Metric({ label, value }: { label: unknown; value?: number }): unknown {
  const intl = useIntl();
  return jsx.jsxs("div", { className: "flex min-w-0 flex-col gap-0.5", children: [
    jsx.jsx("div", { className: "truncate text-xs text-secondary", children: label }),
    jsx.jsx("div", { className: "truncate text-base font-medium text-default", children: value == null ? "—" : intl.formatNumber(value, { maximumFractionDigits: 0 }) }),
  ] });
}

function Card({ children, title, detail }: { children: unknown; detail?: unknown; title: unknown }): unknown {
  return jsx.jsxs("section", { className: "flex min-w-0 flex-col gap-4 rounded-xl border border-default bg-primary-soft-alpha p-4", children: [
    jsx.jsxs("div", { className: "flex flex-col gap-0.5", children: [
      jsx.jsx("h2", { className: "text-sm font-medium text-default", children: title }),
      detail == null ? null : jsx.jsx("div", { className: "text-xs text-tertiary", children: detail }),
    ] }),
    children,
  ] });
}

function LoadingState(): unknown {
  return jsx.jsx("div", { className: "flex min-h-72 items-center justify-center", role: "status", children: jsx.jsx(LoadingSpinner, {}) });
}

function ErrorState({ children, onRetry }: { children: unknown; onRetry(): unknown }): unknown {
  return jsx.jsx("div", { className: "flex min-h-72 items-center justify-center", children: jsx.jsxs("div", { className: "flex items-center gap-3 text-sm text-secondary", children: [
    children,
    jsx.jsx(Button, { color: "secondary", size: "toolbar", onClick: onRetry, children: message("appgenAnalytics.events.retry", "Retry") }),
  ] }) });
}

function AnalyticsChart({ ariaLabel, data, empty, series }: { ariaLabel: string; data: Array<Record<string, string | number>>; empty: boolean; series: Array<Record<string, unknown>> }): unknown {
  if (empty) return jsx.jsx("div", { className: "flex h-64 items-center justify-center text-sm text-secondary", children: message("appgenAnalytics.chart.empty", "No data in this period") });
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsx("div", { className: "h-64 min-w-0", role: "img", "aria-label": ariaLabel, children: jsx.jsx(Chart, { data, disableAnimation: true, height: "100%", series, showGrid: true, showLegend: false, showTooltipCursor: true, showTooltipMarkers: true, showYAxis: true, width: "100%", xAxis: { axisLine: false, dataKey: "label", tickMargin: 8 }, yAxis: { axisLine: false, tickLine: false, width: 44 } }) }),
    jsx.jsx("ul", { className: "sr-only", children: data.map((entry, index) => jsx.jsx("li", { children: `${String(entry.label)}: ${series.map((item) => `${String(item.label)} ${String(entry[String(item.dataKey)])}`).join(", ")}` }, index)) }),
  ] });
}

function RangeSelect({ range, onChange }: { range: AnalyticsRange; onChange(range: AnalyticsRange): void }): unknown {
  return jsx.jsxs("select", { "aria-label": "Date range", value: range, onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value as AnalyticsRange), children: [
    jsx.jsx("option", { value: "7d", children: "Last 7 days" }),
    jsx.jsx("option", { value: "30d", children: "Last 30 days" }),
  ] });
}

function OverviewContent({ overview }: { overview: AnalyticsOverview }): unknown {
  const intl = useIntl();
  const trafficData = overview.traffic.map((point) => ({
    label: overview.interval === "hourly"
      ? intl.formatDate(point.timestampMs, { day: "numeric", hour: "numeric", month: "short", timeZone: TIME_ZONE })
      : intl.formatDate(point.timestampMs, { day: "numeric", month: "short", timeZone: TIME_ZONE }),
    pageViews: point.pageViews,
    uniqueVisitors: point.uniqueVisitors,
  }));
  const trafficEmpty = overview.summary.pageViews === 0 && overview.summary.uniqueVisitors === 0;
  const series = [
    { color: "var(--color-chart-blue)", curveType: "monotone", dataKey: "uniqueVisitors", label: "Unique visitors", type: "line", valueFormat: "integer" },
    { color: "var(--color-chart-purple)", curveType: "monotone", dataKey: "pageViews", label: "Page views", type: "line", valueFormat: "integer" },
  ];
  const traffic = trafficEmpty
    ? jsx.jsx("div", { className: "flex h-64 items-center justify-center text-sm text-secondary", children: message("appgenAnalytics.traffic.empty", "No traffic in this period") })
    : jsx.jsx(AnalyticsChart, { ariaLabel: "Site traffic over time", data: trafficData, empty: false, series });
  const topPages = overview.topPages.length === 0
    ? jsx.jsx("div", { className: "py-8 text-center text-sm text-secondary", children: message("appgenAnalytics.topPages.empty", "No page views in this period") })
    : jsx.jsx("table", { className: "w-full text-sm", children: jsx.jsxs(jsx.Fragment, { children: [
        jsx.jsx("thead", { children: jsx.jsxs("tr", { children: [jsx.jsx("th", { children: "Page" }), jsx.jsx("th", { children: "Unique visitors" }), jsx.jsx("th", { children: "Page views" })] }) }),
        jsx.jsx("tbody", { children: overview.topPages.map((page) => jsx.jsxs("tr", { children: [jsx.jsx("td", { className: "font-mono", children: page.path }), jsx.jsx("td", { children: intl.formatNumber(page.uniqueVisitors, { maximumFractionDigits: 0 }) }), jsx.jsx("td", { children: intl.formatNumber(page.pageViews, { maximumFractionDigits: 0 }) })] }, page.path)) }),
      ] }) });
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsx(Card, { title: message("appgenAnalytics.traffic.title", "Traffic over time"), detail: `${overview.interval === "hourly" ? "Hourly" : "Daily"} · ${intl.formatDateTimeRange(overview.startTimeMs, overview.endTimeMs - 1, { dateStyle: "medium", timeZone: TIME_ZONE })}`, children: traffic }),
    jsx.jsx(Card, { title: message("appgenAnalytics.topPages.title", "Top pages"), children: topPages }),
  ] });
}

function OverviewPanel({ projectId }: { projectId: string }): unknown {
  const [range, setRange] = React.useState<AnalyticsRange>("30d");
  const result = useQueryFamily(overviewQuery, { projectId, range, granularity: "auto" });
  let content: unknown;
  if (result.data != null) content = jsx.jsx(OverviewContent, { overview: result.data });
  else if (result.isError) content = jsx.jsx(ErrorState, { onRetry: result.refetch, children: message("appgenAnalytics.overview.error", "Unable to load analytics") });
  else content = jsx.jsx(LoadingState, {});
  return jsx.jsxs("div", { id: "appgen-analytics-overview", className: "flex flex-col gap-6", role: "tabpanel", "aria-label": "Overview", children: [
    jsx.jsxs("div", { className: "flex flex-wrap items-center gap-x-8 gap-y-3", children: [
      jsx.jsx(Metric, { label: message("appgenAnalytics.metric.uniqueVisitors", "Unique visitors"), value: result.data?.summary.uniqueVisitors }),
      jsx.jsx(Metric, { label: message("appgenAnalytics.metric.pageViews", "Page views"), value: result.data?.summary.pageViews }),
      jsx.jsx("div", { className: "ms-auto", children: jsx.jsx(RangeSelect, { range, onChange: setRange }) }),
    ] }),
    content,
  ] });
}

function EventResult({ event }: { event: AnalyticsEvent }): unknown {
  const intl = useIntl();
  const data = event.occurrences.map((point) => ({ label: intl.formatDate(point.timestampMs, { day: "numeric", month: "short", timeZone: TIME_ZONE }), count: point.count }));
  const chart = event.totalOccurrences === 0
    ? jsx.jsx("div", { className: "flex h-64 items-center justify-center text-sm text-secondary", children: message("appgenAnalytics.events.noOccurrences", "No occurrences in this period") })
    : jsx.jsx(AnalyticsChart, { ariaLabel: `Occurrences of ${event.eventName} over time`, data, empty: false, series: [{ color: "var(--color-chart-green)", curveType: "monotone", dataKey: "count", fillColor: "var(--color-chart-green)", label: "Occurrences", type: "area", valueFormat: "integer" }] });
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      jsx.jsxs("div", { children: [jsx.jsx("div", { className: "font-mono text-sm font-medium", children: event.eventName }), jsx.jsx("div", { className: "text-xs text-tertiary", children: intl.formatDateTimeRange(event.startTimeMs, event.endTimeMs - 1, { dateStyle: "medium", timeZone: TIME_ZONE }) })] }),
      jsx.jsx("div", { className: "rounded-md bg-primary-soft-alpha px-2 py-1 text-xs text-secondary", children: "Aggregation: Count" }),
    ] }),
    jsx.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [jsx.jsx(Metric, { label: "Total occurrences", value: event.totalOccurrences }), jsx.jsx(Metric, { label: "Unique visitors", value: event.uniqueVisitors })] }),
    jsx.jsx(Card, { title: "Count over time", detail: `Daily · ${intl.formatDateTimeRange(event.startTimeMs, event.endTimeMs - 1, { dateStyle: "medium", timeZone: TIME_ZONE })}`, children: chart }),
  ] });
}

function EventQuery({ eventNames, initialEventName, projectId }: { eventNames: string[]; initialEventName: string; projectId: string }): unknown {
  const [draftEvent, setDraftEvent] = React.useState(initialEventName);
  const [draftRange, setDraftRange] = React.useState<AnalyticsRange>("30d");
  const [eventName, setEventName] = React.useState(initialEventName);
  const [range, setRange] = React.useState<AnalyticsRange>("30d");
  const result = useQueryFamily(eventQuery, { projectId, eventName, range });
  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (draftEvent === eventName && draftRange === range) result.refetch();
    else { setEventName(draftEvent); setRange(draftRange); }
  };
  let content: unknown;
  if (result.data != null) content = jsx.jsx(EventResult, { event: result.data });
  else if (result.isError) content = jsx.jsx(ErrorState, { onRetry: result.refetch, children: message("appgenAnalytics.events.queryError", "Unable to query this event") });
  else content = jsx.jsx(LoadingState, {});
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsxs("form", { className: "flex flex-wrap items-end gap-3 rounded-xl border border-default bg-primary-soft-alpha p-4", onSubmit: submit, children: [
      jsx.jsxs("label", { className: "flex min-w-60 flex-1 flex-col gap-1 text-xs text-secondary", children: ["Event", jsx.jsx("select", { value: draftEvent, onChange: (event: { currentTarget: { value: string } }) => setDraftEvent(event.currentTarget.value), children: eventNames.map((name) => jsx.jsx("option", { value: name, children: name }, name)) })] }),
      jsx.jsxs("label", { className: "flex flex-col gap-1 text-xs text-secondary", children: ["Date range", jsx.jsx(RangeSelect, { range: draftRange, onChange: setDraftRange })] }),
      jsx.jsx(Button, { color: "primary", loading: result.isFetching === true, size: "toolbar", type: "submit", children: "Run query" }),
    ] }),
    content,
  ] });
}

function EventsPanel({ projectId }: { projectId: string }): unknown {
  const result = useQueryFamily(eventCatalogQuery, projectId);
  let content: unknown;
  const firstEvent = result.data?.eventNames[0];
  if (result.data == null) content = result.isError
    ? jsx.jsx(ErrorState, { onRetry: result.refetch, children: message("appgenAnalytics.events.catalogError", "Unable to load custom events") })
    : jsx.jsx(LoadingState, {});
  else if (firstEvent == null) content = jsx.jsx(EmptyState, { className: "min-h-72", title: jsx.jsx("h3", { children: "No custom events yet" }), description: "Events logged by this site will appear here" });
  else content = jsx.jsx(EventQuery, { eventNames: result.data.eventNames, initialEventName: firstEvent, projectId });
  return jsx.jsxs("div", { id: "appgen-analytics-events", className: "flex flex-col gap-6", role: "tabpanel", "aria-label": "Events", children: [
    jsx.jsxs("div", { className: "flex flex-col gap-1", children: [jsx.jsx("h2", { className: "text-base font-medium", children: "Custom events" }), jsx.jsx("p", { className: "max-w-2xl text-sm text-secondary", children: "Query events logged by your site and inspect their count over time" })] }),
    content,
  ] });
}

function AnalyticsPageContent({ projectId, section }: { projectId: string; section: AnalyticsSection }): unknown {
  const navigate = useNavigate();
  const intl = useIntl();
  const showSections = useFeatureGate("663642302");
  const children = () => jsx.jsxs("div", { className: "flex flex-col gap-6", children: [
    showSections ? jsx.jsx(Tabs, { ariaLabel: intl.formatMessage({ id: "appgenAnalytics.navigation.label", defaultMessage: "Analytics sections" }), selectedKey: section, tabs: [
      { key: "overview", name: "Overview", panelId: "appgen-analytics-overview" },
      { key: "events", name: "Events", panelId: "appgen-analytics-events" },
    ], variant: "underline", onSelect: (key: string) => navigate(key === "overview" ? overviewRoute(projectId) : eventsRoute(projectId)) }) : null,
    section === "overview" ? jsx.jsx(OverviewPanel, { projectId }) : jsx.jsx(EventsPanel, { projectId }),
  ] });
  return jsx.jsx(SiteDetailLayout, { projectId, selectedTab: "analytics", children });
}

function AppgenAnalyticsPage({ section }: { section: AnalyticsSection }): unknown {
  const { projectId } = useRouteParameters();
  if (projectId == null) return jsx.jsx(Navigate, { replace: true, to: "/sites" });
  return jsx.jsx(AnalyticsPageContent, { projectId, section });
}

export { AppgenAnalyticsPage };
