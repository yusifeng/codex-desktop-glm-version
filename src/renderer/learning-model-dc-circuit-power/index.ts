// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `DC_CIRCUIT_POWER`),
      (n = `dc-circuit-power-v1`),
      (r = `P = VI`),
      (i = {
        voltageVolts: { kind: `number`, defaultValue: 12, min: 1, max: 24 },
        resistanceOhms: { kind: `number`, defaultValue: 6, min: 1, max: 24 },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
