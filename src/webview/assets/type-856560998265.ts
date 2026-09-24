// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `ELECTROLYTE_CONDUCTIVITY`),
      (n = `electrolyte-conductivity-v2`),
      (r = {
        initial_solution: {
          kind: `enum`,
          defaultValue: `potassium-chloride`,
          allowedValues: [`potassium-chloride`, `acetic-acid`, `ethanol`],
        },
        initial_concentration: { kind: `number`, defaultValue: 0.6, min: 0.1, max: 1 },
      }),
      (i = { type: t, version: 2, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
