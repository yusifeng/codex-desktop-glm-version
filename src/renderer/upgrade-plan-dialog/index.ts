import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-subscription-events";
import "@rchunk/pricing-plan-comparison";
import "@rchunk/subscription-update-plan";
import "@rchunk/subscription-update-dialog";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Plan { description?: string; id: string; name: string; price?: string }
interface DialogProps { currentPlan: string; defaultTab?: "business" | "personal"; loadingTargetPlan?: string | null; onCtaClick?(plan: Plan): void; onOpenChange(open: boolean): void; onRetryPricing?(): void; open: boolean; plans?: Plan[]; pricingUnavailable?: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function UpgradePlanDialog({ currentPlan, defaultTab = "personal", loadingTargetPlan = null, onCtaClick, onOpenChange, onRetryPricing, open, plans = [], pricingUnavailable = false }: DialogProps): unknown { if (!open) return null; return jsx().jsxs("dialog", { open: true, "data-tab": defaultTab, children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Upgrade your plan" }), jsx().jsx("button", { type: "button", "aria-label": "Close", onClick: () => onOpenChange(false), children: "Close" })] }), pricingUnavailable ? jsx().jsxs("div", { role: "alert", children: ["Pricing unavailable", jsx().jsx("button", { type: "button", onClick: onRetryPricing, children: "Try again" })] }) : jsx().jsx("ul", { children: plans.map(plan => jsx().jsx("li", { children: jsx().jsxs("article", { children: [jsx().jsx("h3", { children: plan.name }), plan.description, plan.price, jsx().jsx("button", { type: "button", disabled: plan.id === currentPlan || loadingTargetPlan != null, onClick: () => onCtaClick?.(plan), children: plan.id === currentPlan ? "Current plan" : loadingTargetPlan === plan.id ? "Upgrading…" : "Upgrade" })] }) }, plan.id)) })] }); }
function UpgradePlanDialogModal({ currentPlan, defaultTab, onClose, source, plans = [], onUpgrade }: { currentPlan: string; defaultTab?: "business" | "personal"; onClose(): void; source?: string; plans?: Plan[]; onUpgrade?(plan: Plan, source?: string): void }): unknown { return jsx().jsx(UpgradePlanDialog, { open: true, currentPlan, defaultTab, plans, onOpenChange: open => { if (!open) onClose(); }, onCtaClick: plan => onUpgrade?.(plan, source) }); }
export { UpgradePlanDialog, UpgradePlanDialogModal };
