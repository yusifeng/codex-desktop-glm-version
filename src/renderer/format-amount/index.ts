// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
import { EI as t } from "@rchunk/app-initial";
function n(e, n, r) {
  let i = r.toUpperCase(),
    a = t({ intl: e, currencyCode: i });
  return e.formatNumber(n / 10 ** a, { style: `currency`, currency: i });
}
function r() {
  return (r = e(() => {}))();
}
export { r as n, n as t };
