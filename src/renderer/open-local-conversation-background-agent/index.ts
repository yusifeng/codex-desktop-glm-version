// @ts-nocheck
import { ensureConversationReady as g } from "../app-primary/runtime/ensure-conversation-ready";
import { n as e } from "@rchunk/rolldown-runtime";
import {
  I3 as t,
  wL as n,
  zU as r,
} from "@rchunk/app-shared";
import {
  Ag as i,
  Gvt as a,
  HZt as o,
  Mg as s,
  Og as c,
  RQt as l,
  Wvt as u,
  jg as d,
  kg as f,
  vZt as p,
  zZt as m,
} from "@rchunk/app-initial";
import {
  Bl as h,
  Vl as _,
  Wr as v,
} from "@rchunk/app-primary";
import { r as y } from "@rchunk/open-target";
async function b(
  e,
  {
    revealAndFocus: t = !0,
    backgroundAgent: n,
    hostId: i,
    insertPosition: a,
    shouldResume: o = !r(i),
    tabId: s,
    TabComponent: c,
  },
) {
  e.get(p, i)?.activateThreadSummary(n.conversationId, { addToRecent: !1 });
  let l = g(e, n.conversationId, i);
  return l !== !0 && !(await l)
    ? null
    : x(e, {
        revealAndFocus: t,
        backgroundAgent: n,
        hostId: i,
        insertPosition: a,
        shouldResume: o,
        tabId: s,
        TabComponent: c,
      });
}
function x(
  e,
  {
    revealAndFocus: t = !0,
    backgroundAgent: n,
    hostId: r,
    insertPosition: o,
    shouldResume: s,
    tabId: c,
    TabComponent: u,
  },
) {
  if (!e.get(m, n.conversationId) || e.get(l, r).includes(n.conversationId)) return null;
  let f = c ?? d(n.conversationId);
  return a(e, C, {
    revealAndFocus: t,
    durableRoute: { kind: i, params: { conversationId: n.conversationId }, payloadVersion: 1 },
    icon: (0, S.jsx)(h, { className: `icon-sm`, seed: n.conversationId }),
    id: f,
    insertPosition: o,
    props: {
      canInteract: n.canInteract,
      conversationId: n.conversationId,
      hostId: r,
      shouldResume: s,
      onOpenBackgroundAgent: (t) => {
        b(e, { backgroundAgent: t, hostId: r, shouldResume: s, TabComponent: u });
      },
    },
    title: n.displayName,
  });
}
var S, C;
function w() {
  return (w = e(() => {
    (n(), o(), u(), c(), _(), s(), v(), (S = t()), y(), (C = f({ open: b })));
  }))();
}
export { w as n, b as r, C as t };
