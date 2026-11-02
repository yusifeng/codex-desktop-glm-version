// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, e6 as n } from "@rchunk/app-shared";
import { n as r, t as i } from "@rchunk/use-element-in-view";
function a() {
  let e = (0, o.c)(5),
    [t, n] = (0, s.useState)(null),
    [i, a] = (0, s.useState)(null),
    c;
  e[0] !== t || e[1] !== i
    ? ((c = { container: t, target: i }), (e[0] = t), (e[1] = i), (e[2] = c))
    : (c = e[2]);
  let l = !r(c),
    u;
  return (
    e[3] === l
      ? (u = e[4])
      : ((u = { scrollContainerRef: n, showTitleInToolbar: l, titleRef: a }),
        (e[3] = l),
        (e[4] = u)),
    u
  );
}
var o, s;
function c() {
  return (c = e(() => {
    ((o = t()), (s = n()), i());
  }))();
}
export { a as n, c as t };
