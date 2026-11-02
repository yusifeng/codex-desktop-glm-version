// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `CAPILLARY_STARLING_FORCES`),
      (n = `capillary-starling-forces-v3`),
      (r = `J_v=K_f[(P_c-P_i)-\\sigma(\\pi_c-\\pi_i)]`),
      (i = {
        initial_scenario: {
          kind: `enum`,
          defaultValue: `typical-systemic-capillary`,
          allowedValues: [
            `typical-systemic-capillary`,
            `raised-capillary-hydrostatic-pressure`,
            `reduced-plasma-oncotic-pressure`,
            `raised-interstitial-oncotic-pressure`,
            `raised-interstitial-hydrostatic-pressure`,
          ],
        },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
