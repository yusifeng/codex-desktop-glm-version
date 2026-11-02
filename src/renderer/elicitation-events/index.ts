// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { fI as t, oj as n } from "@rchunk/app-shared";
import {
  Cpn as r,
  GPt as i,
  KPt as a,
  Spn as o,
  xpn as s,
  ypn as c,
} from "@rchunk/app-initial";
function l(e, t, r) {
  s(e, n, { ...t, stage: `interacted`, action: r });
}
function u(e, t) {
  return t.visibilityState === `visible` && e.get(i) === !0;
}
function d(e, t, a, c) {
  if (t == null || a == null || typeof IntersectionObserver > `u`) return;
  let l = JSON.stringify([a.threadId, a.turnId, a.itemId]),
    d = t.ownerDocument,
    f = !1,
    p = () => {
      c.current !== l &&
        f &&
        t.isConnected &&
        u(e, d) &&
        (t.checkVisibility?.({ visibilityProperty: !0, opacityProperty: !0 }) ?? !0) &&
        e.get(r) !== o &&
        ((c.current = l), s(e, n, { ...a, stage: `shown` }));
    },
    m = new IntersectionObserver((e) => {
      ((f = e.some((e) => e.intersectionRatio > 0)), p());
    });
  m.observe(t);
  let h = e.watch((e) => {
    (e.get(i), e.get(r), p());
  });
  return (
    d.addEventListener(`visibilitychange`, p),
    d.defaultView?.addEventListener(`focus`, p),
    () => {
      (m.disconnect(),
        h(),
        d.removeEventListener(`visibilitychange`, p),
        d.defaultView?.removeEventListener(`focus`, p));
    }
  );
}
function f() {
  return (f = e(() => {
    (t(), a(), c());
  }))();
}
export { l as n, d as r, f as t };
