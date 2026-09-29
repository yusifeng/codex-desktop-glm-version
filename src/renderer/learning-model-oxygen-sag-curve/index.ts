// Oxygen-sag curve controls. Release chunk: type-ff74ecd72106.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "OXYGEN_SAG_CURVE";
  version: 2;
  thumbnailAssetKey: "oxygen-sag-curve-v1";
  parameters: {
    initial_ultimate_bod_mg_l: {
      kind: "number";
      defaultValue: 9;
      min: 4;
      max: 14;
    };
    initial_oxygen_deficit_mg_l: {
      kind: "number";
      defaultValue: 0.25;
      min: 0;
      max: 0.5;
    };
    deoxygenation_rate_per_day: {
      kind: "number";
      defaultValue: 0.25;
      min: 0.15;
      max: 0.35;
    };
    reaeration_rate_per_day: {
      kind: "number";
      defaultValue: 0.75;
      min: 0.35;
      max: 1.15;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "OXYGEN_SAG_CURVE",
    version: 2,
    thumbnailAssetKey: "oxygen-sag-curve-v1",
    parameters: {
      initial_ultimate_bod_mg_l: {
        kind: "number",
        defaultValue: 9,
        min: 4,
        max: 14,
      },
      initial_oxygen_deficit_mg_l: {
        kind: "number",
        defaultValue: 0.25,
        min: 0,
        max: 0.5,
      },
      deoxygenation_rate_per_day: {
        kind: "number",
        defaultValue: 0.25,
        min: 0.15,
        max: 0.35,
      },
      reaeration_rate_per_day: {
        kind: "number",
        defaultValue: 0.75,
        min: 0.35,
        max: 1.15,
      },
    },
  };
}
export { specification as n, initialize as t };
