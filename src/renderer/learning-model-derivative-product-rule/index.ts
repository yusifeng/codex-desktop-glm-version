// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `DERIVATIVE_PRODUCT_RULE`),
      (n = `derivative-product-rule-v1`),
      (r = `(fg)' = f'g + fg'`),
      (i = { deltaX: { kind: `number`, defaultValue: 2, min: 0.05, max: 2 } }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
