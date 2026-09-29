// Lewis-dot-symbol learning-model manifest. Release chunk: type-84ec9bea3a73.js.
import "@rchunk/rolldown-runtime";

const lewisDotSymbolsSpecification = {
  type: "LEWIS_DOT_SYMBOLS",
  version: 2,
  thumbnailAssetKey: "lewis-dot-symbols-v1",
  parameters: {
    element: {
      kind: "enum" as const,
      defaultValue: "C",
      allowedValues: [
        "H",
        "He",
        "Li",
        "Be",
        "B",
        "C",
        "N",
        "O",
        "F",
        "Ne",
        "Na",
        "Mg",
        "Al",
        "Si",
        "P",
        "S",
        "Cl",
        "Ar",
      ],
    },
  },
};

function initializeLewisDotSymbolsSpecification(): void {}

export { lewisDotSymbolsSpecification as n, initializeLewisDotSymbolsSpecification as t };
