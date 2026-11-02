// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `OUTLIER_LEVERAGE_INFLUENCE`),
      (n = `outlier-leverage-influence-v1`),
      (r = {
        initial_case: {
          kind: `enum`,
          defaultValue: `influential`,
          allowedValues: [`central-outlier`, `aligned-high-leverage`, `influential`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
