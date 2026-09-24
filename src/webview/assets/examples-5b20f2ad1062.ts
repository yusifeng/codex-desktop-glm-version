// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      { name: `Minimum supported values`, initialValues: { pKa: 2, baseToAcidRatio: 0.01 } },
      { name: `Maximum supported values`, initialValues: { pKa: 12, baseToAcidRatio: 100 } },
      { name: `Tenfold weak-acid excess`, initialValues: { baseToAcidRatio: 0.1 } },
      { name: `Tenfold conjugate-base excess`, initialValues: { baseToAcidRatio: 10 } },
    ];
  }))();
}
n();
export { t as default };
