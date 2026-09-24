// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: {
          savingRatePercent: 10,
          depreciationRatePercent: 3,
          populationGrowthRatePercent: 0.5,
          technologyGrowthRatePercent: 0.5,
        },
      },
      {
        name: `Maximum supported values`,
        initialValues: {
          savingRatePercent: 40,
          depreciationRatePercent: 10,
          populationGrowthRatePercent: 4,
          technologyGrowthRatePercent: 4,
        },
      },
    ];
  }))();
}
n();
export { t as default };
