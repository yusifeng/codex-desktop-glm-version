import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/billing-pricing";
import "@rchunk/billing-state";
import "@rchunk/chatgpt-subscription-events";
import "@rchunk/plan-downgrade-dialog-core";
import "@rchunk/format-amount";
import "@rchunk/queries";
import "@rchunk/billing-queries";
import "@rchunk/subscription-queries";
import "@rchunk/billing-query-error";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
type CancellationReason = "not_useful_enough" | "not_using_it_anymore" | "something_else" | "too_expensive";
interface CancellationAccount { account: { account_id: string; plan_type?: string; structure: "personal" | string }; entitlement: { expiration_date?: string | null; has_active_subscription: boolean; is_eligible_for_cp?: boolean; plan_name?: string } }
interface CancellationDialogProps { account: CancellationAccount; accountId: string; activeAccountId?: string; error?: string | null; initialStep?: "confirm" | "survey" | "things_you_lose"; isLoading?: boolean; onCancel?(reason: CancellationReason | null, detail: string): Promise<void> | void; onClose(): void; promotion?: { description: string; label: string } | null }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function CancellationDialog({ account, accountId, activeAccountId = accountId, error, initialStep = "confirm", isLoading = false, onCancel, onClose, promotion = null }: CancellationDialogProps): unknown {
  const eligible = activeAccountId === accountId && account.account.account_id === accountId && account.account.structure === "personal" && account.entitlement.has_active_subscription;
  let step = initialStep, reason: CancellationReason | null = null, detail = "", pending = false;
  if (!eligible) return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: "Subscription Cancellation" }), jsx().jsx("p", { role: "alert", children: "This subscription can no longer be canceled here. Review your subscription in Billing." }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Close" })] });
  if (isLoading) return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: "Subscription Cancellation" }), jsx().jsx("p", { role: "status", children: "Checking your subscription…" })] });
  const planName = account.entitlement.plan_name ?? account.account.plan_type ?? "Plus";
  const confirm = async () => { if (pending) return; pending = true; try { await onCancel?.(reason, detail); onClose(); } finally { pending = false; } };
  const body = step === "survey" ? jsx().jsxs("section", { children: [jsx().jsx("h3", { children: `Why are you canceling your ${planName} subscription?` }), jsx().jsx("select", { "aria-label": "Cancellation reason", onChange: (event: { currentTarget: { value: string } }) => { reason = event.currentTarget.value as CancellationReason; }, children: [jsx().jsx("option", { value: "too_expensive", children: "Too expensive" }), jsx().jsx("option", { value: "not_using_it_anymore", children: "Not using it anymore" }), jsx().jsx("option", { value: "not_useful_enough", children: "Not useful enough" }), jsx().jsx("option", { value: "something_else", children: "Something else" })] }), jsx().jsx("textarea", { "aria-label": "Tell us more", placeholder: "Optional", onChange: (event: { currentTarget: { value: string } }) => { detail = event.currentTarget.value; } }), jsx().jsx("button", { type: "button", onClick: () => { step = "things_you_lose"; }, children: "Submit" })] }) : step === "things_you_lose" ? jsx().jsxs("section", { children: [jsx().jsx("h3", { children: "Are you sure?" }), jsx().jsx("p", { children: `If you cancel, your plan will stay active until the end of this billing cycle. After that, you'll continue on the Free plan.` }), jsx().jsx("p", { children: "You'll no longer have:" }), jsx().jsx("button", { type: "button", disabled: pending, onClick: () => void confirm(), children: "Cancel subscription" })] }) : jsx().jsxs("section", { children: [jsx().jsx("h3", { children: `Cancel ${planName} and return to Free?` }), promotion == null ? null : jsx().jsxs("aside", { children: [jsx().jsx("strong", { children: promotion.label }), jsx().jsx("p", { children: promotion.description }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Get offer" })] }), error == null ? null : jsx().jsx("p", { role: "alert", children: error }), jsx().jsx("button", { type: "button", onClick: () => { step = "survey"; }, children: `Cancel ${planName}` })] });
  return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: "Subscription Cancellation" }), body, jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Go back" })] });
}
export { CancellationDialog, type CancellationDialogProps };
