// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `METRIC_DISTANCE`),
      (n = `metric-distance-v1`),
      (r = {
        lengthCm: { kind: `number`, defaultValue: 32, min: 10, max: 50 },
        unit: { kind: `enum`, defaultValue: `cm`, allowedValues: [`mm`, `cm`, `m`, `km`] },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
