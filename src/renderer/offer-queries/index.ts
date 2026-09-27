import { pL as queryOptions, vW as accountHeaderName, wL as initializeQueryOptions } from "@rchunk/app-shared";
import { aI as initializeOffers, cJt as initializeApi, eI as promotionPlanName, rJt as apiClient } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface Promotion { is_eligible?: boolean; metadata?: unknown; }

function promotionSelectionState(input: { accountId?: string | null; promoCode?: string | null; planName: string; promotion?: Promotion | null; isLoading: boolean; error?: unknown }): { lockedProPlanName: unknown; proPromotionPending: boolean; proSelectionBlocked: boolean } {
  const applies = !!input.promoCode && (input.planName === "chatgptpro" || input.planName === "chatgptprolite");
  const lockedProPlanName = promotionPlanName(applies && input.promotion?.is_eligible ? input.promotion.metadata : null);
  const pending = applies && (input.accountId == null || input.isLoading);
  return { lockedProPlanName, proPromotionPending: pending, proSelectionBlocked: applies && (pending || input.error != null || (lockedProPlanName != null && lockedProPlanName !== input.planName)) };
}

async function fetchPromotionEligibility(input: { accountId: string; code: string; kind: string; signal: AbortSignal }): Promise<Promotion> {
  const options = { additionalHeaders: { "ChatGPT-Account-ID": input.accountId, [accountHeaderName]: input.accountId }, parameters: { path: { code: input.code }, query: { type: input.kind } }, signal: input.signal };
  const api = apiClient as { safeGet(path: string, options: unknown): Promise<Promotion> };
  const eligibility = await api.safeGet("/promotions/eligibility/{code}", options);
  input.signal.throwIfAborted();
  return eligibility.is_eligible ? api.safeGet("/promotions/metadata/{code}", options) : { ...eligibility, metadata: null };
}

function promotionQuery(input: { accountId?: string | null; promoCode?: string | null; planName: string }): unknown {
  return queryOptions({ queryKey: ["pro-checkout-promotion", input.accountId, input.promoCode], enabled: input.accountId != null && !!input.promoCode && (input.planName === "chatgptpro" || input.planName === "chatgptprolite"), queryFn: ({ signal }: { signal: AbortSignal }) => {
    if (input.accountId == null || !input.promoCode) throw new Error("Promotion requires an account and code");
    return fetchPromotionEligibility({ accountId: input.accountId, code: input.promoCode, kind: "promo", signal });
  }, staleTime: 0, retry: false });
}
let initialized = false;
function initializeOfferQueries(): void {
  if (initialized) return;
  initialized = true;
  initializeOffers();
  initializeQueryOptions();
  initializeApi();
}
export { promotionQuery as i, fetchPromotionEligibility as n, initializeOfferQueries as r, promotionSelectionState as t };
