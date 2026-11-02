// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, QI as n, ZI as r, pZ as i, rZ as a } from "@rchunk/app-shared";
import { Ftn as o, Ltn as s, Sun as c, _un as l, mun as u } from "@rchunk/app-initial";
var d, f;
function p() {
  return (p = e(() => {
    (t(),
      c(),
      n(),
      o(),
      (d = i(r, new Map())),
      (f = a(r, (e, { get: t }) => {
        if (e == null) return null;
        let n = t(d).get(e);
        return n != null && n.accountId === t(u) && n.userId === t(l) && t(s, e) != null ? n : null;
      })));
  }))();
}
export { f as n, d as r, p as t };
