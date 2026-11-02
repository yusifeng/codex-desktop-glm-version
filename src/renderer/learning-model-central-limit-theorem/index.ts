// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `CENTRAL_LIMIT_THEOREM`),
      (n = `central-limit-theorem-v1`),
      (r = {
        population_shape: {
          kind: `enum`,
          defaultValue: `right-skewed`,
          allowedValues: [`right-skewed`, `uniform`, `bimodal`, `normal`],
        },
        sample_size: { kind: `integer`, defaultValue: 5, min: 1, max: 100 },
      }),
      (i = { type: t, version: 3, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
