// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, l1 as n, m1 as r, pZ as i } from "@rchunk/app-shared";
import { $en as a, itn as o } from "@rchunk/app-initial";
function s(e, t) {
  let n = !0,
    i = null,
    a = r(t, null, () => {
      if (!n) return;
      let { left: r, width: a } = t.getBoundingClientRect();
      (i?.left !== r || i.width !== a) && ((i = { left: r, width: a }), e.set(c, i));
    });
  return () => {
    ((n = !1), a(), e.get(c) === i && e.set(c, null));
  };
}
var c;
function l() {
  return (l = e(() => {
    (n(), t(), o(), (c = i(a, () => null)));
  }))();
}
export { s as n, c as r, l as t };
