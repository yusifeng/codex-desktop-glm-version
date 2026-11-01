import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $O as t, FX as n, QI as r, QX as i, ZI as a, ek as o } from "./app-shared-7b9edc1bfb7f.js";
import { pdn as s, udn as c } from "./app-initial-51da50e6c6e3.js";
function l(e, t) {
  if (
    e?.is_delinquent !== !0 ||
    !e.will_renew ||
    e.became_delinquent_timestamp == null ||
    e.grace_period_end_timestamp == null
  )
    return null;
  let n = t.getTime(),
    r = Date.parse(e.became_delinquent_timestamp),
    i = Date.parse(e.grace_period_end_timestamp);
  return n > r + u && n < i ? e.grace_period_end_timestamp : null;
}
var u, d;
function f() {
  return (f = e(() => {
    (n(),
      r(),
      o(),
      s(),
      (u = 1728e5),
      (d = i(a, (e) => ({
        enabled: e != null,
        queryKey: [`workspace-renewal-subscription`, e],
        queryFn: () => c.safeGet(`/subscriptions`, { parameters: { query: { account_id: e ?? void 0 } } }),
        refetchInterval: t.ONE_MINUTE,
        staleTime: t.ONE_MINUTE,
      }))));
  }))();
}
export { f as n, d as r, l as t };
