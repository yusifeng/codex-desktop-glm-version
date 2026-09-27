import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializeBillingAnalytics, t as BillingAnalytics } from "@rchunk/billing-analytics";

interface ConsumerViewSettingsProps { isPolling?: boolean }
let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeConsumerViewSettings(): void { if (initialized) return; initialized = true; initializeBillingAnalytics(); jsx = getJsxRuntime(); }
function ConsumerViewSettings({ isPolling = true }: ConsumerViewSettingsProps): unknown { initializeConsumerViewSettings(); return jsx!.jsxs(jsx!.Fragment, { children: [jsx!.jsx("p", { className: "text-sm text-secondary", children: "Restricted view used solely for OpenAI internal testing. Shows your real usage in this workspace." }), jsx!.jsx(BillingAnalytics, { isPolling, canViewCreditSettings: false, reduceMotion: false, scope: "consumer", workspaceTaskUsage: true })] }); }
initializeConsumerViewSettings();
export { ConsumerViewSettings };
