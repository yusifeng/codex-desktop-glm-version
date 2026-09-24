// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { pL as t, vW as n, wL as r } from "./app-shared-7b9edc1bfb7f.js";
import { aI as i, cJt as a, eI as o, rJt as s } from "./app-initial-51da50e6c6e3.js";
function c({ accountId: e, promoCode: t, planName: n, promotion: r, isLoading: i, error: a }) {
  let s = !!t && (n === `chatgptpro` || n === `chatgptprolite`),
    c = o(s && r?.is_eligible ? r.metadata : null),
    l = s && (e == null || i);
  return {
    lockedProPlanName: c,
    proPromotionPending: l,
    proSelectionBlocked: s && (l || a != null || (c != null && c !== n)),
  };
}
function l({ accountId: e, promoCode: n, planName: r }) {
  return t({
    queryKey: [`pro-checkout-promotion`, e, n],
    enabled: e != null && !!n && (r === `chatgptpro` || r === `chatgptprolite`),
    queryFn: ({ signal: t }) => {
      if (e == null || !n) throw Error(`Promotion requires an account and code`);
      return u({ accountId: e, code: n, kind: `promo`, signal: t });
    },
    staleTime: 0,
    retry: !1,
  });
}
async function u({ accountId: e, code: t, kind: r, signal: i }) {
  let a = {
      additionalHeaders: { "ChatGPT-Account-ID": e, [n]: e },
      parameters: { path: { code: t }, query: { type: r } },
      signal: i,
    },
    o = await s.safeGet(`/promotions/eligibility/{code}`, a);
  return (
    i.throwIfAborted(),
    o.is_eligible ? s.safeGet(`/promotions/metadata/{code}`, a) : { ...o, metadata: null }
  );
}
function d() {
  return (d = e(() => {
    (i(), r(), a());
  }))();
}
export { l as i, u as n, d as r, c as t };
