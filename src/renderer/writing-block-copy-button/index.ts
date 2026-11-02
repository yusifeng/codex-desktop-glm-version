// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  I3 as n,
  ay as r,
  lw as i,
  mC as a,
  nf as o,
  tf as s,
} from "@rchunk/app-shared";
function c(e) {
  let t = (0, l.c)(5),
    { className: n, isDisabled: i, onCopy: o } = e,
    c;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = { copy: (0, u.jsx)(a, {}), copied: (0, u.jsx)(r, {}) }), (t[0] = c))
    : (c = t[0]);
  let d;
  return (
    t[1] !== n || t[2] !== i || t[3] !== o
      ? ((d = (0, u.jsx)(s, {
          className: n,
          icons: c,
          isDisabled: i,
          iconOnly: !0,
          tooltipSideOffset: 0,
          variant: `toolbar`,
          onCopy: o,
        })),
        (t[1] = n),
        (t[2] = i),
        (t[3] = o),
        (t[4] = d))
      : (d = t[4]),
    d
  );
}
var l, u;
function d() {
  return (d = e(() => {
    ((l = t()), o(), i(), (u = n()));
  }))();
}
export { d as n, c as t };
