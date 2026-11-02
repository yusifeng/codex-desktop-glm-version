// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
var t, n;
function r() {
  return (r = e(() => {
    ((t = { min: 0, max: 3, defaultValue: 0 }),
      (n = (e) => {
        let n = Number.isFinite(e.stageIndex) ? Math.round(e.stageIndex) : t.defaultValue;
        return { stageIndex: Math.min(t.max, Math.max(t.min, n)) };
      }));
  }))();
}
export { r as n, n as r, t };
