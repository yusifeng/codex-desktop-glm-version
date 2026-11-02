// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `MASS_SPRING_SHM`),
      (n = `mass-spring-shm-v1`),
      (r = `T = 2\\pi\\sqrt{\\frac{m}{k}}`),
      (i = {
        massKilograms: { kind: `number`, defaultValue: 1.5, min: 0.5, max: 5 },
        springConstantNewtonsPerMeter: { kind: `number`, defaultValue: 40, min: 10, max: 100 },
        amplitudeMeters: { kind: `number`, defaultValue: 0.25, min: 0.05, max: 0.5 },
      }),
      (a = { type: t, version: 1, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
