// Cardiac-output product controls. Release chunk: type-b94332d030e5.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CARDIAC_OUTPUT_PRODUCT";
  version: 2;
  thumbnailAssetKey: "cardiac-output-product-v3";
  canonicalFormula: string;
  parameters: {
    heartRateBeatsPerMinute: {
      kind: "number";
      defaultValue: 70;
      min: 40;
      max: 180;
    };
    strokeVolumeMilliliters: {
      kind: "number";
      defaultValue: 70;
      min: 30;
      max: 120;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CARDIAC_OUTPUT_PRODUCT",
    version: 2,
    thumbnailAssetKey: "cardiac-output-product-v3",
    canonicalFormula: "CO = HR \\times SV",
    parameters: {
      heartRateBeatsPerMinute: {
        kind: "number",
        defaultValue: 70,
        min: 40,
        max: 180,
      },
      strokeVolumeMilliliters: {
        kind: "number",
        defaultValue: 70,
        min: 30,
        max: 120,
      },
    },
  };
}
export { specification as n, initialize as t };
