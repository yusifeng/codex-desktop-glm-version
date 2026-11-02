// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
function r(e) {
  let t = (0, i.c)(5),
    { header: n, headerPlacement: r, content: o, renderLayout: s } = e,
    c;
  return (
    t[0] !== o || t[1] !== n || t[2] !== r || t[3] !== s
      ? ((c =
          s == null
            ? (0, a.jsxs)(a.Fragment, { children: [n, o] })
            : s({ header: n, headerPlacement: r, content: o })),
        (t[0] = o),
        (t[1] = n),
        (t[2] = r),
        (t[3] = s),
        (t[4] = c))
      : (c = t[4]),
    c
  );
}
var i, a;
function o() {
  return (o = e(() => {
    ((i = t()), (a = n()));
  }))();
}
export { o as n, r as t };
