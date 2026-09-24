// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ROC_CURVE`),
      (n = `roc-curve-v1`),
      (r = {
        auroc: { kind: `number`, defaultValue: 0.75, min: 0.5, max: 0.95 },
        threshold: { kind: `number`, defaultValue: 0.5, min: 0, max: 1 },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
