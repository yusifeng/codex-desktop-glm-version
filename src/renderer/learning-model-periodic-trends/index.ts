// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `PERIODIC_TRENDS`),
      (n = `periodic-trends-v1`),
      (r = {
        initial_trend: {
          kind: `enum`,
          defaultValue: `atomic radius`,
          allowedValues: [`atomic radius`, `first ionization energy`, `electronegativity`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
