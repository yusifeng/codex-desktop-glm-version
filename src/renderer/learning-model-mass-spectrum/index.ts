// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `MASS_SPECTRUM`),
      (n = `mass-spectrum-v1`),
      (r = {
        example: {
          kind: `enum`,
          defaultValue: `fragment-dominant`,
          allowedValues: [
            `fragment-dominant`,
            `molecular-ion-dominant`,
            `chlorine-isotope-pattern`,
            `bromine-isotope-pattern`,
          ],
        },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
