// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, G4 as n, H4 as r, Z4 as i, g4 as a, q4 as o } from "@rchunk/app-shared";
import { afn as s, ifn as c } from "@rchunk/app-initial";
function l() {
  let e = (0, f.c)(2),
    { value: t } = s(p),
    n;
  return (e[0] === t ? (n = e[1]) : ((n = u(t)), (e[0] = t), (e[1] = n)), n);
}
function u(e) {
  let t = {},
    n = h.parse(e);
  for (let [e, r] of Object.entries(n.skill_markdown_by_id ?? {})) {
    let n = m.safeParse(r);
    n.success && (t[e] = n.data);
  }
  return t;
}
function d(e, t) {
  return e[t];
}
var f, p, m, h;
function g() {
  return (g = e(() => {
    ((f = t()),
      a(),
      c(),
      (p = `1852350085`),
      (m = o().refine((e) => e.trim().length > 0)),
      (h = r({ skill_markdown_by_id: n(o(), i()).optional() }).catch({
        skill_markdown_by_id: {},
      })));
  }))();
}
export { g as n, l as r, d as t };
