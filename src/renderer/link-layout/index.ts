// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { M6t as r, N6t as i, Qgn as a, Xgn as o } from "@rchunk/app-initial";
import { fc as s, mc as c } from "@rchunk/app-primary";
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
