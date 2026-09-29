// Exponential-decay learning-model manifest. Release chunk: type-5ab56173322c.js.
import "@rchunk/rolldown-runtime";

const exponentialDecaySpecification = {
  type: "EXPONENTIAL_DECAY",
  version: 1,
  thumbnailAssetKey: "exponential-decay-v1",
  canonicalFormula: "y = e^{-kt}",
  canonicalFormulaAliases: [
    "y = y_0 \\exp(-kt)",
    "y = e^{-t}",
    "y = 2e^{-0.5t}",
    "N = N_0 e^{-\\lambda t}",
    "A = A_0 e^{-\\lambda t}",
  ],
  parameters: {
    initial: { kind: "number" as const, defaultValue: 6, min: 0.01, max: 10_000 },
    decay: { kind: "number" as const, defaultValue: 0.6, min: 0.01, max: 10_000 },
  },
};

function initializeExponentialDecaySpecification(): void {}

export { exponentialDecaySpecification as n, initializeExponentialDecaySpecification as t };
