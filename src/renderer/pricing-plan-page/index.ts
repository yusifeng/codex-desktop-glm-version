import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { Ygn as Navigate, i_n as useLocation, o_n as useNavigate, uht as useAccountQuery, type SubscriptionPlan as UpdatablePlan } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/chatgpt-subscription-events";
import "@rchunk/checkout-telemetry";
import { n as initializePlanComparison, t as PlanComparison } from "@rchunk/pricing-plan-comparison";
import { f as initializePricingPromotions } from "@rchunk/pricing-promotions";
import { n as initializeSubscriptionUpdateDialog, t as SubscriptionUpdateDialog, type PricingInfo, type SubscriptionPreview } from "@rchunk/subscription-update-dialog";
import { r as initializeSubscriptionUpdatePlan, t as subscriptionPlanToSlug, type SubscriptionPlanSlug } from "@rchunk/subscription-update-plan";

type LoadStatus = "idle" | "loading" | "ready" | "error";
type Plan = "free" | "go" | "plus" | "prolite" | "pro" | "self_serve_business" | "self_serve_business_usage_based" | "free_workspace";
interface PricingAccount { id: string; plan_type: string }
interface PricingOffer { checkoutSource?: string; price?: string; promoCode?: string; returnPath?: string }
interface UpgradeContext { checkoutEntryPoint?: string; openModalLocation?: string; sourceThreadId?: string; upsellContextId?: string }
interface SubscriptionUpdateState { kind: "saved_card_upgrade" | "scheduled_downgrade"; preview: SubscriptionPreview; targetPlan: Plan; updatedPlan: SubscriptionPlanSlug; webUrl: string }
interface PricingService {
  claimPromotion?(input: { accountId: string; promoCode: string; targetPlan: Plan }): Promise<boolean>;
  confirmUpdate?(input: { accountId: string; update: SubscriptionUpdateState }): Promise<"complete" | "pending" | "closed">;
  loadPricing?(accountId: string): Promise<PricingInfo>;
  previewUpdate?(input: { accountId: string; targetPlan: Plan }): Promise<SubscriptionPreview>;
}
interface PricingPlanPageProps {
  account?: PricingAccount | null; accountLoading?: boolean; modal?: boolean;
  offers?: Record<string, PricingOffer>;
  onNavigate?(destination: string, options?: { replace?: boolean; state?: unknown }): void;
  onOpenCheckout?(url: string): void;
  onToast?(kind: "danger" | "success", message: string): void;
  plans?: Plan[]; pricingInfo?: PricingInfo | null; pricingLoading?: boolean;
  returnPath?: string; service?: PricingService; upgradeContext?: UpgradeContext | null;
}

const contextKeys = ["codex_upgrade_location", "codex_checkout_origin", "codex_upsell_context", "codex_source_thread", "codex_promo_handoff"] as const;
const personalPlanOrder: Plan[] = ["free", "go", "plus", "prolite", "pro"];
const defaultService: PricingService = {
  async loadPricing(accountId) { const response = await fetch("/accounts/" + encodeURIComponent(accountId) + "/pricing"); if (!response.ok) throw Error("Pricing request failed"); return (await response.json()) as PricingInfo; },
  async previewUpdate({ accountId, targetPlan }) { const response = await fetch("/accounts/" + encodeURIComponent(accountId) + "/subscription/preview", { body: JSON.stringify({ target_plan: targetPlan }), headers: { "content-type": "application/json" }, method: "POST" }); if (!response.ok) throw Error("Subscription preview failed"); return (await response.json()) as SubscriptionPreview; },
  async confirmUpdate({ accountId, update }) { const response = await fetch("/accounts/" + encodeURIComponent(accountId) + "/subscription", { body: JSON.stringify({ target_plan: update.updatedPlan }), headers: { "content-type": "application/json" }, method: "PATCH" }); if (!response.ok) throw Error("Subscription update failed"); return "complete"; },
  async claimPromotion({ accountId, promoCode }) { const response = await fetch("/promotions/" + encodeURIComponent(promoCode) + "/claim", { headers: { "X-OpenAI-Account-Id": accountId }, method: "POST" }); if (!response.ok) throw Error("Promotion claim failed"); const result = (await response.json()) as { is_eligible?: boolean }; return result.is_eligible === true; },
};

