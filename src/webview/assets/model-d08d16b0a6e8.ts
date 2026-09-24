// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i, a, o, s, c, l, u;
function d() {
  return (d = e(() => {
    ((t = [`sand`, `loam`, `clay`]),
      (n = { min: 0, max: 4, step: 0.05, defaultValue: 1.52 }),
      (r = Math.log10(33)),
      (i = Math.log10(1500)),
      (a = {
        sand: { residual: 0.03, saturated: 0.43, alpha: 1.3249278, n: 1.39445576 },
        loam: { residual: 0.07, saturated: 0.46, alpha: 0.0567237, n: 1.32983302 },
        clay: { residual: 0.12, saturated: 0.5, alpha: 0.24867067, n: 1.1569497 },
      }),
      (o = (e, t, n) => Math.max(t, Math.min(n, e))),
      (s = (e) => (e === `sand` || e === `loam` || e === `clay` ? e : `loam`)),
      (c = (e) => ({
        soil_texture: s(e.soil_texture),
        suctionLog10: Number.isFinite(e.suctionLog10)
          ? o(e.suctionLog10, n.min, n.max)
          : n.defaultValue,
      })),
      (l = (e, t) => {
        let { residual: n, saturated: r, alpha: i, n: o } = a[e],
          s = 1 - 1 / o;
        return 100 * (n + (r - n) / (1 + (i * Math.max(0, t)) ** +o) ** s);
      }),
      (u = (e) => {
        let t = c(e),
          n = 10 ** t.suctionLog10,
          r = l(t.soil_texture, 33),
          i = l(t.soil_texture, 1500);
        return {
          ...t,
          suctionKpa: n,
          current: l(t.soil_texture, n),
          fieldCapacity: r,
          wiltingPoint: i,
          plantAvailable: r - i,
        };
      }));
  }))();
}
export { u as a, c, i, l, t as n, d as o, n as r, s, r as t };
