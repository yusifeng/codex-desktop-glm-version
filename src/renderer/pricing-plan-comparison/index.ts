import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/billing-icons";
import "@rchunk/plan-names";
import "@rchunk/pricing";
import "@rchunk/pricing-promotions";
import "@rchunk/subscription-update-plan";

type Plan = "free" | "go" | "plus" | "prolite" | "pro" | "self_serve_business" | "self_serve_business_usage_based" | string;
interface PlanOffer { badge?: string; description?: string; features?: readonly string[]; price?: string }
interface PlanComparisonProps { currentPlan: Plan; offers?: Record<string, PlanOffer>; plans?: Plan[]; billingInterval?: "month" | "year"; onSelectPlan?(plan: Plan, checkoutUrl: string | null): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function getPlanCheckoutUrl(currentPlan: Plan, targetPlan: Plan, interval: "month" | "year" = "year"): string | null { if (currentPlan === "free_workspace") return null; if (targetPlan === "self_serve_business") return `https://chatgpt.com/business?price_interval=${interval}`; if (targetPlan === "self_serve_business_usage_based") return "https://chatgpt.com/business/usage"; if (!["free", "go", "plus", "prolite", "pro"].includes(targetPlan)) return null; return `/checkout?current_plan=${encodeURIComponent(currentPlan)}&target_plan=${encodeURIComponent(targetPlan)}`; }
function displayPlan(plan: Plan): string { return plan === "prolite" ? "Pro" : plan === "self_serve_business" ? "Business" : plan === "self_serve_business_usage_based" ? "Business usage-based" : `${plan[0]?.toUpperCase() ?? ""}${plan.slice(1)}`; }
function PlanComparison({ currentPlan, offers = {}, plans = ["free", "plus", "pro"], billingInterval = "year", onSelectPlan }: PlanComparisonProps): unknown { return jsx().jsx("section", { "aria-label": "Compare plans", children: plans.map(plan => { const current = plan === currentPlan; const offer = offers[plan]; const url = getPlanCheckoutUrl(currentPlan, plan, billingInterval); const name = displayPlan(plan); return jsx().jsxs("article", { "data-plan": plan, "data-current": current, children: [offer?.badge ? jsx().jsx("p", { "data-plan-badge": true, children: offer.badge }) : null, jsx().jsx("h2", { children: name }), offer?.description ? jsx().jsx("p", { children: offer.description }) : null, offer?.price == null ? null : jsx().jsx("p", { "data-plan-price": true, children: offer.price }), offer?.features?.length ? jsx().jsx("ul", { children: offer.features.map(feature => jsx().jsx("li", { children: feature }, feature)) }) : null, jsx().jsx("button", { type: "button", disabled: current || url == null, onClick: () => onSelectPlan?.(plan, url), children: current ? "Current plan" : `Upgrade to ${name}` })] }, plan); }) }); }
function initializePricingLinks(): void {}
function initializePlanComparison(): void { initializePricingLinks(); void jsx(); }
export { initializePricingLinks as i, initializePlanComparison as n, getPlanCheckoutUrl as r, PlanComparison as t };