let React: ReactRuntime;
let jsx: JsxRuntime;
function normalizePlan(planType: string): Plan | null { if (planType === "free_workspace") return "free_workspace"; if (planType === "team" || planType === "business") return "self_serve_business"; if (planType === "business_usage") return "self_serve_business_usage_based"; if (personalPlanOrder.includes(planType as Plan)) return planType as Plan; return null; }
function checkoutUrl(currentPlan: Plan, targetPlan: Plan): string | null { if (currentPlan === "free_workspace") return null; if (targetPlan === "self_serve_business") return "https://chatgpt.com/business?price_interval=year"; if (targetPlan === "self_serve_business_usage_based") return "https://chatgpt.com/business/usage"; return "/checkout?current_plan=" + encodeURIComponent(currentPlan) + "&target_plan=" + encodeURIComponent(targetPlan); }
function isDowngrade(currentPlan: Plan, targetPlan: Plan): boolean { const currentIndex = personalPlanOrder.indexOf(currentPlan); const targetIndex = personalPlanOrder.indexOf(targetPlan); return currentIndex >= 0 && targetIndex >= 0 && targetIndex < currentIndex; }
function persistUpgradeContext(context: UpgradeContext | null | undefined): void { if (typeof window === "undefined") return; const key = "oai/apps/contextualUpsellId"; try { if (context?.upsellContextId == null) { window.localStorage.removeItem(key); return; } window.localStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + 1_800_000, value: { threadId: context.sourceThreadId, upsellContextId: context.upsellContextId } })); } catch { return; } }

