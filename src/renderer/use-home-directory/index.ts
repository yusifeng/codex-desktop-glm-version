// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, BX as n, FX as r } from "@rchunk/app-shared";
import { _cn as i, gcn as a } from "@rchunk/app-initial";
function o(e) {
  let t = (0, c.c)(2),
    r;
  return (
    t[0] === e ? (r = t[1]) : ((r = e == null ? void 0 : { hostId: e }), (t[0] = e), (t[1] = r)),
    n(a, r)
  );
}
function s(e) {
  return o(e).data?.homeDirectory;
}
var c;
function l() {
  return (l = e(() => {
    ((c = t()), r(), i());
  }))();
}
export { s as n, o as r, l as t };
