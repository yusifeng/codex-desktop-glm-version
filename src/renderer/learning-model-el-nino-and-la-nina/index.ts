// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `EL_NINO_AND_LA_NINA`),
      (n = `el-nino-and-la-nina-v3`),
      (r = {
        initial_phase: {
          kind: `enum`,
          defaultValue: `Neutral`,
          allowedValues: [`La Niña`, `Neutral`, `El Niño`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
