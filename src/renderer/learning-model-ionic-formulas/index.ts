// Ionic-formula learning-model manifest. Release chunk: type-892c2b1ba446.js.
import "@rchunk/rolldown-runtime";

const ionicFormulasSpecification = {
  type: "IONIC_FORMULAS",
  version: 2,
  thumbnailAssetKey: "ionic-formulas-v2",
  parameters: {
    cation: {
      kind: "enum" as const,
      defaultValue: "aluminum",
      allowedValues: [
        "sodium",
        "potassium",
        "silver",
        "magnesium",
        "calcium",
        "zinc",
        "barium",
        "aluminum",
        "iron_iii",
      ],
    },
    anion: {
      kind: "enum" as const,
      defaultValue: "oxide",
      allowedValues: ["chloride", "fluoride", "bromide", "oxide", "sulfide", "nitride", "phosphide"],
    },
  },
};

function initializeIonicFormulasSpecification(): void {}

export { ionicFormulasSpecification as n, initializeIonicFormulasSpecification as t };
