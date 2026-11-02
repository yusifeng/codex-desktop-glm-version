// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { dl as r, fl as i } from "@rchunk/app-initial";
function a(e) {
  let t = (0, o.c)(3),
    { children: n } = e,
    i;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, s.jsx)(r, { showWhenUnseen: !0 })), (t[0] = i))
    : (i = t[0]);
  let a;
  return (
    t[1] === n
      ? (a = t[2])
      : ((a = (0, s.jsxs)(s.Fragment, { children: [n, i] })), (t[1] = n), (t[2] = a)),
    a
  );
}
var o, s;
function c() {
  return (c = e(() => {
    ((o = t()), i(), (s = n()));
  }))();
}
c();
export { a as AppgenPublicationTermsRoute };
