// Logistic-regression learning-model manifest. Release chunk: type-f76de9a47b83.js.
import "@rchunk/rolldown-runtime";

const logisticRegressionSpecification = {
  type: "LOGISTIC_REGRESSION",
  version: 2,
  thumbnailAssetKey: "logistic-regression-v1",
  canonicalFormula: "P(Y=1\\mid x)=\\frac{1}{1+e^{-(\\beta_0+\\beta_1x)}}",
  parameters: {
    intercept: { kind: "number" as const, defaultValue: -0.5, min: -2, max: 2 },
    coefficient: { kind: "number" as const, defaultValue: 1.2, min: -2.5, max: 2.5 },
  },
};

function initializeLogisticRegressionSpecification(): void {}

export { logisticRegressionSpecification as n, initializeLogisticRegressionSpecification as t };
