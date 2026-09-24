// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `OXYGEN_SAG_CURVE`),
      (n = `oxygen-sag-curve-v1`),
      (r = {
        initial_ultimate_bod_mg_l: { kind: `number`, defaultValue: 9, min: 4, max: 14 },
        initial_oxygen_deficit_mg_l: { kind: `number`, defaultValue: 0.25, min: 0, max: 0.5 },
        deoxygenation_rate_per_day: { kind: `number`, defaultValue: 0.25, min: 0.15, max: 0.35 },
        reaeration_rate_per_day: { kind: `number`, defaultValue: 0.75, min: 0.35, max: 1.15 },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
