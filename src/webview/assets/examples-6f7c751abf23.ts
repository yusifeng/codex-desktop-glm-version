// @ts-nocheck
import { n as e } from "./rolldown-runtime-2d059c5e81f4.js";
var t;
function n() {
  return (n = e(() => {
    t = [
      {
        name: `Minimum supported values`,
        initialValues: {
          massKilograms: 0.5,
          springConstantNewtonsPerMeter: 10,
          amplitudeMeters: 0.05,
        },
      },
      {
        name: `Maximum supported values`,
        initialValues: {
          massKilograms: 5,
          springConstantNewtonsPerMeter: 100,
          amplitudeMeters: 0.5,
        },
      },
    ];
  }))();
}
n();
export { t as default };
