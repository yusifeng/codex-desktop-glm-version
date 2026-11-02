// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { Fx as r, Ix as i, Qgn as a, Ygn as o, d_n as s } from "@rchunk/app-initial";
function c() {
  let e = (0, l.c)(6),
    [t] = s(),
    n = `/`;
  try {
    let r;
    (e[0] === t ? (r = e[1]) : ((r = t.get(`toUrl`) ?? `/`), (e[0] = t), (e[1] = r)),
      (n = decodeURIComponent(r)));
  } catch {}
  let i;
  e[2] === n ? (i = e[3]) : ((i = new URL(r(n))), (e[2] = n), (e[3] = i));
  let a = i,
    c = `${a.pathname}${a.search}${a.hash}`,
    d;
  return (
    e[4] === c ? (d = e[5]) : ((d = (0, u.jsx)(o, { to: c, replace: !0 })), (e[4] = c), (e[5] = d)),
    d
  );
}
var l, u;
function d() {
  return (d = e(() => {
    ((l = t()), a(), i(), (u = n()));
  }))();
}
d();
export { c as BrowserLoadPageWithAuth };
