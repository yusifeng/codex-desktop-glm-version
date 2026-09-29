// Energy pyramid learning-model specification. Release chunk: type-402ae30c42ae.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "ENERGY_PYRAMID";
  version: 3;
  thumbnailAssetKey: "energy-pyramid-v2";
  parameters: {
    producer_energy: NumberParameter;
    transfer_efficiency_percent: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "ENERGY_PYRAMID",
    version: 3,
    thumbnailAssetKey: "energy-pyramid-v2",
    parameters: {
      producer_energy: {
        kind: "number",
        defaultValue: 10_000,
        min: 1_000,
        max: 100_000,
      },
      transfer_efficiency_percent: {
        kind: "number",
        defaultValue: 10,
        min: 5,
        max: 20,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
