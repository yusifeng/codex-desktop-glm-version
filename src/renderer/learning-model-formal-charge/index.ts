// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `FORMAL_CHARGE`),
      (n = `formal-charge-v1`),
      (r = {
        example: {
          kind: `enum`,
          defaultValue: `carbon-dioxide-candidates`,
          allowedValues: [`carbon-dioxide-candidates`, `nitrite-resonance`, `ammonium`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
