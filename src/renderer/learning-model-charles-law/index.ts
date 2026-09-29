// Charles's law learning-model manifest. Release chunk: type-ff2ce34a0edd.js.
import "@rchunk/rolldown-runtime";

const charlesLawSpecification = {
  type: "CHARLES_LAW",
  version: 2,
  thumbnailAssetKey: "charles-law-v1",
  canonicalFormula: "\\frac{V_1}{T_1} = \\frac{V_2}{T_2}",
  canonicalFormulaAliases: [
    "V_1/T_1 = V_2/T_2",
    "v1/t1=v2/t2",
    "v2/t2=v1/t1",
    "v/t=k",
    "k=v/t",
    "v=kt",
    "kt=v",
  ],
  parameters: {
    v1: { kind: "number" as const, defaultValue: 12, min: 0.01, max: 10_000 },
    t1: { kind: "number" as const, defaultValue: 300, min: 1, max: 5_000 },
    v2: { kind: "number" as const, defaultValue: 18, min: 0.01, max: 10_000 },
    t2: { kind: "number" as const, defaultValue: 450, min: 1, max: 5_000 },
    solveFor: {
      kind: "enum" as const,
      defaultValue: "v2",
      allowedValues: ["v1", "t1", "v2", "t2"],
    },
  },
};

function initializeCharlesLawSpecification(): void {}

export { charlesLawSpecification as n, initializeCharlesLawSpecification as t };
