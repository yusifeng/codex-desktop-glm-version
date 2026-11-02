// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, BX as n, FX as r } from "@rchunk/app-shared";
import { AXt as i, fon as a, gon as o, kXt as s } from "@rchunk/app-initial";
function c(e, t, r, i, o, c) {
  let u = (0, l.c)(11),
    d;
  u[0] !== e || u[1] !== t
    ? ((d = e == null ? null : { cwd: e, hostConfig: t }), (u[0] = e), (u[1] = t), (u[2] = d))
    : (d = u[2]);
  let f;
  u[3] === c ? (f = u[4]) : ((f = a(c, null)), (u[3] = c), (u[4] = f));
  let p;
  return (
    u[5] !== r || u[6] !== o || u[7] !== i || u[8] !== d || u[9] !== f
      ? ((p = { key: r, operationSource: o, lookup: d, scope: i, ...f }),
        (u[5] = r),
        (u[6] = o),
        (u[7] = i),
        (u[8] = d),
        (u[9] = f),
        (u[10] = p))
      : (p = u[10]),
    n(s, p)
  );
}
var l;
function u() {
  return (u = e(() => {
    ((l = t()), r(), i(), o());
  }))();
}
export { c as n, u as t };
