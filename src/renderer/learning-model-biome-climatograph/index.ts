// Biome climatograph controls. Release chunk: type-894614f7a446.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "BIOME_CLIMATOGRAPH";
  version: 2;
  thumbnailAssetKey: "biome-climatograph-v2";
  parameters: {
    mean_annual_temperature_c: {
      kind: "number";
      defaultValue: 18;
      min: -15;
      max: 30;
    };
    annual_precipitation_cm: {
      kind: "number";
      defaultValue: 100;
      min: 0;
      max: 450;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "BIOME_CLIMATOGRAPH",
    version: 2,
    thumbnailAssetKey: "biome-climatograph-v2",
    parameters: {
      mean_annual_temperature_c: {
        kind: "number",
        defaultValue: 18,
        min: -15,
        max: 30,
      },
      annual_precipitation_cm: {
        kind: "number",
        defaultValue: 100,
        min: 0,
        max: 450,
      },
    },
  };
}
export { specification as n, initialize as t };
