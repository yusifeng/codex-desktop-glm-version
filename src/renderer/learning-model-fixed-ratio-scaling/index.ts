// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `FIXED_RATIO_SCALING`),
      (n = `fixed-ratio-scaling-v1`),
      (r = { scaleFactor: { kind: `number`, defaultValue: 1.5, min: 0.5, max: 2 } }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
