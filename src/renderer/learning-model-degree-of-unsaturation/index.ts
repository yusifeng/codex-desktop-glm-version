// Degree-of-unsaturation manifest. Release chunk: type-60f4e9362b4d.js.
import "@rchunk/rolldown-runtime";

type ExampleFormula = "C2H6" | "C4H8" | "C6H10" | "C6H6" | "C4H6Br2" | "C5H8O" | "C5H9N";

const degreeOfUnsaturationSpecification = {
  type: "DEGREE_OF_UNSATURATION",
  version: 2,
  thumbnailAssetKey: "degree-of-unsaturation-v1",
  parameters: {
    example_formula: {
      kind: "enum" as const,
      defaultValue: "C6H10" as ExampleFormula,
      allowedValues: ["C2H6", "C4H8", "C6H10", "C6H6", "C4H6Br2", "C5H8O", "C5H9N"] as ExampleFormula[],
    },
  },
};

function initializeDegreeOfUnsaturationSpecification(): void {}

export { degreeOfUnsaturationSpecification as n, initializeDegreeOfUnsaturationSpecification as t };
