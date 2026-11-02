import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/billing-pricing";
import "@rchunk/account-action-integrity";
import "@rchunk/checkout-policy";
import "@rchunk/checkout-confirm-latency";
import "@rchunk/checkout-dialog-fields";
import "@rchunk/checkout-error";
import "@rchunk/billing-form-options";
import "@rchunk/billing-icons";
import "@rchunk/offer-queries";
import "@rchunk/plan-names";
import "@rchunk/stripe-pure";
import "@rchunk/queries";
import "@rchunk/checkout-session";
import "@rchunk/stripe-payment-element-options";
import "@rchunk/tax-types";

interface HostedCheckoutProps { returnPath?: string; url: string; onBack?(): void; onOpenExternal?(url: string): void }
interface CheckoutPageProps { accountId?: string | null; checkoutSessionId?: string | null; error?: string | null; loading?: boolean; paymentError?: string | null; processorEntity?: string | null; returnPath?: string; search?: string; status?: "complete" | "processing" | "ready"; userId?: string | null; hostedCheckoutUrl?: string | null; onBack?(): void; onOpenExternal?(url: string): void; onRetry?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function isSecureCheckoutUrl(value: string): boolean { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function HostedCheckout({ returnPath, url, onBack, onOpenExternal }: HostedCheckoutProps): unknown { const valid = isSecureCheckoutUrl(url); return jsx().jsxs("section", { "aria-label": "Hosted checkout", "data-return-path": returnPath, children: [jsx().jsx("h1", { children: "Secure checkout" }), jsx().jsx("p", { children: valid ? "Continue to secure checkout" : "This checkout link is invalid or no longer available." }), valid ? jsx().jsx("button", { type: "button", disabled: onOpenExternal == null, onClick: () => onOpenExternal?.(url), children: "Continue" }) : jsx().jsx("p", { role: "alert", children: "Only secure checkout links can be opened." }), onBack ? jsx().jsx("button", { type: "button", onClick: onBack, children: "Go back" }) : null] }); }
function CheckoutPage(props: CheckoutPageProps): unknown {
  if (props.loading || props.accountId == null || props.userId == null) return jsx().jsx("main", { "aria-busy": true, children: "Loading checkout" });
  if (props.status === "complete") return jsx().jsxs("main", { role: "status", children: [jsx().jsx("h1", { children: "Payment complete" }), jsx().jsx("p", { children: "Your purchase is ready." }), props.onBack ? jsx().jsx("button", { type: "button", onClick: props.onBack, children: "Done" }) : null] });
  if (!props.checkoutSessionId) return jsx().jsxs("main", { role: "alert", children: [props.error ?? "Checkout session is missing", jsx().jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" }), props.onBack ? jsx().jsx("button", { type: "button", onClick: props.onBack, children: "Go back" }) : null] });
  if (props.hostedCheckoutUrl) return HostedCheckout({ returnPath: props.returnPath, url: props.hostedCheckoutUrl, onBack: props.onBack, onOpenExternal: props.onOpenExternal });
  return jsx().jsxs("main", { "aria-busy": props.status === "processing", "aria-label": "Checkout", "data-checkout-session": props.checkoutSessionId, children: [jsx().jsx("h1", { children: "Checkout" }), jsx().jsx("p", { children: `Secure payment${props.processorEntity ? ` · ${props.processorEntity}` : ""}` }), props.paymentError ? jsx().jsxs("div", { role: "alert", children: [props.paymentError, props.onRetry ? jsx().jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" }) : null] }) : null, jsx().jsx("div", { "data-payment-element": true }), props.status === "processing" ? jsx().jsx("p", { role: "status", children: "Processing payment…" }) : null, props.onBack ? jsx().jsx("button", { type: "button", onClick: props.onBack, children: "Cancel" }) : null] });
}
function initializeCheckoutPage(): void { void jsx(); }
export { HostedCheckout as n, initializeCheckoutPage as r, CheckoutPage as t };
