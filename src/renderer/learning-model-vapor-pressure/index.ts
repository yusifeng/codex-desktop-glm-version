// Vapor pressure learning-model specification. Release chunk: type-eccf29c88c2c.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "VAPOR_PRESSURE";
  version: 3;
  thumbnailAssetKey: "vapor-pressure-v1";
  parameters: {
    initial_temperature_c: NumberParameter;
    surrounding_pressure_kpa: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "VAPOR_PRESSURE",
    version: 3,
    thumbnailAssetKey: "vapor-pressure-v1",
    parameters: {
      initial_temperature_c: {
        kind: "number",
        defaultValue: 25,
        min: 0,
        max: 60,
      },
      surrounding_pressure_kpa: {
        kind: "number",
        defaultValue: 101.325,
        min: 40,
        max: 160,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
