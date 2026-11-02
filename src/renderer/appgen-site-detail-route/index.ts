// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { $3 as t, I3 as n } from "@rchunk/app-shared";
import {
  $gn as r,
  GT as i,
  JT as a,
  KT as o,
  Qgn as s,
  WT as c,
  Xgn as l,
  Ygn as u,
  i_n as d,
  l_n as f,
  lnn as p,
  qT as m,
} from "@rchunk/app-initial";
import { n as h, t as g } from "@rchunk/appgen-site-detail-layout";
function _() {
  let e = (0, b.c)(4),
    { pathname: t } = d(),
    { projectId: n } = f();
  if (n == null) {
    let t;
    return (
      e[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, x.jsx)(u, { replace: !0, to: `/sites` })), (e[0] = t))
        : (t = e[0]),
      t
    );
  }
  let i = `analytics`;
  r(`/sites/:projectId/settings`, t) == null
    ? r(`/sites/:projectId/automations`, t) == null
      ? r(`/sites/:projectId/database`, t) != null && (i = `database`)
      : (i = `automations`)
    : (i = `settings`);
  let a;
  return (
    e[1] !== n || e[2] !== i
      ? ((a = (0, x.jsx)(g, { prefetchTab: y, projectId: n, selectedTab: i, children: v })),
        (e[1] = n),
        (e[2] = i),
        (e[3] = a))
      : (a = e[3]),
    a
  );
}
function v() {
  return (0, x.jsx)(l, {});
}
function y(e) {
  switch (e) {
    case `analytics`:
      return c.prefetch();
    case `database`:
      return o.prefetch();
    case `automations`:
      return i.prefetch();
    case `settings`:
      return m.prefetch();
  }
}
var b, x;
function S() {
  return (S = e(() => {
    ((b = t()), s(), a(), p(), h(), (x = n()));
  }))();
}
S();
export { _ as AppgenSiteDetailRoute };
