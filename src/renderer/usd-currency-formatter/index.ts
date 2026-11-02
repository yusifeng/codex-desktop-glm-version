// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e, t, n = !1) {
  let r = Math.abs(e);
  return t.formatNumber(e, {
    style: `currency`,
    currency: `USD`,
    notation: n ? `compact` : `standard`,
    minimumFractionDigits: n && r >= 1e3 ? 0 : 2,
    maximumFractionDigits: 2,
    maximumSignificantDigits: r > 0 && r < 0.01 ? 3 : void 0,
  });
}
function n() {
  return (n = e(() => {}))();
}
export { n, t };
