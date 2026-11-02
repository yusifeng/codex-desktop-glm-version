// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `BALANCING_EQUATIONS`),
      (n = `balancing-equations-v2`),
      (r = {
        reaction_example: {
          kind: `enum`,
          defaultValue: `hydrogen-and-oxygen-to-water`,
          allowedValues: [
            `hydrogen-and-oxygen-to-water`,
            `nitrogen-and-hydrogen-to-ammonia`,
            `methane-combustion`,
          ],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
