// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `GHK_MEMBRANE_POTENTIAL`),
      (n = `ghk-membrane-potential-v1`),
      (r = `P_{\\mathrm{ion}}\\uparrow \\Rightarrow V_m \\to E_{\\mathrm{ion}}`),
      (i = {
        sodiumToPotassiumPermeabilityRatio: { kind: `number`, defaultValue: 0.04, min: 0, max: 1 },
        chlorideToPotassiumPermeabilityRatio: {
          kind: `number`,
          defaultValue: 0.45,
          min: 0,
          max: 1,
        },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
