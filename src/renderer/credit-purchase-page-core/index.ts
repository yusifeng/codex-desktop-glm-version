import "@rchunk/rolldown-runtime";
import "@rchunk/checkout-policy";
import "@rchunk/checkout-dialog-fields";
import "@rchunk/checkout-error";
import "@rchunk/account-action-integrity";
import "@rchunk/billing-pricing";
import "@rchunk/checkout-session";
import "@rchunk/checkout-confirm-latency";
import "@rchunk/checkout-page-core";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

interface CreditPurchasePageProps { accountId?: string; audience?: "personal" | "workspace"; currencyCode?: string; defaultQuantity?: number; maximum?: number; minimum?: number; onComplete?(result: unknown): void; userId?: string }
interface PurchaseApi { safePost<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as PurchaseApi;
function CreditPurchasePage({ accountId = "", audience = "personal", currencyCode = "USD", defaultQuantity = 2500, maximum = 10000, minimum = 500, onComplete }: CreditPurchasePageProps = {}): unknown {
  const [quantity, setQuantity] = React.useState(defaultQuantity);
  const [status, setStatus] = React.useState<"idle" | "pending" | "error">("idle");
  const valid = Number.isSafeInteger(quantity) && quantity >= minimum && quantity <= maximum && quantity % 250 === 0;
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!valid || status === "pending") return;
    setStatus("pending");
    try { const result = await client.safePost("/consumer/billing/credits/purchase", { additionalHeaders: { "ChatGPT-Account-ID": accountId }, requestBody: { audience, currency: currencyCode, quantity } }); setStatus("idle"); onComplete?.(result); } catch { setStatus("error"); }
  };
  return jsx.jsxs("main", { "aria-label": "Purchase credits", children: [jsx.jsx("h1", { children: "Purchase credits" }), jsx.jsxs("form", { onSubmit: submit, children: [jsx.jsxs("label", { children: ["Credits", jsx.jsx("input", { type: "number", min: minimum, max: maximum, step: 250, value: quantity, onChange: (event: { currentTarget: { valueAsNumber: number } }) => setQuantity(event.currentTarget.valueAsNumber) })] }), jsx.jsx("p", { children: `${quantity.toLocaleString()} credits · ${currencyCode}` }), !valid ? jsx.jsx("p", { role: "alert", children: `Choose between ${minimum} and ${maximum} credits in increments of 250.` }) : null, status === "error" ? jsx.jsx("p", { role: "alert", children: "Purchase couldn't be started." }) : null, jsx.jsx("button", { type: "submit", disabled: !valid || status === "pending", children: "Continue" })] })] });
}
function initializeCreditPurchasePage(): void { initializeApiClient(); }
export { initializeCreditPurchasePage as n, CreditPurchasePage as t };
