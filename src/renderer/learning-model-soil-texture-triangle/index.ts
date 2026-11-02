// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `SOIL_TEXTURE_TRIANGLE`),
      (n = `soil-texture-triangle-v1`),
      (r = {
        sand_percent: { kind: `number`, defaultValue: 40, min: 0, max: 100 },
        clay_percent: { kind: `number`, defaultValue: 20, min: 0, max: 100 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
