// Atherosclerosis specification. Release chunk: type-fa58981eb0e3.js.
import "@rchunk/rolldown-runtime";

type DiseaseStage =
  | "healthy artery"
  | "fatty streak"
  | "established plaque"
  | "plaque rupture and thrombus";
interface Specification {
  type: "ATHEROSCLEROSIS";
  version: 2;
  thumbnailAssetKey: "atherosclerosis-v3";
  parameters: {
    initial_stage: {
      kind: "enum";
      defaultValue: "established plaque";
      allowedValues: DiseaseStage[];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "ATHEROSCLEROSIS",
    version: 2,
    thumbnailAssetKey: "atherosclerosis-v3",
    parameters: {
      initial_stage: {
        kind: "enum",
        defaultValue: "established plaque",
        allowedValues: [
          "healthy artery",
          "fatty streak",
          "established plaque",
          "plaque rupture and thrombus",
        ],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
