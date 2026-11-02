// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `SIMPLIFIED_FRACTION`),
      (n = `simplified-fraction-v1`),
      (r = {
        numerator: { kind: `integer`, defaultValue: 6, min: 1, max: 12 },
        denominator: { kind: `integer`, defaultValue: 8, min: 4, max: 24 },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
