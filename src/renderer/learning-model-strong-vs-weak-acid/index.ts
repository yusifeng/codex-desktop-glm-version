// Strong-versus-weak-acid learning-model manifest. Release chunk: type-e8c4aa2e5b51.js.
import "@rchunk/rolldown-runtime";

const strongVsWeakAcidSpecification = {
  type: "STRONG_VS_WEAK_ACID",
  version: 2,
  thumbnailAssetKey: "strong-vs-weak-acid-v2",
  parameters: {
    initial_concentration_molar: { kind: "number" as const, defaultValue: 0.15, min: 0.1, max: 0.25 },
  },
};

function initializeStrongVsWeakAcidSpecification(): void {}

export { strongVsWeakAcidSpecification as n, initializeStrongVsWeakAcidSpecification as t };
