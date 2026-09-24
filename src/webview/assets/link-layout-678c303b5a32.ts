// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { $3 as t, I3 as n } from "./app-shared-7b9edc1bfb7f.js";
import { M6t as r, N6t as i, Qgn as a, Xgn as o } from "./app-initial-51da50e6c6e3.js";
import { fc as s, mc as c } from "./app-primary-d66705000d76.js";
function l() {
  let e = (0, u.c)(2),
    { authMethod: t } = i(),
    n;
  return (
    e[0] === t
      ? (n = e[1])
      : ((n = t
          ? (0, d.jsx)(s, {})
          : (0, d.jsx)(`main`, { className: `h-full bg-surface`, children: (0, d.jsx)(o, {}) })),
        (e[0] = t),
        (e[1] = n)),
    n
  );
}
var u, d;
function f() {
  return (f = e(() => {
    ((u = t()), a(), c(), r(), (d = n()));
  }))();
}
f();
export { l as TrustedContactLinkLayout };
