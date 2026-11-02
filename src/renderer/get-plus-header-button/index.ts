// @ts-nocheck
const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "@rchunk/upgrade-plan-dialog",
      "@rchunk/rolldown-runtime",
      "@rchunk/app-shared",
      "./app-shared-fa570b9eb9dd.css",
      "@rchunk/app-initial",
      "./app-initial-e8ceb32eb626.css",
      "@rchunk/chatgpt-subscription-events",
      "@rchunk/pricing-plan-comparison",
      "@rchunk/pricing-promotions",
      "@rchunk/billing-icons",
      "@rchunk/plan-names",
      "@rchunk/pricing",
      "@rchunk/subscription-update-plan",
      "./pricing-plan-comparison-83ed6e7e6330.css",
      "@rchunk/subscription-update-dialog",
      "@rchunk/offer-notice",
    ]),
) => i.map((i) => d[i]);
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  C_ as n,
  FX as r,
  H3 as i,
  HX as a,
  I3 as o,
  K2 as s,
  S_ as c,
  V3 as l,
  Y2 as u,
  Yh as d,
  Zh as f,
  go as p,
  ho as m,
} from "@rchunk/app-shared";
import { FN as h, IN as g, NN as _, d0t as v, f0t as y } from "@rchunk/app-initial";
function b(e) {
  let t = (0, S.c)(10),
    { onClick: n } = e,
    r;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = { enabled: !1 }), (t[0] = r))
    : (r = t[0]);
  let { data: i, isLoading: o } = a(y, r),
    s = !o,
    l;
  t[1] !== i || t[2] !== s
    ? ((l = { enabled: s, rateLimitStatus: i }), (t[1] = i), (t[2] = s), (t[3] = l))
    : (l = t[3]);
  let f = g(l),
    m;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = (0, C.jsx)(c, { "aria-hidden": !1, asset: p })), (t[4] = m))
    : (m = t[4]);
  let _;
  t[5] === f
    ? (_ = t[6])
    : ((_ = f
        ? (0, C.jsx)(u, { ...h.rejoinPlus })
        : (0, C.jsx)(u, {
            id: `home.header.getPlus`,
            defaultMessage: `Get Plus`,
            description: `Upsell button label shown in the new thread page header for free users`,
          })),
      (t[5] = f),
      (t[6] = _));
  let v;
  return (
    t[7] !== n || t[8] !== _
      ? ((v = (0, C.jsxs)(d, {
          color: `headerUpgrade`,
          onClick: n,
          onFocus: x,
          onPointerEnter: x,
          size: `headerUpsell`,
          children: [m, _],
        })),
        (t[7] = n),
        (t[8] = _),
        (t[9] = v))
      : (v = t[9]),
    v
  );
}
function x() {
  l(
    () => import(`@rchunk/upgrade-plan-dialog`),
    __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
    import.meta.url,
  ).catch(() => void 0);
}
var S, C;
function w() {
  return (w = e(() => {
    ((S = t()), m(), r(), s(), f(), n(), _(), v(), (C = o()), i());
  }))();
}
w();
export { b as GetPlusHeaderButton };
