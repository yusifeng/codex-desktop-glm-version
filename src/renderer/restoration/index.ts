// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { HZt as t, wQt as n } from "@rchunk/app-initial";
async function r(
  { revealAndFocus: e, descriptor: t, insertPosition: r, reason: i, scope: a },
  o,
  s,
) {
  if (a.value.routeKind !== `local-thread`) return !1;
  let c = a.value.conversationId;
  return (
    (await s(a, {
      revealAndFocus: e,
      deferHydrationUntilActivation: i === `persistence` && !e && o != null,
      hostId: a.get(n, c),
      insertPosition: r,
      openOverviewWhenSelectionUnavailable: !0,
      parentConversationId: c,
      selectedConversationId: o,
      tabId: t.tabId,
    })) === t.tabId
  );
}
function i() {
  return (i = e(() => {
    t();
  }))();
}
i();
export { r as restoreSubagentsTabRoute };
