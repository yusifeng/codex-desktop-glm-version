// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a, o;
function s() {
  return (s = e(() => {
    ((t = `CIRCLE_CIRCUMFERENCE`),
      (n = `circle-circumference-v1`),
      (r = `C = 2\\pi r`),
      (i = [
        `2\\pi r = C`,
        `C = \\pi d`,
        `\\pi d = C`,
        `r = \\frac{C}{2\\pi}`,
        `d = \\frac{C}{\\pi}`,
      ]),
      (a = { radius: { kind: `number`, defaultValue: 3, min: 0.01, max: 1e4 } }),
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
var c, l;
function u() {
  return (u = e(() => {
    ((c = { label: `r`, min: 0.5, max: 20, step: 0.1, defaultValue: 3, thumbnailDefaultValue: 3 }),
      (l = { properties: { radius: c } }));
  }))();
}
export { o as a, s as i, c as n, u as r, l as t };
