// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `HEMOGLOBIN_CURVE`),
      (n = `hemoglobin-curve-v1`),
      (r = {
        oxygenPartialPressureMmHg: { kind: `number`, defaultValue: 40, min: 0, max: 120 },
        ph: { kind: `number`, defaultValue: 7.4, min: 7.2, max: 7.6 },
        carbonDioxidePartialPressureMmHg: { kind: `number`, defaultValue: 40, min: 20, max: 60 },
        temperatureCelsius: { kind: `number`, defaultValue: 37, min: 35, max: 39 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
