// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `RGB_ADDITIVE_MIXING`),
      (n = `rgb-additive-mixing-v1`),
      (r = {
        red: { kind: `integer`, defaultValue: 255, min: 0, max: 255 },
        green: { kind: `integer`, defaultValue: 255, min: 0, max: 255 },
        blue: { kind: `integer`, defaultValue: 255, min: 0, max: 255 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
