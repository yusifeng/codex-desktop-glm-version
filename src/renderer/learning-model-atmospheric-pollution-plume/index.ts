// Atmospheric pollution plume specification. Release chunk: type-48b2d5373e6f.js.
import "@rchunk/rolldown-runtime";

type PlumeRegime =
  "looping" | "coning" | "fanning" | "lofting" | "fumigation" | "trapping";
interface Specification {
  type: "ATMOSPHERIC_POLLUTION_PLUME";
  version: 3;
  thumbnailAssetKey: "atmospheric-pollution-plume-v2";
  parameters: {
    initial_plume_regime: {
      kind: "enum";
      defaultValue: "looping";
      allowedValues: PlumeRegime[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "ATMOSPHERIC_POLLUTION_PLUME",
    version: 3,
    thumbnailAssetKey: "atmospheric-pollution-plume-v2",
    parameters: {
      initial_plume_regime: {
        kind: "enum",
        defaultValue: "looping",
        allowedValues: [
          "looping",
          "coning",
          "fanning",
          "lofting",
          "fumigation",
          "trapping",
        ],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
