import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializeBillingAnalytics, t as BillingAnalytics } from "@rchunk/billing-analytics";

interface UsageAnalyticsSettingsProps { canViewCreditSettings?: boolean; isAccessLoading?: boolean; isPolling?: boolean; isUsdWorkspace?: boolean; plan?: string | null; reduceMotion?: boolean }
let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeUsageAnalyticsSettings(): void { if (initialized) return; initialized = true; initializeBillingAnalytics(); jsx = getJsxRuntime(); }
function UsageAnalyticsSettings({ canViewCreditSettings = false, isAccessLoading = false, isPolling = true, isUsdWorkspace = false, plan = null, reduceMotion = false }: UsageAnalyticsSettingsProps): unknown {
  initializeUsageAnalyticsSettings(); if (plan == null && isAccessLoading) return jsx!.jsx("div", { role: "status", children: "Loading usage…" });
  const workspacePlan = plan === "team" || plan === "enterprise"; const scope = workspacePlan ? "workspace" : plan === "business" ? "business" : "consumer";
  return jsx!.jsx(BillingAnalytics, { isPolling, canViewCreditSettings: workspacePlan || canViewCreditSettings, isUsdWorkspace, reduceMotion, scope });
}
initializeUsageAnalyticsSettings();
export { UsageAnalyticsSettings };
