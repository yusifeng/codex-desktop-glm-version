// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a, o, s, c;
function l() {
  return (l = e(() => {
    ((t = { min: 400, max: 700, step: 5, defaultValue: 550 }),
      (n = { min: 0, max: 3, step: 1, defaultValue: 0 }),
      (r = (e, t, n) => Math.min(Math.max(e, t), n)),
      (i = (e, t, n) => Math.exp(-0.5 * ((e - t) / n) ** 2)),
      (a = (e) => ({
        wavelength: Number.isFinite(e.wavelength)
          ? r(e.wavelength ?? t.defaultValue, t.min, t.max)
          : t.defaultValue,
        focus: Number.isFinite(e.focus)
          ? r(Math.round(e.focus ?? n.defaultValue), n.min, n.max)
          : n.defaultValue,
      })),
      (o = (e) => {
        let n = r(e, t.min, t.max);
        return {
          chlorophyllA: Math.min(1, 0.03 + 0.93 * i(n, 430, 13) + 0.82 * i(n, 665, 14)),
          chlorophyllB: Math.min(1, 0.025 + 0.84 * i(n, 455, 15) + 0.65 * i(n, 645, 13)),
          carotenoids: Math.min(1, 0.015 + 0.3 * i(n, 420, 30) + 0.63 * i(n, 475, 22)),
        };
      }),
      (s = (e) =>
        e < 450
          ? `violet-blue`
          : e < 500
            ? `blue`
            : e < 570
              ? `green`
              : e < 600
                ? `yellow`
                : e < 630
                  ? `orange`
                  : `red`),
      (c = (e) =>
        Array.from({ length: 151 }, (n, r) => {
          let i = t.min + r * 2;
          return { x: i, y: o(i)[e] };
        })));
  }))();
}
export { l as a, s as i, t as n, c as o, o as r, a as s, n as t };
