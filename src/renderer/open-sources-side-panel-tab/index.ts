// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { C_ as t, I3 as n, S_ as r, Xi as i, Yi as a } from "@rchunk/app-shared";
import {
  Gvt as o,
  Qen as s,
  Wvt as c,
  Zen as l,
  _vt as u,
  gvt as d,
} from "@rchunk/app-initial";
function f(e, t, n, a, s, c) {
  let u = d(e, l.SOURCES) ?? (s == null ? null : d(e, s)) ?? `right`;
  o(e, t, {
    revealAndFocus: !0,
    icon: (0, p.jsx)(r, { className: `shrink-0`, "aria-hidden": !1, asset: i }),
    id: l.SOURCES,
    kind: l.SOURCES,
    openerTabId: s,
    props: n,
    target: u,
    title: a,
    trailingContent: c,
  });
}
var p;
function m() {
  return (m = e(() => {
    (a(), c(), t(), u(), s(), (p = n()));
  }))();
}
export { f as n, m as t };
