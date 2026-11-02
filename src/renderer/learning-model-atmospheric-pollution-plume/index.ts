// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ATMOSPHERIC_POLLUTION_PLUME`),
      (n = `atmospheric-pollution-plume-v2`),
      (r = {
        initial_plume_regime: {
          kind: `enum`,
          defaultValue: `looping`,
          allowedValues: [`looping`, `coning`, `fanning`, `lofting`, `fumigation`, `trapping`],
        },
      }),
      (i = { type: t, version: 3, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
