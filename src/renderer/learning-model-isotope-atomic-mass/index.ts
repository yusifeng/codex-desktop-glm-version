// Isotope atomic-mass manifest. Release chunk: type-35ea69d98390.js.
import "@rchunk/rolldown-runtime";

type IsotopeElement = "boron" | "carbon" | "neon" | "magnesium" | "sulfur" | "chlorine" | "copper";

const isotopeAtomicMassSpecification = {
  type: "ISOTOPE_ATOMIC_MASS",
  version: 1,
  thumbnailAssetKey: "isotope-atomic-mass-v2",
  parameters: {
    element: {
      kind: "enum" as const,
      defaultValue: "chlorine" as IsotopeElement,
      allowedValues: ["boron", "carbon", "neon", "magnesium", "sulfur", "chlorine", "copper"] as IsotopeElement[],
    },
  },
};

function initializeIsotopeAtomicMassSpecification(): void {}

export { isotopeAtomicMassSpecification as n, initializeIsotopeAtomicMassSpecification as t };
