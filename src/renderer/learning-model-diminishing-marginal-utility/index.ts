// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r;
function i() {
  return (i = e(() => {
    ((t = [24, 19, 15, 11, 8, 6, 4, 0, -4]),
      (n = t.reduce((e, t) => (e.push(e[e.length - 1] + t), e), [0])),
      (r = (e) => {
        let r = Number.isFinite(e) ? Math.min(t.length, Math.max(0, Math.round(e))) : 0;
        return {
          quantity: r,
          marginalUtility: r === 0 ? 0 : t[r - 1],
          totalUtility: n[r],
          totals: n,
        };
      }));
  }))();
}
export { r as n, i as r, t };
