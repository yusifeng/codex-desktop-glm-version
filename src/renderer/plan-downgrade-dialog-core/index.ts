import "@rchunk/rolldown-runtime";
import "@rchunk/pricing";
import "@rchunk/subscription-update-dialog";
import "@rchunk/billing-queries";
import "@rchunk/billing-query-error";
import "@rchunk/stripe-client";
import "@rchunk/billing-state";
import "@rchunk/billing-pricing";
import "@rchunk/subscription-queries";
import "@rchunk/billing-events";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

interface DowngradeDialogProps { account: { account: { account_id: string; plan_type?: string; structure?: string }; entitlement?: Record<string, unknown> }; accountId: string; onBack(): void; onClose(): void; targetPlan: string }
interface BillingApi { safePost<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as BillingApi;
function PlanDowngradeDialog({ account, accountId, targetPlan, onBack, onClose }: DowngradeDialogProps): unknown {
  const [status, setStatus] = React.useState<"idle" | "pending" | "complete" | "error">("idle");
  const eligible = account.account.account_id === accountId && account.account.structure === "personal" && account.account.plan_type !== targetPlan;
  const confirm = async () => {
    if (!eligible || status === "pending") return;
    setStatus("pending");
    try { await client.safePost("/consumer/billing/subscription/update", { additionalHeaders: { "ChatGPT-Account-ID": accountId }, requestBody: { target_plan: targetPlan } }); setStatus("complete"); } catch { setStatus("error"); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Change your plan" }), jsx.jsx("p", { children: `Switch from ${account.account.plan_type ?? "current plan"} to ${targetPlan}.` }), !eligible ? jsx.jsx("p", { role: "alert", children: "This plan change is not available." }) : null, status === "error" ? jsx.jsx("p", { role: "alert", children: "We couldn't update your plan." }) : null, status === "complete" ? jsx.jsx("p", { role: "status", children: "Your plan has been updated." }) : null, jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", disabled: status === "pending", onClick: onBack, children: "Back" }), jsx.jsx("button", { type: "button", onClick: status === "complete" ? onClose : confirm, disabled: !eligible || status === "pending", children: status === "complete" ? "Done" : "Confirm plan change" })] })] });
}
function initializePlanDowngradeDialog(): void { initializeApiClient(); }
export { initializePlanDowngradeDialog as n, PlanDowngradeDialog as t };
