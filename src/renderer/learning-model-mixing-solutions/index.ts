// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `MIXING_SOLUTIONS`),
      (n = `mixing-solutions-v1`),
      (r = `C_{\\mathrm{mix}}=\\frac{C_1V_1+C_2V_2}{V_1+V_2}`),
      (i = {
        solution1VolumeLiters: { kind: `number`, defaultValue: 0.8, min: 0.01, max: 1e3 },
        solution1ConcentrationMolesPerLiter: { kind: `number`, defaultValue: 2, min: 0, max: 20 },
        solution2VolumeLiters: { kind: `number`, defaultValue: 1.2, min: 0.01, max: 1e3 },
        solution2ConcentrationMolesPerLiter: { kind: `number`, defaultValue: 0.5, min: 0, max: 20 },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
