// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `PARALLEL_LINE`),
      (n = `parallel-line-v1`),
      (r = {
        slope: { kind: `number`, defaultValue: 0.6, min: -1, max: 1 },
        referenceIntercept: { kind: `number`, defaultValue: 0, min: -4, max: 4 },
        comparisonIntercept: { kind: `number`, defaultValue: 3, min: -4, max: 4 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
