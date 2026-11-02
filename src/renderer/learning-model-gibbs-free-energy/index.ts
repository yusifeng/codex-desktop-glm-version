// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a, o;
function s() {
  return (s = e(() => {
    ((t = `GIBBS_FREE_ENERGY`),
      (n = `gibbs-free-energy-v1`),
      (r = `\\Delta G^\\circ=-RT\\ln K`),
      (i = [`\\Delta_{\\mathrm r}G^\\circ=-RT\\ln K`]),
      (a = { deltaGKilojoulesPerMole: { kind: `number`, defaultValue: -20, min: -50, max: 50 } }),
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
