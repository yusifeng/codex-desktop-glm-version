// Aromaticity and Huckel's-rule manifest. Release chunk: type-4644d5bf838d.js.
import "@rchunk/rolldown-runtime";

type AromaticityExample =
  | "benzene"
  | "cyclobutadiene"
  | "cyclooctatetraene"
  | "cyclopentadienyl-anion"
  | "cyclopropenyl-cation";

const aromaticityAndHuckelsRuleSpecification = {
  type: "AROMATICITY_AND_HUCKELS_RULE",
  version: 1,
  thumbnailAssetKey: "aromaticity-and-huckels-rule-v1",
  parameters: {
    initial_example: {
      kind: "enum" as const,
      defaultValue: "benzene" as AromaticityExample,
      allowedValues: [
        "benzene",
        "cyclobutadiene",
        "cyclooctatetraene",
        "cyclopentadienyl-anion",
        "cyclopropenyl-cation",
      ] as AromaticityExample[],
    },
  },
};

function initializeAromaticityAndHuckelsRuleSpecification(): void {}

export { aromaticityAndHuckelsRuleSpecification as n, initializeAromaticityAndHuckelsRuleSpecification as t };
