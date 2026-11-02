// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { e6 as t } from "@rchunk/app-shared";
function n(e) {
  let t = (0, r.useRef)(e);
  return ((t.current = e), (0, r.useCallback)((...e) => t.current(...e), []));
}
var r;
function i() {
  return (i = e(() => {
    r = t();
  }))();
}
export { n, i as t };
