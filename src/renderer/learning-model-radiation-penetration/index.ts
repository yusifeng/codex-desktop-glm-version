// Radiation-penetration manifest. Release chunk: type-7a83abf1c6c4.js.
import "@rchunk/rolldown-runtime";

type Shielding = "none" | "paper" | "aluminium-or-plastic" | "lead-or-concrete";

const radiationPenetrationSpecification = {
  type: "RADIATION_PENETRATION",
  version: 2,
  thumbnailAssetKey: "radiation-penetration-v1",
  parameters: {
    initial_shielding: {
      kind: "enum" as const,
      defaultValue: "lead-or-concrete" as Shielding,
      allowedValues: ["none", "paper", "aluminium-or-plastic", "lead-or-concrete"] as Shielding[],
    },
  },
};

function initializeRadiationPenetrationSpecification(): void {}

export { radiationPenetrationSpecification as n, initializeRadiationPenetrationSpecification as t };
