// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: { molarAbsorptivity: 0.01, concentration: 0.01, pathLength: 0.01 },
      },
      {
        name: `Maximum supported values`,
        initialValues: { molarAbsorptivity: 1e5, concentration: 10, pathLength: 100 },
      },
    ];
  }))();
}
n();
export { t as default };
