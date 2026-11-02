// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `PRODUCTION_POSSIBILITIES_FRONTIER`),
      (n = `production-possibilities-frontier-v1`),
      (r = {
        consumerGoods: { kind: `number`, defaultValue: 50, min: 0, max: 100 },
        capitalGoods: { kind: `number`, defaultValue: 75, min: 0, max: 100 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
