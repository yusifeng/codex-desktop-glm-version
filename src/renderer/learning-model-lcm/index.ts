// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r;
function i() {
  return (i = e(() => {
    ((t = `lcm-v1`),
      (n = {
        first_number: { kind: `integer`, defaultValue: 4, min: 1, max: 12 },
        second_number: { kind: `integer`, defaultValue: 6, min: 1, max: 12 },
      }),
      (r = { type: `LCM`, version: 2, thumbnailAssetKey: t, parameters: n }));
  }))();
}
export { r as n, i as t };
