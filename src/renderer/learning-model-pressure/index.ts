// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a, o;
function s() {
  return (s = e(() => {
    ((t = `PRESSURE`),
      (n = `pressure-v1`),
      (r = `P = \\frac{F}{A}`),
      (i = [`P = F/A`, `F = PA`, `A = F/P`]),
      (a = {
        forceNewtons: { kind: `number`, defaultValue: 100, min: 0, max: 200 },
        areaSquareMeters: { kind: `number`, defaultValue: 2, min: 0.25, max: 5 },
      }),
      (o = {
        type: t,
        version: 1,
        thumbnailAssetKey: n,
        canonicalFormula: r,
        canonicalFormulaAliases: i,
        parameters: a,
      }));
  }))();
}
export { o as n, s as t };