function PricingPlanPage({ account: accountOverride, accountLoading, modal = false, offers = {}, onNavigate, onOpenCheckout, onToast, plans = ["free", "go", "plus", "prolite", "pro", "self_serve_business"], pricingInfo: pricingOverride, pricingLoading = false, returnPath, service = defaultService, upgradeContext }: PricingPlanPageProps = {}): unknown {
  const accountQuery = useAccountQuery();
  const location = useLocation();
  const navigate = useNavigate();
  const account = accountOverride === undefined ? (accountQuery.data as unknown as PricingAccount | undefined) : accountOverride;
  const isAccountLoading = accountLoading ?? accountQuery.isLoading;
  const navigateTo = onNavigate ?? ((destination: string, options?: { replace?: boolean; state?: unknown }) => navigate(destination, options));
  const currentPlan = account == null ? null : normalizePlan(account.plan_type);
  const [pricing, setPricing] = React.useState<PricingInfo | null>(pricingOverride ?? null);
  const [pricingStatus, setPricingStatus] = React.useState<LoadStatus>(pricingOverride != null ? "ready" : pricingLoading ? "loading" : "idle");
  const [loadingTarget, setLoadingTarget] = React.useState<Plan | null>(null);
  const [update, setUpdate] = React.useState<SubscriptionUpdateState | null>(null);
  const [updatePending, setUpdatePending] = React.useState(false);
  const [updateError, setUpdateError] = React.useState(false);
  const effectiveReturnPath = returnPath ?? "/";
  const loadPricing = () => { if (account == null || service.loadPricing == null || pricingOverride != null) return; setPricingStatus("loading"); service.loadPricing(account.id).then((value) => { setPricing(value); setPricingStatus("ready"); }, () => setPricingStatus("error")); };

  React.useEffect(() => { persistUpgradeContext(upgradeContext); const params = new URLSearchParams(location.search); if (!contextKeys.some((key) => params.has(key))) return; for (const key of contextKeys) params.delete(key); navigateTo(location.pathname + (params.size === 0 ? "" : "?" + params.toString()) + location.hash, { replace: true, state: { ...(typeof location.state === "object" && location.state != null ? location.state : {}), upgradeContext } }); }, [location.hash, location.pathname, location.search, location.state, navigateTo, upgradeContext]);
  React.useEffect(() => { if (account != null && pricingOverride == null) loadPricing(); }, [account?.id, pricingOverride, service]);
  if (upgradeContext != null && contextKeys.some((key) => new URLSearchParams(location.search).has(key))) return null;
  if (account == null) { if (isAccountLoading) return jsx.jsx("main", { "aria-label": "Loading pricing plans" }); return jsx.jsx(Navigate, { replace: true, to: "/" }); }
  if (currentPlan == null) return jsx.jsx(Navigate, { replace: true, to: "/settings/account" });
  const openCheckout = onOpenCheckout ?? ((url: string) => { if (typeof window !== "undefined") window.location.assign(url); });
  const notify = onToast ?? (() => undefined);

  const selectPlan = async (targetPlan: Plan, suppliedUrl: string | null) => {
    if (loadingTarget != null || targetPlan === currentPlan) return;
    const url = suppliedUrl ?? checkoutUrl(currentPlan, targetPlan);
    if (url == null) { notify("danger", "This plan is unavailable for the current account"); return; }
    setLoadingTarget(targetPlan);
    try {
      const offer = offers[targetPlan];
      if (offer?.promoCode != null && service.claimPromotion != null) { const claimed = await service.claimPromotion({ accountId: account.id, promoCode: offer.promoCode, targetPlan }); if (!claimed) { notify("danger", "This offer isn’t available right now. Please try again later."); return; } notify("success", "You've successfully claimed your promotion"); }
      const targetSlug = subscriptionPlanToSlug(targetPlan as UpdatablePlan);
      if (currentPlan === "free" || targetSlug == null || service.previewUpdate == null) { openCheckout(url); return; }
      const preview = await service.previewUpdate({ accountId: account.id, targetPlan });
      setUpdate({ kind: isDowngrade(currentPlan, targetPlan) ? "scheduled_downgrade" : "saved_card_upgrade", preview, targetPlan, updatedPlan: targetSlug, webUrl: url });
      setUpdateError(false);
    } catch { notify("danger", "We couldn't complete this plan change. Please try again."); }
    finally { setLoadingTarget(null); }
  };
  const confirmUpdate = async () => { if (update == null || updatePending || service.confirmUpdate == null) return; setUpdatePending(true); setUpdateError(false); try { const result = await service.confirmUpdate({ accountId: account.id, update }); if (result === "closed") { setUpdate(null); return; } notify("success", isDowngrade(currentPlan, update.targetPlan) ? "Plan change scheduled" : "Successfully upgraded plan"); setUpdate(null); navigateTo(effectiveReturnPath, { replace: modal }); } catch { setUpdateError(true); } finally { setUpdatePending(false); } };
  const updateDialog = update == null ? null : jsx.jsx(SubscriptionUpdateDialog, { disableConfirm: updateError, error: updateError ? jsx.jsx("div", { role: "alert", children: "We couldn't complete this plan change. Please try again." }) : null, isUpdating: updatePending, onCancel: () => setUpdate(null), onConfirm: () => { void confirmUpdate(); }, onGoToWeb: () => { openCheckout(update.webUrl); setUpdate(null); }, onOpenChange: (open: boolean) => { if (!open && !updatePending) setUpdate(null); }, pricingInfo: pricing, subscriptionUpdate: update.kind === "scheduled_downgrade" ? { kind: "scheduled_downgrade", preview: update.preview, updatedPlan: update.updatedPlan } : { kind: "saved_card_upgrade", minorUnitExponent: pricing?.minorUnitExponent ?? 2, preview: update.preview, updatedPlan: update.updatedPlan } });
  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsx(PlanComparison, { currentPlan, offers, plans, onSelectPlan: (plan: Plan, url: string | null) => { void selectPlan(plan, url); } }),
    pricingStatus === "loading" ? jsx.jsx("p", { role: "status", children: "Loading pricing…" }) : null,
    pricingStatus === "error" ? jsx.jsxs("div", { role: "alert", children: ["Pricing is unavailable", jsx.jsx("button", { type: "button", onClick: loadPricing, children: "Retry" })] }) : null,
    loadingTarget == null ? null : jsx.jsx("p", { role: "status", children: "Preparing " + loadingTarget + "…" }),
    modal ? jsx.jsx("button", { type: "button", onClick: () => navigateTo(effectiveReturnPath, { replace: true }), children: "Back" }) : null,
    updateDialog,
  ] });
}

function initializePricingPlanPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); initializePricingPromotions(); initializeSubscriptionUpdatePlan(); initializeSubscriptionUpdateDialog(); initializePlanComparison(); }
initializePricingPlanPage();
export { PricingPlanPage };
