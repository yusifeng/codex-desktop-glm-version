// Semantic restoration. Release chunk: create-session-976e086b152c.js.
import { n as e } from "@rchunk/rolldown-runtime";
import { cJt as t, ifn as n, rJt as r, rfn as i } from "@rchunk/app-initial";
import { E as a, S as o } from "@rchunk/checkout-policy";
// @ts-ignore -- published chunk binding is preserved locally.
import { n as s, r as c } from "@rchunk/chatgpt-account-action-integrity";
// @ts-ignore -- published chunk binding is preserved locally.
import { D as l, I as u } from "@rchunk/session";
import { n as d, r as f } from "@rchunk/promo-funnel-context";
async function p({
  accountId: e,
  request: t,
  statsig: n,
  isDark: o,
  cancelUrl: c,
  attemptId: u,
  signal: d,
}) {
  let p = await s(`chatgpt_checkout`);
  d.throwIfAborted();
  let m = a(t, {
      isServerOwnedModeEnabled: () => n.checkGate(`2065253865`),
      isCustomModeEnabled: (e) => i(n, `3950229590`).get(e, !0),
    }),
    h = await r.safePost(`/payments/checkout`, {
      requestBody: {
        ...t,
        checkout_ui_mode: m,
        team_plan_data: l(t, {
          checkoutUiMode: m,
          isPremiumSeatsEnabled: () => n.checkGate(`1445075732`),
          getConfiguredDefaultSeats: () =>
            n.getLayer(`1945869247`).get(`default_seat_count`, void 0),
          getConfiguredSeatQuantities: () =>
            n.getLayer(`1945869247`).get(`default_seat_quantities`, void 0),
        }),
        checkout_appearance: o ? `dark` : `light`,
        cancel_url: c,
        purchase_attempt_id: u,
      },
      additionalHeaders: p,
      signal: d,
    });
  // @ts-ignore -- published chunk binding is preserved locally.
  if ((d.throwIfAborted(), !(`tag` in h && h.tag === `custom_checkout_session`) && h.url == null))
    throw Error(`Checkout URL unavailable`);
  let g = t.discount_code;
  return (
    g != null &&
      f({
        accountId: e,
        location: `PricingColumnPrimaryCtaButton`,
        promoCode: `promo_code` in g ? g.promo_code : void 0,
        referralCode: `referral_code` in g ? g.referral_code : void 0,
      }),
    h
  );
}
function m() {
  // @ts-ignore -- published chunk binding is preserved locally.
  return (m = e(() => {
    (u(), o(), c(), t(), n(), d());
  }))();
}
export { m as n, p as t };
