// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a, o;
function s() {
  return (s = e(() => {
    ((t = `WAVE_SPEED`),
      (n = `wave-speed-v1`),
      (r = `v = f\\lambda`),
      (i = [
        `\\nu = \\frac{c}{\\lambda}`,
        `v = f lambda`,
        `v=flambda`,
        `v=lambdaf`,
        `flambda=v`,
        `lambdaf=v`,
        `f=v/lambda`,
        `lambda=v/f`,
      ]),
      (a = {
        frequency: { kind: `number`, defaultValue: 2, min: 0.1, max: 2e4 },
        wavelength: { kind: `number`, defaultValue: 3, min: 0.1, max: 1e4 },
      }),
      (o = {
        type: t,
        version: 1,
        thumbnailAssetKey: n,
        canonicalFormula: r,
        canonicalFormulaAliases: i,
        parameters: a,
      }));
  }))();
}
export { o as n, s as t };
