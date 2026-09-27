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

interface HostedCheckoutProps { returnPath?: string; url: string; onOpenExternal?(url: string): void }
interface CheckoutPageProps { accountId?: string | null; checkoutSessionId?: string | null; error?: string | null; loading?: boolean; processorEntity?: string | null; returnPath?: string; search?: string; userId?: string | null; hostedCheckoutUrl?: string | null; onOpenExternal?(url: string): void; onRetry?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function HostedCheckout({ returnPath, url, onOpenExternal }: HostedCheckoutProps): unknown { return jsx().jsxs("section", { "data-return-path": returnPath, children: [jsx().jsx("p", { children: "Continue to secure checkout" }), jsx().jsx("button", { type: "button", onClick: () => onOpenExternal?.(url), children: "Continue" })] }); }
function CheckoutPage(props: CheckoutPageProps): unknown { if (props.loading || props.accountId == null || props.userId == null) return jsx().jsx("main", { "aria-busy": true, children: "Loading checkout" }); if (!props.checkoutSessionId) return jsx().jsxs("main", { role: "alert", children: [props.error ?? "Checkout session is missing", jsx().jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" })] }); if (props.hostedCheckoutUrl) return HostedCheckout({ returnPath: props.returnPath, url: props.hostedCheckoutUrl, onOpenExternal: props.onOpenExternal }); return jsx().jsxs("main", { "aria-label": "Checkout", "data-checkout-session": props.checkoutSessionId, children: [jsx().jsx("h1", { children: "Checkout" }), jsx().jsx("p", { children: `Secure payment${props.processorEntity ? ` · ${props.processorEntity}` : ""}` }), jsx().jsx("div", { "data-payment-element": true })] }); }
function initializeCheckoutPage(): void { void jsx(); }
export { HostedCheckout as n, initializeCheckoutPage as r, CheckoutPage as t };
