// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { GZt as t, HZt as n, Ugn as r, Wgn as i, wQt as a } from "@rchunk/app-initial";
import { n as o, r as s, t as c } from "@rchunk/open-target";
import { n as l, t as u } from "@rchunk/verify-descendant";
async function d({ revealAndFocus: e, descriptor: n, insertPosition: i, scope: s }, u, d, f) {
  if (s.value.routeKind !== `local-thread`) return !1;
  let p = s.value.conversationId,
    m = s.get(a, p);
  if (
    !(await l(s, {
      hostId: m,
      hydrateMissingAncestors: !0,
      parentConversationId: p,
      selectedConversationId: u,
    }))
  )
    return !1;
  let h = o(s, p, u),
    g = h ?? c(s, p, m, u);
  if (h == null && s.get(t, p) !== !0)
    try {
      (await r(s, m).ensureConversationHistoryLoaded(p), (g = o(s, p, u) ?? c(s, p, m, u) ?? g));
    } catch {}
  return (
    g != null &&
    (await d(s, {
      revealAndFocus: e,
      backgroundAgent: g,
      hostId: m,
      insertPosition: i,
      tabId: n.tabId,
      TabComponent: f,
    })) === n.tabId
  );
}
function f() {
  return (f = e(() => {
    (i(), n(), u(), s());
  }))();
}
f();
export { d as restoreBackgroundAgentTabRoute };
