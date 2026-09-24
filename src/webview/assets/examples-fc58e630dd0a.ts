// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: { turnsRatio: 0.1, loadResistanceOhms: 1 },
      },
      {
        name: `Maximum supported values`,
        initialValues: { turnsRatio: 10, loadResistanceOhms: 1e4 },
      },
    ];
  }))();
}
n();
export { t as default };
