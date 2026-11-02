// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ACCURACY_VS_PRECISION_TARGETS`),
      (n = `accuracy-vs-precision-targets-v1`),
      (r = {
        meanPosition: {
          kind: `enum`,
          defaultValue: `centered`,
          allowedValues: [`centered`, `offset`],
        },
        measurementSpread: {
          kind: `enum`,
          defaultValue: `small`,
          allowedValues: [`small`, `large`],
        },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
