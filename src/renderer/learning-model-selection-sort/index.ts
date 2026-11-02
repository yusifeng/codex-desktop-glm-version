// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `SELECTION_SORT`),
      (n = `selection-sort-v1`),
      (r = {
        order: {
          kind: `enum`,
          defaultValue: `6,3,8,2,7,1,5,4`,
          allowedValues: [
            `6,3,8,2,7,1,5,4`,
            `8,7,6,5,4,3,2,1`,
            `1,2,3,4,5,6,7,8`,
            `4,1,7,3,8,5,2,6`,
          ],
        },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
