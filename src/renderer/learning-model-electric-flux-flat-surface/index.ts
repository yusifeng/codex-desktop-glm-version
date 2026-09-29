// Electric-flux-through-a-flat-surface manifest. Release chunk: type-36d833db1430.js.
import "@rchunk/rolldown-runtime";

const electricFluxFlatSurfaceSpecification = {
  type: "ELECTRIC_FLUX_FLAT_SURFACE",
  version: 1,
  thumbnailAssetKey: "electric-flux-flat-surface-v1",
  canonicalFormula: "\\Phi_E = EA\\cos(\\theta)",
  parameters: {
    fieldStrengthNewtonsPerCoulomb: { kind: "number" as const, defaultValue: 6, min: 0, max: 10 },
    areaSquareMeters: { kind: "number" as const, defaultValue: 3, min: 0.5, max: 5 },
    angleDegrees: { kind: "number" as const, defaultValue: 30, min: 0, max: 90 },
  },
};

function initializeElectricFluxFlatSurfaceSpecification(): void {}

export { electricFluxFlatSurfaceSpecification as n, initializeElectricFluxFlatSurfaceSpecification as t };
