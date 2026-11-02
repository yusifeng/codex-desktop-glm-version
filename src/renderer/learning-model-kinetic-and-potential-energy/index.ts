// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `KINETIC_AND_POTENTIAL_ENERGY`),
      (n = `kinetic-and-potential-energy-v1`),
      (r = `E_{\\text{total}} = PE + KE`),
      (i = { startHeightMeters: { kind: `number`, defaultValue: 6, min: 2, max: 10 } }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
