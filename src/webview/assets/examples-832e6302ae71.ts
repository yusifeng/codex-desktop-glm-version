// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: {
          initial_ultimate_bod_mg_l: 4,
          initial_oxygen_deficit_mg_l: 0,
          deoxygenation_rate_per_day: 0.15,
          reaeration_rate_per_day: 0.35,
        },
      },
      {
        name: `Maximum supported values`,
        initialValues: {
          initial_ultimate_bod_mg_l: 14,
          initial_oxygen_deficit_mg_l: 0.5,
          deoxygenation_rate_per_day: 0.35,
          reaeration_rate_per_day: 1.15,
        },
      },
      {
        name: `Heavy load with weak reaeration`,
        initialValues: { initial_ultimate_bod_mg_l: 14, reaeration_rate_per_day: 0.35 },
      },
    ];
  }))();
}
n();
export { t as default };
