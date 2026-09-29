// Collision simulation learning-model manifest. Release chunk: type-ff70f856f345.js.
import "@rchunk/rolldown-runtime";

const collisionSimulationSpecification = {
  type: "COLLISION_SIMULATION",
  version: 3,
  thumbnailAssetKey: "collision-simulation-v1",
  canonicalFormula: "m_1v_{1,i} + m_2v_{2,i} = m_1v_{1,f} + m_2v_{2,f}",
  parameters: {
    cartAInitialVelocityMps: { kind: "number" as const, defaultValue: 2, min: -3, max: 3 },
    cartBInitialVelocityMps: { kind: "number" as const, defaultValue: -1.5, min: -3, max: 3 },
    collisionType: {
      kind: "enum" as const,
      defaultValue: "elastic",
      allowedValues: ["elastic", "perfectlyInelastic"],
    },
  },
};

function initializeCollisionSimulationSpecification(): void {}

export { collisionSimulationSpecification as n, initializeCollisionSimulationSpecification as t };
