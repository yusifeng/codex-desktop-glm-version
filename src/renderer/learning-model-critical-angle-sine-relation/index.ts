// Critical-angle sine-relation manifest. Release chunk: type-79fafd7cdcf3.js.
import "@rchunk/rolldown-runtime";

const criticalAngleSineRelationSpecification = {
  type: "CRITICAL_ANGLE_SINE_RELATION",
  version: 1,
  thumbnailAssetKey: "critical-angle-sine-relation-v1",
  canonicalFormula: "\\sin\\theta_c = \\frac{n_2}{n_1}",
  parameters: {
    indexRatio: { kind: "number" as const, defaultValue: 0.67, min: 0.5, max: 0.95 },
  },
};

function initializeCriticalAngleSineRelationSpecification(): void {}

export { criticalAngleSineRelationSpecification as n, initializeCriticalAngleSineRelationSpecification as t };
