// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  FX as n,
  I3 as r,
  LX as i,
  QI as a,
  ZI as o,
  e6 as s,
} from "@rchunk/app-shared";
import { Qp as c, em as l } from "@rchunk/app-primary";
function u(e) {
  let t = (0, d.c)(5),
    { source: n, candidate: r } = e,
    a = i(o),
    s = (0, f.useId)(),
    l;
  return (
    t[0] !== r || t[1] !== s || t[2] !== a || t[3] !== n
      ? ((l = (0, p.jsx)(`span`, {
          hidden: !0,
          ref: (e) => {
            a.set(c, (t) => {
              let i = new Map(t);
              return (e == null ? i.delete(s) : i.set(s, { source: n, candidate: r }), i);
            });
          },
        })),
        (t[0] = r),
        (t[1] = s),
        (t[2] = a),
        (t[3] = n),
        (t[4] = l))
      : (l = t[4]),
    l
  );
}
var d, f, p;
function m() {
  return (m = e(() => {
    ((d = t()), n(), (f = s()), a(), l(), (p = r()));
  }))();
}
export { m as n, u as t };
