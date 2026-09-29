// Photosynthesis limiting-factor metadata. Release chunk: type-5b3d00b051e8.js.
import "@rchunk/rolldown-runtime";
type Intensity = "low" | "medium" | "high";
interface Specification {
  type: "PHOTOSYNTHESIS";
  version: 2;
  thumbnailAssetKey: "photosynthesis-v3";
  parameters: {
    lightIntensity: {
      kind: "enum";
      defaultValue: Intensity;
      allowedValues: Intensity[];
    };
    carbonDioxide: {
      kind: "enum";
      defaultValue: Intensity;
      allowedValues: Intensity[];
    };
    water: {
      kind: "enum";
      defaultValue: Intensity;
      allowedValues: Intensity[];
    };
  };
}
let specification: Specification;
let initialized = false;
const levels: Intensity[] = ["low", "medium", "high"];
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "PHOTOSYNTHESIS",
    version: 2,
    thumbnailAssetKey: "photosynthesis-v3",
    parameters: {
      lightIntensity: {
        kind: "enum",
        defaultValue: "low",
        allowedValues: [...levels],
      },
      carbonDioxide: {
        kind: "enum",
        defaultValue: "low",
        allowedValues: [...levels],
      },
      water: { kind: "enum", defaultValue: "low", allowedValues: [...levels] },
    },
  };
}
export { specification as n, initialize as t };
