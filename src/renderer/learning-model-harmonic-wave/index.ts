// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = { fundamentalHz: 1.5, harmonicMagnitude: 0.8 }),
      (n = (e, t, n, r) => (Number.isFinite(e) ? Math.min(n, Math.max(t, e)) : r)),
      (r = (e) => {
        let t = n(e.fundamentalHz, 0.5, 3, 1.5),
          r = n(e.harmonicMagnitude, 0, 1.5, 0.8);
        return { fundamentalHz: t, harmonicHz: t * 2, harmonicMagnitude: r, hasHarmonic: r > 0 };
      }),
      (i = (e, t, n = 480) =>
        Array.from({ length: n + 1 }, (r, i) => {
          let a = (i / n) * 4;
          return { x: a, y: t * Math.sin(2 * Math.PI * e * a) };
        })));
  }))();
}
export { i, r as n, a as r, t };
