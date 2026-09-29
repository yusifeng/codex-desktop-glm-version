// Kinematics velocity specification. Release chunk: type-d8ff967dcf16.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "KINEMATICS_VELOCITY";
  version: 1;
  thumbnailAssetKey: "kinematics-velocity-v1";
  canonicalFormula: "v_f = v_i + at";
  canonicalFormulaAliases: ["v = u + at", "v = v_0 + at", "u + at = v"];
  parameters: {
    initialVelocityMetersPerSecond: NumberParameter;
    accelerationMetersPerSecondSquared: NumberParameter;
    timeSeconds: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "KINEMATICS_VELOCITY",
    version: 1,
    thumbnailAssetKey: "kinematics-velocity-v1",
    canonicalFormula: "v_f = v_i + at",
    canonicalFormulaAliases: ["v = u + at", "v = v_0 + at", "u + at = v"],
    parameters: {
      initialVelocityMetersPerSecond: {
        kind: "number",
        defaultValue: 2,
        min: -6,
        max: 10,
      },
      accelerationMetersPerSecondSquared: {
        kind: "number",
        defaultValue: 1,
        min: -2,
        max: 4,
      },
      timeSeconds: { kind: "number", defaultValue: 5, min: 1, max: 9 },
    },
  };
}
export { specification as n, initializeSpecification as t };
