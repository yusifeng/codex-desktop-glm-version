import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/billing-queries";
import "@rchunk/billing-query-error";
import "@rchunk/subscription-queries";
import "@rchunk/subscription-plan-status";
import "@rchunk/format-amount";
import "@rchunk/billing-events";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Props { account: { account: { plan_type?: string | null }; entitlement: { billing_period?: string | null; cancels_at?: string | null; renews_at?: string | null } }; accountId: string; currency?: string; isError?: boolean; isPending?: boolean; onClose(): void; onRenew?(): Promise<void> | void; price?: number | null; renewalDate?: string | null; showProLevels?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function SubscriptionRenewalDialog({ account, currency = "USD", isError = false, isPending = false, onClose, onRenew, price, renewalDate }: Props): unknown { const entitlement = account.entitlement, fallbackDate = entitlement.cancels_at != null && entitlement.renews_at != null && Date.parse(entitlement.cancels_at) > Date.parse(entitlement.renews_at) ? entitlement.cancels_at : entitlement.renews_at, date = renewalDate ?? fallbackDate; return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: "Renew subscription" }), isError ? jsx().jsx("p", { role: "alert", children: "Couldn’t load renewal details" }) : jsx().jsxs("div", { children: [jsx().jsx("p", { children: date == null ? "Restore automatic renewal" : `Your subscription will renew on ${new Date(date).toLocaleDateString("en-US")}.` }), price == null ? null : jsx().jsx("p", { children: `${currency} ${price.toFixed(2)} per ${entitlement.billing_period ?? "billing period"}` })] }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: isPending, onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: isPending || isError, onClick: () => void onRenew?.(), children: isPending ? "Renewing…" : "Renew subscription" })] })] }); }
export { SubscriptionRenewalDialog };
