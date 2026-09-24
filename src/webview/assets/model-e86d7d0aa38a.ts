// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r;
function i() {
  return (i = e(() => {
    ((t = { startingGap: 0, fiscalAction: 0 }),
      (n = { outputMin: 20, outputMax: 112, priceMin: 12, priceMax: 116 }),
      (r = (e) => {
        let t = +(e.startingGap >= 0.5),
          n = e.fiscalAction < 0.5 ? 0 : e.fiscalAction < 1.5 ? 1 : e.fiscalAction < 2.5 ? 2 : 3,
          r = n === 0 || n === 2,
          i = r === (t === 0),
          a = t === 0 ? 48 : 84,
          o = a + (r ? 18 : -18),
          s = 0.6 * a + 15,
          c = 0.6 * o + 15;
        return {
          startingGap: t,
          fiscalAction: n,
          expansionary: r,
          closesGap: i,
          potentialOutput: 66,
          initialOutput: a,
          finalOutput: o,
          initialPrice: s,
          finalPrice: c,
          initialAdIntercept: s + 0.55 * a,
          finalAdIntercept: c + 0.55 * o,
        };
      }));
  }))();
}
export { i, n, r, t };
