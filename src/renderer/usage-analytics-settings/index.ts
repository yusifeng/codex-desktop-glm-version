// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, FX as n, HX as r, I3 as i } from "@rchunk/app-shared";
import {
  Hln as a,
  Pdn as o,
  Rln as s,
  Slt as c,
  _S as l,
  d0t as u,
  dS as d,
  f0t as f,
  iu as p,
  ru as m,
  uS as h,
  vS as g,
  xlt as _,
} from "@rchunk/app-initial";
import { n as v, t as y } from "@rchunk/billing-analytics";
function b(e) {
  let t = (0, x.c)(9),
    { isPolling: n } = e,
    i = n === void 0 || n,
    { data: s } = r(f),
    {
      canViewCreditSettings: l,
      isUsageSettingsAccessLoading: u,
      plan: p,
    } = d(s?.credits?.balance != null),
    h = c(),
    _;
  t[0] === p ? (_ = t[1]) : ((_ = g(p) || p === o.ENT26), (t[0] = p), (t[1] = _));
  let v = _,
    b = `consumer`;
  if ((v ? (b = `workspace`) : a(p) && (b = `business`), p == null && u)) {
    let e;
    return (
      t[2] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, S.jsx)(m, {})), (t[2] = e))
        : (e = t[2]),
      e
    );
  }
  let C = v || l,
    w = p === o.ENT26,
    T;
  return (
    t[3] !== i || t[4] !== h || t[5] !== b || t[6] !== C || t[7] !== w
      ? ((T = (0, S.jsx)(y, {
          isPolling: i,
          canViewCreditSettings: C,
          isUsdWorkspace: w,
          reduceMotion: h,
          scope: b,
        })),
        (t[3] = i),
        (t[4] = h),
        (t[5] = b),
        (t[6] = C),
        (t[7] = w),
        (t[8] = T))
      : (T = t[8]),
    T
  );
}
var x, S;
function C() {
  return (C = e(() => {
    ((x = t()), n(), h(), u(), _(), p(), l(), s(), v(), (S = i()));
  }))();
}
C();
export { b as UsageAnalyticsSettings };
