// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: { meanDifference: -3, standardError: 0.75, degreesOfFreedom: 2 },
      },
      {
        name: `Maximum supported values`,
        initialValues: { meanDifference: 3, standardError: 3, degreesOfFreedom: 200 },
      },
    ];
  }))();
}
n();
export { t as default };
