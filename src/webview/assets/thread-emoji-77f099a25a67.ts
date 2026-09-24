// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, BX as n, FX as r, I3 as i } from "./app-shared-7b9edc1bfb7f.js";
import { h_t as a, m_t as o } from "./app-initial-51da50e6c6e3.js";
function s(e) {
  let t = (0, c.c)(2),
    { threadId: r } = e,
    i = n(a, r),
    o;
  return (
    t[0] === i
      ? (o = t[1])
      : ((o =
          i == null
            ? null
            : (0, l.jsxs)(`span`, { className: `shrink-0 select-none`, children: [i, ` `] })),
        (t[0] = i),
        (t[1] = o)),
    o
  );
}
var c, l;
function u() {
  return (u = e(() => {
    ((c = t()), r(), o(), (l = i()));
  }))();
}
export { u as n, s as t };
