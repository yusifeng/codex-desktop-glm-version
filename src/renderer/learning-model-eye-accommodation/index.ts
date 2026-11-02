// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `EYE_ACCOMMODATION`),
      (n = `eye-accommodation-v1`),
      (r = { objectDistanceMeters: { kind: `number`, defaultValue: 1, min: 0.25, max: 6 } }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
