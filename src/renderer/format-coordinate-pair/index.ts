// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r;
function i() {
  return (i = e(() => {
    ((t = 1.1),
      (n = (e) =>
        e
          .formatNumber(t, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: !1 })
          .includes(`.`)
          ? `, `
          : `; `),
      (r = (e, t, r) => `(${t}${n(e)}${r})`));
  }))();
}
export { i as n, r as t };
