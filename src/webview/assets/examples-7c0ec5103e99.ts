// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      { name: `Minimum supported values`, initialValues: { allele_frequency_p: 0 } },
      { name: `Maximum supported values`, initialValues: { allele_frequency_p: 1 } },
      { name: `Rare A allele`, initialValues: { allele_frequency_p: 0.1 } },
      { name: `Rare a allele`, initialValues: { allele_frequency_p: 0.9 } },
    ];
  }))();
}
n();
export { t as default };
