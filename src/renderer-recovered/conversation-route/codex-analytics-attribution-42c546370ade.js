import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
import { FX as t, sZ as n } from "./app-shared-7b9edc1bfb7f.js";
import { $en as r, HZt as i, itn as a, lQt as o } from "./app-initial-51da50e6c6e3.js";
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
