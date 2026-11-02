// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `RADIATION_PENETRATION`),
      (n = `radiation-penetration-v1`),
      (r = {
        initial_shielding: {
          kind: `enum`,
          defaultValue: `lead-or-concrete`,
          allowedValues: [`none`, `paper`, `aluminium-or-plastic`, `lead-or-concrete`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
