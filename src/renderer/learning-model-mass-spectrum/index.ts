// Mass spectrum specification. Release chunk: type-d5b1a1a74ceb.js.
import "@rchunk/rolldown-runtime";

type SpectrumExample =
  | "fragment-dominant"
  | "molecular-ion-dominant"
  | "chlorine-isotope-pattern"
  | "bromine-isotope-pattern";
interface Specification {
  type: "MASS_SPECTRUM";
  version: 2;
  thumbnailAssetKey: "mass-spectrum-v1";
  parameters: {
    example: {
      kind: "enum";
      defaultValue: "fragment-dominant";
      allowedValues: SpectrumExample[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "MASS_SPECTRUM",
    version: 2,
    thumbnailAssetKey: "mass-spectrum-v1",
    parameters: {
      example: {
        kind: "enum",
        defaultValue: "fragment-dominant",
        allowedValues: [
          "fragment-dominant",
          "molecular-ion-dominant",
          "chlorine-isotope-pattern",
          "bromine-isotope-pattern",
        ],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
