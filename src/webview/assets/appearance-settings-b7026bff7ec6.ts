// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, I3 as n } from "./app-shared-7b9edc1bfb7f.js";
import { Xl as r, Yl as i, au as a, su as o } from "./app-initial-51da50e6c6e3.js";
import { n as s, o as c } from "./general-settings-3d550f75d0eb.js";
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
