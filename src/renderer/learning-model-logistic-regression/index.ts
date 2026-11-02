// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `LOGISTIC_REGRESSION`),
      (n = `logistic-regression-v1`),
      (r = `P(Y=1\\mid x)=\\frac{1}{1+e^{-(\\beta_0+\\beta_1x)}}`),
      (i = {
        intercept: { kind: `number`, defaultValue: -0.5, min: -2, max: 2 },
        coefficient: { kind: `number`, defaultValue: 1.2, min: -2.5, max: 2.5 },
      }),
      (a = { type: t, version: 2, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
