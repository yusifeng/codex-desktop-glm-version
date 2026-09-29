// Lens-equation learning-model manifest. Release chunk: type-9cab42e2673f.js.
import "@rchunk/rolldown-runtime";

const lensEquationSpecification = {
  type: "LENS_EQUATION",
  version: 2,
  thumbnailAssetKey: "lens-equation-v1",
  canonicalFormula: "\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}",
  canonicalFormulaAliases: [
    "\\frac{1}{f} = \\frac{1}{a} + \\frac{1}{b}",
    "1/f=1/do+1/di",
    "1/f=1/di+1/do",
    "1/f=1/b+1/a",
    "1/do+1/di=1/f",
    "1/di+1/do=1/f",
    "1/a+1/b=1/f",
    "1/b+1/a=1/f",
  ],
  parameters: {
    objectDistance: { kind: "number" as const, defaultValue: 32, min: 0.01, max: 10_000 },
    focalLength: { kind: "number" as const, defaultValue: 16, min: -10_000, max: 10_000 },
  },
};

function initializeLensEquationSpecification(): void {}

export { lensEquationSpecification as n, initializeLensEquationSpecification as t };
