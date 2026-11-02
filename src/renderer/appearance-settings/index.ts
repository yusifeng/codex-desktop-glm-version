// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { Xl as r, Yl as i, au as a, su as o } from "@rchunk/app-initial";
import { n as s, o as c } from "@rchunk/general-settings";
function l() {
  let e = (0, u.c)(1),
    t;
  return (
    e[0] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((t = (0, d.jsx)(a, {
          title: (0, d.jsx)(i, { slug: `appearance` }),
          children: (0, d.jsx)(s, {}),
        })),
        (e[0] = t))
      : (t = e[0]),
    t
  );
}
var u, d;
function f() {
  return (f = e(() => {
    ((u = t()), o(), r(), c(), (d = n()));
  }))();
}
f();
export { l as AppearanceSettings };
