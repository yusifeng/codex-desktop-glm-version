// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { pL as t } from "@rchunk/app-shared";
import { pdn as n, udn as r } from "@rchunk/app-initial";
function i(e) {
  return t({
    queryKey: [`consumer-billing`, e, `billing-info`],
    queryFn: ({ signal: t }) =>
      r.safeGet(`/payments/billing_info`, { parameters: { query: { account_id: e } }, signal: t }),
    staleTime: 0,
    retry: !1,
  });
}
function a(e) {
  return t({
    queryKey: [`consumer-billing`, e, `payment-methods`],
    queryFn: ({ signal: t }) =>
      r.safeGet(`/payments/payment_methods`, {
        parameters: { query: { account_id: e } },
        signal: t,
      }),
    staleTime: 0,
    retry: !1,
  });
}
async function o(e, t) {
  await Promise.all([
    e.queryClient.invalidateQueries({ queryKey: [`consumer-billing`, t] }),
    e.queryClient.invalidateQueries({ queryKey: [`accounts`] }),
    e.queryClient.invalidateQueries({ queryKey: [`usage-settings`] }),
  ]);
}
function s() {
  return (s = e(() => {
    n();
  }))();
}
export { o as i, s as n, a as r, i as t };
