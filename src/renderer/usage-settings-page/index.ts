// usage-settings-page — Usage limits, plan, credits, resets, and analytics tabs.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as usageQueriesChunk from "@rchunk/command-menu-queries";
import * as entryPointAvailabilityChunk from "@rchunk/entry-point-availability";
import "@rchunk/form-runtime";
import * as linkedAppLogoChunk from "@rchunk/linked-app-logo";
import * as pricingChunk from "@rchunk/pricing";
import "@rchunk/rolldown-runtime";
import * as tabsChunk from "@rchunk/security-tabs";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";
import * as usdChunk from "@rchunk/usd";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}

interface ReactRuntime {
  Suspense: unknown;
  lazy(loader: () => Promise<{ default: unknown }>): unknown;
  useLayoutEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<Value>(value: Value): { current: Value };
}

interface QueryState<Value> {
  data?: Value | null;
  isError?: boolean;
  isLoading?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface SharedRuntime {
  $3(): void;
  FX(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  K2(): void;
  Y2: unknown;
  Yh: unknown;
  e6(): ReactRuntime;
}

interface SearchParameters {
  get(name: string): string | null;
  toString(): string;
}

interface LocationState {
  hash: string;
  pathname: string;
  search: string;
  state?: unknown;
}

interface VisibleSettingsSection {
  label?: string;
  slug: string;
}

interface UsageSettingsContext {
  onSelectSection(section: string, subsection?: string, replace?: boolean): void;
  restoreUsageTabFocus(element: unknown): void;
  visibleSettingsSections: VisibleSettingsSection[];
}

interface PlanState {
  canPurchaseCredits?: boolean;
  canViewCreditSettings?: boolean;
  isAccessLoading?: boolean;
  isBusinessWorkspace?: boolean;
  isUsageSettingsVisible?: boolean;
  isUsdWorkspace?: boolean;
  plan?: string | null;
}

interface InitialRuntime {
  Ygn: unknown;
  c_n(): UsageSettingsContext;
  dS(hasCreditBalance: boolean, source?: string): PlanState;
  d_n(): [SearchParameters];
  f0t: unknown;
  i_n(): LocationState;
}

interface TabsRuntime {
  n(): void;
  t: unknown;
}

interface LoadingRowRuntime {
  n(): void;
  t: unknown;
}

interface EntryPointRuntime {
  r(): boolean;
  t(): void;
}

interface QueriesRuntime {
  t(): void;
}

interface PricingRuntime {
  r(): void;
  t(input: {
    amount?: number | null;
    currencyCode: string;
    intl: {
      formatNumber(value: number, options: Intl.NumberFormatOptions): string;
      formatNumberToParts(value: number, options: Intl.NumberFormatOptions): Intl.NumberFormatPart[];
    };
  }): string | null;
}

interface UsdRuntime {
  t(value?: number | null): string;
}

interface LinkedAppLogoRuntime {
  n: unknown;
  r(): void;
}

interface RateLimitWindow {
  limit_window_seconds?: number;
  reset_at?: number | string | null;
  used_percent?: number | null;
}

interface AppLimit {
  app: { client_app_type?: string; logo_uri?: string | null; name: string };
  limit?: number | null;
  used_percent?: number | null;
  uses_credits?: boolean;
}

interface UsageData {
  credits?: { balance?: number | null; unlimited?: boolean };
  isUnlimited?: boolean;
  monthly?: { limit?: number | null; used?: number | null };
  planPrice?: { amount?: number | null; currencyCode?: string | null };
  rate_limit?: {
    primary_window?: RateLimitWindow | null;
    secondary_window?: RateLimitWindow | null;
  } | null;
  reset_credits?: Array<{ expires_at?: string | null; id: string }>;
  services?: AppLimit[];
}

type UsageSection = "analytics" | "consumer-view" | "usage" | "usage-code-review";

const {
  $3: initializeJsxRuntime,
  FX: initializeSignals,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeIntl,
  Y2: FormattedMessage,
  Yh: Button,
  e6: getReactRuntime,
} = appSharedChunk as unknown as SharedRuntime;
const {
  Ygn: Redirect,
  c_n: useUsageSettingsContext,
  dS: usePlanState,
  d_n: useSearchParameters,
  f0t: usageQuerySignal,
  i_n: useLocation,
} = appInitialChunk as unknown as InitialRuntime;
const { n: initializeTabs, t: Tabs } = tabsChunk as unknown as TabsRuntime;
const { n: initializeLoadingRow, t: SettingsLoadingRow } =
  settingsLoadingRowChunk as unknown as LoadingRowRuntime;
const { r: useGiftCreditPurchaseAvailable, t: initializeEntryPointAvailability } =
  entryPointAvailabilityChunk as unknown as EntryPointRuntime;
const { t: initializeUsageQueries } = usageQueriesChunk as unknown as QueriesRuntime;
const { r: initializePricing, t: formatPrice } = pricingChunk as unknown as PricingRuntime;
const { t: formatUsd } = usdChunk as unknown as UsdRuntime;
const { n: LinkedAppLogo, r: initializeLinkedAppLogo } =
  linkedAppLogoChunk as unknown as LinkedAppLogoRuntime;

const ALLOWED_SECTIONS = new Set<UsageSection>([
  "analytics",
  "consumer-view",
  "usage",
  "usage-code-review",
]);
const SECTION_LABELS: Record<UsageSection, string> = {
  analytics: "Analytics",
  "consumer-view": "Consumer view",
  usage: "Overview",
  "usage-code-review": "Code review",
};

let jsx: JsxRuntime;
let React: ReactRuntime;

const UsageAnalyticsSettings = (): unknown => {
  const Component = getLazyComponents().analytics;
  return jsx.jsx(Component, { isPolling: true });
};
const ConsumerViewSettings = (): unknown => {
  const Component = getLazyComponents().consumerView;
  return jsx.jsx(Component, { isPolling: true });
};
const UsageCodeReviewSettings = (): unknown => {
  const Component = getLazyComponents().codeReview;
  return jsx.jsx(Component, { isPolling: true });
};

let lazyComponents:
  | { analytics: unknown; codeReview: unknown; consumerView: unknown }
  | undefined;

function getLazyComponents(): { analytics: unknown; codeReview: unknown; consumerView: unknown } {
  if (lazyComponents != null) return lazyComponents;
  lazyComponents = {
    analytics: React.lazy(() =>
      import("@rchunk/usage-analytics-settings").then((module) => ({
        default: module.UsageAnalyticsSettings,
      })),
    ),
    consumerView: React.lazy(() =>
      import("@rchunk/consumer-view-settings").then((module) => ({
        default: module.ConsumerViewSettings,
      })),
    ),
    codeReview: React.lazy(() =>
      import("@rchunk/usage-code-review-settings").then((module) => ({
        default: module.UsageCodeReviewSettings,
      })),
    ),
  };
  return lazyComponents;
}

function message(id: string, defaultMessage: string, description: string): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage, description });
}

