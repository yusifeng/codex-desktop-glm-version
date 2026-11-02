// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `CLIMATE_FEEDBACK_LOOPS`),
      (n = `climate-feedback-loops-v2`),
      (r = {
        initial_mechanism: {
          kind: `enum`,
          defaultValue: `ice-albedo`,
          allowedValues: [`ice-albedo`, `water-vapor`, `radiative-response`],
        },
        initial_change: {
          kind: `enum`,
          defaultValue: `warming`,
          allowedValues: [`warming`, `cooling`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
