// @ts-nocheck
import { n as e } from "@rchunk/rolldown-runtime";
function t(e, t) {
  return typeof t?.enabled == `boolean` ? t.enabled : (e?.__default?.enabled ?? !0);
}
function n() {
  return (n = e(() => {}))();
}
export { t as n, n as t };
