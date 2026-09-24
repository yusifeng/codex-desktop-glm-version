// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i, a, o, s;
function c() {
  return (c = e(() => {
    ((t = { min: 0.5, max: 5, step: 0.1, defaultValue: 3 }),
      (n = { min: 0.5, max: 5, step: 0.1, defaultValue: 2 }),
      (r = { min: 0.2, max: 2, step: 0.05, defaultValue: 0.8 }),
      (i = (e, t, n) => Math.min(Math.max(e, t), n)),
      (a = (e, t, n, r) => (Number.isFinite(e) ? i(e ?? t, n, r) : t)),
      (o = (e) => ({
        length: a(e.length, t.defaultValue, t.min, t.max),
        area: a(e.area, n.defaultValue, n.min, n.max),
        resistivity: a(e.resistivity, r.defaultValue, r.min, r.max),
      })),
      (s = (e) => {
        let t = o(e);
        return { ...t, resistance: (t.resistivity * t.length) / t.area };
      }));
  }))();
}
export { c as a, s as i, t as n, o, r, n as t };
