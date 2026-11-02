// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = { min: 0, max: 40, step: 0.5, defaultValue: 12 }),
      (n = 2.4),
      (r = (e) => (e <= 20 ? n + (20 - e) * 0.24 : n + (e - 20) * 0.2)),
      (i = (e) => {
        let n = Number.isFinite(e.addedVolumeMl)
          ? Math.min(t.max, Math.max(t.min, e.addedVolumeMl))
          : t.defaultValue;
        return {
          addedVolumeMl: n,
          conductivity: r(n),
          regime: n < 20 ? `before` : n > 20 ? `after` : `equivalence`,
        };
      }));
  }))();
}
export { a, r as i, t as n, i as r, n as t };
