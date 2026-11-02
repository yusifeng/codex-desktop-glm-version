// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ISOTOPE_ATOMIC_MASS`),
      (n = `isotope-atomic-mass-v2`),
      (r = {
        element: {
          kind: `enum`,
          defaultValue: `chlorine`,
          allowedValues: [`boron`, `carbon`, `neon`, `magnesium`, `sulfur`, `chlorine`, `copper`],
        },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
