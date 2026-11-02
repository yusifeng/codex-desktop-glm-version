// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `INTERMOLECULAR_FORCES`),
      (n = `intermolecular-forces-v2`),
      (r = {
        initial_example: {
          kind: `enum`,
          defaultValue: `water`,
          allowedValues: [`methane`, `hydrogen chloride`, `water`],
        },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
