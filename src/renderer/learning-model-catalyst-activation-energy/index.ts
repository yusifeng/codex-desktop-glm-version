// Catalyst activation-energy specification. Release chunk: type-661332749edd.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CATALYST_ACTIVATION_ENERGY";
  version: 1;
  thumbnailAssetKey: "catalyst-activation-energy-v1";
  parameters: {
    catalystEffectivenessPercent: {
      kind: "number";
      defaultValue: 50;
      min: 0;
      max: 100;
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "CATALYST_ACTIVATION_ENERGY",
    version: 1,
    thumbnailAssetKey: "catalyst-activation-energy-v1",
    parameters: {
      catalystEffectivenessPercent: {
        kind: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
