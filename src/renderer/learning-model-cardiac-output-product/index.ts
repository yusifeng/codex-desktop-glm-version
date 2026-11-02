// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `CARDIAC_OUTPUT_PRODUCT`),
      (n = `cardiac-output-product-v3`),
      (r = `CO = HR \\times SV`),
      (i = {
        heartRateBeatsPerMinute: { kind: `number`, defaultValue: 70, min: 40, max: 180 },
        strokeVolumeMilliliters: { kind: `number`, defaultValue: 70, min: 30, max: 120 },
      }),
      (a = { type: t, version: 2, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
