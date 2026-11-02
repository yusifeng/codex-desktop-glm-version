// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { iW as t, wL as n } from "@rchunk/app-shared";
import {
  Fcn as r,
  HZt as i,
  Icn as a,
  Syt as o,
  Ugn as s,
  Wgn as c,
  _Qt as l,
  byt as u,
  mpn as d,
  ppn as f,
  wQt as p,
  wZt as m,
} from "@rchunk/app-initial";
import { n as h, t as g } from "@rchunk/local-conversation-plan-model";
async function _({ revealAndFocus: e, descriptor: n, insertPosition: r, scope: i }, c, u) {
  if (i.value.routeKind !== `local-thread`) return !1;
  let f = i.value.conversationId,
    h = i.get(m, f),
    _ = g(h ?? i.get(l, f) ?? [], c);
  if (
    (_ == null &&
      h == null &&
      (await s(i, i.get(p, f)).ensureConversationHistoryLoaded(f),
      (h = i.get(m, f)),
      (_ = g(h ?? i.get(l, f) ?? [], c))),
    _ == null)
  )
    return !1;
  let v = i.get(o);
  return (
    u(
      i,
      {
        content: _.content,
        conversationId: f,
        cwd: v == null ? null : t(v),
        hideCodeBlocks: i.get(a),
        key: _.key,
        planKey: _.key,
        title: i
          .get(d)
          .formatMessage({
            id: `localConversation.planSummary.title`,
            defaultMessage: `Plan`,
            description: `Title for the plan summary card header`,
          }),
      },
      { revealAndFocus: e, insertPosition: r, tabId: n.tabId },
    ) === n.tabId
  );
}
function v() {
  return (v = e(() => {
    (n(), c(), i(), f(), u(), r(), h());
  }))();
}
v();
export { _ as restorePlanTabRoute };