function visibleSections(sections: VisibleSettingsSection[]): UsageSection[] {
  const result = sections.flatMap((section): UsageSection[] =>
    ALLOWED_SECTIONS.has(section.slug as UsageSection) ? [section.slug as UsageSection] : [],
  );
  return result.length === 0 ? ["usage"] : result;
}

function canonicalLocation(location: LocationState, section: UsageSection): string {
  const parameters = new URLSearchParams(location.search);
  if (section === "usage") parameters.delete("tab");
  else parameters.set("tab", section);
  const search = parameters.toString();
  return `${location.pathname}${search.length === 0 ? "" : `?${search}`}`;
}

function UsageSettingsPage(): unknown {
  const context = useUsageSettingsContext();
  const [searchParameters] = useSearchParameters();
  const location = useLocation();
  const sections = visibleSections(context.visibleSettingsSections);
  const requested = searchParameters.get("tab");
  const selected: UsageSection =
    requested != null && sections.includes(requested as UsageSection)
      ? (requested as UsageSection)
      : sections[0] ?? "usage";
  const canonical = canonicalLocation(location, selected);
  if (`${location.pathname}${location.search}` !== canonical) {
    return jsx.jsx(Redirect, { to: `${canonical}${location.hash}`, state: location.state, replace: true });
  }
  const compact = selected === "usage" && sections.length === 1;
  return jsx.jsxs("main", {
    "data-density": compact ? "compact" : "default",
    "data-page": "usage-settings",
    children: [
      jsx.jsx("h1", { children: "Usage" }),
      sections.length > 1
        ? jsx.jsx(UsageTabs, { context, sections, selected })
        : null,
      sections.map((section) =>
        jsx.jsx(
          "section",
          {
            id: `usage-panel-${section}`,
            role: sections.length > 1 ? "tabpanel" : undefined,
            "aria-labelledby": sections.length > 1 ? `usage-panel-${section}-tab` : undefined,
            hidden: section !== selected,
            children: jsx.jsx(React.Suspense, {
              fallback: jsx.jsx(SettingsLoadingRow, { children: "Loading usage settings…" }),
              children: jsx.jsx(sectionComponent(section), { isPolling: section === selected }),
            }),
          },
          section,
        ),
      ),
    ],
  });
}

