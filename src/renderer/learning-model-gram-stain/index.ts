// Gram-stain bacteria selector metadata. Release chunk: type-6ec40c0e5685.js.
import "@rchunk/rolldown-runtime";

type BacteriaType = "positive" | "negative";
interface GramStainSpecification {
  type: "GRAM_STAIN";
  version: 1;
  thumbnailAssetKey: "gram-stain-v1";
  parameters: {
    bacteriaType: {
      kind: "enum";
      defaultValue: BacteriaType;
      allowedValues: BacteriaType[];
    };
  };
}

let gramStainSpecification: GramStainSpecification;
let initialized = false;
function initializeGramStainSpecification(): void {
  if (initialized) return;
  initialized = true;
  gramStainSpecification = {
    type: "GRAM_STAIN",
    version: 1,
    thumbnailAssetKey: "gram-stain-v1",
    parameters: {
      bacteriaType: {
        kind: "enum",
        defaultValue: "positive",
        allowedValues: ["positive", "negative"],
      },
    },
  };
}

export { gramStainSpecification as n, initializeGramStainSpecification as t };
