// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { FX as t, sZ as n } from "@rchunk/app-shared";
import { $en as r, HZt as i, itn as a, lQt as o } from "@rchunk/app-initial";
var s;
function c() {
  return (c = e(() => {
    (t(),
      i(),
      a(),
      (s = n(r, ({ get: e, scope: t }) => {
        if (t.value.routeKind !== `local-thread`) return null;
        let n = e(o, t.value.conversationId);
        return n?.turnId == null ? null : { threadId: t.value.conversationId, turnId: n.turnId };
      })));
  }))();
}
export { s as n, c as t };