function UsageTabs({
  context,
  sections,
  selected,
}: {
  context: UsageSettingsContext;
  sections: UsageSection[];
  selected: UsageSection;
}): unknown {
  const tabListRef = React.useRef<unknown>(null);
  React.useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => context.restoreUsageTabFocus(tabListRef.current));
    return () => cancelAnimationFrame(frame);
  }, [context.restoreUsageTabFocus, selected]);
  return jsx.jsx(Tabs, {
    ariaLabel: "Usage sections",
    onSelect: (section: string) => context.onSelectSection(section, undefined, true),
    scrollable: true,
    selectedKey: selected,
    tabListRef,
    tabs: sections.map((section) => ({
      key: section,
      name: SECTION_LABELS[section],
      panelId: `usage-panel-${section}`,
    })),
    variant: "underline",
  });
}

function sectionComponent(section: UsageSection): unknown {
  switch (section) {
    case "analytics":
      return UsageAnalyticsSettings;
    case "consumer-view":
      return ConsumerViewSettings;
    case "usage-code-review":
      return UsageCodeReviewSettings;
    case "usage":
      return UsageOverview;
  }
}

function UsageOverview({ isPolling = true }: { isPolling?: boolean }): unknown {
  const query = useSignalValue<QueryState<UsageData>>(usageQuerySignal);
  const data = query.data ?? null;
  const planState = usePlanState(data?.credits?.balance != null, "usage");
  const giftCreditsAvailable = useGiftCreditPurchaseAvailable();
  if (planState.isAccessLoading || (query.isLoading && data == null)) {
    return jsx.jsx(SettingsLoadingRow, { children: "Loading usage settings…" });
  }
  if (!planState.isUsageSettingsVisible) return null;
  if (query.isError && data == null) {
    return jsx.jsxs("div", {
      "data-state": "error",
      children: [
        jsx.jsx("span", { children: "Could not load usage settings." }),
        jsx.jsx(Button, { onClick: () => void query.refetch(), children: "Retry" }),
      ],
    });
  }
  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(PlanSection, { data, plan: planState.plan ?? null }),
      jsx.jsx(LimitsSection, { data, isPolling }),
      planState.canViewCreditSettings && data?.credits != null
        ? jsx.jsx(CreditsSection, {
            canPurchase: planState.canPurchaseCredits === true,
            credits: data.credits,
            giftCreditsAvailable,
          })
        : null,
      (data?.reset_credits?.length ?? 0) > 0
        ? jsx.jsx(ResetCreditsSection, { resets: data?.reset_credits ?? [] })
        : null,
      (data?.services?.length ?? 0) > 0
        ? jsx.jsx(ServicesSection, { services: data?.services ?? [] })
        : null,
    ],
  });
}

function PlanSection({ data, plan }: { data: UsageData | null; plan: string | null }): unknown {
  const price = data?.planPrice;
  const formattedPrice =
    price?.currencyCode == null
      ? null
      : formatPrice({
          amount: price.amount,
          currencyCode: price.currencyCode,
          intl: {
            formatNumber: (value, options) => new Intl.NumberFormat(undefined, options).format(value),
            formatNumberToParts: (value, options) =>
              new Intl.NumberFormat(undefined, options).formatToParts(value),
          },
        });
  return jsx.jsxs("section", {
    "data-section": "plan",
    children: [
      jsx.jsx("h2", { children: "Your plan" }),
      jsx.jsx("strong", { children: planLabel(plan) }),
      formattedPrice == null ? null : jsx.jsx("span", { children: `${formattedPrice} / month` }),
      jsx.jsx(Button, { children: "View plans" }),
    ],
  });
}

