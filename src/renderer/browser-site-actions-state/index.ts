// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { lY as t, wL as n } from "@rchunk/app-shared";
import { _an as r, aan as i } from "@rchunk/app-initial";
import { c as a, r as o, s, t as c } from "@rchunk/appgen-access";
import { n as l, t as u } from "@rchunk/appgen-browser-site-core";
import { r as d, t as f } from "@rchunk/local-conversation-artifacts-signals";
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
