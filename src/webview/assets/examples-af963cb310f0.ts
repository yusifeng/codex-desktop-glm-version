// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: { speedKmh: 30, reactionTimeSeconds: 0.5 },
      },
      {
        name: `Maximum supported values`,
        initialValues: { speedKmh: 100, reactionTimeSeconds: 2 },
      },
      { name: `roadCondition: wet`, initialValues: { roadCondition: `wet` } },
      { name: `roadCondition: snow_ice`, initialValues: { roadCondition: `snow_ice` } },
    ];
  }))();
}
n();
export { t as default };
