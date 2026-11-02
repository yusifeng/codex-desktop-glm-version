// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t;
function n() {
  return (n = e(() => {
    t = (e) => {
      let t = Number.isFinite(e.soluteAddedGrams)
          ? Math.min(Math.max(e.soluteAddedGrams, 0), 72)
          : 48,
        n = Math.min(t, 36);
      return { addedGrams: t, dissolvedGrams: n, excessGrams: t - n, isSaturated: t >= 36 };
    };
  }))();
}
export { n, t };
