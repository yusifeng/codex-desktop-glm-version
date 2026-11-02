// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `CRITICAL_ANGLE_SINE_RELATION`),
      (n = `critical-angle-sine-relation-v1`),
      (r = `\\sin\\theta_c = \\frac{n_2}{n_1}`),
      (i = { indexRatio: { kind: `number`, defaultValue: 0.67, min: 0.5, max: 0.95 } }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
