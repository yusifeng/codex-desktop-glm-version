// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, Df as n, FX as r, I3 as i, LX as a, Of as o } from "@rchunk/app-shared";
import { $en as s, Jut as c, Yut as l, itn as u } from "@rchunk/app-initial";
function d(e) {
  let t = (0, f.c)(9),
    r,
    i;
  t[0] === e
    ? ((r = t[1]), (i = t[2]))
    : (({ children: r, ...i } = e), (t[0] = e), (t[1] = r), (t[2] = i));
  let o = a(s),
    l;
  t[3] !== i || t[4] !== o ? ((l = () => c(o, i)), (t[3] = i), (t[4] = o), (t[5] = l)) : (l = t[5]);
  let u;
  return (
    t[6] !== r || t[7] !== l
      ? ((u = (0, p.jsx)(n, { getItems: l, children: r })), (t[6] = r), (t[7] = l), (t[8] = u))
      : (u = t[8]),
    u
  );
}
var f, p;
function m() {
  return (m = e(() => {
    ((f = t()), r(), o(), u(), l(), (p = i()));
  }))();
}
export { m as n, d as t };
