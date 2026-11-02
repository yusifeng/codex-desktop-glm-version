// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i;
function a() {
  return (a = e(() => {
    ((t = `MOLE_AVOGADRO_NUMBER_VISUAL`),
      (n = `mole-avogadro-number-visual-v1`),
      (r = {
        substance: {
          kind: `enum`,
          defaultValue: `copper`,
          allowedValues: [`carbon`, `copper`, `water`],
        },
        initial_moles: { kind: `number`, defaultValue: 1, min: 0.25, max: 5 },
      }),
      (i = { type: t, version: 1, thumbnailAssetKey: n, parameters: r }));
  }))();
}
export { i as n, a as t };
