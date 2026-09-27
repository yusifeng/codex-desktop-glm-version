import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/billing-icons";
import "@rchunk/plan-names";
import "@rchunk/pricing";
import "@rchunk/pricing-promotions";
import "@rchunk/subscription-update-plan";

type Plan = "free" | "go" | "plus" | "prolite" | "pro" | "self_serve_business" | "self_serve_business_usage_based" | string;
interface PlanComparisonProps { currentPlan: Plan; offers?: Record<string, { price?: string }>; plans?: Plan[]; billingInterval?: "month" | "year"; onSelectPlan?(plan: Plan, checkoutUrl: string | null): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function getPlanCheckoutUrl(currentPlan: Plan, targetPlan: Plan, interval: "month" | "year" = "year"): string | null { if (currentPlan === "free_workspace") return null; if (targetPlan === "self_serve_business") return `https://chatgpt.com/business?price_interval=${interval}`; if (targetPlan === "self_serve_business_usage_based") return "https://chatgpt.com/business/usage"; return `/checkout?current_plan=${encodeURIComponent(currentPlan)}&target_plan=${encodeURIComponent(targetPlan)}`; }
function PlanComparison({ currentPlan, offers = {}, plans = ["free", "plus", "pro"], billingInterval = "year", onSelectPlan }: PlanComparisonProps): unknown { return jsx().jsx("section", { "aria-label": "Compare plans", children: plans.map(plan => { const current = plan === currentPlan; const url = getPlanCheckoutUrl(currentPlan, plan, billingInterval); return jsx().jsxs("article", { "data-plan": plan, "data-current": current, children: [jsx().jsx("h2", { children: plan === "prolite" ? "Pro" : plan[0]?.toUpperCase() + plan.slice(1) }), offers[plan]?.price == null ? null : jsx().jsx("p", { children: offers[plan].price }), jsx().jsx("button", { type: "button", disabled: current || url == null, onClick: () => onSelectPlan?.(plan, url), children: current ? "Current plan" : `Upgrade to ${plan === "prolite" ? "Pro" : plan}` })] }, plan); }) }); }
function initializePricingLinks(): void {}
function initializePlanComparison(): void { initializePricingLinks(); void jsx(); }
export { initializePricingLinks as i, initializePlanComparison as n, getPlanCheckoutUrl as r, PlanComparison as t };
