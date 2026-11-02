// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `CLASSES_OF_LEVERS`),
      (n = `classes-of-levers-v1`),
      (r = {
        leverClass: {
          kind: `enum`,
          defaultValue: `first`,
          allowedValues: [`first`, `second`, `third`],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
