// Proton-NMR splitting learning-model manifest. Release chunk: type-6f1a8a4562be.js.
import "@rchunk/rolldown-runtime";

type NeighborCount = "0" | "1" | "2" | "3" | "4" | "6";

const protonNmrSplittingSpecification = {
  type: "PROTON_NMR_SPLITTING",
  version: 2,
  thumbnailAssetKey: "proton-nmr-splitting-v1",
  parameters: {
    neighbor_count: {
      kind: "enum" as const,
      defaultValue: "2" as NeighborCount,
      allowedValues: ["0", "1", "2", "3", "4", "6"] as NeighborCount[],
    },
  },
};

function initializeProtonNmrSplittingSpecification(): void {}

export { protonNmrSplittingSpecification as n, initializeProtonNmrSplittingSpecification as t };
