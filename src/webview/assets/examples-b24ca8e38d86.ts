// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      { name: `Minimum supported values`, initialValues: { P: 0.01, V: 0.01, n: 0.01, T: 1 } },
      { name: `Maximum supported values`, initialValues: { P: 100, V: 1e4, n: 1e3, T: 5e3 } },
      { name: `solveFor: V`, initialValues: { solveFor: `V` } },
      { name: `solveFor: n`, initialValues: { solveFor: `n` } },
      { name: `solveFor: T`, initialValues: { solveFor: `T` } },
    ];
  }))();
}
n();
export { t as default };
