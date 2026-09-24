// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { lY as t, wL as n } from "./app-shared-7b9edc1bfb7f.js";
import { _an as r, aan as i } from "./app-initial-51da50e6c6e3.js";
import { c as a, r as o, s, t as c } from "./appgen-access-50974c702eaf.js";
import { n as l, t as u } from "./appgen-browser-site-e3ffe94b8e86.js";
import { r as d, t as f } from "./local-conversation-artifacts-signals-adff984a1c7d.js";
function p(e, n, r, s) {
  let l = u(e(f, { conversationId: t(n.conversationId), hostId: s }), r);
  if (l == null) return null;
  let { data: d } = e(i, l.projectId);
  return {
    siteUrl: r,
    projectId: l.projectId,
    canManage: c(d),
    isOwnerOnly: d != null && a(o(d.access_policy)),
  };
}
function m() {
  return (m = e(() => {
    (n(), s(), l(), r(), d());
  }))();
}
m();
export { p as getBrowserSiteActionsState };
