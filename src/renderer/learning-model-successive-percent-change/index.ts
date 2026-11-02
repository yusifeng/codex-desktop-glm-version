// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `SUCCESSIVE_PERCENT_CHANGE`),
      (n = `successive-percent-change-v1`),
      (r = `100\\left(1+\\frac{p_1}{100}\\right)\\left(1+\\frac{p_2}{100}\\right)`),
      (i = {
        firstChangePercent: { kind: `number`, defaultValue: 50, min: -95, max: 100 },
        secondChangePercent: { kind: `number`, defaultValue: -50, min: -100, max: 100 },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
