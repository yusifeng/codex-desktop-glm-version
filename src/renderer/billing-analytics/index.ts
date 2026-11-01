import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/thread-usage-breakdown";
import "@rchunk/recharts-bar-chart";
import "@rchunk/command-menu-queries";
import "@rchunk/settings-loading-row";
import "@rchunk/activity-chart";
import "@rchunk/usd-currency-formatter";

interface BillingAnalyticsProps extends Record<string, unknown> {
  canViewCreditSettings?: boolean;
  isPolling?: boolean;
  isUsdWorkspace?: boolean;
  reduceMotion?: boolean;
  scope?: "business" | "consumer" | "workspace";
  workspaceTaskUsage?: boolean;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime {
  runtime ??= getJsxRuntime();
  return runtime;
}

function initializeBillingAnalytics(): void {
  void jsx();
}

function BillingAnalytics({
  canViewCreditSettings = false,
  isPolling = true,
  isUsdWorkspace = false,
  scope = "consumer",
  workspaceTaskUsage = false,
}: BillingAnalyticsProps): unknown {
  const title = scope === "workspace" ? "Workspace usage" : scope === "business" ? "Business usage" : "Usage";
  return jsx().jsxs("section", {
    "aria-label": title,
    "data-billing-analytics": scope,
    children: [
      jsx().jsx("h2", { children: title }),
      jsx().jsx("p", {
        className: "text-sm text-secondary",
        children: workspaceTaskUsage
          ? "Task usage for this workspace is shown here."
          : "Usage and limits for the current billing period are shown here.",
      }),
      isPolling ? jsx().jsx("span", { role: "status", children: "Refreshing usage…" }) : null,
      isUsdWorkspace ? jsx().jsx("p", { children: "Charges are displayed in USD." }) : null,
      canViewCreditSettings
        ? jsx().jsx("a", { href: "/settings/billing", children: "Manage credits" })
        : null,
    ],
  });
}

initializeBillingAnalytics();

export { initializeBillingAnalytics as n, BillingAnalytics as t };