function planLabel(plan: string | null): string {
  if (plan == null || plan === "free") return "ChatGPT Free";
  if (plan === "go") return "ChatGPT Go";
  if (plan === "plus") return "ChatGPT Plus";
  if (plan === "pro") return "ChatGPT Pro";
  return plan;
}

function LimitsSection({ data, isPolling }: { data: UsageData | null; isPolling: boolean }): unknown {
  const windows = [
    ["5-hour limit", data?.rate_limit?.primary_window],
    ["Weekly limit", data?.rate_limit?.secondary_window],
  ] as const;
  return jsx.jsxs("section", {
    "data-polling": isPolling,
    "data-section": "limits",
    children: [
      jsx.jsx("h2", { children: "Plan limits" }),
      windows.map(([label, window]) =>
        window == null
          ? null
          : jsx.jsxs("div", {
              "data-limit": label,
              children: [
                jsx.jsx("span", { children: label }),
                jsx.jsx("progress", { max: 100, value: Math.max(0, 100 - (window.used_percent ?? 0)) }),
                jsx.jsx("span", { children: `${Math.max(0, 100 - (window.used_percent ?? 0))}% left` }),
                window.reset_at == null
                  ? null
                  : jsx.jsx("time", { children: `Resets ${String(window.reset_at)}` }),
              ],
            }, label),
      ),
      data?.monthly == null
        ? null
        : jsx.jsxs("div", {
            "data-limit": "monthly",
            children: [
              jsx.jsx("span", { children: "Monthly usage limit" }),
              jsx.jsx("span", { children: `${data.monthly.used ?? 0} of ${data.monthly.limit ?? 0} credits used` }),
            ],
          }),
    ],
  });
}

function CreditsSection({
  canPurchase,
  credits,
  giftCreditsAvailable,
}: {
  canPurchase: boolean;
  credits: NonNullable<UsageData["credits"]>;
  giftCreditsAvailable: boolean;
}): unknown {
  const balance = credits.unlimited ? "Unlimited credit" : formatUsd(credits.balance);
  return jsx.jsxs("section", {
    "data-section": "credits",
    children: [
      jsx.jsx("h2", { children: "Credits" }),
      jsx.jsx("strong", { children: balance }),
      jsx.jsx("span", { children: "Current balance" }),
      canPurchase ? jsx.jsx(Button, { children: "Add more" }) : null,
      giftCreditsAvailable ? jsx.jsx(Button, { children: "Gift credits" }) : null,
    ],
  });
}

function ResetCreditsSection({
  resets,
}: {
  resets: Array<{ expires_at?: string | null; id: string }>;
}): unknown {
  return jsx.jsxs("section", {
    "data-section": "resets",
    children: [
      jsx.jsx("h2", { children: "Usage limit resets" }),
      resets.map((reset) =>
        jsx.jsxs("div", {
          children: [
            jsx.jsx("span", { children: "Usage reset" }),
            reset.expires_at == null ? null : jsx.jsx("time", { children: `Expires ${reset.expires_at}` }),
            jsx.jsx(Button, { children: "Use reset" }),
          ],
        }, reset.id),
      ),
    ],
  });
}

function ServicesSection({ services }: { services: AppLimit[] }): unknown {
  return jsx.jsxs("section", {
    "data-section": "services",
    children: [
      jsx.jsx("h2", { children: "Services sharing tokens" }),
      services.map((service) =>
        jsx.jsxs("div", {
          "data-service": service.app.name,
          children: [
            jsx.jsx(LinkedAppLogo, { app: service.app }),
            jsx.jsx("span", { children: service.app.name }),
            jsx.jsx("span", { children: `${Math.round((service.limit ?? 0) * 100)}% of available tokens` }),
            service.uses_credits ? jsx.jsx("span", { children: "Uses credits" }) : null,
          ],
        }, service.app.name),
      ),
    ],
  });
}

initializeJsxRuntime();
initializeSignals();
initializeIntl();
initializeTabs();
initializeLoadingRow();
initializeEntryPointAvailability();
initializeUsageQueries();
initializePricing();
initializeLinkedAppLogo();
jsx = getJsxRuntime();
React = getReactRuntime();
getLazyComponents();

export { UsageSettingsPage };
