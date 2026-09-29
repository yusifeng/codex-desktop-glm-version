// Hemoglobin curve specification. Release chunk: type-9f5bb286483b.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "HEMOGLOBIN_CURVE";
  version: 1;
  thumbnailAssetKey: "hemoglobin-curve-v1";
  parameters: {
    oxygenPartialPressureMmHg: NumberParameter;
    ph: NumberParameter;
    carbonDioxidePartialPressureMmHg: NumberParameter;
    temperatureCelsius: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "HEMOGLOBIN_CURVE",
    version: 1,
    thumbnailAssetKey: "hemoglobin-curve-v1",
    parameters: {
      oxygenPartialPressureMmHg: {
        kind: "number",
        defaultValue: 40,
        min: 0,
        max: 120,
      },
      ph: { kind: "number", defaultValue: 7.4, min: 7.2, max: 7.6 },
      carbonDioxidePartialPressureMmHg: {
        kind: "number",
        defaultValue: 40,
        min: 20,
        max: 60,
      },
      temperatureCelsius: {
        kind: "number",
        defaultValue: 37,
        min: 35,
        max: 39,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
