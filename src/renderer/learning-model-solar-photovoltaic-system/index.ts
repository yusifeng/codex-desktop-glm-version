// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `SOLAR_PHOTOVOLTAIC_SYSTEM`),
      (n = `solar-photovoltaic-system-v2`),
      (r = { array_capacity_kw: { kind: `number`, defaultValue: 6, min: 1, max: 20 } }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
