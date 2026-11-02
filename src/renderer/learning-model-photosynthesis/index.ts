// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `PHOTOSYNTHESIS`),
      (n = `photosynthesis-v3`),
      (r = {
        lightIntensity: {
          kind: `enum`,
          defaultValue: `low`,
          allowedValues: [`low`, `medium`, `high`],
        },
        carbonDioxide: {
          kind: `enum`,
          defaultValue: `low`,
          allowedValues: [`low`, `medium`, `high`],
        },
        water: { kind: `enum`, defaultValue: `low`, allowedValues: [`low`, `medium`, `high`] },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
