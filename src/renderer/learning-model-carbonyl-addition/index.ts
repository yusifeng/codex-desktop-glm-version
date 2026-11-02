// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n;
function r() {
  return (r = e(() => {
    ((t = [`aldehyde`, `ketone`]),
      (n = (e) => ({
        substrateClass: t.includes(e.substrate_class) ? e.substrate_class : `aldehyde`,
        stage: Number.isFinite(e.stage) ? Math.max(0, Math.min(3, Math.round(e.stage))) : 0,
      })));
  }))();
}
export { r as n, n as r, t };
