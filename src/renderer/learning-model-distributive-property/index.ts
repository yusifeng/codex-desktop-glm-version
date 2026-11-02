// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n, r, i, a;
function o() {
  return (o = e(() => {
    ((t = `DISTRIBUTIVE_PROPERTY`),
      (n = `distributive-property-v1`),
      (r = `a(b+c)=ab+ac`),
      (i = {
        a: { kind: `integer`, defaultValue: 8, min: 2, max: 8 },
        b: { kind: `integer`, defaultValue: 7, min: 2, max: 8 },
        c: { kind: `integer`, defaultValue: 7, min: 2, max: 8 },
      }),
      (a = { type: t, version: 2, thumbnailAssetKey: n, canonicalFormula: r, parameters: i }));
  }))();
}
export { a as n, o as t };
