import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { C_ as t, I3 as n, S_ as r, Xi as i, Yi as a } from "./app-shared-7b9edc1bfb7f.js";
import { Gvt as o, Qen as s, Wvt as c, Zen as l, _vt as u, gvt as d } from "./app-initial-51da50e6c6e3.js";
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
