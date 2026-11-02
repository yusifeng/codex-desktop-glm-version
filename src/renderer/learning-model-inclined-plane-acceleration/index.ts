// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `INCLINED_PLANE_ACCELERATION`),
      (n = `inclined-plane-acceleration-v1`),
      (r = `a = g \\sin \\theta`),
      (i = {
        planeAngleDegrees: { kind: `number`, defaultValue: 30, min: 15, max: 45 },
        boxMassKilograms: { kind: `number`, defaultValue: 4, min: 2, max: 6 },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
