import "@rchunk/rolldown-runtime";
import "@rchunk/add-payment-method";
import "@rchunk/app-initial";
import "@rchunk/billing-state";
import "@rchunk/confirm-subscription-upgrade";
import "@rchunk/delinquent-upgrade-preparation";
import "@rchunk/payment-method-display";
import "@rchunk/edit-payment-method";
import "@rchunk/checkout-error";
import "@rchunk/subscription-recovery-events";
import "@rchunk/format-amount";
import "@rchunk/billing-queries";
import "@rchunk/billing-query-error";
import "@rchunk/stripe-client";
import "@rchunk/stripe-payment-confirmation";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface PaymentMethod { brand?: string; id: string; last4?: string }
interface RecoveryDialogProps { accountId: string; amountDue?: number | null; currency?: string; error?: string | null; isLoading?: boolean; onAddPaymentMethod?(): void; onClose(): void; onComplete(): void; onEditPaymentMethod?(method: PaymentMethod): void; onPay?(method: PaymentMethod): Promise<"pending" | "succeeded"> | "pending" | "succeeded"; onRetry?(): void; paymentMethods?: PaymentMethod[]; planName: string; selectedPaymentMethodId?: string | null; walletBalanceApplied?: number }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function RecoveryDialog({ amountDue, currency = "USD", error, isLoading = false, onAddPaymentMethod, onClose, onComplete, onEditPaymentMethod, onPay, onRetry, paymentMethods = [], planName, selectedPaymentMethodId, walletBalanceApplied = 0 }: RecoveryDialogProps): unknown {
  const initial = paymentMethods.find(method => method.id === selectedPaymentMethodId) ?? paymentMethods[0]; const [selectedId, setSelectedId] = ReactRuntime.useState(initial?.id ?? ""), [pending, setPending] = ReactRuntime.useState(false), [paymentError, setPaymentError] = ReactRuntime.useState<string | null>(null); const selected = paymentMethods.find(method => method.id === selectedId) ?? initial;
  const pay = async () => { if (selected == null || pending) return; setPending(true); setPaymentError(null); try { const status = await onPay?.(selected) ?? "succeeded"; if (status === "succeeded") onComplete(); } catch { setPaymentError("We couldn't complete your payment. Please try again."); } finally { setPending(false); } };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending, children: [jsx().jsx("h2", { children: `Renew your ChatGPT ${planName} plan` }), jsx().jsx("p", { children: `Your last payment failed. Update your payment method to continue using ChatGPT ${planName}.` }), isLoading ? jsx().jsx("p", { role: "status", children: "Loading payment details" }) : error != null ? jsx().jsxs("div", { role: "alert", children: ["Payment details are unavailable. Try again later.", jsx().jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] }) : jsx().jsxs("section", { children: [jsx().jsx("h3", { children: `ChatGPT ${planName} subscription` }), walletBalanceApplied > 0 ? jsx().jsx("p", { children: `Wallet balance applied: ${walletBalanceApplied}` }) : null, amountDue == null ? null : jsx().jsx("p", { children: `Due today: ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountDue)}` }), jsx().jsx("label", { children: ["Payment method", jsx().jsx("select", { value: selected?.id ?? "", disabled: pending, onChange: (event: { currentTarget: { value: string } }) => setSelectedId(event.currentTarget.value), children: paymentMethods.map(method => jsx().jsx("option", { value: method.id, children: `${method.brand ?? "Card"} •••• ${method.last4 ?? ""}` }, method.id)) })] }), selected == null ? jsx().jsx("button", { type: "button", onClick: onAddPaymentMethod, children: "Add payment method" }) : jsx().jsx("button", { type: "button", disabled: pending, onClick: () => onEditPaymentMethod?.(selected), children: "Edit payment method" }), paymentError == null ? null : jsx().jsx("p", { role: "alert", children: paymentError })] }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Close" }), jsx().jsx("button", { type: "button", disabled: pending || selected == null || error != null, onClick: () => void pay(), children: pending ? "Processing…" : "Pay now" })] })] });
}
export { RecoveryDialog, type RecoveryDialogProps };
