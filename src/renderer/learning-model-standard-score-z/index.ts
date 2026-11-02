// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a, o;
function s() {
  return (s = e(() => {
    ((t = `STANDARD_SCORE_Z`),
      (n = `standard-score-z-v1`),
      (r = `z = \\frac{x - \\mu}{\\sigma}`),
      (i = [
        `z = \\frac{x - \\bar{x}}{s}`,
        `z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}`,
        `z = \\frac{\\bar{x} - \\mu0}{\\sigma / \\sqrt{n}}`,
      ]),
      (a = {
        x: { kind: `number`, defaultValue: 1.2, min: -1e4, max: 1e4 },
        mu: { kind: `number`, defaultValue: 0, min: -1e4, max: 1e4 },
        sigma: { kind: `number`, defaultValue: 1, min: 0.01, max: 1e4 },
      }),
      (o = {
        type: t,
        version: 2,
        thumbnailAssetKey: n,
        canonicalFormula: r,
        canonicalFormulaAliases: i,
        parameters: a,
      }));
  }))();
}
export { o as n, s as t };
