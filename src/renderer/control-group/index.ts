// @ts-nocheck
import { classNames as i, initializeClassNames as r } from "../app-shared/ui/class-names";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  $3 as t,
  I3 as n,
} from "@rchunk/app-shared";
function a(e) {
  let t = (0, o.c)(5),
    { children: n, className: r } = e,
    a;
  t[0] === r ? (a = t[1]) : ((a = i(`flex items-center gap-2`, r)), (t[0] = r), (t[1] = a));
  let c;
  return (
    t[2] !== n || t[3] !== a
      ? ((c = (0, s.jsx)(`div`, { className: a, children: n })), (t[2] = n), (t[3] = a), (t[4] = c))
      : (c = t[4]),
    c
  );
}
var o, s;
function c() {
  return (c = e(() => {
    ((o = t()), r(), (s = n()));
  }))();
}
export { c as n, a as t };
