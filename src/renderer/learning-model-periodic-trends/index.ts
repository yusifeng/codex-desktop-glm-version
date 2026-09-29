// Periodic-trend selector metadata. Release chunk: type-5d4a85edaa4f.js.
import "@rchunk/rolldown-runtime";
type PeriodicTrend =
  "atomic radius" | "first ionization energy" | "electronegativity";
interface Specification {
  type: "PERIODIC_TRENDS";
  version: 2;
  thumbnailAssetKey: "periodic-trends-v1";
  parameters: {
    initial_trend: {
      kind: "enum";
      defaultValue: PeriodicTrend;
      allowedValues: PeriodicTrend[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "PERIODIC_TRENDS",
    version: 2,
    thumbnailAssetKey: "periodic-trends-v1",
    parameters: {
      initial_trend: {
        kind: "enum",
        defaultValue: "atomic radius",
        allowedValues: [
          "atomic radius",
          "first ionization energy",
          "electronegativity",
        ],
      },
    },
  };
}
export { specification as n, initialize as t };
