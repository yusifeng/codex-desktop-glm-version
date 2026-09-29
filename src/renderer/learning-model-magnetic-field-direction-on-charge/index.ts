// Magnetic field direction on a charge specification. Release chunk: type-f09422f3bf66.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "MAGNETIC_FIELD_DIRECTION_ON_CHARGE";
  version: 1;
  thumbnailAssetKey: "magnetic-field-direction-on-charge-v3";
  canonicalFormula: "\\vec F_B=q\\vec v\\times\\vec B";
  parameters: {
    velocityAngleDegrees: { kind: "number"; defaultValue: 0; min: 0; max: 360 };
    fieldDirection: {
      kind: "enum";
      defaultValue: "into-page";
      allowedValues: ["into-page", "out-of-page"];
    };
    chargeSign: {
      kind: "enum";
      defaultValue: "positive";
      allowedValues: ["positive", "negative"];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "MAGNETIC_FIELD_DIRECTION_ON_CHARGE",
    version: 1,
    thumbnailAssetKey: "magnetic-field-direction-on-charge-v3",
    canonicalFormula: "\\vec F_B=q\\vec v\\times\\vec B",
    parameters: {
      velocityAngleDegrees: {
        kind: "number",
        defaultValue: 0,
        min: 0,
        max: 360,
      },
      fieldDirection: {
        kind: "enum",
        defaultValue: "into-page",
        allowedValues: ["into-page", "out-of-page"],
      },
      chargeSign: {
        kind: "enum",
        defaultValue: "positive",
        allowedValues: ["positive", "negative"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
