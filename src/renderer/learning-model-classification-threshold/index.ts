// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `CLASSIFICATION_THRESHOLD`),
      (n = `classification-threshold-v1`),
      (r = { threshold: { kind: `number`, defaultValue: 0.5, min: 0, max: 1 } }),
      (i = { type: t, version: 3, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
