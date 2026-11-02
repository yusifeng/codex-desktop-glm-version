// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `HYPEROPIA`),
      (n = `hyperopia-v2`),
      (r = { objectDistanceMeters: { kind: `number`, defaultValue: 0.5, min: 0.25, max: 6 } }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
