import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
const jsx = getJsxRuntime();
function BillingQueryError({ onRetry }: { onRetry(): void }): unknown { return jsx.jsxs("div", { className: "flex items-center gap-2 text-sm text-warning", role: "alert", children: [jsx.jsx("span", { children: "Unable to load billing information. Please try again." }), jsx.jsx("button", { type: "button", onClick: onRetry, children: "Retry" })] }); }
function initializeBillingQueryError(): void {}
export { initializeBillingQueryError as n, BillingQueryError as t };
