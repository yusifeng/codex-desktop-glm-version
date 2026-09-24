// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import {
  $3 as t,
  Cq as n,
  I3 as r,
  K3 as i,
  W3 as a,
  e6 as o,
  wL as s,
} from "./app-shared-7b9edc1bfb7f.js";
import { Oun as c, Qgn as l, Ygn as u } from "./app-initial-51da50e6c6e3.js";
import { n as d, t as f } from "./panel-3f0c2778c5e0.js";
function p() {
  let e = (0, h.c)(7),
    [t, r] = (0, g.useState)(null),
    a;
  e[0] === Symbol.for(`react.memo_cache_sentinel`) ? ((a = []), (e[0] = a)) : (a = e[0]);
  let [o, s] = (0, g.useState)(a),
    l;
  (e[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = (e) => {
        let { conversationId: t } = e;
        r(t);
      }),
      (e[1] = l))
    : (l = e[1]),
    i(`debug-window-origin-conversation-changed`, l));
  let d;
  if (
    (e[2] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((d = (e) => {
          let { events: t } = e;
          s(t);
        }),
        (e[2] = d))
      : (d = e[2]),
    i(`debug-window-client-analytics-history-changed`, d),
    !n.allowDebugMenu(c()))
  ) {
    let t;
    return (
      e[3] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, _.jsx)(u, { to: `/`, replace: !0 })), (e[3] = t))
        : (t = e[3]),
      t
    );
  }
  let p;
  return (
    e[4] !== o || e[5] !== t
      ? ((p = (0, _.jsx)(_.Fragment, {
          children: (0, _.jsx)(`main`, {
            className: `h-dvh w-full overflow-hidden bg-surface text-default`,
            children: (0, _.jsx)(f, {
              clientAnalyticsHistory: o,
              conversationIdOverride: t,
              onClose: m,
              showHeader: !1,
            }),
          }),
        })),
        (e[4] = o),
        (e[5] = t),
        (e[6] = p))
      : (p = e[6]),
    p
  );
}
function m() {
  return window.close();
}
var h, g, _;
function v() {
  return (v = e(() => {
    ((h = t()), s(), (g = o()), l(), a(), d(), (_ = r()));
  }))();
}
v();
export { p as DebugWindowPage };
