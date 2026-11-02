// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import { C4 as r, E4 as i, Qgn as a, Ygn as o } from "@rchunk/app-initial";
function s() {
  let e = (0, c.c)(2);
  if (!i()) {
    let t;
    return (
      e[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, l.jsx)(o, { to: `/`, replace: !0 })), (e[0] = t))
        : (t = e[0]),
      t
    );
  }
  let t;
  return (
    e[1] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((t = (0, l.jsx)(o, { to: `/settings/connections`, replace: !0 })), (e[1] = t))
      : (t = e[1]),
    t
  );
}
var c, l;
function u() {
  return (u = e(() => {
    ((c = t()), a(), r(), (l = n()));
  }))();
}
u();
export { s as RemoteConnectionsPage };
