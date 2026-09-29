// Molecular-polarity learning-model manifest. Release chunk: type-af64de236b87.js.
import "@rchunk/rolldown-runtime";

type Molecule = "CO2" | "H2O" | "BF3" | "NH3" | "CCl4" | "CH3Cl";

const molecularPolaritySpecification = {
  type: "MOLECULAR_POLARITY",
  version: 1,
  thumbnailAssetKey: "molecular-polarity-v1",
  parameters: {
    molecule: {
      kind: "enum" as const,
      defaultValue: "H2O" as Molecule,
      allowedValues: ["CO2", "H2O", "BF3", "NH3", "CCl4", "CH3Cl"] as Molecule[],
    },
  },
};

function initializeMolecularPolaritySpecification(): void {}

export { molecularPolaritySpecification as n, initializeMolecularPolaritySpecification as t };
