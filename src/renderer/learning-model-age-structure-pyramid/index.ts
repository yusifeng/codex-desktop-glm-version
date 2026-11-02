// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `AGE_STRUCTURE_PYRAMID`),
      (n = `age-structure-pyramid-v1`),
      (r = {
        initial_pattern: {
          kind: `enum`,
          defaultValue: `expansive`,
          allowedValues: [`expansive`, `stationary`, `constrictive`],
        },
      }),
      (i = { type: t, version: 3, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
