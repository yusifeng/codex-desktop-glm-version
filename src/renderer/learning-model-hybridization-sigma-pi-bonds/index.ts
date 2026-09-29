// Hybridization sigma/pi-bond specification. Release chunk: type-6fafbd960065.js.
import "@rchunk/rolldown-runtime";
type Hybridization = "sp3" | "sp2" | "sp";
interface Specification {
  type: "HYBRIDIZATION_SIGMA_PI_BONDS";
  version: 1;
  thumbnailAssetKey: "hybridization-sigma-pi-bonds-v2";
  parameters: {
    hybridization: {
      kind: "enum";
      defaultValue: Hybridization;
      allowedValues: Hybridization[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "HYBRIDIZATION_SIGMA_PI_BONDS",
    version: 1,
    thumbnailAssetKey: "hybridization-sigma-pi-bonds-v2",
    parameters: {
      hybridization: {
        kind: "enum",
        defaultValue: "sp2",
        allowedValues: ["sp3", "sp2", "sp"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
