// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: { trials: 10, success_probability: 0.02, success_count: 0 },
      },
      {
        name: `Maximum supported values`,
        initialValues: { trials: 80, success_probability: 0.98, success_count: 80 },
      },
      { name: `event: at_least`, initialValues: { event: `at_least` } },
      { name: `event: exactly`, initialValues: { event: `exactly` } },
      {
        name: `Skewed distribution with a small expected count`,
        initialValues: {
          trials: 30,
          success_probability: 0.12,
          success_count: 3,
          event: `at_most`,
        },
      },
    ];
  }))();
}
n();
export { t as default };
