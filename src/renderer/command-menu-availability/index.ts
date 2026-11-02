// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, QI as n, ZI as r, dZ as i, sZ as a } from "@rchunk/app-shared";
import {
  Sqt as o,
  Sun as s,
  U6t as c,
  gfn as l,
  mfn as u,
  mun as d,
  pfn as f,
  vfn as p,
  xun as m,
} from "@rchunk/app-initial";
import { n as h, t as g } from "@rchunk/command-menu-holdout";
var _, v;
function y() {
  return (y = e(() => {
    (t(),
      s(),
      h(),
      o(),
      n(),
      f(),
      (_ = i(
        r,
        ({ get: e }) => {
          let t = e(l);
          return t == null || g(t);
        },
        ({ get: e, set: t }) => {
          let n = e(l);
          if (n == null) return;
          let r = () => t(g(n));
          return (n.on(`values_updated`, r), () => n.off(`values_updated`, r));
        },
      )),
      (v = a(r, ({ get: e }) => {
        let t = e(c);
        return t != null && t === e(d) && e(m) && !e(p) && e(u, `665873859`) && !e(_);
      })));
  }))();
}
export { y as n, v as t };
