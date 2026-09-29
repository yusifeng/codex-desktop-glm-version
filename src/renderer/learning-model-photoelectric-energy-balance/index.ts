// Photoelectric energy balance specification. Release chunk: type-389cfab21292.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "PHOTOELECTRIC_ENERGY_BALANCE";
  version: 1;
  thumbnailAssetKey: "photoelectric-energy-balance-v1";
  canonicalFormula: "hf = \\phi + K_{\\max}";
  parameters: {
    frequencyTimes10To14Hertz: NumberParameter;
    intensityPercent: NumberParameter;
    workFunctionElectronVolts: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PHOTOELECTRIC_ENERGY_BALANCE",
    version: 1,
    thumbnailAssetKey: "photoelectric-energy-balance-v1",
    canonicalFormula: "hf = \\phi + K_{\\max}",
    parameters: {
      frequencyTimes10To14Hertz: {
        kind: "number",
        defaultValue: 8,
        min: 3,
        max: 15,
      },
      intensityPercent: { kind: "number", defaultValue: 50, min: 10, max: 100 },
      workFunctionElectronVolts: {
        kind: "number",
        defaultValue: 2.3,
        min: 1.5,
        max: 6,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
