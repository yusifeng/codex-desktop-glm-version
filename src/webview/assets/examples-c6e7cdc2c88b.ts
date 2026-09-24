// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: { success_probability: 0.05, selected_trial: 1 },
      },
      {
        name: `Maximum supported values`,
        initialValues: { success_probability: 0.8, selected_trial: 16 },
      },
      {
        name: `Longer expected wait`,
        initialValues: { success_probability: 0.1, selected_trial: 10 },
      },
    ];
  }))();
}
n();
export { t as default };
