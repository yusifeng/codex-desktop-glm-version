// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { D0 as t, O0 as n, j0 as r } from "@rchunk/app-initial";
import { i, n as a } from "@rchunk/queries";
import { n as o, r as s } from "@rchunk/subscription-update-plan";
import { n as c, r as l } from "@rchunk/billing-queries";
import { n as u, r as d } from "@rchunk/stripe-client";
import { i as f } from "@rchunk/billing-state";
import { n as p, t as m } from "@rchunk/payment-method-display";
import { n as h, t as g } from "@rchunk/confirm-subscription-upgrade";
import { n as _, t as v } from "@rchunk/delinquent-upgrade-preparation";
async function y({
  scope: e,
  accountId: r,
  userId: i,
  initialPlan: s,
  updatedPlan: c,
  promoCampaign: l,
  promoCode: u,
  paymentMethodId: f,
  statsigClient: p,
  signal: m,
  isActive: h,
}) {
  if (!h()) return { status: `closed` };
  let [_, y] = await Promise.all([e.queryClient.fetchQuery(a(r)), e.queryClient.fetchQuery(d(r))]);
  if (!h()) return { status: `closed` };
  let x = _.accounts[r];
  if (
    x?.account.structure !== `personal` ||
    x.account.plan_type !== s ||
    x.account.account_id !== r ||
    x.account.account_user_id?.split(`__`)[0] !== i
  )
    return { status: `closed` };
  if (f != null && (await b(e, r, f)) == null)
    return {
      status: `payment_method_failed`,
      reason: `payment_method_unavailable`,
      source: `update`,
    };
  if (!h()) return { status: `closed` };
  let S = n(s),
    C =
      S != null && t({ currentPlan: S.pricePlan, targetPlan: o(c) }) === `upgrade`
        ? p.getLayer(`2797915223`)
        : null,
    w = C?.get(`payment_method_recovery_enabled`, !1) ?? !1,
    T = C?.get(`mandate_recovery_payment_method_types`, []) ?? [];
  return g(e, {
    accountId: r,
    userId: i,
    updatedPlan: c,
    promoCampaign: l,
    promoCode: u,
    paymentMethodId: f,
    signal: m,
    stripe: y.stripe,
    willRenew: x.last_active_subscription.will_renew === !0,
    mandateRecovery: w && Array.isArray(T) && T.length > 0,
    isPaymentMethodRecoveryEnabled: w,
    isActive: h,
    revalidatePaymentMethod: async () => (f == null || (await b(e, r, f)) != null) && h(),
    isPendingUpdateError: (e) => v(e) === `subscription_update_pending`,
  });
}
async function b(e, t, n) {
  return (await e.queryClient.fetchQuery(l(t))).payment_methods.find(
    (e) => e.id === n && e.type === `card` && !f(e),
  );
}
async function x(e, t) {
  let n = await e.queryClient.fetchQuery(l(t)),
    r = n.payment_methods.find((e) => e.id === n.default_payment_method_id && !f(e));
  return r == null ? null : m(r).label;
}
function S() {
  return (S = e(() => {
    (i(), r(), s(), p(), c(), u(), h(), _());
  }))();
}
S();
export {
  y as confirmPricingPlanUpgrade,
  x as getPricingPlanDefaultPaymentMethod,
  b as getPricingPlanPaymentMethod,
};
