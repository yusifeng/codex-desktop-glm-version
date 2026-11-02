// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `GRAM_STAIN`),
      (n = `gram-stain-v1`),
      (r = {
        bacteriaType: {
          kind: `enum`,
          defaultValue: `positive`,
          allowedValues: [`positive`, `negative`],
        },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
