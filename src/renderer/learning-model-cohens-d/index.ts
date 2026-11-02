// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `COHENS_D`),
      (n = `cohens-d-v1`),
      (r = `d = \\frac{\\bar{x}_2 - \\bar{x}_1}{s_{\\mathrm{pooled}}}`),
      (i = {
        initial_mean_difference: { kind: `number`, defaultValue: 0.8, min: -4, max: 4 },
        pooled_standard_deviation: { kind: `number`, defaultValue: 1, min: 0.75, max: 2 },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
