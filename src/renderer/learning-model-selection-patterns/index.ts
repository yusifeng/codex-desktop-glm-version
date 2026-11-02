// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `SELECTION_PATTERNS`),
      (n = `selection-patterns-v1`),
      (r = {
        initial_selection_pattern: {
          kind: `enum`,
          defaultValue: `stabilizing`,
          allowedValues: [`stabilizing`, `directional`, `disruptive`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
