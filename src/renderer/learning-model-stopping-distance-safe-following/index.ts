// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `STOPPING_DISTANCE_SAFE_FOLLOWING`),
      (n = `stopping-distance-safe-following-v2`),
      (r = `d_{\\mathrm{stop}}=d_{\\mathrm{reaction}}+d_{\\mathrm{braking}}`),
      (i = {
        speedKmh: { kind: `number`, defaultValue: 60, min: 30, max: 100 },
        reactionTimeSeconds: { kind: `number`, defaultValue: 1, min: 0.5, max: 2 },
        roadCondition: {
          kind: `enum`,
          defaultValue: `dry`,
          allowedValues: [`dry`, `wet`, `snow_ice`],
        },
      }),
      (a = { type: t, version: 2, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
